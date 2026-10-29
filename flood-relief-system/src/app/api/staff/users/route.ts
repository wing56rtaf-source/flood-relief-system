import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { hashPassword, canManageUsers, sanitizeText } from '@/lib/auth';

export async function GET(request: Request) {
  try {
    const role = request.headers.get('x-user-role') || '';
    if (!canManageUsers(role)) {
      return NextResponse.json(
        { error: 'FORBIDDEN', message: 'คุณไม่มีสิทธิ์เข้าถึงระบบจัดการผู้ใช้งาน' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search')?.trim().toLowerCase();

    let whereClause = {};
    if (search) {
      whereClause = {
        OR: [
          { username: { contains: search } },
          { name: { contains: search } },
          { role: { contains: search } },
        ],
      };
    }

    const users = await prisma.user.findMany({
      where: whereClause,
      select: {
        id: true,
        username: true,
        name: true,
        role: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'asc' },
    });

    return NextResponse.json(users);
  } catch (error) {
    console.error('Error fetching users:', error);
    return NextResponse.json(
      { error: 'SERVER_ERROR', message: 'ไม่สามารถดึงข้อมูลรายชื่อผู้ใช้ได้' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const creatorRole = request.headers.get('x-user-role') || '';
    const creatorId = request.headers.get('x-user-id');
    const clientIp = request.headers.get('x-forwarded-for')?.split(',')[0].trim() || '127.0.0.1';

    // Prime Admin, Admin, and Data Entry can add users
    if (!['PRIME_ADMIN', 'ADMIN', 'DATA_ENTRY'].includes(creatorRole)) {
      return NextResponse.json(
        { error: 'FORBIDDEN', message: 'เฉพาะ Prime Admin, Admin หรือ ผู้กรอกข้อมูล เท่านั้นที่มีสิทธิ์เพิ่มผู้ใช้งาน' },
        { status: 403 }
      );
    }

    const body = await request.json().catch(() => ({}));
    const { username, name, role } = body;

    if (!username?.trim() || !name?.trim() || !role) {
      return NextResponse.json(
        { error: 'INVALID_INPUT', message: 'กรุณากรอกชื่อผู้ใช้ Email RTAF, ชื่อ-นามสกุล และเลือกบทบาทหน้าที่' },
        { status: 400 }
      );
    }

    // Strip '@...' if entered
    const cleanUsername = username.trim().split('@')[0].toLowerCase();
    const cleanName = sanitizeText(name.trim());
    const validRoles = ['DATA_ENTRY', 'RESCUE', 'STAFF', 'ADMIN'];

    if (!validRoles.includes(role)) {
      return NextResponse.json(
        { error: 'INVALID_ROLE', message: 'บทบาทหน้าที่ไม่ถูกต้อง ต้องเป็น แอดมิน (ADMIN), ผู้กรอกข้อมูล (DATA_ENTRY) หรือ หน่วยกู้ภัย (RESCUE)' },
        { status: 400 }
      );
    }

    // DATA_ENTRY cannot create ADMIN accounts
    if (creatorRole === 'DATA_ENTRY' && role === 'ADMIN') {
      return NextResponse.json(
        { error: 'FORBIDDEN', message: 'ผู้กรอกข้อมูลไม่มีสิทธิ์สร้างบัญชี Admin' },
        { status: 403 }
      );
    }

    // Check if username is already taken
    const existing = await prisma.user.findUnique({
      where: { username: cleanUsername },
    });

    if (existing) {
      return NextResponse.json(
        { error: 'USERNAME_EXISTS', message: `ชื่อผู้ใช้ Email RTAF "${cleanUsername}" มีอยู่ในระบบแล้ว` },
        { status: 409 }
      );
    }

    // Default password hash (since OTP 123456 is used for authentication)
    const defaultPasswordHash = await hashPassword('otp123456');

    const newUser = await prisma.user.create({
      data: {
        username: cleanUsername,
        name: cleanName,
        role,
        passwordHash: defaultPasswordHash,
      },
      select: {
        id: true,
        username: true,
        name: true,
        role: true,
        createdAt: true,
      },
    });

    // Record Audit Log
    await prisma.auditLog.create({
      data: {
        userId: creatorId || undefined,
        action: 'CREATE_USER',
        targetId: newUser.id,
        details: `Created new user ${newUser.username} with role ${newUser.role}`,
        ipAddress: clientIp,
      },
    });

    return NextResponse.json(
      {
        success: true,
        message: `เพิ่มผู้ใช้ ${newUser.name} (${newUser.role}) สำเร็จ`,
        user: newUser,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating user:', error);
    return NextResponse.json(
      { error: 'SERVER_ERROR', message: 'ไม่สามารถสร้างผู้ใช้ได้' },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request) {
  try {
    const callerRole = request.headers.get('x-user-role') || '';
    const callerId = request.headers.get('x-user-id');
    const clientIp = request.headers.get('x-forwarded-for')?.split(',')[0].trim() || '127.0.0.1';

    // Only PRIME_ADMIN and ADMIN can edit users (DATA_ENTRY cannot edit users)
    if (!['PRIME_ADMIN', 'ADMIN'].includes(callerRole)) {
      return NextResponse.json(
        { error: 'FORBIDDEN', message: 'เฉพาะ Prime Admin หรือ Admin เท่านั้นที่มีสิทธิ์แก้ไขข้อมูลผู้ใช้งาน' },
        { status: 403 }
      );
    }

    const body = await request.json().catch(() => ({}));
    const { id, username, name, role } = body;

    if (!id) {
      return NextResponse.json(
        { error: 'INVALID_INPUT', message: 'ระบุ ID ผู้ใช้ที่ต้องการแก้ไข' },
        { status: 400 }
      );
    }

    const targetUser = await prisma.user.findUnique({
      where: { id },
    });

    if (!targetUser) {
      return NextResponse.json(
        { error: 'NOT_FOUND', message: 'ไม่พบผู้ใช้นี้ในระบบ' },
        { status: 404 }
      );
    }

    // Protect Prime Admin from role demotion
    if ((targetUser.username === 'nattanon_r' || targetUser.role === 'PRIME_ADMIN') && role && role !== 'PRIME_ADMIN') {
      return NextResponse.json(
        { error: 'FORBIDDEN', message: 'ไม่สามารถเปลี่ยนบทบาทของ Prime Admin ได้' },
        { status: 403 }
      );
    }

    const updateData: { username?: string; name?: string; role?: string } = {};

    if (username && typeof username === 'string') {
      const cleanUsername = username.trim().split('@')[0].toLowerCase();
      if (cleanUsername && cleanUsername !== targetUser.username) {
        if (targetUser.username === 'nattanon_r' || targetUser.role === 'PRIME_ADMIN') {
          return NextResponse.json(
            { error: 'FORBIDDEN', message: 'ไม่สามารถเปลี่ยนชื่อผู้ใช้ของ Prime Admin ได้' },
            { status: 403 }
          );
        }
        const existing = await prisma.user.findUnique({
          where: { username: cleanUsername },
        });
        if (existing) {
          return NextResponse.json(
            { error: 'USERNAME_EXISTS', message: `ชื่อผู้ใช้ Email RTAF "${cleanUsername}" มีอยู่ในระบบแล้ว` },
            { status: 409 }
          );
        }
        updateData.username = cleanUsername;
      }
    }

    if (name && typeof name === 'string') {
      updateData.name = sanitizeText(name.trim());
    }

    if (role && typeof role === 'string') {
      const allowedRoles = ['DATA_ENTRY', 'RESCUE', 'STAFF', 'ADMIN', 'PRIME_ADMIN'];
      if (!allowedRoles.includes(role)) {
        return NextResponse.json(
          { error: 'INVALID_ROLE', message: 'บทบาทหน้าที่ไม่ถูกต้อง' },
          { status: 400 }
        );
      }
      updateData.role = role;
    }

    const updatedUser = await prisma.user.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        username: true,
        name: true,
        role: true,
        createdAt: true,
      },
    });

    // Record Audit Log
    await prisma.auditLog.create({
      data: {
        userId: callerId || undefined,
        action: 'UPDATE_USER',
        targetId: updatedUser.id,
        details: `Updated user ${updatedUser.username}: ${JSON.stringify(updateData)}`,
        ipAddress: clientIp,
      },
    });

    return NextResponse.json({
      success: true,
      message: `แก้ไขข้อมูลผู้ใช้ ${updatedUser.name} สำเร็จ`,
      user: updatedUser,
    });
  } catch (error) {
    console.error('Error updating user:', error);
    return NextResponse.json(
      { error: 'SERVER_ERROR', message: 'ไม่สามารถแก้ไขข้อมูลผู้ใช้ได้' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const callerRole = request.headers.get('x-user-role') || '';
    const callerId = request.headers.get('x-user-id');
    const clientIp = request.headers.get('x-forwarded-for')?.split(',')[0].trim() || '127.0.0.1';

    // Only PRIME_ADMIN and ADMIN can delete users (DATA_ENTRY cannot delete users)
    if (!['PRIME_ADMIN', 'ADMIN'].includes(callerRole)) {
      return NextResponse.json(
        { error: 'FORBIDDEN', message: 'เฉพาะ Prime Admin หรือ Admin เท่านั้นที่มีสิทธิ์ลบผู้ใช้งาน' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    let targetId = searchParams.get('id');

    if (!targetId) {
      const body = await request.json().catch(() => ({}));
      targetId = body.id;
    }

    if (!targetId) {
      return NextResponse.json(
        { error: 'INVALID_INPUT', message: 'ระบุ ID ผู้ใช้ที่ต้องการลบ' },
        { status: 400 }
      );
    }

    const targetUser = await prisma.user.findUnique({
      where: { id: targetId },
    });

    if (!targetUser) {
      return NextResponse.json(
        { error: 'NOT_FOUND', message: 'ไม่พบผู้ใช้นี้ในระบบ' },
        { status: 404 }
      );
    }

    // Protection 1: Cannot delete Prime Admin
    if (targetUser.username === 'nattanon_r' || targetUser.role === 'PRIME_ADMIN') {
      return NextResponse.json(
        { error: 'FORBIDDEN', message: 'ไม่สามารถลบบัญชี Prime Admin ได้' },
        { status: 403 }
      );
    }

    // Protection 2: Cannot delete currently logged in self
    if (callerId && targetUser.id === callerId) {
      return NextResponse.json(
        { error: 'SELF_DELETE_FORBIDDEN', message: 'ไม่สามารถลบบัญชีของตัวเองขณะเข้าสู่ระบบอยู่ได้' },
        { status: 400 }
      );
    }

    await prisma.user.delete({
      where: { id: targetId },
    });

    // Record Audit Log
    await prisma.auditLog.create({
      data: {
        userId: callerId || undefined,
        action: 'DELETE_USER',
        targetId: targetId,
        details: `Deleted user ${targetUser.username} (${targetUser.name}, ${targetUser.role})`,
        ipAddress: clientIp,
      },
    });

    return NextResponse.json({
      success: true,
      message: `ลบผู้ใช้ ${targetUser.name} (@${targetUser.username}) สำเร็จ`,
    });
  } catch (error) {
    console.error('Error deleting user:', error);
    return NextResponse.json(
      { error: 'SERVER_ERROR', message: 'ไม่สามารถลบผู้ใช้ได้' },
      { status: 500 }
    );
  }
}
