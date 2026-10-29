'use client';

import React from 'react';
import dynamic from 'next/dynamic';
import { PublicCaseItem } from './public-map';

const PublicMap = dynamic(() => import('./public-map'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-[380px] sm:h-[460px] md:h-[500px] rounded-3xl bg-slate-100 dark:bg-slate-900 flex flex-col items-center justify-center text-slate-400 gap-3 border border-slate-200 dark:border-slate-800">
      <div className="animate-spin text-3xl">🌍</div>
      <p className="text-xs sm:text-sm font-medium">กำลังโหลดแผนที่จุดขอความช่วยเหลือ OpenStreetMap...</p>
    </div>
  ),
});

export default function PublicMapWrapper({ cases }: { cases: PublicCaseItem[] }) {
  return <PublicMap cases={cases} />;
}
