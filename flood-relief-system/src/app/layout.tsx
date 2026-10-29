import './globals.css';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'ระบบช่วยเหลือผู้ประสบภัยน้ำท่วม (Flood Relief System)',
  description: 'ระบบจัดการและประสานงานช่วยเหลือผู้ประสบภัยน้ำท่วมสำหรับเจ้าหน้าที่',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="th" suppressHydrationWarning>
      <head>
        <link
          rel="stylesheet"
          href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"
          integrity="sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY="
          crossOrigin=""
        />
      </head>
      <body className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 antialiased transition-colors duration-200">
        {children}
      </body>
    </html>
  );
}
