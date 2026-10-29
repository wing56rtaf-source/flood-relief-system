import { NextResponse } from 'next/server';
import { isPublicIntakeEnabled } from '@/lib/settings';

export const dynamic = 'force-dynamic';

export async function GET() {
  const isEnabled = await isPublicIntakeEnabled();
  return NextResponse.json({ enabled: isEnabled });
}
