'use client';

import React, { useEffect, useState } from 'react';

export default function DarkModeToggle() {
  const [isDark, setIsDark] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    // Check localStorage or system preference
    const savedTheme = localStorage.getItem('theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;

    if (savedTheme === 'dark' || (!savedTheme && prefersDark)) {
      setIsDark(true);
      document.documentElement.classList.add('dark');
    } else {
      setIsDark(false);
      document.documentElement.classList.remove('dark');
    }
  }, []);

  const toggleDarkMode = () => {
    const nextState = !isDark;
    setIsDark(nextState);
    if (nextState) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  };

  if (!mounted) {
    // Avoid hydration mismatch by rendering a placeholder
    return <div className="w-[52px] h-[30px]" />;
  }

  return (
    <div className="flex items-center gap-2">
      <span className="text-xs select-none hidden sm:inline" title={isDark ? 'โหมดกลางคืน (Dark Mode)' : 'โหมดสว่าง (Light Mode)'}>
        {isDark ? '🌙' : '☀️'}
      </span>
      {/* iPhone-style Toggle Switch */}
      <button
        type="button"
        role="switch"
        aria-checked={isDark}
        onClick={toggleDarkMode}
        className={`relative inline-flex h-[30px] w-[52px] shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-300 ease-in-out focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 shadow-inner ${
          isDark ? 'bg-emerald-500' : 'bg-slate-300 dark:bg-slate-700'
        }`}
        title={`สลับโหมด: ตอนนี้เป็น${isDark ? 'โหมดมืด' : 'โหมดสว่าง'}`}
      >
        <span className="sr-only">Toggle Dark Mode</span>
        {/* Sliding Knob */}
        <span
          className={`pointer-events-none flex items-center justify-center h-[26px] w-[26px] transform rounded-full bg-white shadow-[0_3px_8px_rgba(0,0,0,0.18),0_1px_2px_rgba(0,0,0,0.12)] transition duration-300 ease-in-out ${
            isDark ? 'translate-x-[22px]' : 'translate-x-0'
          }`}
        >
          <span className="text-[11px] leading-none select-none">
            {isDark ? '🌙' : '☀️'}
          </span>
        </span>
      </button>
    </div>
  );
}
