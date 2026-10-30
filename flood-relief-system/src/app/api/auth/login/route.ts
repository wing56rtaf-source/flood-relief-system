import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyPassword, generateSessionToken } from '@/lib/auth';

// In-memory brute-force protection tracking
const loginAttempts = new Map<string, { count: number; lockUntil: number }>();

/**
 * Verify OTP against RTAF MFA API Gateway
 * POST http://apigw.rtaf.mi.th/login-rtaf-mfa/v2/mfa/login
 * Headers: { "Content-Type": "application/json" }
 * Body: { "user": email, "pass": otp }
 */
async function verifyRtafMfa(email: string, otp: string): Promise<boolean> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 8000);

  try {
    const res = await fetch('http://apigw.rtaf.mi.th/login-rtaf-mfa/v2/mfa/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        user: email,
        pass: otp,
      }),
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    if (res.ok) {
      const data = await res.json().catch(() => ({}));
      if (
        data.result === 'Process-Error' ||
        data.authorized === false ||
        data.status === 'error' ||
        data.error ||
        data.code === 401 ||
        data.success === false
      ) {
        return false;
      }
      return true;
    }
    return false;
  } catch (err: any) {
    clearTimeout(timeoutId);
    console.warn('RTAF MFA API Gateway connection:', err?.message || err);
    return false;
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const { username, password, otp } = body;
    const rawUsername = String(username || '').trim();
    const cleanUsername = rawUsername.split('@')[0].toLowerCase();
    const clientIp = request.headers.get('x-forwarded-for')?.split(',')[0].trim() || '127.0.0.1';
    const key = `${clientIp}_${cleanUsername || 'anonymous'}`;

    const attempt = loginAttempts.get(key) || { count: 0, lockUntil: 0 };

    // 1. Brute-force Account Lockout Check (TS-12)
    if (Date.now() < attempt.lockUntil) {
      const remainingMinutes = Math.ceil((attempt.lockUntil - Date.now()) / 60000);
      return NextResponse.json(
        {
          error: 'ACCOUNT_LOCKED',
          message: `บัญชีถูกระงับชั่วคราวเนื่องจากเข้าระบบผิดหลายครั้ง กรุณารอ ${remainingMinutes} นาที`,
        },
        { status: 429 }
      );
    }

    // 2. Validate input - require username and OTP (or password)
    if (!cleanUsername || (!password && !otp)) {
      return NextResponse.json(
        { error: 'INVALID_INPUT', message: 'กรุณากรอกชื่อผู้ใช้ Email RTAF และรหัส OTP' },
        { status: 400 }
      );
    }

    // 3. Find user by username
    const user = await prisma.user.findUnique({
      where: { username: cleanUsername },
    });

    // 4. Validate credentials: RTAF MFA API Gateway OTP
    let isCredentialValid = false;
    if (user) {
      if (otp) {
        const cleanOtp = String(otp).trim();
        const emailPayload = rawUsername.includes('@') ? rawUsername : `${cleanUsername}@rtaf.mi.th`;
        isCredentialValid = await verifyRtafMfa(emailPayload, cleanOtp);
      } else if (password) {
        isCredentialValid = await verifyPassword(password, user.passwordHash);
      }
    }

    if (!user || !isCredentialValid) {
      attempt.count += 1;
      if (attempt.count >= 5) {
        attempt.lockUntil = Date.now() + 15 * 60 * 1000; // Lock for 15 minutes
      }
      loginAttempts.set(key, attempt);

      return NextResponse.json(
        {
          error: 'INVALID_CREDENTIALS',
          message: otp
            ? 'ชื่อผู้ใช้งานหรือรหัส OTP ไม่ถูกต้อง'
            : 'ชื่อผู้ใช้งานหรือรหัสผ่านไม่ถูกต้อง',
          attemptsLeft: Math.max(0, 5 - attempt.count),
        },
        { status: 401 }
      );
    }

    // Reset failed attempts on success
    loginAttempts.delete(key);

    // 4. Generate signed JWT session token
    const token = generateSessionToken({
      userId: user.id,
      username: user.username,
      name: user.name,
      role: user.role as any,
    });

    const response = NextResponse.json({
      success: true,
      user: {
        id: user.id,
        username: user.username,
        name: user.name,
        role: user.role,
      },
    });

    // 5. Set HttpOnly Cookie (TS-13)
    response.cookies.set('session_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 8 * 60 * 60, // 8 hours
      path: '/',
    });

    return response;
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: 'SERVER_ERROR', message: 'เกิดข้อผิดพลาดที่เซิร์ฟเวอร์' },
      { status: 500 }
    );
  }
}
