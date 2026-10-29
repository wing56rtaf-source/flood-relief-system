import Link from 'next/link';
import DarkModeToggle from '@/components/dark-mode-toggle';
import { prisma } from '@/lib/prisma';
import PublicMapWrapper from '@/components/public-map-wrapper';

export const dynamic = 'force-dynamic';

export default async function HomePage() {
  // Fetch active relief cases (excluding cancelled/trash)
  let publicCases: any[] = [];
  try {
    const raw = await prisma.reliefCase.findMany({
      where: {
        status: { not: 'CANCELLED' },
      },
      orderBy: { createdAt: 'desc' },
    });

    publicCases = raw.map((c) => ({
      id: c.id,
      reporterName: c.reporterName,
      peopleCount: c.peopleCount,
      urgency: c.urgency,
      status: c.status,
      latitude: c.latitude,
      longitude: c.longitude,
      addressDetail: c.addressDetail,
      itemsNeeded: (() => {
        try {
          return JSON.parse(c.itemsNeeded || '[]');
        } catch {
          return [];
        }
      })(),
      createdAt: c.createdAt.toISOString(),
    }));
  } catch (err) {
    console.error('Failed to fetch public cases:', err);
  }

  const totalPeople = publicCases.reduce((sum, c) => sum + (c.peopleCount || 0), 0);
  const criticalCount = publicCases.filter((c) => c.urgency === 'CRITICAL' && c.status !== 'RESOLVED').length;
  const inProgressCount = publicCases.filter((c) => c.status === 'IN_PROGRESS').length;
  const resolvedCount = publicCases.filter((c) => c.status === 'RESOLVED').length;

  return (
    <div className="min-h-screen flex flex-col justify-between bg-gradient-to-b from-blue-50/70 via-slate-50 to-slate-100 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 font-prompt transition-colors duration-200">
      {/* Top Navbar */}
      <nav className="w-full max-w-7xl mx-auto px-4 sm:px-6 py-4 flex justify-between items-center gap-3">
        <div className="flex items-center gap-2.5 min-w-0">
          <span className="text-2xl sm:text-3xl shrink-0">🌊</span>
          <div>
            <span className="font-bold text-sm sm:text-base text-slate-800 dark:text-slate-100 truncate block leading-tight">
              ศูนย์ประสานงานช่วยเหลือผู้ประสบภัยน้ำท่วม
            </span>
            <span className="text-[11px] text-slate-500 dark:text-slate-400 hidden xs:block">
              สถานการณ์อุทกภัย หาดใหญ่ &amp; สงขลา
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2.5 shrink-0">
          <DarkModeToggle />
          <Link
            href="/login"
            className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-4 sm:px-5 py-2.5 rounded-xl text-xs sm:text-sm transition-all shadow-md shadow-blue-500/20 active:scale-95"
          >
            เจ้าหน้าที่เข้าสู่ระบบ
          </Link>
        </div>
      </nav>

      {/* Main Content Area */}
      <main className="max-w-7xl w-full mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6">
        {/* Title Header */}
        <div className="text-center max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-blue-100 dark:bg-blue-950/70 text-blue-700 dark:text-blue-300 text-xs font-semibold uppercase tracking-wider mb-3 border border-blue-200 dark:border-blue-800/60">
            แผนที่สถานการณ์จริง &bull; LIVE RELIEF MAP
          </div>
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-slate-900 dark:text-slate-50 tracking-tight leading-snug">
            พิกัดจุดขอความช่วยเหลือผู้ประสบอุทกภัย
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-2 max-w-xl mx-auto">
            แสดงตำแหน่งจุดขอความช่วยเหลือในพื้นที่อำเภอหาดใหญ่และใกล้เคียง คลิกที่หมุดเพื่อดูข้อมูลสิ่งของจำเป็น
            (ข้อมูลส่วนบุคคลได้รับการคุ้มครองเพื่อความปลอดภัย)
          </p>
        </div>

        {/* Live Counters */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 max-w-4xl mx-auto">
          <div className="bg-white dark:bg-slate-900 p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm text-center">
            <span className="text-xs text-slate-500 dark:text-slate-400">จุดแจ้งเหตุทั้งหมด</span>
            <p className="text-xl sm:text-2xl font-black text-slate-800 dark:text-slate-100 mt-0.5">{publicCases.length}</p>
          </div>
          <div className="bg-white dark:bg-slate-900 p-3.5 rounded-2xl border border-rose-200 dark:border-rose-900/60 shadow-sm text-center">
            <span className="text-xs text-rose-600 dark:text-rose-400 font-semibold flex items-center justify-center gap-1">
              <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping inline-block"></span> วิกฤตค้างอยู่
            </span>
            <p className="text-xl sm:text-2xl font-black text-rose-600 dark:text-rose-400 mt-0.5">{criticalCount}</p>
          </div>
          <div className="bg-white dark:bg-slate-900 p-3.5 rounded-2xl border border-blue-200 dark:border-blue-900/60 shadow-sm text-center">
            <span className="text-xs text-blue-600 dark:text-blue-400 font-semibold">🚤 กำลังช่วยเหลือ</span>
            <p className="text-xl sm:text-2xl font-black text-blue-600 dark:text-blue-400 mt-0.5">{inProgressCount}</p>
          </div>
          <div className="bg-white dark:bg-slate-900 p-3.5 rounded-2xl border border-emerald-200 dark:border-emerald-900/60 shadow-sm text-center">
            <span className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold">👥 ผู้ประสบภัยรวม</span>
            <p className="text-xl sm:text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-0.5">{totalPeople} คน</p>
          </div>
        </div>

        {/* Centered Map Container */}
        <div className="max-w-5xl mx-auto">
          <PublicMapWrapper cases={publicCases} />
        </div>

        {/* Action Buttons Below Map */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center items-center pt-2 max-w-md mx-auto">
          <Link
            href="/login"
            className="w-full sm:w-auto bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold px-7 py-3 rounded-2xl shadow-lg shadow-blue-500/25 transition-all text-xs sm:text-sm active:scale-95 text-center flex items-center justify-center gap-2"
          >
            <span>🔐</span> สำหรับเจ้าหน้าที่: เข้าจัดการเคส &rarr;
          </Link>
        </div>
      </main>

      {/* Footer */}
      <footer className="w-full border-t border-slate-200/80 dark:border-slate-800/80 bg-white/50 dark:bg-slate-900/50 py-4 text-center text-xs text-slate-500 dark:text-slate-400 transition-colors">
        ระบบศูนย์ช่วยเหลือผู้ประสบภัยน้ำท่วม © 2026 &bull; พิกัดแผนที่สนับสนุนโดย OpenStreetMap contributors
      </footer>
    </div>
  );
}
