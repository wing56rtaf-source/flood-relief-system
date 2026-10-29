import { notFound } from 'next/navigation';
import { isPublicIntakeEnabled } from '@/lib/settings';

export const dynamic = 'force-dynamic';

export default async function ReportLayout({ children }: { children: React.ReactNode }) {
  const isEnabled = await isPublicIntakeEnabled();
  if (!isEnabled) {
    notFound();
  }
  return <>{children}</>;
}
