import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const reliefCase = await prisma.reliefCase.findUnique({
      where: { id: params.id },
    });

    if (!reliefCase) {
      return NextResponse.json({ error: 'NOT_FOUND', message: 'ไม่พบข้อมูลเคส' }, { status: 404 });
    }

    // Record Audit Log when unmasking PII (TS-09)
    const userId = request.headers.get('x-user-id');
    const clientIp = request.headers.get('x-forwarded-for')?.split(',')[0].trim() || '127.0.0.1';

    await prisma.auditLog.create({
      data: {
        userId: userId || undefined,
        action: 'UNMASK_FULL_PII',
        targetId: params.id,
        details: `Staff requested full phone number for case ${params.id}`,
        ipAddress: clientIp,
      },
    });

    return NextResponse.json({
      ...reliefCase,
      itemsNeeded: (() => {
        try {
          return JSON.parse(reliefCase.itemsNeeded || '[]');
        } catch {
          return [];
        }
      })(),
    });
  } catch (error) {
    console.error('Error fetching case detail:', error);
    return NextResponse.json({ error: 'SERVER_ERROR', message: 'เกิดข้อผิดพลาดในการดึงข้อมูลเคส' }, { status: 500 });
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const userRole = request.headers.get('x-user-role') || '';
    const body = await request.json().catch(() => ({}));
    const { status, urgency, description } = body;

    // RBAC: RESCUE role can ONLY update status
    if (userRole === 'RESCUE' && (urgency !== undefined || description !== undefined)) {
      return NextResponse.json(
        { error: 'FORBIDDEN', message: 'หน่วยกู้ภัยสามารถเปลี่ยนสถานะได้อย่างเดียว ไม่สามารถแก้ไขข้อมูลอื่นได้' },
        { status: 403 }
      );
    }

    const existingCase = await prisma.reliefCase.findUnique({
      where: { id: params.id },
    });

    if (!existingCase) {
      return NextResponse.json({ error: 'NOT_FOUND', message: 'ไม่พบเคสที่ต้องการแก้ไข' }, { status: 404 });
    }

    const updateData: any = {};
    if (status && ['PENDING', 'IN_PROGRESS', 'RESOLVED', 'CANCELLED'].includes(status)) {
      updateData.status = status;
    }
    if (urgency && ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'].includes(urgency)) {
      updateData.urgency = urgency;
    }
    if (description !== undefined) {
      updateData.description = description;
    }

    const updatedCase = await prisma.reliefCase.update({
      where: { id: params.id },
      data: updateData,
    });

    // Record Audit Log for status update
    const userId = request.headers.get('x-user-id');
    const clientIp = request.headers.get('x-forwarded-for')?.split(',')[0].trim() || '127.0.0.1';

    await prisma.auditLog.create({
      data: {
        userId: userId || undefined,
        action: 'UPDATE_CASE_STATUS',
        targetId: params.id,
        details: `Updated case fields: ${Object.keys(updateData).join(', ')}`,
        ipAddress: clientIp,
      },
    });

    return NextResponse.json({
      success: true,
      case: {
        ...updatedCase,
        itemsNeeded: (() => {
          try {
            return JSON.parse(updatedCase.itemsNeeded || '[]');
          } catch {
            return [];
          }
        })(),
      },
    });
  } catch (error) {
    console.error('Error updating case:', error);
    return NextResponse.json({ error: 'SERVER_ERROR', message: 'ไม่สามารถอัปเดตข้อมูลเคสได้' }, { status: 500 });
  }
}

// Permanent Delete Case from Trash (Hard Delete)
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const userRole = request.headers.get('x-user-role') || '';
    if (userRole === 'RESCUE') {
      return NextResponse.json(
        { error: 'FORBIDDEN', message: 'หน่วยกู้ภัยสามารถดูข้อมูลได้อย่างเดียว ไม่สามารถลบเคสได้' },
        { status: 403 }
      );
    }

    const existingCase = await prisma.reliefCase.findUnique({
      where: { id: params.id },
    });

    if (!existingCase) {
      return NextResponse.json({ error: 'NOT_FOUND', message: 'ไม่พบเคสที่ต้องการลบ' }, { status: 404 });
    }

    await prisma.reliefCase.delete({
      where: { id: params.id },
    });

    // Record Audit Log for permanent deletion
    const userId = request.headers.get('x-user-id');
    const clientIp = request.headers.get('x-forwarded-for')?.split(',')[0].trim() || '127.0.0.1';

    await prisma.auditLog.create({
      data: {
        userId: userId || undefined,
        action: 'DELETE_CASE_PERMANENT',
        targetId: params.id,
        details: `Permanently deleted case originally reported by ${existingCase.reporterName}`,
        ipAddress: clientIp,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'ลบเคสออกจากระบบถาวรเรียบร้อยแล้ว',
    });
  } catch (error) {
    console.error('Error permanently deleting case:', error);
    return NextResponse.json({ error: 'SERVER_ERROR', message: 'ไม่สามารถลบเคสได้' }, { status: 500 });
  }
}
