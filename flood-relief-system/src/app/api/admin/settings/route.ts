import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { updateSystemSetting, isPublicIntakeEnabled } from '@/lib/settings';

export async function GET(request: Request) {
  try {
    const role = request.headers.get('x-user-role') || '';
    if (!['PRIME_ADMIN', 'ADMIN'].includes(role)) {
      return NextResponse.json({ error: 'FORBIDDEN', message: 'เฉพาะ Prime Admin หรือ Admin เท่านั้น' }, { status: 403 });
    }

    const settings = await prisma.systemSetting.findMany();
    const isPublicEnabled = await isPublicIntakeEnabled();

    // Fetch recent audit logs for admin review
    const recentLogs = await prisma.auditLog.findMany({
      take: 50,
      orderBy: { createdAt: 'desc' },
      include: {
        user: {
          select: { username: true, name: true, role: true },
        },
      },
    });

    return NextResponse.json({
      settings,
      features: {
        ENABLE_PUBLIC_INTAKE: isPublicEnabled,
      },
      auditLogs: recentLogs,
    });
  } catch (error) {
    console.error('Error fetching admin settings:', error);
    return NextResponse.json({ error: 'SERVER_ERROR', message: 'เกิดข้อผิดพลาดในการดึงข้อมูลการตั้งค่า' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const role = request.headers.get('x-user-role') || '';
    if (!['PRIME_ADMIN', 'ADMIN'].includes(role)) {
      return NextResponse.json({ error: 'FORBIDDEN', message: 'เฉพาะ Prime Admin หรือ Admin เท่านั้น' }, { status: 403 });
    }

    const body = await request.json().catch(() => ({}));
    const { key, value } = body;

    if (!key || value === undefined) {
      return NextResponse.json({ error: 'INVALID_INPUT', message: 'กรุณาระบุ key และ value' }, { status: 400 });
    }

    const userId = request.headers.get('x-user-id');
    const clientIp = request.headers.get('x-forwarded-for')?.split(',')[0].trim() || '127.0.0.1';

    // Update in database
    const updated = await updateSystemSetting(key, String(value), userId || undefined);

    // Record Audit Log for administrative setting change
    await prisma.auditLog.create({
      data: {
        userId: userId || undefined,
        action: 'UPDATE_SYSTEM_SETTING',
        targetId: key,
        details: `Changed ${key} to ${value}`,
        ipAddress: clientIp,
      },
    });

    return NextResponse.json({
      success: true,
      setting: updated,
    });
  } catch (error) {
    console.error('Error updating system setting:', error);
    return NextResponse.json({ error: 'SERVER_ERROR', message: 'ไม่สามารถอัปเดตการตั้งค่าได้' }, { status: 500 });
  }
}
