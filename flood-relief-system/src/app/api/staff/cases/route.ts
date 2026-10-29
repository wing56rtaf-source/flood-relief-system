import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { maskPhoneNumber, sanitizeText } from '@/lib/auth';
import { findDuplicateActiveCase, mergeDuplicateCase } from '@/lib/duplicate-detector';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const urgency = searchParams.get('urgency');
    const search = searchParams.get('search');

    const where: any = {};
    if (status && status !== 'ALL') {
      where.status = status;
    }
    if (urgency && urgency !== 'ALL') {
      where.urgency = urgency;
    }
    if (search) {
      where.OR = [
        { reporterName: { contains: search } },
        { addressDetail: { contains: search } },
        { description: { contains: search } },
      ];
    }

    const cases = await prisma.reliefCase.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });

    // Backend-level PII Masking before sending JSON response (TS-03)
    const maskedCases = cases.map((item) => ({
      ...item,
      phoneNumber: maskPhoneNumber(item.phoneNumber),
      itemsNeeded: (() => {
        try {
          return JSON.parse(item.itemsNeeded || '[]');
        } catch {
          return [];
        }
      })(),
    }));

    return NextResponse.json(maskedCases);
  } catch (error) {
    console.error('Error fetching staff cases:', error);
    return NextResponse.json({ error: 'SERVER_ERROR', message: 'ไม่สามารถดึงข้อมูลเคสได้' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    // 0. RBAC Check: RESCUE role cannot create cases
    const userRole = request.headers.get('x-user-role') || '';
    if (userRole === 'RESCUE') {
      return NextResponse.json(
        { error: 'FORBIDDEN', message: 'หน่วยกู้ภัยสามารถดูข้อมูลและเปลี่ยนสถานะได้เท่านั้น ไม่สามารถเพิ่มข้อมูลเคสได้' },
        { status: 403 }
      );
    }

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
      forceNew,
    } = body;

    // 1. Validate required fields
    if (!reporterName?.trim() || !phoneNumber?.trim() || latitude === undefined || longitude === undefined) {
      return NextResponse.json(
        { error: 'MISSING_FIELDS', message: 'กรุณากรอกข้อมูลสำคัญ (ชื่อ, เบอร์โทร, พิกัด) ให้ครบถ้วน' },
        { status: 400 }
      );
    }

    // 2. Reject cases with non-positive people count (TS-04)
    const count = Number(peopleCount);
    if (isNaN(count) || count < 1) {
      return NextResponse.json(
        { error: 'INVALID_PEOPLE_COUNT', message: 'จำนวนคนต้องเป็นตัวเลขตั้งแต่ 1 คนขึ้นไป' },
        { status: 400 }
      );
    }

    // 3. Validate coordinates
    const lat = Number(latitude);
    const lng = Number(longitude);
    if (isNaN(lat) || isNaN(lng) || lat < -90 || lat > 90 || lng < -180 || lng > 180) {
      return NextResponse.json(
        { error: 'INVALID_COORDINATES', message: 'พิกัดละติจูด/ลองจิจูดไม่ถูกต้อง' },
        { status: 400 }
      );
    }

    // 4. Duplicate Check & Prevention (staff case creation)
    if (!forceNew) {
      const duplicate = await findDuplicateActiveCase({
        phoneNumber,
        latitude: lat,
        longitude: lng,
        maxDistanceMeters: 200,
        requireBothPhoneAndLocation: true,
      });

      if (duplicate) {
        const merged = await mergeDuplicateCase({
          existingCaseId: duplicate.matchedCase.id,
          reporterName,
          newDescription: description,
          newItems: itemsNeeded,
          newUrgency: urgency,
          clientIp: request.headers.get('x-forwarded-for')?.split(',')[0].trim() || '127.0.0.1',
          source: 'STAFF',
        });

        if (merged) {
          return NextResponse.json(
            {
              success: true,
              isDuplicate: true,
              case: {
                ...merged,
                itemsNeeded: JSON.parse(merged.itemsNeeded),
              },
              message: `ตรวจพบเคสเดิมที่ยังเปิดอยู่ (${duplicate.reason}) ระบบได้รวมข้อมูลเพิ่มเติมลงในเคสเดิมเรียบร้อยแล้ว`,
            },
            { status: 201 }
          );
        }
      }
    }

    // 5. Create case with sanitized inputs and default PENDING status (TS-01)
    const newCase = await prisma.reliefCase.create({
      data: {
        reporterName: sanitizeText(reporterName.trim()),
        phoneNumber: sanitizeText(phoneNumber.trim()),
        peopleCount: count,
        urgency: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'].includes(urgency) ? urgency : 'MEDIUM',
        itemsNeeded: JSON.stringify(Array.isArray(itemsNeeded) ? itemsNeeded.map((i: any) => String(i)) : []),
        description: sanitizeText(description?.trim() || ''),
        latitude: lat,
        longitude: lng,
        addressDetail: sanitizeText(addressDetail?.trim() || ''),
        status: 'PENDING',
        source: 'STAFF',
      },
    });

    return NextResponse.json(
      {
        success: true,
        case: {
          ...newCase,
          itemsNeeded: JSON.parse(newCase.itemsNeeded),
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating staff case:', error);
    return NextResponse.json({ error: 'SERVER_ERROR', message: 'ไม่สามารถสร้างเคสได้' }, { status: 500 });
  }
}

// Bulk delete all cancelled cases from trash bin
export async function DELETE(request: Request) {
  try {
    // RBAC Check: RESCUE role cannot delete cases
    const userRole = request.headers.get('x-user-role') || '';
    if (userRole === 'RESCUE') {
      return NextResponse.json(
        { error: 'FORBIDDEN', message: 'หน่วยกู้ภัยสามารถดูข้อมูลได้อย่างเดียว ไม่สามารถลบเคสได้' },
        { status: 403 }
      );
    }
    const { searchParams } = new URL(request.url);
    const trashOnly = searchParams.get('trashOnly');

    if (trashOnly === 'true') {
      const result = await prisma.reliefCase.deleteMany({
        where: { status: 'CANCELLED' },
      });

      const userId = request.headers.get('x-user-id');
      const clientIp = request.headers.get('x-forwarded-for')?.split(',')[0].trim() || '127.0.0.1';

      await prisma.auditLog.create({
        data: {
          userId: userId || undefined,
          action: 'EMPTY_TRASH_ALL',
          details: `Permanently deleted all ${result.count} cancelled cases from trash bin`,
          ipAddress: clientIp,
        },
      });

      return NextResponse.json({
        success: true,
        count: result.count,
        message: `ลบเคสทั้งหมดในถังขยะเรียบร้อยแล้ว (${result.count} รายการ)`,
      });
    }

    return NextResponse.json({ error: 'INVALID_REQUEST', message: 'กรุณาระบุเงื่อนไขการลบ' }, { status: 400 });
  } catch (error) {
    console.error('Error emptying trash:', error);
    return NextResponse.json({ error: 'SERVER_ERROR', message: 'ไม่สามารถล้างถังขยะได้' }, { status: 500 });
  }
}
