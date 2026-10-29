import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { isPublicIntakeEnabled } from '@/lib/settings';
import { sanitizeText } from '@/lib/auth';
import { findDuplicateActiveCase, mergeDuplicateCase } from '@/lib/duplicate-detector';

// Rate limiting in-memory store: 5 requests per minute per IP
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();

export async function POST(request: Request) {
  try {
    // 1. Authoritative Feature Flag Guard (TS-02 / TS-14)
    const isEnabled = await isPublicIntakeEnabled();
    if (!isEnabled) {
      return new NextResponse('Not Found', { status: 404 });
    }

    // 2. Rate Limiting (5 requests / min / IP) (TS-06)
    const clientIp = request.headers.get('x-forwarded-for')?.split(',')[0].trim() || '127.0.0.1';
    const now = Date.now();
    const rateData = rateLimitMap.get(clientIp) || { count: 0, resetTime: now + 60000 };

    if (now > rateData.resetTime) {
      rateData.count = 0;
      rateData.resetTime = now + 60000;
    }

    if (rateData.count >= 5) {
      return NextResponse.json(
        {
          error: 'TOO_MANY_REQUESTS',
          message: 'คุณส่งคำขอเกินกำหนด 5 ครั้งต่อนาที กรุณารอสักครู่ก่อนทำรายการใหม่',
        },
        { status: 429 }
      );
    }

    rateData.count += 1;
    rateLimitMap.set(clientIp, rateData);

    // 3. Input Validation
    const body = await request.json().catch(() => ({}));
    const {
      reporterName,
      phoneNumber,
      peopleCount,
      urgency,
      itemsNeeded,
      description,
      latitude,
      longitude,
      addressDetail,
    } = body;

    if (!reporterName?.trim() || !phoneNumber?.trim() || latitude === undefined || longitude === undefined) {
      return NextResponse.json(
        { error: 'INVALID_INPUT', message: 'กรุณากรอกข้อมูลสำคัญ (ชื่อ, เบอร์ติดต่อ, พิกัด) ให้ครบถ้วน' },
        { status: 400 }
      );
    }

    const count = Number(peopleCount);
    if (isNaN(count) || count < 1) {
      return NextResponse.json(
        { error: 'INVALID_PEOPLE_COUNT', message: 'จำนวนคนต้องอย่างน้อย 1 คน' },
        { status: 400 }
      );
    }

    const lat = Number(latitude);
    const lng = Number(longitude);
    if (isNaN(lat) || isNaN(lng) || lat < -90 || lat > 90 || lng < -180 || lng > 180) {
      return NextResponse.json(
        { error: 'INVALID_COORDINATES', message: 'พิกัด GPS ไม่ถูกต้อง' },
        { status: 400 }
      );
    }

    // 4. Stored XSS Sanitization (TS-17)
    const sanitizedReporterName = sanitizeText(reporterName.trim());
    const sanitizedPhone = sanitizeText(phoneNumber.trim());
    const sanitizedDesc = sanitizeText(description?.trim() || '');
    const sanitizedAddress = sanitizeText(addressDetail?.trim() || '');

    // 5. Duplicate Detection & Prevention
    const duplicate = await findDuplicateActiveCase({
      phoneNumber: sanitizedPhone,
      latitude: lat,
      longitude: lng,
    });

    if (duplicate) {
      await mergeDuplicateCase({
        existingCaseId: duplicate.matchedCase.id,
        reporterName: sanitizedReporterName,
        newDescription: sanitizedDesc,
        newItems: Array.isArray(itemsNeeded) ? itemsNeeded.map((i: any) => sanitizeText(String(i))) : [],
        newUrgency: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'].includes(urgency) ? urgency : 'MEDIUM',
        clientIp,
        source: 'PUBLIC',
      });

      return NextResponse.json(
        {
          success: true,
          isDuplicate: true,
          caseId: duplicate.matchedCase.id,
          message: 'ระบบพบข้อมูลขอความช่วยเหลือเดิมของคุณอยู่แล้ว ได้ทำการบันทึกข้อมูลเพิ่มเติมให้เรียบร้อยแล้ว ท่านสามารถติดตามหรือแก้ไขสถานะได้ทันที',
        },
        { status: 201 }
      );
    }

    // 6. Create new case with default PENDING status (TS-01)
    const newCase = await prisma.reliefCase.create({
      data: {
        reporterName: sanitizedReporterName,
        phoneNumber: sanitizedPhone,
        peopleCount: count,
        urgency: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'].includes(urgency) ? urgency : 'MEDIUM',
        itemsNeeded: JSON.stringify(Array.isArray(itemsNeeded) ? itemsNeeded.map((i: any) => sanitizeText(String(i))) : []),
        description: sanitizedDesc,
        latitude: lat,
        longitude: lng,
        addressDetail: sanitizedAddress,
        status: 'PENDING',
        source: 'PUBLIC',
      },
    });

    // 5. Success state with Ref ID (TS-18)
    return NextResponse.json(
      {
        success: true,
        caseId: newCase.id,
        message: 'บันทึกข้อมูลขอรับความช่วยเหลือเรียบร้อยแล้ว เจ้าหน้าที่จะเร่งตรวจสอบ',
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error handling public case submission:', error);
    return NextResponse.json(
      { error: 'SERVER_ERROR', message: 'เกิดข้อผิดพลาดในการส่งข้อมูล กรุณาลองใหม่อีกครั้ง' },
      { status: 500 }
    );
  }
}
