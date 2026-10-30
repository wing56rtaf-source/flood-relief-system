'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import DarkModeToggle from '@/components/dark-mode-toggle';

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [otp, setOtp] = useState('');
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
              <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full">
                RTAF MFA
              </span>
            </div>
            <div className="relative">
              <input
                type="text"
                required
                maxLength={6}
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                placeholder="ระบุรหัส OTP 6 หลัก"
                className="w-full tracking-widest text-center font-mono text-base font-bold px-4 py-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-slate-800 dark:text-slate-100 transition-all"
              />
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
              * รหัส OTP จะถูกส่งและยืนยันผ่านระบบ RTAF MFA Gateway ของกองทัพอากาศ
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

        <div className="text-center mt-6 pt-4 border-t border-slate-100 dark:border-slate-800">
          <Link href="/" className="text-xs text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 transition-colors">
            &larr; กลับหน้าหลัก
          </Link>
        </div>
      </div>
    </div>
  );
}
