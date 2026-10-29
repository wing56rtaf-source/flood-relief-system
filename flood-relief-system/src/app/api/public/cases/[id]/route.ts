import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { isPublicIntakeEnabled } from '@/lib/settings';
import { maskPhoneNumber, sanitizeText } from '@/lib/auth';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    // 1. Authoritative Feature Flag Guard
    const isEnabled = await isPublicIntakeEnabled();
    if (!isEnabled) {
      return new NextResponse('Not Found', { status: 404 });
    }

    const item = await prisma.reliefCase.findUnique({
      where: { id: params.id },
    });

    if (!item) {
      return NextResponse.json(
        { error: 'NOT_FOUND', message: 'ไม่พบข้อมูลคำขอความช่วยเหลือตามรหัสอ้างอิงนี้' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      id: item.id,
      reporterName: item.reporterName,
      phoneNumber: maskPhoneNumber(item.phoneNumber),
      peopleCount: item.peopleCount,
      urgency: item.urgency,
      status: item.status,
      addressDetail: item.addressDetail,
      description: item.description,
      itemsNeeded: (() => {
        try {
          return JSON.parse(item.itemsNeeded || '[]');
        } catch {
          return [];
        }
      })(),
      createdAt: item.createdAt,
      updatedAt: item.updatedAt,
    });
  } catch (error) {
    console.error('Error fetching public case detail:', error);
    return NextResponse.json(
      { error: 'SERVER_ERROR', message: 'ไม่สามารถดึงข้อมูลสถานะได้' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    // 1. Authoritative Feature Flag Guard
    const isEnabled = await isPublicIntakeEnabled();
    if (!isEnabled) {
      return new NextResponse('Not Found', { status: 404 });
    }

    const existingCase = await prisma.reliefCase.findUnique({
      where: { id: params.id },
    });

    if (!existingCase) {
      return NextResponse.json(
        { error: 'NOT_FOUND', message: 'ไม่พบเคสที่ต้องการแก้ไข' },
        { status: 404 }
      );
    }

    const body = await request.json().catch(() => ({}));
    const { status, note } = body;

    // Public users can only update to RESOLVED (helped) or CANCELLED (no longer needed)
    const allowedStatuses = ['RESOLVED', 'CANCELLED'];
    if (status && !allowedStatuses.includes(status)) {
      return NextResponse.json(
        {
          error: 'INVALID_STATUS_TRANSITION',
          message: 'ผู้ประสบภัยสามารถเลือกเปลี่ยนสถานะเป็น "ช่วยเหลือแล้ว (RESOLVED)" หรือ "ยกเลิกคำขอ (CANCELLED)" เท่านั้น',
        },
        { status: 400 }
      );
    }

    const updateData: any = {};
    if (status) {
      updateData.status = status;
    }

    if (note && typeof note === 'string' && note.trim()) {
      const nowStr = new Date().toLocaleString('th-TH', { timeZone: 'Asia/Bangkok' });
      const appendStr = `\n\n[ผู้แจ้งอัปเดตสถานะเพิ่มเติมเมื่อ ${nowStr}]: ${sanitizeText(note.trim())}`;
      updateData.description = (existingCase.description || '') + appendStr;
    }

    const updatedCase = await prisma.reliefCase.update({
      where: { id: params.id },
      data: updateData,
    });

    // Record Audit Log for public self-service status change
    const clientIp = request.headers.get('x-forwarded-for')?.split(',')[0].trim() || '127.0.0.1';
    await prisma.auditLog.create({
      data: {
        action: 'PUBLIC_SELF_STATUS_UPDATE',
        targetId: params.id,
        details: `Public user updated status to ${status || 'NOTE_ONLY'} from IP ${clientIp}`,
        ipAddress: clientIp,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'อัปเดตสถานะคำขอความช่วยเหลือเรียบร้อยแล้ว',
      case: {
        id: updatedCase.id,
        status: updatedCase.status,
        description: updatedCase.description,
        updatedAt: updatedCase.updatedAt,
      },
    });
  } catch (error) {
    console.error('Error updating public case status:', error);
    return NextResponse.json(
      { error: 'SERVER_ERROR', message: 'เกิดข้อผิดพลาดในการอัปเดตสถานะ' },
      { status: 500 }
    );
  }
}
