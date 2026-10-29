import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-slate-50 text-center">
      <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center text-4xl mb-4 shadow-sm">
        🔍
      </div>
      <h1 className="text-4xl font-bold text-slate-800 mb-2">404</h1>
      <h2 className="text-xl font-semibold text-slate-700 mb-4">ไม่พบหน้าที่คุณต้องการ</h2>
      <p className="text-slate-500 max-w-md mb-8">
        หน้านี้ไม่มีอยู่ หรือฟังก์ชันการใช้งานดังกล่าวอาจยังไม่เปิดให้บริการในขณะนี้
      </p>
      <Link
        href="/login"
        className="inline-flex items-center justify-center px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-medium shadow-md transition-colors"
      >
        เข้าสู่ระบบเจ้าหน้าที่
      </Link>
    </div>
  );
}
