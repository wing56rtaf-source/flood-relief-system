'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import DarkModeToggle from '@/components/dark-mode-toggle';

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [otp, setOtp] = useState('123456');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setIsLoading(true);

    try {
      const cleanUser = username.trim().split('@')[0].toLowerCase();
      const payload = { username: cleanUser, otp: otp.trim() };

      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        setErrorMessage(data.message || 'เข้าสู่ระบบไม่สำเร็จ');
        setIsLoading(false);
        return;
      }

      router.push('/dashboard');
      router.refresh();
    } catch {
      setErrorMessage('ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้ กรุณาลองใหม่อีกครั้ง');
      setIsLoading(false);
    }
  };

  const handleSelectDemoAccount = (user: string) => {
    setUsername(user);
    setOtp('123456');
    setErrorMessage(null);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-slate-50 dark:bg-slate-950 font-prompt transition-colors duration-200 relative">
      {/* Floating Dark Mode Toggle */}
      <div className="absolute top-5 right-5 z-20">
        <DarkModeToggle />
      </div>

      <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-100 dark:border-slate-800 p-7 sm:p-8 transition-colors">
        <div className="text-center mb-6">
          <div className="inline-flex w-16 h-16 bg-blue-100 dark:bg-blue-950/60 rounded-3xl items-center justify-center text-3xl mb-3 shadow-inner">
            🌊
          </div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100">เข้าสู่ระบบเจ้าหน้าที่</h1>
          <p className="text-slate-500 dark:text-slate-400 text-xs sm:text-sm mt-1">Flood Relief Operations Portal (RTAF)</p>
        </div>

        {errorMessage && (
          <div className="mb-6 bg-red-50 dark:bg-red-950/50 border-l-4 border-red-500 p-4 rounded-r-xl text-red-700 dark:text-red-300 text-xs sm:text-sm flex items-start gap-2">
            <span>⚠️</span>
            <div>{errorMessage}</div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              ชื่อผู้ใช้ Email RTAF
            </label>
            <div className="relative flex items-center">
              <input
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Email RTAF ไม่ต้องใส่ @"
                className="w-full px-4 py-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-slate-800 dark:text-slate-100 text-sm transition-all"
              />
              <span className="absolute right-3.5 text-xs font-mono text-slate-400 pointer-events-none">
                @rtaf.mi.th
              </span>
            </div>
            <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1">
              * กรอกเฉพาะชื่อบัญชีก่อนเครื่องหมาย @ (เช่น <code>nattanon_r</code>)
            </p>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                รหัส OTP (6 หลัก)
              </label>
              <span className="text-[11px] text-blue-600 dark:text-blue-400 font-medium bg-blue-50 dark:bg-blue-950/60 px-2 py-0.5 rounded-full">
                OTP จำลอง: 123456
              </span>
            </div>
            <div className="relative">
              <input
                type="text"
                required
                maxLength={6}
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                placeholder="123456"
                className="w-full tracking-widest text-center font-mono text-base font-bold px-4 py-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-slate-800 dark:text-slate-100 transition-all"
              />
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
              * สำหรับการทดสอบระบบ สามารถใช้รหัส OTP กลางคือ <code className="font-bold text-blue-600 dark:text-blue-400">123456</code> ได้ทันที
            </p>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full mt-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold py-3.5 rounded-xl shadow-lg shadow-blue-500/25 transition-all text-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 active:scale-98"
          >
            {isLoading ? (
              <>
                <svg className="animate-spin h-5 w-5 text-white" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                </svg>
                กำลังเข้าสู่ระบบ...
              </>
            ) : (
              'เข้าสู่ระบบด้วย OTP'
            )}
          </button>
        </form>

        {/* Roles & Demo Accounts Box */}
        <div className="mt-6 pt-5 border-t border-slate-100 dark:border-slate-800 text-xs text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-800/60 p-4 rounded-2xl">
          <p className="font-semibold text-slate-700 dark:text-slate-200 mb-2">เลือกบัญชีทดสอบตามสิทธิ์ (คลิกเพื่อเลือก):</p>
          <div className="space-y-2">
            <button
              type="button"
              onClick={() => handleSelectDemoAccount('nattanon_r')}
              className="w-full text-left p-2.5 rounded-xl border border-purple-200 dark:border-purple-900/60 bg-purple-50/50 dark:bg-purple-950/30 hover:bg-purple-100/60 dark:hover:bg-purple-900/50 transition-colors flex items-center justify-between"
            >
              <div>
                <span className="font-bold text-purple-700 dark:text-purple-300 block text-xs">
                  👑 Prime Admin (<code className="font-mono">nattanon_r</code>)
                </span>
                <span className="text-[11px] text-slate-500 dark:text-slate-400">
                  สิทธิ์ผู้ดูแลระบบหลัก: เพิ่ม/ลบ/แก้ไข/ค้นหาผู้ใช้, จัดการและลบเคส
                </span>
              </div>
              <span className="text-purple-600 dark:text-purple-400 font-bold text-xs">เลือก &rarr;</span>
            </button>

            <button
              type="button"
              onClick={() => handleSelectDemoAccount('admin')}
              className="w-full text-left p-2.5 rounded-xl border border-indigo-200 dark:border-indigo-900/60 bg-indigo-50/50 dark:bg-indigo-950/30 hover:bg-indigo-100/60 dark:hover:bg-indigo-900/50 transition-colors flex items-center justify-between"
            >
              <div>
                <span className="font-bold text-indigo-700 dark:text-indigo-300 block text-xs">
                  ⚙️ Admin (<code className="font-mono">admin</code>)
                </span>
                <span className="text-[11px] text-slate-500 dark:text-slate-400">
                  สิทธิ์ผู้ดูแลระบบ: ทำได้ทุกอย่างเหมือนผู้กรอกข้อมูล, แก้ไข/ลบผู้ใช้ได้, ควบคุมระบบรับเรื่องสาธารณะ
                </span>
              </div>
              <span className="text-indigo-600 dark:text-indigo-400 font-bold text-xs">เลือก &rarr;</span>
            </button>

            <button
              type="button"
              onClick={() => handleSelectDemoAccount('staff_entry')}
              className="w-full text-left p-2.5 rounded-xl border border-blue-200 dark:border-blue-900/60 bg-blue-50/50 dark:bg-blue-950/30 hover:bg-blue-100/60 dark:hover:bg-blue-900/50 transition-colors flex items-center justify-between"
            >
              <div>
                <span className="font-bold text-blue-700 dark:text-blue-300 block text-xs">
                  📝 ผู้กรอกข้อมูล (<code className="font-mono">staff_entry</code>)
                </span>
                <span className="text-[11px] text-slate-500 dark:text-slate-400">
                  สิทธิ์: เพิ่มข้อมูลเคส, เพิ่มผู้ใช้, ลบเคส (ห้ามแก้ไข/ลบผู้ใช้)
                </span>
              </div>
              <span className="text-blue-600 dark:text-blue-400 font-bold text-xs">เลือก &rarr;</span>
            </button>

            <button
              type="button"
              onClick={() => handleSelectDemoAccount('rescuer1')}
              className="w-full text-left p-2.5 rounded-xl border border-emerald-200 dark:border-emerald-900/60 bg-emerald-50/50 dark:bg-emerald-950/30 hover:bg-emerald-100/60 dark:hover:bg-emerald-900/50 transition-colors flex items-center justify-between"
            >
              <div>
                <span className="font-bold text-emerald-700 dark:text-emerald-300 block text-xs">
                  🚑 หน่วยกู้ภัย (<code className="font-mono">rescuer1</code>)
                </span>
                <span className="text-[11px] text-slate-500 dark:text-slate-400">
                  สิทธิ์: ดูข้อมูลได้อย่างเดียว, เปลี่ยนสถานะได้ (ห้ามเพิ่ม/ลบเคส และห้ามจัดการผู้ใช้)
                </span>
              </div>
              <span className="text-emerald-600 dark:text-emerald-400 font-bold text-xs">เลือก &rarr;</span>
            </button>
          </div>
        </div>

        <div className="text-center mt-5">
          <Link href="/" className="text-xs text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 transition-colors">
            &larr; กลับหน้าหลัก
          </Link>
        </div>
      </div>
    </div>
  );
}
