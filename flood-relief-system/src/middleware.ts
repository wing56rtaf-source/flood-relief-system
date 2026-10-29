import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { verifyJwtEdge } from './lib/jwt-edge';

const JWT_SECRET = process.env.JWT_SECRET || 'flood_relief_default_secret_key_2026';

export async function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;

  // 1. Guard Protected Web Routes (/dashboard)
  if (path.startsWith('/dashboard')) {
    const sessionToken = request.cookies.get('session_token')?.value;
    if (!sessionToken) {
      return NextResponse.redirect(new URL('/login', request.url));
    }

    const payload = await verifyJwtEdge(sessionToken, JWT_SECRET);
    if (!payload) {
      const response = NextResponse.redirect(new URL('/login', request.url));
      response.cookies.delete('session_token');
      return response;
    }

    // Role check for admin sub-routes
    if (path.startsWith('/dashboard/admin') && !['ADMIN', 'PRIME_ADMIN'].includes(payload.role)) {
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }
  }

  // 3. Guard Protected API Routes (/api/staff and /api/admin)
  if (path.startsWith('/api/staff') || path.startsWith('/api/admin')) {
    const sessionToken = request.cookies.get('session_token')?.value;
    if (!sessionToken) {
      return NextResponse.json({ error: 'UNAUTHORIZED', message: 'กรุณาเข้าสู่ระบบ' }, { status: 401 });
    }

    const payload = await verifyJwtEdge(sessionToken, JWT_SECRET);
    if (!payload) {
      return NextResponse.json({ error: 'INVALID_SESSION', message: 'เซสชันหมดอายุหรือไม่ถูกต้อง' }, { status: 401 });
    }

    // Pass user info downstream via headers
    const requestHeaders = new Headers(request.headers);
    requestHeaders.set('x-user-id', payload.userId);
    requestHeaders.set('x-user-role', payload.role);
    requestHeaders.set('x-user-name', encodeURIComponent(payload.name || payload.username));

    // Admin role enforcement
    if (path.startsWith('/api/admin') && !['ADMIN', 'PRIME_ADMIN'].includes(payload.role)) {
      return NextResponse.json({ error: 'FORBIDDEN', message: 'เฉพาะผู้ดูแลระบบ (ADMIN) เท่านั้น' }, { status: 403 });
    }

    return NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    });
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/report',
    '/api/public/:path*',
    '/dashboard/:path*',
    '/dashboard',
    '/api/staff/:path*',
    '/api/admin/:path*',
  ],
};
