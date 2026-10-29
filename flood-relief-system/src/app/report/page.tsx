'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import DarkModeToggle from '@/components/dark-mode-toggle';

export default function PublicReportPage() {
  const [activeTab, setActiveTab] = useState<'NEW_REPORT' | 'TRACK_STATUS'>('NEW_REPORT');
  const [isPortalDisabled, setIsPortalDisabled] = useState(false);

  // Check portal status on client mount
  useEffect(() => {
    fetch('/api/public/status')
      .then((r) => r.json())
      .then((data) => {
        if (data.enabled === false) {
          setIsPortalDisabled(true);
        }
      })
      .catch(() => {});
  }, []);

  // Form State
  const [formData, setFormData] = useState({
    reporterName: '',
    phoneNumber: '',
    peopleCount: 1,
    addressDetail: '',
    description: '',
  });

  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);
  const [isLocating, setIsLocating] = useState(false);
  const [locationStatus, setLocationStatus] = useState<string>('');

  const [urgency, setUrgency] = useState<'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'>('MEDIUM');
  const [selectedItems, setSelectedItems] = useState<string[]>([]);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedCaseId, setSubmittedCaseId] = useState<string | null>(null);
  const [isDuplicateDetected, setIsDuplicateDetected] = useState(false);
  const [duplicateMessage, setDuplicateMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Tracking & Self Status Update State
  const [trackRefId, setTrackRefId] = useState('');
  const [trackedCase, setTrackedCase] = useState<any | null>(null);
  const [isTrackLoading, setIsTrackLoading] = useState(false);
  const [trackError, setTrackError] = useState<string | null>(null);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [statusUpdateMessage, setStatusUpdateMessage] = useState<string | null>(null);
  const [additionalNote, setAdditionalNote] = useState('');

  const availableItems = ['น้ำดื่ม', 'อาหารแห้ง', 'ยารักษาโรค', 'เรือ/รถอพยพ', 'อาหารสัตว์'];

  const toggleItem = (item: string) => {
    setSelectedItems((prev) =>
      prev.includes(item) ? prev.filter((i) => i !== item) : [...prev, item]
    );
  };

  const handleGetLocation = () => {
    if (typeof window === 'undefined' || !navigator.geolocation) {
      setLocationStatus('อุปกรณ์ของคุณไม่รองรับการดึงพิกัด GPS');
      return;
    }

    setIsLocating(true);
    setLocationStatus('');

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLatitude(position.coords.latitude);
        setLongitude(position.coords.longitude);
        setIsLocating(false);
        setLocationStatus('📍 ดึงพิกัดตำแหน่งปัจจุบันสำเร็จแล้ว');
      },
      () => {
        setIsLocating(false);
        setLocationStatus('ไม่สามารถดึงพิกัดได้ กรุณาเปิดระบบระบุตำแหน่ง (GPS)');
      },
      { timeout: 10000, enableHighAccuracy: true }
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setDuplicateMessage(null);
    setIsDuplicateDetected(false);

    if (!formData.reporterName.trim() || !formData.phoneNumber.trim()) {
      setErrorMessage('กรุณากรอกชื่อและเบอร์โทรศัพท์ติดต่อ');
      return;
    }

    if (latitude === null || longitude === null) {
      setErrorMessage('กรุณากดดึงตำแหน่งปัจจุบัน (GPS) ก่อนส่งข้อมูล');
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch('/api/public/cases', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          peopleCount: Number(formData.peopleCount),
          latitude,
          longitude,
          urgency,
          itemsNeeded: selectedItems,
        }),
      });

      const result = await response.json().catch(() => ({}));

      if (!response.ok) {
        setErrorMessage(result.message || 'เกิดข้อผิดพลาดในการส่งข้อมูล');
        setIsSubmitting(false);
        return;
      }

      setSubmittedCaseId(result.caseId);
      if (result.isDuplicate) {
        setIsDuplicateDetected(true);
        setDuplicateMessage(result.message);
      }
      setIsSubmitting(false);
    } catch {
      setErrorMessage('ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้ กรุณาลองใหม่อีกครั้ง');
      setIsSubmitting(false);
    }
  };

  // Track Case by Ref ID
  const handleTrackCase = async (caseIdToTrack?: string) => {
    const id = caseIdToTrack || trackRefId.trim();
    if (!id) {
      setTrackError('กรุณากรอกหมายเลข Ref ID');
      return;
    }

    setIsTrackLoading(true);
    setTrackError(null);
    setStatusUpdateMessage(null);

    try {
      const res = await fetch(`/api/public/cases/${id}`);
      const data = await res.json();

      if (!res.ok) {
        setTrackError(data.message || 'ไม่พบเคสตามรหัสที่ระบุ');
        setTrackedCase(null);
      } else {
        setTrackedCase(data);
      }
    } catch {
      setTrackError('ไม่สามารถเชื่อมต่อระบบได้ กรุณาลองใหม่อีกครั้ง');
    } finally {
      setIsTrackLoading(false);
    }
  };

  // Self-update Case Status (e.g. RESOLVED or CANCELLED)
  const handleSelfUpdateStatus = async (newStatus: 'RESOLVED' | 'CANCELLED') => {
    if (!trackedCase) return;
    setIsUpdatingStatus(true);
    setStatusUpdateMessage(null);

    try {
      const res = await fetch(`/api/public/cases/${trackedCase.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: newStatus,
          note: additionalNote.trim() || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setTrackError(data.message || 'ไม่สามารถอัปเดตสถานะได้');
      } else {
        setStatusUpdateMessage(data.message || 'อัปเดตสถานะเรียบร้อยแล้ว');
        setTrackedCase((prev: any) => ({
          ...prev,
          status: newStatus,
          description: data.case?.description || prev.description,
        }));
        setAdditionalNote('');
      }
    } catch {
      setTrackError('เกิดข้อผิดพลาดในการเชื่อมต่อ');
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  // Portal Disabled State (AC-02 / Feature Flag)
  if (isPortalDisabled) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 font-prompt p-6 flex flex-col items-center justify-center text-center transition-colors">
        <div className="w-16 h-16 bg-slate-200 dark:bg-slate-800 text-slate-500 rounded-full flex items-center justify-center text-3xl mb-4 shadow-sm">
          🚫
        </div>
        <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100 mb-2">
          404 - ระบบรับเรื่องออนไลน์ปิดให้บริการชั่วคราว
        </h1>
        <p className="text-slate-600 dark:text-slate-400 mb-6 max-w-sm text-sm">
          ฟีเจอร์รับเรื่องจากประชาชน (Public Intake) ถูกปิดการใช้งานอยู่ตามการควบคุมของผู้ดูแลระบบ หากต้องการความช่วยเหลือด่วน กรุณาติดต่อศูนย์บรรเทาสาธารณภัยโดยตรง
        </p>
        <Link
          href="/"
          className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 px-6 rounded-xl transition-all text-xs"
        >
          กลับหน้าหลัก
        </Link>
      </div>
    );
  }

  // Success State View (TS-18)
  if (submittedCaseId) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 font-prompt p-6 flex flex-col items-center justify-center text-center transition-colors">
        <div className={`w-16 h-16 ${isDuplicateDetected ? 'bg-amber-100 dark:bg-amber-950/60 text-amber-600' : 'bg-green-100 dark:bg-green-950/60 text-green-600'} rounded-full flex items-center justify-center text-3xl mb-4 shadow-sm`}>
          {isDuplicateDetected ? '🔄' : '✅'}
        </div>
        <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100 mb-2">
          {isDuplicateDetected ? 'อัปเดตข้อมูลคำขอเดิมเรียบร้อยแล้ว' : 'รับแจ้งเหตุเรียบร้อยแล้ว'}
        </h1>
        <p className="text-slate-600 dark:text-slate-400 mb-6 max-w-sm text-sm">
          {duplicateMessage || 'เจ้าหน้าที่ได้รับข้อมูลของท่านและกำลังเร่งประสานงานช่วยเหลือภาคสนาม'}
        </p>

        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm w-full max-w-sm mb-6 text-left">
          <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">หมายเลขติดตามเคส (Ref ID)</p>
          <p className="text-base sm:text-lg font-mono font-bold text-blue-600 dark:text-blue-400 break-all select-all">
            {submittedCaseId}
          </p>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-2">
            💡 กรุณาบันทึกรหัสนี้ไว้ เพื่อใช้ติดตามสถานะหรือแจ้งว่าได้รับความช่วยเหลือแล้ว
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 w-full max-w-sm">
          <button
            onClick={() => {
              setActiveTab('TRACK_STATUS');
              setTrackRefId(submittedCaseId);
              handleTrackCase(submittedCaseId);
              setSubmittedCaseId(null);
            }}
            className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold py-3 px-4 rounded-xl shadow-md transition-all active:scale-95 text-sm"
          >
            🔍 ติดตาม / อัปเดตสถานะเคสนี้
          </button>
          <button
            onClick={() => {
              setSubmittedCaseId(null);
              setFormData({ reporterName: '', phoneNumber: '', peopleCount: 1, addressDetail: '', description: '' });
              setLatitude(null);
              setLongitude(null);
              setSelectedItems([]);
              setLocationStatus('');
              setUrgency('MEDIUM');
            }}
            className="flex-1 bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-medium py-3 px-4 rounded-xl transition-all active:scale-95 text-sm"
          >
            แจ้งเหตุใหม่
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 font-prompt pb-28 transition-colors">
      <header className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-4 shadow-md sticky top-0 z-10 flex items-center justify-between">
        <Link href="/" className="text-xs text-blue-100 hover:text-white flex items-center gap-1">
          &larr; หน้าหลัก
        </Link>
        <div className="text-center">
          <h1 className="text-lg sm:text-xl font-bold">🌊 ศูนย์รับแจ้งเหตุอุทกภัย</h1>
          <p className="text-[11px] text-blue-100 mt-0.5">ระบบแจ้งขอรับความช่วยเหลือฉุกเฉิน</p>
        </div>
        <div>
          <DarkModeToggle />
        </div>
      </header>

      {/* Tabs */}
      <div className="max-w-md mx-auto mt-4 px-4">
        <div className="flex bg-slate-200/80 dark:bg-slate-800 p-1 rounded-2xl text-xs font-semibold">
          <button
            type="button"
            onClick={() => setActiveTab('NEW_REPORT')}
            className={`flex-1 py-2.5 rounded-xl transition-all flex items-center justify-center gap-1.5 ${
              activeTab === 'NEW_REPORT'
                ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <span>📝</span> แจ้งขอความช่วยเหลือใหม่
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('TRACK_STATUS')}
            className={`flex-1 py-2.5 rounded-xl transition-all flex items-center justify-center gap-1.5 ${
              activeTab === 'TRACK_STATUS'
                ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <span>🔍</span> ติดตาม / แก้ไขสถานะเดิม
          </button>
        </div>
      </div>

      {activeTab === 'TRACK_STATUS' ? (
        /* Self Status Tracking & Update View */
        <div className="p-4 max-w-md mx-auto space-y-4">
          <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
            <h2 className="text-base font-bold text-slate-800 dark:text-slate-100 mb-1 flex items-center gap-2">
              <span>🔍</span> ตรวจสอบและแก้ไขสถานะคำขอ
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
              กรอกหมายเลข Ref ID ที่ได้รับจากการส่งเรื่อง เพื่อตรวจสอบสถานะหรือแจ้งว่าได้รับความช่วยเหลือแล้ว
            </p>

            <div className="flex gap-2">
              <input
                type="text"
                value={trackRefId}
                onChange={(e) => setTrackRefId(e.target.value)}
                placeholder="ระบุ Ref ID เช่น a1b2c3d4..."
                className="flex-1 px-3.5 py-2.5 text-xs font-mono rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                type="button"
                onClick={() => handleTrackCase()}
                disabled={isTrackLoading}
                className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold px-4 py-2.5 rounded-xl transition-all disabled:opacity-50"
              >
                {isTrackLoading ? 'ค้นหา...' : 'ตรวจสอบ'}
              </button>
            </div>

            {trackError && (
              <div className="mt-3 p-3 bg-red-50 dark:bg-red-950/60 border-l-4 border-red-500 text-red-700 dark:text-red-300 text-xs rounded-r-xl">
                {trackError}
              </div>
            )}

            {statusUpdateMessage && (
              <div className="mt-3 p-3 bg-green-50 dark:bg-green-950/60 border-l-4 border-green-500 text-green-700 dark:text-green-300 text-xs rounded-r-xl">
                {statusUpdateMessage}
              </div>
            )}
          </div>

          {trackedCase && (
            <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                <div>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400 block">ผู้แจ้งเหตุ</span>
                  <span className="font-bold text-slate-800 dark:text-slate-100 text-sm">{trackedCase.reporterName}</span>
                </div>
                <div>
                  {trackedCase.status === 'PENDING' && (
                    <span className="px-3 py-1 bg-amber-100 dark:bg-amber-950/80 text-amber-700 dark:text-amber-300 font-bold text-xs rounded-full">
                      ⏳ รอการช่วยเหลือ
                    </span>
                  )}
                  {trackedCase.status === 'IN_PROGRESS' && (
                    <span className="px-3 py-1 bg-blue-100 dark:bg-blue-950/80 text-blue-700 dark:text-blue-300 font-bold text-xs rounded-full animate-pulse">
                      🚤 กำลังดำเนินการ
                    </span>
                  )}
                  {trackedCase.status === 'RESOLVED' && (
                    <span className="px-3 py-1 bg-green-100 dark:bg-green-950/80 text-green-700 dark:text-green-300 font-bold text-xs rounded-full">
                      ✅ ช่วยเหลือแล้ว
                    </span>
                  )}
                  {trackedCase.status === 'CANCELLED' && (
                    <span className="px-3 py-1 bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-bold text-xs rounded-full">
                      ❌ ยกเลิกคำขอ
                    </span>
                  )}
                </div>
              </div>

              <div className="text-xs space-y-1.5 text-slate-600 dark:text-slate-300">
                <div><span className="text-slate-400">สถานที่:</span> {trackedCase.addressDetail}</div>
                <div><span className="text-slate-400">จำนวนคน:</span> {trackedCase.peopleCount} คน</div>
                {trackedCase.itemsNeeded?.length > 0 && (
                  <div>
                    <span className="text-slate-400">สิ่งของที่ขอ:</span> {trackedCase.itemsNeeded.join(', ')}
                  </div>
                )}
                {trackedCase.description && (
                  <div className="p-2.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl mt-2 whitespace-pre-line text-[11px]">
                    {trackedCase.description}
                  </div>
                )}
              </div>

              {/* Self-update buttons */}
              {['PENDING', 'IN_PROGRESS'].includes(trackedCase.status) && (
                <div className="pt-3 border-t border-slate-100 dark:border-slate-800 space-y-3">
                  <p className="text-xs font-bold text-slate-700 dark:text-slate-200">
                    🛠️ อัปเดตสถานะของคุณ:
                  </p>

                  <div>
                    <label className="block text-[11px] text-slate-500 dark:text-slate-400 mb-1">
                      ข้อความเพิ่มเติม / ความคืบหน้า (ถ้ามี)
                    </label>
                    <input
                      type="text"
                      value={additionalNote}
                      onChange={(e) => setAdditionalNote(e.target.value)}
                      placeholder="เช่น ได้รับอาหารจากอาสาสมัครแล้ว, ย้ายไปศูนย์พักพิงแล้ว"
                      className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 outline-none focus:ring-2 focus:ring-blue-500 mb-2"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      disabled={isUpdatingStatus}
                      onClick={() => handleSelfUpdateStatus('RESOLVED')}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2.5 px-3 rounded-xl text-xs transition-all flex items-center justify-center gap-1 shadow-sm active:scale-95 disabled:opacity-50"
                    >
                      <span>✅</span> ได้รับความช่วยเหลือแล้ว
                    </button>
                    <button
                      type="button"
                      disabled={isUpdatingStatus}
                      onClick={() => handleSelfUpdateStatus('CANCELLED')}
                      className="bg-slate-600 hover:bg-slate-700 text-white font-medium py-2.5 px-3 rounded-xl text-xs transition-all flex items-center justify-center gap-1 shadow-sm active:scale-95 disabled:opacity-50"
                    >
                      <span>❌</span> ขอยกเลิกคำขอ
                    </button>
                  </div>
                  <p className="text-[10px] text-slate-400 text-center">
                    การเปลี่ยนสถานะเป็น "ช่วยเหลือแล้ว" จะช่วยให้ทีมกู้ภัยไปช่วยผู้อื่นต่อได้อย่างรวดเร็ว
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      ) : (
        /* New Case Form */
        <form onSubmit={handleSubmit} className="p-4 space-y-4 max-w-md mx-auto">
          {errorMessage && (
            <div className="bg-red-50 dark:bg-red-950/60 border-l-4 border-red-500 p-4 rounded-r-2xl text-red-700 dark:text-red-300 text-xs sm:text-sm">
              {errorMessage}
            </div>
          )}

          <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4 transition-colors">
            <h2 className="text-sm font-bold text-slate-800 dark:text-slate-100 border-b border-slate-100 dark:border-slate-800 pb-2 flex items-center gap-2">
              <span>📍</span> 1. ระบุพิกัดตำแหน่งของคุณ
            </h2>

            <div>
              <button
                type="button"
                onClick={handleGetLocation}
                disabled={isLocating}
                className="w-full bg-blue-50 dark:bg-blue-950/50 hover:bg-blue-100 dark:hover:bg-blue-900/60 text-blue-600 dark:text-blue-400 font-bold py-3 px-4 rounded-2xl border border-blue-200 dark:border-blue-900/80 transition-all flex items-center justify-center gap-2 text-sm shadow-sm active:scale-98 disabled:opacity-50"
              >
                {isLocating ? (
                  <>
                    <svg className="animate-spin h-5 w-5 text-blue-600 dark:text-blue-400" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                    </svg>
                    กำลังค้นหาพิกัด GPS...
                  </>
                ) : (
                  <>
                    <span>📍</span> กดเพื่อระบุตำแหน่งปัจจุบัน (GPS)
                  </>
                )}
              </button>

              {locationStatus && (
                <p className={`text-xs mt-2 text-center font-medium ${locationStatus.includes('สำเร็จ') ? 'text-green-600 dark:text-green-400' : 'text-amber-600 dark:text-amber-400'}`}>
                  {locationStatus}
                </p>
              )}

              {latitude !== null && longitude !== null && (
                <div className="mt-3 p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl text-center font-mono text-xs text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                  ละติจูด: {latitude.toFixed(6)}, ลองจิจูด: {longitude.toFixed(6)}
                </div>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                ที่อยู่ / จุดสังเกตเพิ่มเติม *
              </label>
              <textarea
                required
                rows={2}
                value={formData.addressDetail}
                onChange={(e) => setFormData({ ...formData, addressDetail: e.target.value })}
                placeholder="เช่น บ้านเลขที่ 123/45 ซอยร่วมมิตร ติดกับวัด... ใกล้ร้านค้า..."
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
              />
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4 transition-colors">
            <h2 className="text-sm font-bold text-slate-800 dark:text-slate-100 border-b border-slate-100 dark:border-slate-800 pb-2 flex items-center gap-2">
              <span>👤</span> 2. ข้อมูลผู้ติดต่อ & จำนวนผู้ประสบภัย
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  ชื่อ-นามสกุล *
                </label>
                <input
                  type="text"
                  required
                  value={formData.reporterName}
                  onChange={(e) => setFormData({ ...formData, reporterName: e.target.value })}
                  placeholder="เช่น สมศรี มณีวรรณ"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  เบอร์โทรศัพท์ติดต่อ *
                </label>
                <input
                  type="tel"
                  required
                  value={formData.phoneNumber}
                  onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                  placeholder="0812345678"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                จำนวนผู้ประสบภัย (คน) *
              </label>
              <input
                type="number"
                min={1}
                required
                value={formData.peopleCount}
                onChange={(e) => setFormData({ ...formData, peopleCount: parseInt(e.target.value) || 1 })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
              />
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4 transition-colors">
            <h2 className="text-sm font-bold text-slate-800 dark:text-slate-100 border-b border-slate-100 dark:border-slate-800 pb-2 flex items-center gap-2">
              <span>🚨</span> 3. ระดับความเร่งด่วน & สิ่งของที่ต้องการ
            </h2>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2">
                ระดับความเร่งด่วน *
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <button
                  type="button"
                  onClick={() => setUrgency('CRITICAL')}
                  className={`p-3 rounded-2xl border text-xs text-left font-bold transition-all flex items-start gap-2.5 ${
                    urgency === 'CRITICAL'
                      ? 'border-red-500 bg-red-50 dark:bg-red-950/60 text-red-700 dark:text-red-300 shadow-sm ring-1 ring-red-500'
                      : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/60'
                  }`}
                >
                  <span className="text-xl shrink-0">🚨</span>
                  <div>
                    <p className="font-bold">วิกฤต (CRITICAL)</p>
                    <p className="text-[10px] opacity-80 font-normal mt-0.5">อันตรายถึงชีวิต / น้ำท่วมสูงมิดหัว</p>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setUrgency('HIGH')}
                  className={`p-3 rounded-2xl border text-xs text-left font-bold transition-all flex items-start gap-2.5 ${
                    urgency === 'HIGH'
                      ? 'border-amber-500 bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 shadow-sm ring-1 ring-amber-500'
                      : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/60'
                  }`}
                >
                  <span className="text-xl shrink-0">⚡</span>
                  <div>
                    <p className="font-bold">ด่วนมาก (HIGH)</p>
                    <p className="text-[10px] opacity-80 font-normal mt-0.5">มีเด็ก/คนแก่ / ขาดอาหารและน้ำ</p>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setUrgency('MEDIUM')}
                  className={`p-3 rounded-2xl border text-xs text-left font-bold transition-all flex items-start gap-2.5 ${
                    urgency === 'MEDIUM'
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 shadow-sm ring-1 ring-blue-500'
                      : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/60'
                  }`}
                >
                  <span className="text-xl shrink-0">📍</span>
                  <div>
                    <p className="font-bold">
                      ปกติ (MEDIUM) <span className="text-[10px] bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 px-1.5 py-0.5 rounded font-semibold ml-1">ค่าเริ่มต้น</span>
                    </p>
                    <p className="text-[10px] opacity-80 font-normal mt-0.5">ต้องการความช่วยเหลือทั่วไป</p>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setUrgency('LOW')}
                  className={`p-3 rounded-2xl border text-xs text-left font-bold transition-all flex items-start gap-2.5 ${
                    urgency === 'LOW'
                      ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 shadow-sm ring-1 ring-emerald-500'
                      : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/60'
                  }`}
                >
                  <span className="text-xl shrink-0">🌱</span>
                  <div>
                    <p className="font-bold">ต่ำ (LOW)</p>
                    <p className="text-[10px] opacity-80 font-normal mt-0.5">ผลกระทบน้อย / สอบถามข้อมูล</p>
                  </div>
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2">
                สิ่งของหรือความช่วยเหลือที่ต้องการ (เลือกได้หลายข้อ)
              </label>
              <div className="flex flex-wrap gap-2">
                {availableItems.map((item) => {
                  const isSelected = selectedItems.includes(item);
                  return (
                    <button
                      key={item}
                      type="button"
                      onClick={() => toggleItem(item)}
                      className={`text-xs px-3 py-1.5 rounded-full border transition-all ${
                        isSelected
                          ? 'bg-blue-600 border-blue-600 text-white font-semibold'
                          : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-750'
                      }`}
                    >
                      {item} {isSelected ? '✓' : '+'}
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                รายละเอียดเพิ่มเติม
              </label>
              <textarea
                rows={3}
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="ระบุ เช่น มีเด็กเล็ก/ผู้ป่วยติดเตียง ระดับน้ำท่วมสูงถึงชั้นไหน..."
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold py-4 px-6 rounded-2xl shadow-lg shadow-blue-500/25 transition-all text-base disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 active:scale-98"
          >
            {isSubmitting ? (
              <>
                <svg className="animate-spin h-5 w-5 text-white" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                </svg>
                กำลังส่งข้อมูลขอความช่วยเหลือ...
              </>
            ) : (
              '🚀 ส่งคำขอความช่วยเหลือฉุกเฉิน'
            )}
          </button>
        </form>
      )}
    </div>
  );
}
