'use client';

import React, { useState, useEffect, useRef } from 'react';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/navigation';
import DarkModeToggle from '@/components/dark-mode-toggle';

// Dynamically import MapPicker with SSR disabled
const MapPicker = dynamic(() => import('./map-picker'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-80 bg-slate-100 dark:bg-slate-800/80 rounded-2xl flex flex-col items-center justify-center text-slate-400 text-sm gap-2">
      <div className="animate-spin text-2xl">🌍</div>
      <span>กำลังโหลดแผนที่ OpenStreetMap...</span>
    </div>
  ),
});

const DEFAULT_LAT = 7.0076;
const DEFAULT_LNG = 100.4712; // Hat Yai center

// Urgency sort order: lower = more urgent
const URGENCY_ORDER: Record<string, number> = { CRITICAL: 0, HIGH: 1, MEDIUM: 2, LOW: 3 };

interface CaseItem {
  id: string;
  reporterName: string;
  phoneNumber: string;
  peopleCount: number;
  urgency: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  itemsNeeded: string[];
  description?: string;
  latitude: number;
  longitude: number;
  addressDetail: string;
  status: 'PENDING' | 'IN_PROGRESS' | 'RESOLVED' | 'CANCELLED';
  source: 'STAFF' | 'PUBLIC';
  createdAt: string;
  updatedAt?: string;
}

interface UserSession {
  userId: string;
  username: string;
  name: string;
  role: 'PRIME_ADMIN' | 'DATA_ENTRY' | 'RESCUE' | 'ADMIN' | 'STAFF';
}

// Emergency Sound / Bell Tone Generator using Web Audio API
let globalAudioCtx: AudioContext | null = null;
let activeToneOscillators: OscillatorNode[] = [];
let toneTimerId: NodeJS.Timeout | null = null;

function stopEmergencyTone() {
  if (toneTimerId) {
    clearTimeout(toneTimerId);
    toneTimerId = null;
  }
  activeToneOscillators.forEach((osc) => {
    try {
      osc.stop();
      osc.disconnect();
    } catch {}
  });
  activeToneOscillators = [];
}

function playEmergencyTone(durationSeconds: number) {
  if (typeof window === 'undefined') return;
  stopEmergencyTone();

  try {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioCtx) return;
    if (!globalAudioCtx || globalAudioCtx.state === 'closed') {
      globalAudioCtx = new AudioCtx();
    }
    if (globalAudioCtx.state === 'suspended') {
      globalAudioCtx.resume().catch(() => {});
    }

    const now = globalAudioCtx.currentTime;
    const pulseLen = 0.35;
    const count = Math.max(1, Math.ceil(durationSeconds / pulseLen));

    for (let i = 0; i < count; i++) {
      const pStart = now + i * pulseLen;
      if (pStart >= now + durationSeconds) break;
      const pEnd = Math.min(now + durationSeconds, pStart + 0.28);

      const osc = globalAudioCtx.createOscillator();
      const gain = globalAudioCtx.createGain();

      // Digital alert bell tone (alternates between high 880Hz and 700Hz)
      osc.type = 'sine';
      osc.frequency.setValueAtTime(i % 2 === 0 ? 880 : 700, pStart);

      gain.gain.setValueAtTime(0.001, pStart);
      gain.gain.linearRampToValueAtTime(0.25, pStart + 0.03);
      gain.gain.exponentialRampToValueAtTime(0.001, pEnd);

      osc.connect(gain);
      gain.connect(globalAudioCtx.destination);

      osc.start(pStart);
      osc.stop(pEnd);
      activeToneOscillators.push(osc);
    }

    toneTimerId = setTimeout(() => {
      stopEmergencyTone();
    }, durationSeconds * 1000);
  } catch (err) {
    console.warn('Web Audio playback error:', err);
  }
}

export default function DashboardPage() {
  const router = useRouter();
  const [isMounted, setIsMounted] = useState(false);
  const [currentUser, setCurrentUser] = useState<UserSession | null>(null);

  // allCases = raw list from API
  const [allCases, setAllCases] = useState<CaseItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Navigation & Filters
  const [activeTab, setActiveTab] = useState<'TABLE' | 'MAP' | 'TRASH' | 'ADMIN' | 'USERS'>('TABLE');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [urgencyFilter, setUrgencyFilter] = useState('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [viewLayout, setViewLayout] = useState<'TABLE' | 'CARDS'>('TABLE');

  // Pagination State (20 items per page)
  const PAGE_SIZE = 20;
  const [currentPage, setCurrentPage] = useState(1);

  // Screen Shake & Critical Alert State & Settings
  const [alertConfig, setAlertConfig] = useState<{
    showAlertCard: boolean;
    enableShake: boolean;
    shakeDuration: number;
    enableSound: boolean;
  }>({
    showAlertCard: true,
    enableShake: true,
    shakeDuration: 5,
    enableSound: true,
  });
  const alertConfigRef = useRef(alertConfig);
  const shakeTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const [criticalAlerts, setCriticalAlerts] = useState<
    Array<{
      id: string;
      reporterName: string;
      addressDetail: string;
      count: number;
      timestamp: number;
    }>
  >([]);
  const [isAlertSettingsOpen, setIsAlertSettingsOpen] = useState(false);
  const [isScreenShaking, setIsScreenShaking] = useState(false);
  const knownCaseIdsRef = useRef<Set<string>>(new Set());
  const isInitialLoadRef = useRef(true);

  // Synchronize ref on state changes
  useEffect(() => {
    alertConfigRef.current = alertConfig;
  }, [alertConfig]);

  // Load saved alert & shake configuration from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem('flood_relief_alert_config');
      if (saved) {
        const parsed = JSON.parse(saved);
        const loaded = {
          showAlertCard: typeof parsed.showAlertCard === 'boolean' ? parsed.showAlertCard : true,
          enableShake: typeof parsed.enableShake === 'boolean' ? parsed.enableShake : true,
          shakeDuration:
            typeof parsed.shakeDuration === 'number' ? Math.max(1, Math.min(15, parsed.shakeDuration)) : 5,
          enableSound: typeof parsed.enableSound === 'boolean' ? parsed.enableSound : true,
        };
        setAlertConfig(loaded);
        alertConfigRef.current = loaded;
      }
    } catch {}
  }, []);

  const updateAlertConfig = (newConfig: Partial<typeof alertConfig>) => {
    setAlertConfig((prev) => {
      const updated = { ...prev, ...newConfig };
      alertConfigRef.current = updated;
      try {
        localStorage.setItem('flood_relief_alert_config', JSON.stringify(updated));
      } catch {}
      return updated;
    });
  };

  const stopAllAlertEffects = () => {
    setIsScreenShaking(false);
    stopEmergencyTone();
    if (shakeTimeoutRef.current) {
      clearTimeout(shakeTimeoutRef.current);
      shakeTimeoutRef.current = null;
    }
  };

  const triggerCriticalAlert = (item: {
    id: string;
    reporterName: string;
    addressDetail: string;
    count: number;
  }) => {
    const config = alertConfigRef.current;
    const duration = Math.max(1, Math.min(15, Number(config.shakeDuration) || 5));

    if (config.enableShake) {
      if (shakeTimeoutRef.current) {
        clearTimeout(shakeTimeoutRef.current);
      }
      setIsScreenShaking(true);

      // Play emergency ringing sound for the duration of the screen shake
      if (config.enableSound !== false) {
        playEmergencyTone(duration);
      }

      shakeTimeoutRef.current = setTimeout(() => {
        setIsScreenShaking(false);
        stopEmergencyTone();
        shakeTimeoutRef.current = null;
      }, duration * 1000);
    }

    if (config.showAlertCard) {
      setCriticalAlerts((prev) => {
        if (prev.some((a) => a.id === item.id)) return prev;
        return [{ ...item, timestamp: Date.now() }, ...prev];
      });
      // Auto-dismiss after 10 seconds
      setTimeout(() => {
        setCriticalAlerts((prev) => prev.filter((a) => a.id !== item.id));
      }, 10000);
    }
  };

  const handleTestAlert = () => {
    triggerCriticalAlert({
      id: 'test_' + Date.now(),
      reporterName: 'ทดสอบเหตุฉุกเฉิน (จำลอง)',
      addressDetail: 'จุดทดสอบระบบ อาคารบัญชาการศูนย์บรรเทาฯ',
      count: Math.floor(Math.random() * 5) + 1,
    });
  };

  // Focus on map pin
  const [focusedCaseId, setFocusedCaseId] = useState<string | null>(null);

  // Modals
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newCaseData, setNewCaseData] = useState({
    reporterName: '',
    phoneNumber: '',
    peopleCount: 1,
    urgency: 'MEDIUM' as 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL',
    itemsNeeded: [] as string[],
    description: '',
    latitude: DEFAULT_LAT,
    longitude: DEFAULT_LNG,
    addressDetail: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  // Case Detail / Unmask Modal
  const [selectedCase, setSelectedCase] = useState<CaseItem | null>(null);
  const [unmaskedPhone, setUnmaskedPhone] = useState<string | null>(null);
  const [isDetailLoading, setIsDetailLoading] = useState(false);

  // Confirm Cancel (Move to Trash) Modal
  const [caseToCancel, setCaseToCancel] = useState<CaseItem | null>(null);

  // Confirm Single Permanent Delete Modal
  const [caseToDeletePermanent, setCaseToDeletePermanent] = useState<CaseItem | null>(null);
  const [isDeletingPermanent, setIsDeletingPermanent] = useState(false);

  // Confirm Empty All Trash Modal
  const [isConfirmEmptyTrash, setIsConfirmEmptyTrash] = useState(false);
  const [isEmptyingTrash, setIsEmptyingTrash] = useState(false);

  // Admin Feature Flag & Audit Logs State
  const [adminPublicFlag, setAdminPublicFlag] = useState(false);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [isAdminSaving, setIsAdminSaving] = useState(false);

  // User Management State (Prime Admin & Data Entry)
  const [userList, setUserList] = useState<any[]>([]);
  const [isUsersLoading, setIsUsersLoading] = useState(false);
  const [isAddUserOpen, setIsAddUserOpen] = useState(false);
  const [userSearchQuery, setUserSearchQuery] = useState('');
  const [editingUser, setEditingUser] = useState<{ id: string; username: string; name: string; role: string } | null>(null);
  const [userToDelete, setUserToDelete] = useState<any | null>(null);
  const [isUpdatingUser, setIsUpdatingUser] = useState(false);
  const [isDeletingUser, setIsDeletingUser] = useState(false);
  const [newUserData, setNewUserData] = useState({
    username: '',
    name: '',
    role: 'DATA_ENTRY' as 'ADMIN' | 'DATA_ENTRY' | 'RESCUE',
  });
  const [userActionError, setUserActionError] = useState<string | null>(null);
  const [userActionSuccess, setUserActionSuccess] = useState<string | null>(null);
  const [isCreatingUser, setIsCreatingUser] = useState(false);

  const availableItems = ['น้ำดื่ม', 'อาหารแห้ง', 'ยารักษาโรค', 'เรือ/รถอพยพ', 'อาหารสัตว์'];

  // Check auth & fetch user info
  useEffect(() => {
    setIsMounted(true);
    async function loadAuth() {
      try {
        const res = await fetch('/api/auth/me');
        if (!res.ok) {
          router.push('/login');
          return;
        }
        const data = await res.json();
        setCurrentUser(data.user);
      } catch {
        router.push('/login');
      }
    }
    loadAuth();
  }, [router]);

  // Reset pagination to page 1 on filter or search changes
  useEffect(() => {
    setCurrentPage(1);
  }, [statusFilter, urgencyFilter, searchTerm]);

  // Sort helper: Non-resolved first, then CRITICAL > HIGH > MEDIUM > LOW, then createdAt desc
  // Cases with status === 'RESOLVED' (ช่วยเหลือแล้ว) are pushed to the very bottom
  const sortCases = (arr: CaseItem[]): CaseItem[] =>
    [...arr].sort((a, b) => {
      const aResolved = a.status === 'RESOLVED' ? 1 : 0;
      const bResolved = b.status === 'RESOLVED' ? 1 : 0;
      if (aResolved !== bResolved) {
        return aResolved - bResolved;
      }

      const urgencyDiff = (URGENCY_ORDER[a.urgency] ?? 4) - (URGENCY_ORDER[b.urgency] ?? 4);
      if (urgencyDiff !== 0) return urgencyDiff;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

  // Fetch all cases from API (supports silent background real-time polling)
  const fetchAllCases = async (isBackground = false) => {
    if (!isBackground) setIsLoading(true);
    try {
      const res = await fetch('/api/staff/cases');
      if (res.ok) {
        const data: CaseItem[] = await res.json();

        // Detect newly arrived cases
        if (!isInitialLoadRef.current) {
          const newCases = data.filter((c) => !knownCaseIdsRef.current.has(c.id));
          const newCriticals = newCases.filter((c) => c.urgency === 'CRITICAL' && c.status !== 'CANCELLED');
          newCriticals.forEach((c) => {
            triggerCriticalAlert({
              id: c.id,
              reporterName: c.reporterName,
              addressDetail: c.addressDetail,
              count: c.peopleCount,
            });
          });
        } else {
          isInitialLoadRef.current = false;
        }

        knownCaseIdsRef.current = new Set(data.map((c) => c.id));
        setAllCases(sortCases(data));
      }
    } catch (err) {
      console.error('Failed to load cases:', err);
    } finally {
      if (!isBackground) setIsLoading(false);
    }
  };

  // Initial fetch and automatic real-time polling (every 3.5 seconds)
  useEffect(() => {
    fetchAllCases(false);
    const interval = setInterval(() => {
      fetchAllCases(true);
    }, 3500);
    return () => clearInterval(interval);
  }, []);

  // Fetch Admin settings if admin tab active (Admin or Prime Admin)
  useEffect(() => {
    if (activeTab === 'ADMIN' && ['ADMIN', 'PRIME_ADMIN'].includes(currentUser?.role || '')) {
      fetchAdminData();
    }
  }, [activeTab, currentUser]);

  const fetchAdminData = async () => {
    try {
      const res = await fetch('/api/admin/settings');
      if (res.ok) {
        const data = await res.json();
        setAdminPublicFlag(data.features.ENABLE_PUBLIC_INTAKE);
        setAuditLogs(data.auditLogs || []);
      }
    } catch (err) {
      console.error('Failed to fetch admin settings:', err);
    }
  };

  const handleTogglePublicIntake = async (newValue: boolean) => {
    setIsAdminSaving(true);
    try {
      const res = await fetch('/api/admin/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key: 'ENABLE_PUBLIC_INTAKE', value: String(newValue) }),
      });
      if (res.ok) {
        setAdminPublicFlag(newValue);
        fetchAdminData();
      }
    } catch (err) {
      console.error('Failed to update setting:', err);
    } finally {
      setIsAdminSaving(false);
    }
  };

  // Fetch User list for user management tab (supports search)
  const fetchUserList = async (search?: string) => {
    setIsUsersLoading(true);
    try {
      const q = typeof search === 'string' ? search : userSearchQuery;
      const url = q ? `/api/staff/users?search=${encodeURIComponent(q)}` : '/api/staff/users';
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setUserList(data);
      }
    } catch (err) {
      console.error('Failed to load users:', err);
    } finally {
      setIsUsersLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'USERS') {
      fetchUserList();
    }
  }, [activeTab]);

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setUserActionError(null);
    setUserActionSuccess(null);
    setIsCreatingUser(true);

    try {
      const res = await fetch('/api/staff/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newUserData),
      });

      const data = await res.json();
      if (!res.ok) {
        setUserActionError(data.message || 'ไม่สามารถเพิ่มผู้ใช้งานได้');
      } else {
        setUserActionSuccess(`เพิ่มผู้ใช้ "${data.user.name}" สำเร็จ! สามารถเข้าสู่ระบบด้วย Email RTAF`);
        setNewUserData({ username: '', name: '', role: 'DATA_ENTRY' });
        setIsAddUserOpen(false);
        fetchUserList();
      }
    } catch {
      setUserActionError('เกิดข้อผิดพลาดในการเชื่อมต่อเซิร์ฟเวอร์');
    } finally {
      setIsCreatingUser(false);
    }
  };

  const handleUpdateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;
    setUserActionError(null);
    setUserActionSuccess(null);
    setIsUpdatingUser(true);

    try {
      const res = await fetch('/api/staff/users', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: editingUser.id,
          username: editingUser.username,
          name: editingUser.name,
          role: editingUser.role,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setUserActionError(data.message || 'ไม่สามารถแก้ไขข้อมูลผู้ใช้ได้');
      } else {
        setUserActionSuccess(data.message || 'แก้ไขข้อมูลผู้ใช้สำเร็จ');
        setEditingUser(null);
        fetchUserList();
      }
    } catch {
      setUserActionError('เกิดข้อผิดพลาดในการเชื่อมต่อเซิร์ฟเวอร์');
    } finally {
      setIsUpdatingUser(false);
    }
  };

  const handleDeleteUser = async () => {
    if (!userToDelete) return;
    setUserActionError(null);
    setUserActionSuccess(null);
    setIsDeletingUser(true);

    try {
      const res = await fetch(`/api/staff/users?id=${encodeURIComponent(userToDelete.id)}`, {
        method: 'DELETE',
      });

      const data = await res.json();
      if (!res.ok) {
        setUserActionError(data.message || 'ไม่สามารถลบผู้ใช้ได้');
      } else {
        setUserActionSuccess(data.message || 'ลบผู้ใช้สำเร็จ');
        setUserToDelete(null);
        fetchUserList();
      }
    } catch {
      setUserActionError('เกิดข้อผิดพลาดในการเชื่อมต่อเซิร์ฟเวอร์');
    } finally {
      setIsDeletingUser(false);
    }
  };

  // Open Case Detail & Unmask Phone (TS-09)
  const handleOpenDetail = async (caseItem: CaseItem) => {
    setSelectedCase(caseItem);
    setUnmaskedPhone(null);
    setIsDetailLoading(true);

    try {
      const res = await fetch(`/api/staff/cases/${caseItem.id}`);
      if (res.ok) {
        const data = await res.json();
        setUnmaskedPhone(data.phoneNumber);
      }
    } catch (err) {
      console.error('Failed to unmask phone:', err);
    } finally {
      setIsDetailLoading(false);
    }
  };

  // Jump from table row or card to map pin with zoom and highlight
  const handleFocusOnMap = (caseItem: CaseItem) => {
    setActiveTab('MAP');
    setFocusedCaseId(caseItem.id);
  };

  // Update Status handler with soft-delete confirm check
  const handleUpdateStatus = async (caseId: string, newStatus: string) => {
    if (newStatus === 'CANCELLED') {
      if (currentUser?.role === 'RESCUE') {
        alert('หน่วยกู้ภัยสามารถเปลี่ยนสถานะได้เท่านั้น ไม่สามารถยกเลิก/ลบเคสได้');
        return;
      }
      const target = allCases.find((c) => c.id === caseId);
      if (target) {
        setCaseToCancel(target);
        return;
      }
    }

    await executeStatusUpdate(caseId, newStatus);
  };

  const executeStatusUpdate = async (caseId: string, newStatus: string) => {
    try {
      const res = await fetch(`/api/staff/cases/${caseId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) {
        fetchAllCases();
        if (selectedCase && selectedCase.id === caseId) {
          setSelectedCase((prev) => (prev ? { ...prev, status: newStatus as any } : null));
        }
      }
    } catch (err) {
      console.error('Failed to update status:', err);
    }
  };

  // Confirm cancel and move to trash
  const handleConfirmCancel = async () => {
    if (!caseToCancel) return;
    await executeStatusUpdate(caseToCancel.id, 'CANCELLED');
    setCaseToCancel(null);
  };

  // Permanently delete single case from Trash
  const handleConfirmPermanentDelete = async () => {
    if (!caseToDeletePermanent) return;
    setIsDeletingPermanent(true);
    try {
      const res = await fetch(`/api/staff/cases/${caseToDeletePermanent.id}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        fetchAllCases();
        setCaseToDeletePermanent(null);
      }
    } catch (err) {
      console.error('Failed to permanently delete case:', err);
    } finally {
      setIsDeletingPermanent(false);
    }
  };

  // Bulk empty all trash
  const handleEmptyTrashAll = async () => {
    setIsEmptyingTrash(true);
    try {
      const res = await fetch('/api/staff/cases?trashOnly=true', {
        method: 'DELETE',
      });
      if (res.ok) {
        fetchAllCases();
        setIsConfirmEmptyTrash(false);
      }
    } catch (err) {
      console.error('Failed to empty trash:', err);
    } finally {
      setIsEmptyingTrash(false);
    }
  };

  // Restore case from Trash
  const handleRestoreCase = async (caseId: string) => {
    await executeStatusUpdate(caseId, 'PENDING');
  };

  // Create Case Handler
  const handleCreateCase = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateError(null);

    if (newCaseData.peopleCount < 1) {
      setCreateError('จำนวนคนต้องอย่างน้อย 1 คน');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch('/api/staff/cases', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newCaseData),
      });

      const data = await res.json();
      if (!res.ok) {
        setCreateError(data.message || 'สร้างเคสไม่สำเร็จ');
        setIsSubmitting(false);
        return;
      }

      setIsCreateOpen(false);
      setNewCaseData({
        reporterName: '',
        phoneNumber: '',
        peopleCount: 1,
        urgency: 'MEDIUM',
        itemsNeeded: [],
        description: '',
        latitude: DEFAULT_LAT,
        longitude: DEFAULT_LNG,
        addressDetail: '',
      });

      if (data.case && data.case.urgency === 'CRITICAL') {
        triggerCriticalAlert({
          id: data.case.id,
          reporterName: data.case.reporterName,
          addressDetail: data.case.addressDetail,
          count: data.case.peopleCount,
        });
      }

      fetchAllCases();
    } catch {
      setCreateError('ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login');
  };

  // Helper Badge Renderers
  const getUrgencyBadge = (urgency: string) => {
    switch (urgency) {
      case 'CRITICAL':
        return {
          icon: '🚨',
          label: 'วิกฤต',
          className: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/30 dark:border-rose-500/40',
        };
      case 'HIGH':
        return {
          icon: '⚡',
          label: 'ด่วนมาก',
          className: 'bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/30 dark:border-orange-500/40',
        };
      case 'MEDIUM':
        return {
          icon: '📍',
          label: 'ปกติ',
          className: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/30 dark:border-blue-500/40',
        };
      case 'LOW':
        return {
          icon: '🌱',
          label: 'ต่ำ',
          className: 'bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-500/30',
        };
      default:
        return { icon: '•', label: urgency, className: 'bg-slate-100 text-slate-700' };
    }
  };

  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'PENDING':
        return {
          label: 'รอดำเนินการ',
          badgeClass: 'bg-amber-100 text-amber-800 border-amber-400 dark:bg-amber-900/50 dark:text-amber-200 dark:border-amber-600',
          dotClass: 'bg-amber-500',
        };
      case 'IN_PROGRESS':
        return {
          label: 'กำลังช่วยเหลือ',
          badgeClass: 'bg-blue-100 text-blue-800 border-blue-400 dark:bg-blue-900/50 dark:text-blue-200 dark:border-blue-600',
          dotClass: 'bg-blue-500 animate-pulse',
        };
      case 'RESOLVED':
        return {
          label: 'ช่วยเหลือแล้ว',
          badgeClass: 'bg-emerald-100 text-emerald-800 border-emerald-400 dark:bg-emerald-900/50 dark:text-emerald-200 dark:border-emerald-600',
          dotClass: 'bg-emerald-500',
        };
      case 'CANCELLED':
        return {
          label: 'ยกเลิก (ในถังขยะ)',
          badgeClass: 'bg-slate-100 text-slate-700 border-slate-300 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-600',
          dotClass: 'bg-slate-400',
        };
      default:
        return { label: status, badgeClass: 'bg-slate-100 text-slate-700 border-slate-300', dotClass: 'bg-slate-400' };
    }
  };

  // Active cases (exclude trash / cancelled)
  const activeCases = allCases.filter((c) => c.status !== 'CANCELLED');
  const trashCases = allCases.filter((c) => c.status === 'CANCELLED');

  // Stats Counters
  const totalCases = activeCases.length;
  const pendingCases = activeCases.filter((c) => c.status === 'PENDING').length;
  const inProgressCases = activeCases.filter((c) => c.status === 'IN_PROGRESS').length;
  const resolvedCases = activeCases.filter((c) => c.status === 'RESOLVED').length;
  const criticalCases = activeCases.filter((c) => c.urgency === 'CRITICAL' && c.status !== 'RESOLVED').length;

  // Filtered active cases for Table / Cards view
  const displayCases = activeCases.filter((c) => {
    if (statusFilter !== 'ALL' && c.status !== statusFilter) return false;
    if (urgencyFilter === 'CRITICAL' && (c.urgency !== 'CRITICAL' || c.status === 'RESOLVED')) return false;
    if (urgencyFilter !== 'ALL' && urgencyFilter !== 'CRITICAL' && c.urgency !== urgencyFilter) return false;
    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      const match =
        c.reporterName.toLowerCase().includes(q) ||
        c.addressDetail.toLowerCase().includes(q) ||
        (c.description && c.description.toLowerCase().includes(q));
      if (!match) return false;
    }
    return true;
  });

  // Pagination calculation (20 items per page)
  const totalDisplayPages = Math.max(1, Math.ceil(displayCases.length / PAGE_SIZE));
  const validCurrentPage = Math.min(Math.max(1, currentPage), totalDisplayPages);
  const startIndex = (validCurrentPage - 1) * PAGE_SIZE;
  const endIndex = Math.min(startIndex + PAGE_SIZE, displayCases.length);
  const paginatedCases = displayCases.slice(startIndex, endIndex);

  // Pagination Controls UI
  const renderPagination = () => {
    if (displayCases.length === 0) return null;

    return (
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-slate-100 dark:border-slate-800 text-xs mt-3">
        <div className="text-slate-500 dark:text-slate-400">
          แสดง <span className="font-bold text-slate-700 dark:text-slate-200">{startIndex + 1}</span> ถึง{' '}
          <span className="font-bold text-slate-700 dark:text-slate-200">{endIndex}</span> จากทั้งหมด{' '}
          <span className="font-bold text-slate-700 dark:text-slate-200">{displayCases.length}</span> รายการ
          {' '}(แสดงหน้าละ {PAGE_SIZE} แถว)
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            disabled={validCurrentPage <= 1}
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            className="px-3 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed font-medium transition-colors shadow-xs"
          >
            &larr; หน้าก่อนหน้า
          </button>

          <span className="px-3 py-1 font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/60 rounded-xl border border-indigo-200 dark:border-indigo-800">
            หน้า {validCurrentPage} / {totalDisplayPages}
          </span>

          <button
            type="button"
            disabled={validCurrentPage >= totalDisplayPages}
            onClick={() => setCurrentPage((p) => Math.min(totalDisplayPages, p + 1))}
            className="px-3 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed font-medium transition-colors shadow-xs"
          >
            หน้าถัดไป &rarr;
          </button>
        </div>
      </div>
    );
  };

  // Filtered cases for Map view
  const mapCases = activeCases.filter((c) => {
    if (statusFilter !== 'ALL' && c.status !== statusFilter) return false;
    if (urgencyFilter === 'CRITICAL' && (c.urgency !== 'CRITICAL' || c.status === 'RESOLVED')) return false;
    if (urgencyFilter !== 'ALL' && urgencyFilter !== 'CRITICAL' && c.urgency !== urgencyFilter) return false;
    return true;
  });

  // Render Single Card (Reusable for Card View and Mobile Feed)
  const renderCaseCard = (c: CaseItem) => {
    const urgency = getUrgencyBadge(c.urgency);
    const status = getStatusConfig(c.status);

    return (
      <div
        key={c.id}
        className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden transition-all hover:border-blue-400 dark:hover:border-blue-600 flex flex-col justify-between"
      >
        <div>
          {/* Urgency color bar */}
          <div
            className={`h-1.5 w-full ${
              c.urgency === 'CRITICAL'
                ? 'bg-rose-500'
                : c.urgency === 'HIGH'
                ? 'bg-orange-500'
                : c.urgency === 'MEDIUM'
                ? 'bg-blue-500'
                : 'bg-slate-300'
            }`}
          />
          <div className="p-4 space-y-3">
            {/* Card Top Row */}
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 flex-wrap">
                <span
                  className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold border ${urgency.className}`}
                >
                  <span>{urgency.icon}</span> {urgency.label}
                </span>
                <span className="text-[11px] px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400">
                  {c.source === 'PUBLIC' ? '🌐 แจ้งออนไลน์' : '👤 จนท. บันทึก'}
                </span>
              </div>
              <span className="text-[11px] text-slate-400 shrink-0" suppressHydrationWarning>
                {new Date(c.createdAt).toLocaleDateString('th-TH', { day: 'numeric', month: 'short' })}
              </span>
            </div>

            {/* Card Main Info */}
            <div>
              <div className="flex items-baseline justify-between gap-2 flex-wrap">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <h3 className="font-bold text-base text-slate-900 dark:text-slate-100">{c.reporterName}</h3>
                  {(c.description?.includes('[ข้อมูลแจ้งซ้ำ') || c.description?.includes('[มีการส่งแจ้งซ้ำ')) && (
                    <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 dark:bg-amber-950/80 text-amber-700 dark:text-amber-300 border border-amber-300 dark:border-amber-700">
                      ⚠️ แจ้งซ้ำ
                    </span>
                  )}
                </div>
                <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 shrink-0">
                  👥 {c.peopleCount} คน
                </span>
              </div>
            </div>

            {/* Location */}
            <div className="text-xs text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-800/60 p-2.5 rounded-xl border border-slate-100 dark:border-slate-800 flex items-start gap-1.5">
              <span className="text-blue-500 shrink-0 mt-0.5">📍</span>
              <span className="line-clamp-2">
                {c.addressDetail || `พิกัด: ${c.latitude.toFixed(4)}, ${c.longitude.toFixed(4)}`}
              </span>
            </div>

            {/* Items Needed Tags */}
            {c.itemsNeeded && c.itemsNeeded.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {c.itemsNeeded.map((item, idx) => (
                  <span
                    key={idx}
                    className="bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200/50 dark:border-blue-800/50 text-[11px] font-medium px-2 py-0.5 rounded-md"
                  >
                    {item}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Card Footer */}
        <div className="p-4 pt-0 space-y-2.5">
          <div className="pt-2.5 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between gap-2 flex-wrap">
            <span className={`inline-flex items-center gap-1.5 text-xs font-semibold pl-2 pr-3 py-1.5 rounded-full border ${status.badgeClass}`}>
              <span className={`w-2 h-2 rounded-full ${status.dotClass} shrink-0`}></span>
              {status.label}
            </span>

            <div className="flex items-center gap-1.5 flex-wrap">
              {c.status !== 'IN_PROGRESS' && c.status !== 'RESOLVED' && (
                <button
                  onClick={() => handleUpdateStatus(c.id, 'IN_PROGRESS')}
                  className="text-xs px-2.5 py-1.5 rounded-xl bg-blue-50 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-700 font-semibold transition-all active:scale-95"
                  title="เปลี่ยนเป็น: กำลังช่วยเหลือ"
                >
                  🚤 กำลังช่วย
                </button>
              )}
              {c.status !== 'RESOLVED' && (
                <button
                  onClick={() => handleUpdateStatus(c.id, 'RESOLVED')}
                  className="text-xs px-2.5 py-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-700 font-semibold transition-all active:scale-95"
                  title="เปลี่ยนเป็น: ช่วยเหลือแล้ว"
                >
                  ✅ ช่วยแล้ว
                </button>
              )}
              {currentUser?.role !== 'RESCUE' && (
                <button
                  onClick={() => setCaseToCancel(c)}
                  className="text-xs px-2 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-rose-600 transition-colors"
                  title="ยกเลิกเคส (ย้ายไปถังขยะ)"
                >
                  🗑️
                </button>
              )}
              <button
                onClick={() => handleOpenDetail(c)}
                className="bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs px-3 py-1.5 rounded-xl shadow-sm transition-all active:scale-95 flex items-center gap-1"
              >
                <span>🔓</span> รายละเอียด
              </button>
            </div>
          </div>

          {/* Jump to Map button */}
          <button
            onClick={() => handleFocusOnMap(c)}
            className="w-full text-xs text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 hover:underline py-1 flex items-center justify-center gap-1 border-t border-dashed border-slate-200 dark:border-slate-800 transition-colors font-medium"
          >
            <span>🗺️</span> ดูตำแหน่งบนแผนที่ (ซูมเฉพาะจุด)
          </button>
        </div>
      </div>
    );
  };

  if (!isMounted) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 font-prompt flex flex-col items-center justify-center p-4">
        <div className="flex items-center gap-3 bg-white dark:bg-slate-900 px-6 py-4 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800">
          <span className="text-3xl animate-bounce">🌊</span>
          <div className="text-left">
            <p className="text-sm font-bold text-slate-800 dark:text-slate-100">ศูนย์ช่วยเหลือผู้ประสบภัยน้ำท่วม</p>
            <p className="text-xs text-slate-500 dark:text-slate-400">กำลังเชื่อมต่อข้อมูล...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen bg-slate-50 dark:bg-slate-950 font-prompt pb-24 sm:pb-16 transition-colors duration-200 ${isScreenShaking ? 'animate-screen-shake' : ''}`}>
      {/* Floating Red Alerts Stack for Critical Cases (Top-Right) */}
      {criticalAlerts.length > 0 && (
        <div className="fixed top-5 right-5 z-[99999] max-w-sm w-full flex flex-col gap-2.5 pointer-events-none transition-all">
          {/* Summary Stack Header when 2 or more alerts */}
          {criticalAlerts.length >= 2 && (
            <div className="pointer-events-auto bg-red-700/95 backdrop-blur-md text-white rounded-2xl px-4 py-2.5 shadow-xl border border-red-400/50 flex items-center justify-between animate-in fade-in slide-in-from-top-2">
              <div className="flex items-center gap-2">
                <span className="text-lg animate-pulse">🚨</span>
                <span className="text-xs font-black tracking-wide">
                  มีเคสวิกฤตเข้ามา {criticalAlerts.length} รายการ
                </span>
              </div>
              <button
                type="button"
                onClick={() => {
                  setCriticalAlerts([]);
                  stopAllAlertEffects();
                }}
                className="text-[11px] font-bold bg-white/20 hover:bg-white/30 px-2.5 py-1 rounded-lg text-white transition-colors"
                title="ปิดการแจ้งเตือนทั้งหมด"
              >
                ✕ ปิดทั้งหมด
              </button>
            </div>
          )}

          {/* Individual Alert Cards */}
          {criticalAlerts.map((alert, idx) => (
            <div
              key={alert.id}
              className="pointer-events-auto bg-red-600 text-white rounded-2xl p-4 shadow-2xl border-2 border-white/60 animate-in slide-in-from-right fade-in duration-200 transition-all hover:scale-[1.01]"
              style={{ animationDelay: `${idx * 40}ms` }}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-2.5">
                  <span className="text-2xl shrink-0 animate-bounce">🔥</span>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="font-extrabold text-sm flex items-center gap-1.5 tracking-wide text-white">
                        แจ้งเตือนเคสวิกฤตด่วน!
                      </h4>
                      {criticalAlerts.length > 1 && (
                        <span className="text-[10px] bg-white/20 px-1.5 py-0.5 rounded font-mono font-bold">
                          {idx + 1}/{criticalAlerts.length}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-red-100 mt-1 leading-snug">
                      มีผู้ประสบภัยระดับ <b className="text-white underline font-bold">วิกฤต</b> เพิ่มเข้ามาในระบบ: <br />
                      <b className="text-white font-bold">{alert.reporterName}</b> (จำนวน {alert.count} คน)
                    </p>
                    {alert.addressDetail && (
                      <p className="text-[11px] text-red-200 mt-1 truncate max-w-[220px]">
                        📍 {alert.addressDetail}
                      </p>
                    )}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setCriticalAlerts((prev) => prev.filter((a) => a.id !== alert.id))}
                  className="text-white/80 hover:text-white text-base font-bold px-2 py-0.5 rounded-lg hover:bg-white/20 transition-colors shrink-0"
                  title="ปิดการแจ้งเตือนนี้"
                >
                  ✕
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Top Navbar */}
      <header className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 sticky top-0 z-30 transition-colors duration-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex justify-between items-center gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <span className="text-2xl sm:text-3xl shrink-0">🌊</span>
            <div className="min-w-0">
              <h1 className="text-sm sm:text-lg font-bold text-slate-800 dark:text-slate-100 truncate leading-snug">
                ศูนย์ช่วยเหลือผู้ประสบภัยน้ำท่วม
              </h1>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 hidden xs:block truncate">
                Staff Relief Portal &bull; หาดใหญ่ &amp; สงขลา
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            {/* Alert Settings Quick Trigger Button */}
            <button
              type="button"
              onClick={() => setIsAlertSettingsOpen(true)}
              className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 transition-all shadow-sm active:scale-95"
              title="ตั้งค่าแจ้งเตือนวิกฤต & เขย่าหน้าจอ"
            >
              <span className="text-sm">🔔</span>
              <span className="hidden sm:inline">ตั้งค่าแจ้งเตือน</span>
            </button>

            <DarkModeToggle />

            {currentUser && (
              <div className="hidden md:flex items-center gap-2 pl-2 border-l border-slate-200 dark:border-slate-800">
                <div className="text-right">
                  <p className="text-xs font-semibold text-slate-700 dark:text-slate-200 leading-tight">
                    {currentUser.name}
                  </p>
                  <span
                    className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      currentUser.role === 'PRIME_ADMIN'
                        ? 'bg-purple-100 dark:bg-purple-900/60 text-purple-700 dark:text-purple-300 border border-purple-300 dark:border-purple-700'
                        : currentUser.role === 'DATA_ENTRY'
                        ? 'bg-blue-100 dark:bg-blue-900/60 text-blue-700 dark:text-blue-300 border border-blue-300 dark:border-blue-700'
                        : currentUser.role === 'RESCUE'
                        ? 'bg-emerald-100 dark:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700'
                        : currentUser.role === 'ADMIN'
                        ? 'bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300'
                        : 'bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300'
                    }`}
                  >
                    {currentUser.role === 'PRIME_ADMIN' && '👑 Prime Admin'}
                    {currentUser.role === 'DATA_ENTRY' && '📝 ผู้กรอกข้อมูล'}
                    {currentUser.role === 'RESCUE' && '🚑 หน่วยกู้ภัย'}
                    {currentUser.role === 'ADMIN' && '⚙️ แอดมิน'}
                    {currentUser.role === 'STAFF' && '👤 เจ้าหน้าที่'}
                  </span>
                </div>
              </div>
            )}

            <button
              onClick={handleLogout}
              className="text-xs bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-medium px-3 py-2 rounded-xl transition-colors border border-slate-200 dark:border-slate-700 shadow-sm"
              title="ออกจากระบบ"
            >
              <span className="hidden sm:inline">ออกจากระบบ</span>
              <span className="sm:hidden">🚪</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 pt-5">
        {/* Navigation & Actions Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3.5 mb-5">
          {/* iOS Style Segmented Control Tab */}
          <div className="flex items-center bg-slate-200/90 dark:bg-slate-800/90 p-1 rounded-2xl w-full sm:w-auto overflow-x-auto shadow-inner">
            <button
              onClick={() => setActiveTab('TABLE')}
              className={`flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                activeTab === 'TABLE'
                  ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              <span>📋</span> รายการเคส ({totalCases})
            </button>
            <button
              onClick={() => setActiveTab('MAP')}
              className={`flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                activeTab === 'MAP'
                  ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              <span>🗺️</span> แผนที่พิกัดรวม ({mapCases.length})
            </button>
            <button
              onClick={() => setActiveTab('TRASH')}
              className={`flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                activeTab === 'TRASH'
                  ? 'bg-white dark:bg-slate-900 text-rose-600 dark:text-rose-400 shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              <span>🗑️</span> ถังขยะ ({trashCases.length})
            </button>
            {['ADMIN', 'PRIME_ADMIN'].includes(currentUser?.role || '') && (
              <button
                onClick={() => setActiveTab('ADMIN')}
                className={`flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                  activeTab === 'ADMIN'
                    ? 'bg-white dark:bg-slate-900 text-purple-600 dark:text-purple-400 shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
              >
                <span>⚙️</span> แอดมิน &amp; ความปลอดภัย
              </button>
            )}
            {['PRIME_ADMIN', 'ADMIN', 'DATA_ENTRY'].includes(currentUser?.role || '') && (
              <button
                onClick={() => setActiveTab('USERS')}
                className={`flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                  activeTab === 'USERS'
                    ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
              >
                <span>👥</span> จัดการสิทธิ์ผู้ใช้
              </button>
            )}
          </div>

          <div className="flex items-center justify-between sm:justify-end gap-2.5">
            {activeTab === 'TABLE' && (
              <div className="flex items-center bg-slate-200/80 dark:bg-slate-800 p-1 rounded-xl text-xs">
                <button
                  onClick={() => setViewLayout('TABLE')}
                  className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
                    viewLayout === 'TABLE'
                      ? 'bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 shadow-xs'
                      : 'text-slate-600 dark:text-slate-400'
                  }`}
                  title="แสดงผลแบบตารางข้อมูล"
                >
                  📋 ตาราง
                </button>
                <button
                  onClick={() => setViewLayout('CARDS')}
                  className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
                    viewLayout === 'CARDS'
                      ? 'bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 shadow-xs'
                      : 'text-slate-600 dark:text-slate-400'
                  }`}
                  title="แสดงผลแบบการ์ด"
                >
                  🗂️ การ์ด
                </button>
              </div>
            )}

            {currentUser?.role !== 'RESCUE' ? (
              <button
                onClick={() => setIsCreateOpen(true)}
                className="w-full sm:w-auto bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold text-xs sm:text-sm px-4 py-2.5 rounded-xl shadow-md shadow-blue-500/20 active:scale-98 transition-all flex items-center justify-center gap-2"
              >
                <span>➕</span> บันทึกรับแจ้งเหตุใหม่
              </button>
            ) : (
              <div className="text-[11px] font-semibold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 px-3.5 py-2 rounded-xl flex items-center gap-1.5 shadow-sm">
                <span>🚑</span>
                <span>โหมดหน่วยกู้ภัย (ดูข้อมูลและเปลี่ยนสถานะ)</span>
              </div>
            )}
          </div>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 mb-5">
          {/* Card 1: Total */}
          <div
            onClick={() => {
              setStatusFilter('ALL');
              setUrgencyFilter('ALL');
            }}
            className={`p-3.5 sm:p-4 rounded-2xl border transition-all cursor-pointer ${
              statusFilter === 'ALL' && urgencyFilter === 'ALL'
                ? 'bg-blue-50/80 dark:bg-blue-950/40 border-blue-300 dark:border-blue-800 ring-2 ring-blue-500/20'
                : 'bg-white dark:bg-slate-900/90 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
            } shadow-sm`}
            title="คลิกเพื่อดูเคสทั้งหมด (ขยายแผนที่ครอบคลุมทั้งหมด)"
          >
            <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 mb-1">
              <span>เคสทั้งหมด</span>
              <span>📋</span>
            </div>
            <p className="text-2xl font-extrabold text-slate-800 dark:text-slate-100">{totalCases}</p>
          </div>

          {/* Card 2: Critical */}
          <div
            onClick={() => {
              setUrgencyFilter('CRITICAL');
              setStatusFilter('ALL');
            }}
            className={`p-3.5 sm:p-4 rounded-2xl border transition-all cursor-pointer ${
              urgencyFilter === 'CRITICAL'
                ? 'bg-rose-50 dark:bg-rose-950/40 border-rose-300 dark:border-rose-800 ring-2 ring-rose-500/20'
                : 'bg-white dark:bg-slate-900/90 border-slate-200 dark:border-slate-800 hover:border-rose-200'
            } shadow-sm`}
            title="คลิกเพื่อแสดงเฉพาะเคสวิกฤต"
          >
            <div className="flex items-center justify-between text-xs font-semibold text-rose-600 dark:text-rose-400 mb-1">
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping inline-block"></span>
                วิกฤตค้างอยู่
              </span>
              <span>🚨</span>
            </div>
            <p className="text-2xl font-extrabold text-rose-600 dark:text-rose-400">{criticalCases}</p>
          </div>

          {/* Card 3: Pending */}
          <div
            onClick={() => {
              setStatusFilter('PENDING');
              setUrgencyFilter('ALL');
            }}
            className={`p-3.5 sm:p-4 rounded-2xl border transition-all cursor-pointer ${
              statusFilter === 'PENDING'
                ? 'bg-amber-50 dark:bg-amber-950/40 border-amber-300 dark:border-amber-800 ring-2 ring-amber-500/20'
                : 'bg-white dark:bg-slate-900/90 border-slate-200 dark:border-slate-800 hover:border-amber-200'
            } shadow-sm`}
            title="คลิกเพื่อแสดงเฉพาะเคสรอดำเนินการ"
          >
            <div className="flex items-center justify-between text-xs text-amber-600 dark:text-amber-400 font-medium mb-1">
              <span>รอดำเนินการ</span>
              <span>⏳</span>
            </div>
            <p className="text-2xl font-extrabold text-amber-600 dark:text-amber-400">{pendingCases}</p>
          </div>

          {/* Card 4: In Progress */}
          <div
            onClick={() => {
              setStatusFilter('IN_PROGRESS');
              setUrgencyFilter('ALL');
            }}
            className={`p-3.5 sm:p-4 rounded-2xl border transition-all cursor-pointer ${
              statusFilter === 'IN_PROGRESS'
                ? 'bg-blue-50 dark:bg-blue-950/40 border-blue-300 dark:border-blue-800 ring-2 ring-blue-500/20'
                : 'bg-white dark:bg-slate-900/90 border-slate-200 dark:border-slate-800 hover:border-blue-200'
            } shadow-sm`}
            title="คลิกเพื่อแสดงเฉพาะเคสที่กำลังช่วยเหลือ"
          >
            <div className="flex items-center justify-between text-xs text-blue-600 dark:text-blue-400 font-medium mb-1">
              <span>กำลังช่วยเหลือ</span>
              <span>🚤</span>
            </div>
            <p className="text-2xl font-extrabold text-blue-600 dark:text-blue-400">{inProgressCases}</p>
          </div>

          {/* Card 5: Resolved */}
          <div
            onClick={() => {
              setStatusFilter('RESOLVED');
              setUrgencyFilter('ALL');
            }}
            className={`col-span-2 sm:col-span-1 p-3.5 sm:p-4 rounded-2xl border transition-all cursor-pointer ${
              statusFilter === 'RESOLVED'
                ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-800 ring-2 ring-emerald-500/20'
                : 'bg-white dark:bg-slate-900/90 border-slate-200 dark:border-slate-800 hover:border-emerald-200'
            } shadow-sm`}
            title="คลิกเพื่อแสดงเฉพาะเคสที่ช่วยเหลือแล้ว"
          >
            <div className="flex items-center justify-between text-xs text-emerald-600 dark:text-emerald-400 font-medium mb-1">
              <span>ช่วยเหลือแล้ว</span>
              <span>✅</span>
            </div>
            <p className="text-2xl font-extrabold text-emerald-600 dark:text-emerald-400">{resolvedCases}</p>
          </div>
        </div>

        {/* Tab 1: Table & Cards View */}
        {activeTab === 'TABLE' && (
          <div className="space-y-4">
            {/* Filter & Search Bar */}
            <div className="bg-white dark:bg-slate-900 p-3 sm:p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between transition-colors">
              <div className="relative flex-1">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 text-sm">
                  🔍
                </span>
                <input
                  type="text"
                  placeholder="ค้นหาชื่อผู้แจ้ง, สถานที่, หรือรายละเอียด..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full text-xs sm:text-sm pl-9 pr-8 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:ring-2 focus:ring-blue-500 focus:bg-white dark:focus:bg-slate-900 outline-none transition-all"
                />
                {searchTerm && (
                  <button
                    onClick={() => setSearchTerm('')}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-xs"
                  >
                    ✕
                  </button>
                )}
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="flex-1 sm:flex-none text-xs sm:text-sm px-3 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 outline-none shadow-xs min-w-[140px]"
                >
                  <option value="ALL">สถานะทั้งหมด</option>
                  <option value="PENDING">รอดำเนินการ</option>
                  <option value="IN_PROGRESS">กำลังช่วยเหลือ</option>
                  <option value="RESOLVED">ช่วยเหลือแล้ว</option>
                </select>

                <select
                  value={urgencyFilter}
                  onChange={(e) => setUrgencyFilter(e.target.value)}
                  className="flex-1 sm:flex-none text-xs sm:text-sm px-3 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 outline-none shadow-xs min-w-[140px]"
                >
                  <option value="ALL">ความเร่งด่วนทั้งหมด</option>
                  <option value="CRITICAL">🚨 วิกฤต</option>
                  <option value="HIGH">⚡ ด่วนมาก</option>
                  <option value="MEDIUM">📍 ปกติ</option>
                  <option value="LOW">🌱 ต่ำ</option>
                </select>

                {(statusFilter !== 'ALL' || urgencyFilter !== 'ALL' || searchTerm) && (
                  <button
                    onClick={() => {
                      setStatusFilter('ALL');
                      setUrgencyFilter('ALL');
                      setSearchTerm('');
                    }}
                    className="p-2.5 text-xs text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-xl transition-colors shrink-0"
                    title="ล้างฟิลเตอร์ทั้งหมด"
                  >
                    ล้างตัวกรอง
                  </button>
                )}
              </div>
            </div>

            {/* Loading & Empty States */}
            {isLoading ? (
              <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-12 text-center text-slate-400 dark:text-slate-500 shadow-sm flex flex-col items-center justify-center gap-3">
                <div className="animate-spin text-3xl">⏳</div>
                <p className="text-sm">กำลังโหลดข้อมูลเคสขอความช่วยเหลือ...</p>
              </div>
            ) : displayCases.length === 0 ? (
              <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-12 text-center text-slate-400 dark:text-slate-500 shadow-sm flex flex-col items-center justify-center gap-2">
                <span className="text-4xl">🔍</span>
                <p className="text-base font-semibold text-slate-700 dark:text-slate-300">ไม่พบเคสช่วยเหลือตามเงื่อนไขที่เลือก</p>
                <p className="text-xs text-slate-500">ลองปรับเปลี่ยนตัวกรองค้นหา หรือกดล้างตัวกรองเพื่อดูรายการทั้งหมด</p>
              </div>
            ) : (
              <>
                {/* 1. Explicit CARD VIEW Layout (Shows when viewLayout === 'CARDS') */}
                {viewLayout === 'CARDS' && (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
                    {paginatedCases.map((c) => renderCaseCard(c))}
                  </div>
                )}

                {/* 2. TABLE VIEW Layout (Shows when viewLayout === 'TABLE') */}
                {viewLayout === 'TABLE' && (
                  <>
                    {/* Mobile fallback cards feed (< 768px) */}
                    <div className="space-y-3 block md:hidden">
                      {paginatedCases.map((c) => renderCaseCard(c))}
                    </div>

                    {/* Desktop high-density table (>= 768px) */}
                    <div className="hidden md:block bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden transition-colors">
                      <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs">
                          <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 font-semibold border-b border-slate-200 dark:border-slate-800">
                            <tr>
                              <th className="py-3.5 px-3 whitespace-nowrap">ความเร่งด่วน</th>
                              <th className="py-3.5 px-3">ผู้แจ้งเหตุ</th>
                              <th className="py-3.5 px-3 whitespace-nowrap">จำนวน</th>
                              <th className="py-3.5 px-3">สิ่งของที่ต้องการ</th>
                              <th className="py-3.5 px-3">สถานที่ / จุดสังเกต</th>
                              <th className="py-3.5 px-3 whitespace-nowrap">สถานะ</th>
                              <th className="py-3.5 px-3 whitespace-nowrap text-center">จัดการ</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
                            {paginatedCases.map((c) => {
                              const urgency = getUrgencyBadge(c.urgency);
                              const status = getStatusConfig(c.status);

                              return (
                                <tr
                                  key={c.id}
                                  className="hover:bg-blue-50/40 dark:hover:bg-slate-800/50 transition-colors cursor-pointer group"
                                  onClick={() => handleFocusOnMap(c)}
                                  title="คลิกแถวนี้เพื่อไปยังตำแหน่งบนแผนที่ (ซูมพร้อมไฮไลต์หมุด)"
                                >
                                  {/* Urgency */}
                                  <td className="py-3 px-3 whitespace-nowrap">
                                    <span
                                      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold border ${urgency.className}`}
                                    >
                                      <span>{urgency.icon}</span> {urgency.label}
                                    </span>
                                  </td>

                                  {/* Reporter Name */}
                                  <td className="py-3 px-3">
                                    <div className="font-semibold text-slate-800 dark:text-slate-100 leading-tight text-xs group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors flex items-center gap-1.5 flex-wrap">
                                      <span>{c.reporterName}</span>
                                      {(c.description?.includes('[ข้อมูลแจ้งซ้ำ') || c.description?.includes('[มีการส่งแจ้งซ้ำ')) && (
                                        <span className="inline-flex items-center gap-0.5 px-1.5 py-0.2 rounded-full text-[9px] font-bold bg-amber-100 dark:bg-amber-950/80 text-amber-700 dark:text-amber-300 border border-amber-300 dark:border-amber-700">
                                          ⚠️ แจ้งซ้ำ
                                        </span>
                                      )}
                                    </div>
                                    <span className="inline-block mt-0.5 text-[10px] px-1.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400">
                                      {c.source === 'PUBLIC' ? '🌐 Online' : '👤 Staff'}
                                    </span>
                                  </td>

                                  {/* People Count */}
                                  <td className="py-3 px-3 whitespace-nowrap font-semibold text-slate-700 dark:text-slate-200 text-xs">
                                    👥 {c.peopleCount}
                                  </td>

                                  {/* Items Needed */}
                                  <td className="py-3 px-3" onClick={(e) => e.stopPropagation()}>
                                    <div className="flex flex-wrap gap-1 max-w-[180px]">
                                      {c.itemsNeeded && c.itemsNeeded.length > 0 ? (
                                        <>
                                          {c.itemsNeeded.slice(0, 2).map((item, idx) => (
                                            <span
                                              key={idx}
                                              className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-[11px] px-2 py-0.5 rounded-md font-medium whitespace-nowrap"
                                            >
                                              {item}
                                            </span>
                                          ))}
                                          {c.itemsNeeded.length > 2 && (
                                            <span className="bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-400 text-[11px] px-2 py-0.5 rounded-md font-medium">
                                              +{c.itemsNeeded.length - 2}
                                            </span>
                                          )}
                                        </>
                                      ) : (
                                        <span className="text-slate-400 text-xs">-</span>
                                      )}
                                    </div>
                                  </td>

                                  {/* Address with "ดูบนแผนที่" link below */}
                                  <td className="py-3 px-3 text-xs text-slate-600 dark:text-slate-300 max-w-[210px]">
                                    <div className="flex flex-col items-start gap-0.5">
                                      <div className="flex items-start gap-1 max-w-full">
                                        <span className="text-blue-500 shrink-0 mt-0.5">📍</span>
                                        <span className="truncate" title={c.addressDetail || `${c.latitude}, ${c.longitude}`}>
                                          {c.addressDetail || `${c.latitude.toFixed(4)}, ${c.longitude.toFixed(4)}`}
                                        </span>
                                      </div>
                                      <button
                                        type="button"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleFocusOnMap(c);
                                        }}
                                        className="inline-flex items-center gap-1 text-[11px] text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 font-semibold hover:underline mt-0.5 pl-3.5 transition-colors"
                                        title="ซูมไปยังจุดนี้บนแผนที่"
                                      >
                                        <span>🗺️</span> ดูบนแผนที่
                                      </button>
                                    </div>
                                  </td>

                                  {/* Status Select Badge */}
                                  <td className="py-3 px-3 whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                                    <div className="relative inline-block">
                                      <select
                                        value={c.status}
                                        onChange={(e) => handleUpdateStatus(c.id, e.target.value)}
                                        className={`text-xs font-semibold pl-6 pr-6 py-1.5 rounded-full border outline-none cursor-pointer appearance-none transition-colors ${status.badgeClass}`}
                                      >
                                        <option value="PENDING">รอดำเนินการ</option>
                                        <option value="IN_PROGRESS">กำลังช่วยเหลือ</option>
                                        <option value="RESOLVED">ช่วยเหลือแล้ว</option>
                                        {currentUser?.role !== 'RESCUE' && (
                                          <option value="CANCELLED">ยกเลิก (ย้ายไปถังขยะ)</option>
                                        )}
                                      </select>
                                      <span className={`absolute left-2.5 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full ${status.dotClass} pointer-events-none`}></span>
                                      <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[9px] opacity-60 pointer-events-none">▼</span>
                                    </div>
                                  </td>

                                  {/* Actions Button */}
                                  <td className="py-3 px-3 text-center whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                                    <div className="flex items-center justify-center gap-1.5">
                                      <button
                                        onClick={() => handleOpenDetail(c)}
                                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-blue-600/10 hover:bg-blue-600 text-blue-600 hover:text-white dark:bg-blue-500/20 dark:text-blue-300 dark:hover:bg-blue-600 dark:hover:text-white border border-blue-600/20 dark:border-blue-500/30 transition-all active:scale-95 shadow-xs"
                                        title="คลิกเพื่อปลดล็อกเบอร์เต็มและดูข้อมูล"
                                      >
                                        <span>🔓</span> ดูเบอร์เต็ม
                                      </button>
                                      {currentUser?.role !== 'RESCUE' && (
                                        <button
                                          onClick={() => setCaseToCancel(c)}
                                          className="p-1.5 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                                          title="ยกเลิกเคสนี้ (ย้ายไปถังขยะ)"
                                        >
                                          🗑️
                                        </button>
                                      )}
                                    </div>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </>
                )}

                {/* Pagination (20 items per page) */}
                {renderPagination()}
              </>
            )}
          </div>
        )}

        {/* Tab 2: Map Overview */}
        <div className={activeTab === 'MAP' ? 'block' : 'hidden'}>
          <div className="bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4 transition-colors">
            <div className="flex flex-wrap justify-between items-center gap-3">
              <div>
                <h3 className="text-base font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                  <span>🗺️</span> แผนที่ตำแหน่งผู้ประสบภัยน้ำท่วม
                  {statusFilter !== 'ALL' || urgencyFilter !== 'ALL' ? (
                    <span className="text-xs px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300 font-semibold">
                      กรองเฉพาะ:{' '}
                      {urgencyFilter === 'CRITICAL'
                        ? 'วิกฤต'
                        : statusFilter === 'PENDING'
                        ? 'รอดำเนินการ'
                        : statusFilter === 'IN_PROGRESS'
                        ? 'กำลังช่วยเหลือ'
                        : statusFilter === 'RESOLVED'
                        ? 'ช่วยเหลือแล้ว'
                        : 'กำหนดเอง'}
                    </span>
                  ) : null}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5" suppressHydrationWarning>
                  {`แสดง ${mapCases.length} เคสบนแผนที่ • ศูนย์กลางหาดใหญ่ (${DEFAULT_LAT.toFixed(4)}, ${DEFAULT_LNG.toFixed(4)})`}
                </p>
              </div>

              <div className="flex items-center gap-3 text-xs bg-slate-50 dark:bg-slate-800 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700">
                <span className="flex items-center gap-1 text-slate-700 dark:text-slate-200">
                  <span className="w-2.5 h-2.5 rounded-full bg-rose-600 inline-block animate-pulse"></span> วิกฤต
                </span>
                <span className="flex items-center gap-1 text-slate-700 dark:text-slate-200">
                  <span className="w-2.5 h-2.5 rounded-full bg-orange-500 inline-block"></span> ด่วน
                </span>
                <span className="flex items-center gap-1 text-slate-700 dark:text-slate-200">
                  <span className="w-2.5 h-2.5 rounded-full bg-blue-600 inline-block"></span> ปกติ
                </span>
              </div>
            </div>

            <div className="w-full h-[450px] sm:h-[580px] rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800">
              <MapPicker
                latitude={DEFAULT_LAT}
                longitude={DEFAULT_LNG}
                cases={mapCases}
                readOnly={true}
                onSelectCase={handleOpenDetail}
                onStatusChange={handleUpdateStatus}
                onDeleteCase={(c) => {
                  const fullCase = allCases.find((x) => x.id === c.id);
                  if (fullCase) setCaseToCancel(fullCase);
                }}
                canDeleteCase={currentUser?.role !== 'RESCUE'}
                focusedCaseId={focusedCaseId}
                onFocusHandled={() => setFocusedCaseId(null)}
                isActive={activeTab === 'MAP'}
              />
            </div>
          </div>
        </div>

        {/* Tab 3: Trash Bin (ถังขยะรายการลบ / กู้คืน / ลบถาวร / ล้างทั้งหมด) */}
        {activeTab === 'TRASH' && (
          <div className="space-y-4">
            <div className="bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
              <div>
                <h3 className="text-base font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                  <span>🗑️</span> ถังขยะรายการลบ (Trash Bin)
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  เคสที่ถูกยกเลิกจะถูกเก็บไว้ที่นี่ สามารถกด &quot;กู้คืนเคส&quot; เพื่อนำกลับไปยังรายการหลัก หรือกด &quot;ลบถาวร&quot; เพื่อลบออกจากฐานข้อมูล
                </p>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs px-3 py-1 rounded-xl bg-rose-100 dark:bg-rose-950/50 text-rose-700 dark:text-rose-300 font-bold border border-rose-200 dark:border-rose-900">
                  เคสในถังขยะ: {trashCases.length} รายการ
                </span>

                {trashCases.length > 0 && currentUser?.role !== 'RESCUE' && (
                  <button
                    onClick={() => setIsConfirmEmptyTrash(true)}
                    className="bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs px-3.5 py-1.5 rounded-xl shadow-sm transition-all active:scale-95 flex items-center gap-1.5"
                    title="ลบเคสทั้งหมดในถังขยะอย่างถาวร"
                  >
                    <span>🗑️</span> ลบทั้งหมดในถังขยะ
                  </button>
                )}
              </div>
            </div>

            {trashCases.length === 0 ? (
              <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-12 text-center text-slate-400 dark:text-slate-500 shadow-sm flex flex-col items-center justify-center gap-2">
                <span className="text-4xl">✨</span>
                <p className="text-base font-semibold text-slate-700 dark:text-slate-300">ไม่มีเคสในถังขยะ</p>
                <p className="text-xs text-slate-500">เคสที่ถูกกดยกเลิกจะมาปรากฏในหน้านี้</p>
              </div>
            ) : (
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {trashCases.map((c) => {
                  const urgency = getUrgencyBadge(c.urgency);

                  return (
                    <div
                      key={c.id}
                      className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-rose-200 dark:border-rose-950/60 shadow-sm space-y-3"
                    >
                      <div className="flex items-center justify-between">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold border ${urgency.className}`}>
                          <span>{urgency.icon}</span> {urgency.label}
                        </span>
                        <span className="text-[11px] text-rose-600 dark:text-rose-400 font-semibold bg-rose-50 dark:bg-rose-950/40 px-2 py-0.5 rounded-md">
                          สถานะ: ยกเลิก
                        </span>
                      </div>

                      <div>
                        <h4 className="font-bold text-slate-800 dark:text-slate-100 text-sm">{c.reporterName}</h4>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                          👥 {c.peopleCount} คน &bull; 📍 {c.addressDetail || `${c.latitude}, ${c.longitude}`}
                        </p>
                      </div>

                      {c.description && (
                        <p className="text-xs text-slate-600 dark:text-slate-300 line-clamp-2 bg-slate-50 dark:bg-slate-800/50 p-2 rounded-xl">
                          {c.description}
                        </p>
                      )}

                      <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2">
                        <button
                          onClick={() => handleRestoreCase(c.id)}
                          className="flex-1 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/40 dark:hover:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800 text-xs font-bold py-2 rounded-xl transition-all flex items-center justify-center gap-1"
                          title="นำเคสนี้กลับสู่สถานะรอดำเนินการ"
                        >
                          <span>♻️</span> กู้คืนเคส
                        </button>
                        {currentUser?.role !== 'RESCUE' && (
                          <button
                            onClick={() => setCaseToDeletePermanent(c)}
                            className="bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/40 dark:hover:bg-rose-900/50 text-rose-700 dark:text-rose-300 border border-rose-300 dark:border-rose-800 text-xs font-bold px-3 py-2 rounded-xl transition-all"
                            title="ลบออกจากระบบอย่างถาวร"
                          >
                            🗑️ ลบถาวร
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Tab 4: Admin & Audit Logs */}
        {activeTab === 'ADMIN' && ['ADMIN', 'PRIME_ADMIN'].includes(currentUser?.role || '') && (
          <div className="space-y-6">
            {/* 2-Column Grid: Feature Flag Toggle (Left) & Alert/Shake Settings (Right) */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">
              {/* Box 1 (Left): Feature Flag Toggle */}
              <div className="bg-white dark:bg-slate-900 p-5 sm:p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm transition-colors flex flex-col justify-between">
                <div>
                  <h3 className="text-base font-bold text-slate-800 dark:text-slate-100 mb-2 flex items-center gap-2">
                    <span>⚙️</span> การควบคุมระบบรับเรื่องสาธารณะ (Feature Flag Toggle)
                  </h3>
                  <p className="text-xs text-slate-600 dark:text-slate-400 mb-4 leading-relaxed">
                    ตามข้อกำหนดความปลอดภัย (AC-02) ฟีเจอร์รับเรื่องจากผู้ประสบภัยโดยตรง (`/report` และ `POST /api/public/cases`)
                    จะต้องถูกปิดไว้เป็นค่าเริ่มต้น หากต้องการเปิดให้ประชาชนเข้าถึง สามารถเปิดสวิตช์ด้านล่างนี้ได้
                  </p>
                </div>

                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700">
                  <div>
                    <p className="text-xs font-bold text-slate-800 dark:text-slate-100">Public Intake Portal</p>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                      สถานะปัจจุบัน:{' '}
                      <span className={adminPublicFlag ? 'text-emerald-600 dark:text-emerald-400 font-bold' : 'text-rose-600 dark:text-rose-400 font-bold'}>
                        {adminPublicFlag ? 'เปิดใช้งาน (/report)' : 'ปิดการใช้งาน (404)'}
                      </span>
                    </p>
                  </div>
                  <button
                    onClick={() => handleTogglePublicIntake(!adminPublicFlag)}
                    disabled={isAdminSaving}
                    className={`px-4 py-2 rounded-xl font-bold text-xs transition-all shadow-sm active:scale-95 shrink-0 ${
                      adminPublicFlag
                        ? 'bg-rose-600 hover:bg-rose-700 text-white'
                        : 'bg-emerald-600 hover:bg-emerald-700 text-white'
                    }`}
                  >
                    {isAdminSaving ? 'กำลังบันทึก...' : adminPublicFlag ? 'สั่งปิดฟีเจอร์นี้' : 'สั่งเปิดฟีเจอร์นี้'}
                  </button>
                </div>
              </div>

              {/* Box 2 (Right): Compact Alert & Shake Settings */}
              <div className="bg-white dark:bg-slate-900 p-5 sm:p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm transition-colors flex flex-col justify-between space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <h3 className="text-base font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                      <span>🔔</span> ตั้งค่าระบบแจ้งเตือน &amp; เขย่าหน้าจอ
                    </h3>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                      กำหนดการแจ้งเตือนเคสวิกฤต, การสั่น และเสียงกริ่ง
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleTestAlert}
                    className="px-2.5 py-1.5 rounded-xl text-xs font-bold bg-amber-500 hover:bg-amber-600 text-white shadow-sm transition-all flex items-center gap-1 active:scale-95 shrink-0"
                    title="ทดสอบการแจ้งเตือน เสียงกริ่ง และการสั่นหน้าจอ"
                  >
                    <span>⚡</span> ทดสอบ
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs">
                  {/* Toggle 1: Alert Card */}
                  <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex items-center justify-between">
                    <div>
                      <p className="font-bold text-slate-800 dark:text-slate-100 text-[11px]">การ์ดสีแดง</p>
                      <p className="text-[10px] text-slate-500 dark:text-slate-400">
                        {alertConfig.showAlertCard ? 'เปิดใช้งาน' : 'ปิด'}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => updateAlertConfig({ showAlertCard: !alertConfig.showAlertCard })}
                      className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out ${
                        alertConfig.showAlertCard ? 'bg-red-600' : 'bg-slate-300 dark:bg-slate-700'
                      }`}
                    >
                      <span
                        className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                          alertConfig.showAlertCard ? 'translate-x-4' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </div>

                  {/* Toggle 2: Screen Shake */}
                  <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex items-center justify-between">
                    <div>
                      <p className="font-bold text-slate-800 dark:text-slate-100 text-[11px]">เขย่าหน้าจอ</p>
                      <p className="text-[10px] text-slate-500 dark:text-slate-400">
                        {alertConfig.enableShake ? 'เปิดใช้งาน' : 'ปิด'}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => updateAlertConfig({ enableShake: !alertConfig.enableShake })}
                      className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out ${
                        alertConfig.enableShake ? 'bg-red-600' : 'bg-slate-300 dark:bg-slate-700'
                      }`}
                    >
                      <span
                        className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                          alertConfig.enableShake ? 'translate-x-4' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </div>

                  {/* Toggle 3: Sound Bell Alert */}
                  <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex items-center justify-between col-span-2">
                    <div>
                      <p className="font-bold text-slate-800 dark:text-slate-100 text-[11px]">
                        🔔 เสียงกริ่งแจ้งเตือนฉุกเฉินตามเวลาเขย่า
                      </p>
                      <p className="text-[10px] text-slate-500 dark:text-slate-400">
                        {alertConfig.enableSound !== false ? 'เปิดเสียงกริ่งเตือน' : 'ปิดเสียงกริ่ง'}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => updateAlertConfig({ enableSound: alertConfig.enableSound === false ? true : false })}
                      className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out ${
                        alertConfig.enableSound !== false ? 'bg-red-600' : 'bg-slate-300 dark:bg-slate-700'
                      }`}
                    >
                      <span
                        className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                          alertConfig.enableSound !== false ? 'translate-x-4' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </div>
                </div>

                {/* Duration Slider */}
                <div
                  className={`p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-1 transition-opacity ${
                    alertConfig.enableShake ? 'opacity-100' : 'opacity-40 pointer-events-none'
                  }`}
                >
                  <div className="flex justify-between items-center text-[11px]">
                    <span className="font-semibold text-slate-700 dark:text-slate-300">
                      ระยะเวลาเขย่า &amp; เสียงกริ่ง:
                    </span>
                    <span className="font-bold text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/50 px-1.5 py-0.5 rounded text-[11px] border border-red-200 dark:border-red-900">
                      {alertConfig.shakeDuration} วินาที
                    </span>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="15"
                    step="1"
                    value={alertConfig.shakeDuration}
                    onChange={(e) => updateAlertConfig({ shakeDuration: Number(e.target.value) || 1 })}
                    className="w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-red-600"
                  />
                  <div className="flex justify-between text-[9px] text-slate-400">
                    <span>1 วิ</span>
                    <span>5 วิ</span>
                    <span>15 วิ</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Audit Logs Table */}
            <div className="bg-white dark:bg-slate-900 p-5 sm:p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm transition-colors">
              <div className="flex justify-between items-center mb-4">
                <div>
                  <h3 className="text-base font-bold text-slate-800 dark:text-slate-100">
                    📋 ประวัติการเข้าถึงข้อมูลสำคัญ (Audit Logs)
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    บันทึกทุกครั้งที่มีการเปิดดูข้อมูลส่วนบุคคล (PII Unmasking), การแก้ไขสถานะ หรือการลบเคส
                  </p>
                </div>
                <button
                  onClick={fetchAdminData}
                  className="text-xs text-blue-600 dark:text-blue-400 hover:underline font-medium"
                >
                  🔄 รีเฟรช Logs
                </button>
              </div>

              <div className="overflow-x-auto max-h-96">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-semibold border-b border-slate-200 dark:border-slate-700 sticky top-0">
                    <tr>
                      <th className="py-2.5 px-3 whitespace-nowrap">เวลา</th>
                      <th className="py-2.5 px-3 whitespace-nowrap">การกระทำ (Action)</th>
                      <th className="py-2.5 px-3 whitespace-nowrap">ผู้ใช้งาน (User)</th>
                      <th className="py-2.5 px-3 whitespace-nowrap">เป้าหมาย (Target)</th>
                      <th className="py-2.5 px-3 whitespace-nowrap">IP Address</th>
                      <th className="py-2.5 px-3">รายละเอียด</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {auditLogs.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="py-8 text-center text-slate-400">
                          ยังไม่มีบันทึก Audit Log ในระบบ
                        </td>
                      </tr>
                    ) : (
                      auditLogs.map((log) => (
                        <tr key={log.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                          <td className="py-2 px-3 text-slate-500 dark:text-slate-400 whitespace-nowrap font-mono text-[11px]">
                            {new Date(log.createdAt).toLocaleString('th-TH')}
                          </td>
                          <td className="py-2 px-3 font-mono font-bold text-slate-700 dark:text-slate-200 whitespace-nowrap">
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] ${
                                log.action === 'UNMASK_FULL_PII'
                                  ? 'bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300'
                                  : log.action === 'DELETE_CASE_PERMANENT' || log.action === 'EMPTY_TRASH_ALL'
                                  ? 'bg-rose-100 dark:bg-rose-950/60 text-rose-800 dark:text-rose-300'
                                  : 'bg-purple-100 dark:bg-purple-950/60 text-purple-800 dark:text-purple-300'
                              }`}
                            >
                              {log.action}
                            </span>
                          </td>
                          <td className="py-2 px-3 text-slate-800 dark:text-slate-200">
                            {log.user ? `${log.user.name} (${log.user.username})` : log.userId || '-'}
                          </td>
                          <td className="py-2 px-3 font-mono text-slate-500 dark:text-slate-400 max-w-[120px] truncate">
                            {log.targetId || '-'}
                          </td>
                          <td className="py-2 px-3 font-mono text-slate-500 dark:text-slate-400">{log.ipAddress || '-'}</td>
                          <td className="py-2 px-3 text-slate-600 dark:text-slate-300">{log.details || '-'}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Tab 5: User Management (Prime Admin & Data Entry) */}
        {activeTab === 'USERS' && ['PRIME_ADMIN', 'ADMIN', 'DATA_ENTRY'].includes(currentUser?.role || '') && (
          <div className="space-y-6">
            <div className="bg-white dark:bg-slate-900 p-5 sm:p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm transition-colors">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
                <div>
                  <h3 className="text-base font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                    <span>👥</span> ระบบจัดการสิทธิ์ผู้ใช้งาน
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Prime Admin และ Admin สามารถเพิ่ม ลบ แก้ไข และค้นหาผู้ใช้ได้ (ผู้กรอกข้อมูลสามารถเพิ่มผู้ใช้ได้)
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setIsAddUserOpen(true);
                    setUserActionError(null);
                    setUserActionSuccess(null);
                  }}
                  className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-bold text-xs px-4 py-2.5 rounded-xl shadow-md transition-all active:scale-95 flex items-center justify-center gap-1.5"
                >
                  <span>➕</span> เพิ่มชื่อผู้ใช้งานใหม่
                </button>
              </div>

              {/* Status alerts */}
              {userActionSuccess && (
                <div className="mb-4 p-3 bg-green-50 dark:bg-green-950/60 border-l-4 border-green-500 text-green-700 dark:text-green-300 text-xs rounded-r-xl">
                  {userActionSuccess}
                </div>
              )}
              {userActionError && (
                <div className="mb-4 p-3 bg-red-50 dark:bg-red-950/60 border-l-4 border-red-500 text-red-700 dark:text-red-300 text-xs rounded-r-xl">
                  {userActionError}
                </div>
              )}

              {/* User Guide Card */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-6 p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 text-xs">
                <div className="border-l-4 border-indigo-500 pl-3">
                  <span className="font-bold text-indigo-700 dark:text-indigo-300 block mb-0.5">⚙️ หน้าที่: แอดมิน (ADMIN)</span>
                  <span className="text-slate-600 dark:text-slate-400 text-[11px] leading-relaxed">
                    จัดการข้อมูลเคสได้ทั้งหมด, เพิ่ม/แก้ไข/ลบผู้ใช้ (กำหนดระดับผู้ใช้ได้), และควบคุมการเปิด-ปิดระบบรับเรื่องออนไลน์
                  </span>
                </div>
                <div className="border-l-4 border-blue-500 pl-3">
                  <span className="font-bold text-blue-700 dark:text-blue-300 block mb-0.5">📝 หน้าที่: ผู้กรอกข้อมูล (DATA_ENTRY)</span>
                  <span className="text-slate-600 dark:text-slate-400 text-[11px] leading-relaxed">
                    มีหน้าที่เพิ่มข้อมูลเคสใหม่, เพิ่มผู้ใช้ใหม่, แก้ไขเคส และลบเคสลงถังขยะ (ไม่สามารถแก้ไขหรือลบผู้ใช้ได้)
                  </span>
                </div>
                <div className="border-l-4 border-emerald-500 pl-3">
                  <span className="font-bold text-emerald-700 dark:text-emerald-300 block mb-0.5">🚑 หน้าที่: หน่วยกู้ภัย (RESCUE)</span>
                  <span className="text-slate-600 dark:text-slate-400 text-[11px] leading-relaxed">
                    สามารถดูข้อมูลเคสและพิกัดแผนที่ได้อย่างเดียว, เปลี่ยนสถานะได้ (เช่น กำลังช่วย / ช่วยแล้ว) แต่<strong>ไม่สามารถลบหรือเพิ่มเคสได้</strong>
                  </span>
                </div>
              </div>

              {/* Search Bar for Users */}
              <div className="flex flex-col sm:flex-row gap-3 mb-4 items-stretch sm:items-center justify-between">
                <div className="relative w-full sm:w-80">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs">🔍</span>
                  <input
                    type="text"
                    value={userSearchQuery}
                    onChange={(e) => {
                      setUserSearchQuery(e.target.value);
                      fetchUserList(e.target.value);
                    }}
                    placeholder="ค้นหาผู้ใช้ Email RTAF (ชื่อ, email, บทบาท)..."
                    className="w-full pl-8 pr-8 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-100 text-xs outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                  {userSearchQuery && (
                    <button
                      type="button"
                      onClick={() => {
                        setUserSearchQuery('');
                        fetchUserList('');
                      }}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs p-1"
                    >
                      ✕
                    </button>
                  )}
                </div>
                <div className="text-xs text-slate-500 dark:text-slate-400 self-end sm:self-center">
                  พบ <b>{userList.length}</b> ผู้ใช้งาน
                </div>
              </div>

              {/* Users Table */}
              <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-semibold border-b border-slate-200 dark:border-slate-700">
                    <tr>
                      <th className="py-3 px-4">ชื่อผู้ใช้ Email RTAF</th>
                      <th className="py-3 px-4">ชื่อ-นามสกุล</th>
                      <th className="py-3 px-4">บทบาท / หน้าที่</th>
                      <th className="py-3 px-4">การเข้าสู่ระบบ</th>
                      <th className="py-3 px-4">วันที่เพิ่ม</th>
                      {['PRIME_ADMIN', 'ADMIN'].includes(currentUser?.role || '') && (
                        <th className="py-3 px-4 text-center">จัดการ</th>
                      )}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {userList.map((u) => (
                      <tr key={u.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                        <td className="py-3 px-4 font-mono font-bold text-slate-800 dark:text-slate-100">
                          {u.username}<span className="text-slate-400 font-normal text-[10px]">@rtaf.mi.th</span>
                        </td>
                        <td className="py-3 px-4 text-slate-700 dark:text-slate-300">
                          {u.name}
                        </td>
                        <td className="py-3 px-4">
                          <span
                            className={`inline-block px-2.5 py-1 rounded-full text-[10px] font-bold ${
                              u.role === 'PRIME_ADMIN'
                                ? 'bg-purple-100 dark:bg-purple-900/60 text-purple-700 dark:text-purple-300 border border-purple-300 dark:border-purple-700'
                                : u.role === 'ADMIN'
                                ? 'bg-indigo-100 dark:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 border border-indigo-300 dark:border-indigo-700'
                                : u.role === 'DATA_ENTRY'
                                ? 'bg-blue-100 dark:bg-blue-900/60 text-blue-700 dark:text-blue-300 border border-blue-300 dark:border-blue-700'
                                : u.role === 'RESCUE'
                                ? 'bg-emerald-100 dark:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700'
                                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                            }`}
                          >
                            {u.role === 'PRIME_ADMIN' && '👑 Prime Admin'}
                            {u.role === 'ADMIN' && '⚙️ แอดมิน'}
                            {u.role === 'DATA_ENTRY' && '📝 ผู้กรอกข้อมูล'}
                            {u.role === 'RESCUE' && '🚑 หน่วยกู้ภัย'}
                            {u.role === 'STAFF' && '👤 เจ้าหน้าที่'}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-slate-500 dark:text-slate-400 font-mono text-[11px]">
                          RTAF MFA
                        </td>
                        <td className="py-3 px-4 text-slate-400 text-[11px]" suppressHydrationWarning>
                          {new Date(u.createdAt).toLocaleDateString('th-TH')}
                        </td>
                        {['PRIME_ADMIN', 'ADMIN'].includes(currentUser?.role || '') && (
                          <td className="py-3 px-4 text-center">
                            <div className="flex items-center justify-center gap-1.5">
                              <button
                                type="button"
                                onClick={() => {
                                  setEditingUser({
                                    id: u.id,
                                    username: u.username,
                                    name: u.name,
                                    role: u.role,
                                  });
                                  setUserActionError(null);
                                  setUserActionSuccess(null);
                                }}
                                className="px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800 hover:bg-indigo-100 transition-colors"
                                title="แก้ไขผู้ใช้"
                              >
                                ✏️ แก้ไข
                              </button>
                              {u.role !== 'PRIME_ADMIN' && u.username !== 'nattanon_r' && u.id !== currentUser?.userId && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    setUserToDelete(u);
                                    setUserActionError(null);
                                    setUserActionSuccess(null);
                                  }}
                                  className="px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-red-50 dark:bg-red-950/60 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-800 hover:bg-red-100 transition-colors"
                                  title="ลบผู้ใช้"
                                >
                                  🗑️ ลบ
                                </button>
                              )}
                            </div>
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Modal for Editing User */}
            {editingUser && (
              <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4 z-[9999]">
                <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 max-w-md w-full border border-slate-200 dark:border-slate-800 shadow-2xl">
                  <h3 className="text-base font-bold text-slate-800 dark:text-slate-100 mb-1 flex items-center gap-2">
                    <span>✏️</span> แก้ไขข้อมูลผู้ใช้งาน
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
                    แก้ไขชื่อผู้ใช้ Email RTAF, ชื่อ-นามสกุล หรือปรับเปลี่ยนหน้าที่ของผู้ใช้
                  </p>

                  <form onSubmit={handleUpdateUser} className="space-y-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        ชื่อผู้ใช้ Email RTAF *
                      </label>
                      <div className="relative flex items-center">
                        <input
                          type="text"
                          required
                          disabled={editingUser.role === 'PRIME_ADMIN' || editingUser.username === 'nattanon_r'}
                          value={editingUser.username}
                          onChange={(e) => setEditingUser({ ...editingUser, username: e.target.value })}
                          className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 text-xs outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-60"
                        />
                        <span className="absolute right-3 text-[11px] font-mono text-slate-400 pointer-events-none">
                          @rtaf.mi.th
                        </span>
                      </div>
                      {editingUser.role === 'PRIME_ADMIN' && (
                        <p className="text-[10px] text-amber-500 mt-1">
                          * บัญชี Prime Admin ได้รับการคุ้มครอง ไม่สามารถเปลี่ยนชื่อผู้ใช้ได้
                        </p>
                      )}
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        ชื่อ-นามสกุล / ชื่อทีม *
                      </label>
                      <input
                        type="text"
                        required
                        value={editingUser.name}
                        onChange={(e) => setEditingUser({ ...editingUser, name: e.target.value })}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 text-xs outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>

                    {editingUser.role !== 'PRIME_ADMIN' && (
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                          เลือกบทบาท / หน้าที่
                        </label>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                          <button
                            type="button"
                            onClick={() => setEditingUser({ ...editingUser, role: 'ADMIN' })}
                            className={`p-2.5 rounded-xl border text-left text-xs transition-all ${
                              editingUser.role === 'ADMIN'
                                ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 ring-2 ring-indigo-500/20'
                                : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                            }`}
                          >
                            <span className="font-bold block">⚙️ แอดมิน</span>
                            <span className="text-[10px] text-slate-500">จัดการเคส, สิทธิ์, ฟีเจอร์</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => setEditingUser({ ...editingUser, role: 'DATA_ENTRY' })}
                            className={`p-2.5 rounded-xl border text-left text-xs transition-all ${
                              editingUser.role === 'DATA_ENTRY'
                                ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 ring-2 ring-blue-500/20'
                                : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                            }`}
                          >
                            <span className="font-bold block">📝 ผู้กรอกข้อมูล</span>
                            <span className="text-[10px] text-slate-500">จัดการเคสและสิทธิ์</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => setEditingUser({ ...editingUser, role: 'RESCUE' })}
                            className={`p-2.5 rounded-xl border text-left text-xs transition-all ${
                              editingUser.role === 'RESCUE'
                                ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 ring-2 ring-emerald-500/20'
                                : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                            }`}
                          >
                            <span className="font-bold block">🚑 หน่วยกู้ภัย</span>
                            <span className="text-[10px] text-slate-500">ดูเคส เปลี่ยนสถานะ</span>
                          </button>
                        </div>
                      </div>
                    )}

                    <div className="flex gap-2 justify-end pt-3 border-t border-slate-100 dark:border-slate-800">
                      <button
                        type="button"
                        onClick={() => setEditingUser(null)}
                        className="px-4 py-2 rounded-xl text-xs font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                      >
                        ยกเลิก
                      </button>
                      <button
                        type="submit"
                        disabled={isUpdatingUser}
                        className="px-4 py-2 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm transition-all disabled:opacity-50"
                      >
                        {isUpdatingUser ? 'กำลังบันทึก...' : 'บันทึกการแก้ไข'}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}

            {/* Modal for Confirming Delete User */}
            {userToDelete && (
              <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4 z-[9999]">
                <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 max-w-sm w-full border border-slate-200 dark:border-slate-800 shadow-2xl text-center">
                  <div className="w-12 h-12 rounded-full bg-red-100 dark:bg-red-950 text-red-600 flex items-center justify-center mx-auto mb-3 text-xl">
                    ⚠️
                  </div>
                  <h3 className="text-base font-bold text-slate-800 dark:text-slate-100 mb-1">
                    ยืนยันการลบผู้ใช้?
                  </h3>
                  <p className="text-xs text-slate-600 dark:text-slate-400 mb-4">
                    คุณแน่ใจหรือไม่ว่าต้องการลบผู้ใช้ <strong>{userToDelete.name}</strong> ({userToDelete.username}@rtaf.mi.th) ออกจากระบบ?
                  </p>
                  <div className="flex gap-2 justify-center">
                    <button
                      type="button"
                      onClick={() => setUserToDelete(null)}
                      className="px-4 py-2 rounded-xl text-xs font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                    >
                      ยกเลิก
                    </button>
                    <button
                      type="button"
                      disabled={isDeletingUser}
                      onClick={handleDeleteUser}
                      className="px-4 py-2 rounded-xl text-xs font-bold bg-red-600 hover:bg-red-700 text-white shadow-sm transition-all disabled:opacity-50"
                    >
                      {isDeletingUser ? 'กำลังลบ...' : 'ยืนยันลบผู้ใช้'}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Modal for Adding New User */}
            {isAddUserOpen && (
              <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4 z-[9999]">
                <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 max-w-md w-full border border-slate-200 dark:border-slate-800 shadow-2xl">
                  <h3 className="text-base font-bold text-slate-800 dark:text-slate-100 mb-1 flex items-center gap-2">
                    <span>➕</span> เพิ่มชื่อผู้ใช้ Email RTAF และกำหนดหน้าที่
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
                    ผู้ใช้ใหม่จะสามารถเข้าสู่ระบบด้วยชื่อผู้ใช้ Email RTAF ผ่านรหัส OTP ของกองทัพอากาศ (RTAF MFA)
                  </p>

                  <form onSubmit={handleCreateUser} className="space-y-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        ชื่อผู้ใช้ Email RTAF *
                      </label>
                      <div className="relative flex items-center">
                        <input
                          type="text"
                          required
                          value={newUserData.username}
                          onChange={(e) => setNewUserData({ ...newUserData, username: e.target.value })}
                          placeholder="Email RTAF ไม่ต้องใส่ @"
                          className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 text-xs outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                        <span className="absolute right-3 text-[11px] font-mono text-slate-400 pointer-events-none">
                          @rtaf.mi.th
                        </span>
                      </div>
                      <p className="text-[10px] text-slate-400 mt-1">
                        * ไม่ต้องใส่ @rtaf.mi.th เช่น กรอก <code>somchai_k</code>
                      </p>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        ชื่อ-นามสกุล / ชื่อทีม *
                      </label>
                      <input
                        type="text"
                        required
                        value={newUserData.name}
                        onChange={(e) => setNewUserData({ ...newUserData, name: e.target.value })}
                        placeholder="เช่น นายมานะ ใจดี หรือ กู้ภัยมิตรภาพทีม B"
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 text-xs outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        เลือกบทบาท / หน้าที่ *
                      </label>
                      <div className={`grid gap-2 ${['PRIME_ADMIN', 'ADMIN'].includes(currentUser?.role || '') ? 'grid-cols-1 sm:grid-cols-3' : 'grid-cols-2'}`}>
                        {['PRIME_ADMIN', 'ADMIN'].includes(currentUser?.role || '') && (
                          <button
                            type="button"
                            onClick={() => setNewUserData({ ...newUserData, role: 'ADMIN' })}
                            className={`p-2.5 rounded-xl border text-left text-xs transition-all ${
                              newUserData.role === 'ADMIN'
                                ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 ring-2 ring-indigo-500/20'
                                : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                            }`}
                          >
                            <span className="font-bold block">⚙️ แอดมิน</span>
                            <span className="text-[10px] text-slate-500">จัดการเคส, สิทธิ์, ฟีเจอร์</span>
                          </button>
                        )}

                        <button
                          type="button"
                          onClick={() => setNewUserData({ ...newUserData, role: 'DATA_ENTRY' })}
                          className={`p-2.5 rounded-xl border text-left text-xs transition-all ${
                            newUserData.role === 'DATA_ENTRY'
                              ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 ring-2 ring-blue-500/20'
                              : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                          }`}
                        >
                          <span className="font-bold block">📝 ผู้กรอกข้อมูล</span>
                          <span className="text-[10px] text-slate-500">เพิ่มข้อมูล, จัดการสิทธิ์, ลบเคส</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => setNewUserData({ ...newUserData, role: 'RESCUE' })}
                          className={`p-2.5 rounded-xl border text-left text-xs transition-all ${
                            newUserData.role === 'RESCUE'
                              ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 ring-2 ring-emerald-500/20'
                            : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                          }`}
                        >
                          <span className="font-bold block">🚑 หน่วยกู้ภัย</span>
                          <span className="text-[10px] text-slate-500">ดูข้อมูล, เปลี่ยนสถานะ (ห้ามเพิ่ม/ลบ)</span>
                        </button>
                      </div>
                    </div>

                    <div className="flex gap-2 justify-end pt-3 border-t border-slate-100 dark:border-slate-800">
                      <button
                        type="button"
                        onClick={() => setIsAddUserOpen(false)}
                        className="px-4 py-2 rounded-xl text-xs font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                      >
                        ยกเลิก
                      </button>
                      <button
                        type="submit"
                        disabled={isCreatingUser}
                        className="px-4 py-2 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm transition-all disabled:opacity-50"
                      >
                        {isCreatingUser ? 'กำลังบันทึก...' : 'บันทึกผู้ใช้'}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}
          </div>
        )}
      </main>

      {/* Floating Action Button (FAB) for Mobile Quick Add */}
      {currentUser?.role !== 'RESCUE' && (
        <div className="fixed bottom-5 right-5 z-40 sm:hidden">
          <button
            onClick={() => setIsCreateOpen(true)}
            className="w-14 h-14 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-full shadow-2xl flex items-center justify-center text-2xl active:scale-90 transition-transform border-2 border-white dark:border-slate-800"
            title="บันทึกเคสใหม่"
          >
            ➕
          </button>
        </div>
      )}

      {/* Modal: Confirm Cancel (Soft Delete -> Trash) */}
      {caseToCancel && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-[9999] flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl max-w-md w-full p-6 border border-slate-200 dark:border-slate-800 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center gap-3">
              <span className="w-10 h-10 rounded-2xl bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center text-xl shrink-0">
                ⚠️
              </span>
              <div>
                <h3 className="font-bold text-slate-800 dark:text-slate-100 text-base">ยืนยันการยกเลิกเคสนี้?</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">ย้ายไปยังถังขยะรายการลบ</p>
              </div>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed bg-slate-50 dark:bg-slate-800/60 p-3.5 rounded-2xl border border-slate-100 dark:border-slate-800">
              เคสของ <b className="text-slate-800 dark:text-slate-100">{caseToCancel.reporterName}</b> จะถูกย้ายไปยัง{' '}
              <b className="text-rose-600 dark:text-rose-400">ถังขยะ</b> และจะไม่แสดงในหน้ารายการเคสหรือแผนที่หลัก
              แต่ท่านสามารถเข้าไปที่แท็บ <b>&quot;🗑️ ถังขยะ&quot;</b> เพื่อกู้คืนกลับมาได้ตลอดเวลา
            </p>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setCaseToCancel(null)}
                className="px-4 py-2 text-xs font-semibold rounded-xl text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                ย้อนกลับ
              </button>
              <button
                onClick={handleConfirmCancel}
                className="px-5 py-2 text-xs font-bold rounded-xl bg-rose-600 hover:bg-rose-700 text-white shadow-md transition-all active:scale-95"
              >
                ยืนยันย้ายไปถังขยะ
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Confirm Single Permanent Delete */}
      {caseToDeletePermanent && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-[9999] flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl max-w-md w-full p-6 border border-rose-200 dark:border-rose-950 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center gap-3">
              <span className="w-10 h-10 rounded-2xl bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center text-xl shrink-0">
                🚨
              </span>
              <div>
                <h3 className="font-bold text-slate-800 dark:text-slate-100 text-base">ลบเคสนี้ออกจากระบบถาวร?</h3>
                <p className="text-xs text-rose-600 dark:text-rose-400 font-semibold">การกระทำนี้ไม่สามารถย้อนกลับได้</p>
              </div>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed bg-rose-50/50 dark:bg-rose-950/30 p-3.5 rounded-2xl border border-rose-200/50 dark:border-rose-900/50">
              ข้อมูลเคสของ <b className="text-slate-800 dark:text-slate-100">{caseToDeletePermanent.reporterName}</b>{' '}
              จะถูกลบออกจากฐานข้อมูลอย่างถาวรทันที และระบบจะบันทึกประวัติไว้ใน Audit Log
            </p>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setCaseToDeletePermanent(null)}
                disabled={isDeletingPermanent}
                className="px-4 py-2 text-xs font-semibold rounded-xl text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                ยกเลิก
              </button>
              <button
                onClick={handleConfirmPermanentDelete}
                disabled={isDeletingPermanent}
                className="px-5 py-2 text-xs font-bold rounded-xl bg-rose-600 hover:bg-rose-700 text-white shadow-md transition-all active:scale-95 disabled:opacity-50"
              >
                {isDeletingPermanent ? 'กำลังลบ...' : 'ลบเคสถาวร'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Confirm Empty All Trash */}
      {isConfirmEmptyTrash && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-[9999] flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl max-w-md w-full p-6 border border-rose-300 dark:border-rose-900 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center gap-3">
              <span className="w-10 h-10 rounded-2xl bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center text-xl shrink-0">
                🚨
              </span>
              <div>
                <h3 className="font-bold text-slate-800 dark:text-slate-100 text-base">ลบเคสทั้งหมดในถังขยะ?</h3>
                <p className="text-xs text-rose-600 dark:text-rose-400 font-semibold">
                  ทั้งหมด {trashCases.length} รายการจะถูกลบอย่างถาวร
                </p>
              </div>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed bg-rose-50/60 dark:bg-rose-950/30 p-3.5 rounded-2xl border border-rose-200 dark:border-rose-900">
              เคสที่อยู่ในถังขยะทั้งหมดจำนวน <b className="text-rose-600 dark:text-rose-400">{trashCases.length} รายการ</b>{' '}
              จะถูกลบออกจากฐานข้อมูลอย่างถาวรทันที และไม่สามารถกู้คืนกลับมาได้อีก ระบบจะบันทึกประวัติไว้ใน Audit Log
            </p>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setIsConfirmEmptyTrash(false)}
                disabled={isEmptyingTrash}
                className="px-4 py-2 text-xs font-semibold rounded-xl text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                ยกเลิก
              </button>
              <button
                onClick={handleEmptyTrashAll}
                disabled={isEmptyingTrash}
                className="px-5 py-2 text-xs font-bold rounded-xl bg-rose-600 hover:bg-rose-700 text-white shadow-md transition-all active:scale-95 disabled:opacity-50"
              >
                {isEmptyingTrash ? 'กำลังล้างถังขยะ...' : 'ยืนยันล้างทั้งหมด'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Create New Case */}
      {isCreateOpen && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-[9999] flex items-end sm:items-center justify-center p-0 sm:p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 rounded-t-3xl sm:rounded-3xl shadow-2xl max-w-2xl w-full p-5 sm:p-7 max-h-[92vh] sm:max-h-[88vh] overflow-y-auto border border-slate-100 dark:border-slate-800 transition-colors animate-in fade-in slide-in-from-bottom duration-200">
            <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-3 mb-4">
              <div className="flex items-center gap-2">
                <span className="text-xl">➕</span>
                <h2 className="text-base sm:text-lg font-bold text-slate-800 dark:text-slate-100">
                  เจ้าหน้าที่บันทึกรับแจ้งเหตุใหม่
                </h2>
              </div>
              <button
                onClick={() => setIsCreateOpen(false)}
                className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 flex items-center justify-center text-lg font-bold transition-colors"
              >
                &times;
              </button>
            </div>

            {createError && (
              <div className="mb-4 bg-red-50 dark:bg-red-950/50 border-l-4 border-red-500 p-3 rounded-r-xl text-red-700 dark:text-red-300 text-xs">
                {createError}
              </div>
            )}

            <form onSubmit={handleCreateCase} className="space-y-4">
              <div className="grid sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    ชื่อผู้แจ้งเหตุ *
                  </label>
                  <input
                    type="text"
                    required
                    value={newCaseData.reporterName}
                    onChange={(e) => setNewCaseData({ ...newCaseData, reporterName: e.target.value })}
                    className="w-full text-xs p-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                    placeholder="ระบุชื่อผู้แจ้ง / ผู้ประสบภัย"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    เบอร์โทรศัพท์ติดต่อ *
                  </label>
                  <input
                    type="tel"
                    required
                    value={newCaseData.phoneNumber}
                    onChange={(e) => setNewCaseData({ ...newCaseData, phoneNumber: e.target.value })}
                    className="w-full text-xs p-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                    placeholder="08X-XXX-XXXX"
                  />
                </div>
              </div>

              <div className="grid sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    จำนวนคนขอความช่วยเหลือ *
                  </label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={newCaseData.peopleCount}
                    onChange={(e) => setNewCaseData({ ...newCaseData, peopleCount: parseInt(e.target.value) || 1 })}
                    className="w-full text-xs p-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    ระดับความเร่งด่วน
                  </label>
                  <select
                    value={newCaseData.urgency}
                    onChange={(e) => setNewCaseData({ ...newCaseData, urgency: e.target.value as any })}
                    className="w-full text-xs p-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                  >
                    <option value="CRITICAL">🚨 วิกฤต / ฉุกเฉิน (Critical)</option>
                    <option value="HIGH">⚡ ด่วนมาก (High)</option>
                    <option value="MEDIUM">📍 ปกติ (Medium)</option>
                    <option value="LOW">🌱 ต่ำ (Low)</option>
                  </select>
                </div>
              </div>

              {/* Items Needed Checklist */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  สิ่งของที่ต้องการ (เลือกได้หลายข้อ)
                </label>
                <div className="flex flex-wrap gap-2">
                  {availableItems.map((item) => (
                    <button
                      key={item}
                      type="button"
                      onClick={() => {
                        const items = newCaseData.itemsNeeded.includes(item)
                          ? newCaseData.itemsNeeded.filter((i) => i !== item)
                          : [...newCaseData.itemsNeeded, item];
                        setNewCaseData({ ...newCaseData, itemsNeeded: items });
                      }}
                      className={`text-xs px-3 py-1.5 rounded-full border transition-all ${
                        newCaseData.itemsNeeded.includes(item)
                          ? 'bg-blue-600 border-blue-600 text-white shadow-xs'
                          : 'bg-slate-50 dark:bg-slate-800 border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100'
                      }`}
                    >
                      {item}
                    </button>
                  ))}
                </div>
              </div>

              {/* Map Coordinates Picker */}
              <div>
                <div className="flex justify-between items-center mb-1.5">
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                    📍 ระบุพิกัดบนแผนที่ (Map Picker)
                  </label>
                  <span className="text-[11px] font-mono text-slate-500 dark:text-slate-400">
                    {newCaseData.latitude.toFixed(4)}, {newCaseData.longitude.toFixed(4)}
                  </span>
                </div>
                <div className="w-full h-56 sm:h-64 rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800">
                  <MapPicker
                    latitude={newCaseData.latitude}
                    longitude={newCaseData.longitude}
                    onChangeLocation={(lat, lng) =>
                      setNewCaseData((prev) => ({ ...prev, latitude: lat, longitude: lng }))
                    }
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  รายละเอียดที่อยู่ / จุดสังเกต
                </label>
                <input
                  type="text"
                  value={newCaseData.addressDetail}
                  onChange={(e) => setNewCaseData({ ...newCaseData, addressDetail: e.target.value })}
                  className="w-full text-xs p-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                  placeholder="เช่น ซอยคลองอู่ตะเภา 4 บ้านสีฟ้าสองชั้น"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  รายละเอียดเพิ่มเติม
                </label>
                <textarea
                  value={newCaseData.description}
                  onChange={(e) => setNewCaseData({ ...newCaseData, description: e.target.value })}
                  rows={2}
                  className="w-full text-xs p-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                  placeholder="เช่น มีผู้สูงอายุติดอยู่บนชั้นสอง ต้องการความช่วยเหลือด่วน..."
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsCreateOpen(false)}
                  className="px-4 py-2.5 text-xs font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs px-5 py-2.5 rounded-xl shadow-md disabled:bg-slate-300 dark:disabled:bg-slate-700 transition-colors"
                >
                  {isSubmitting ? 'กำลังบันทึก...' : 'บันทึกเคสเข้าระบบ'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Case Detail & Unmask Phone */}
      {selectedCase && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-[9999] flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="bg-white dark:bg-slate-900 rounded-t-3xl sm:rounded-3xl shadow-2xl max-w-lg w-full p-5 sm:p-7 border border-slate-100 dark:border-slate-800 transition-colors animate-in fade-in slide-in-from-bottom duration-200 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-3 mb-4">
              <div className="flex items-center gap-2">
                <span
                  className={`w-3 h-3 rounded-full ${
                    selectedCase.urgency === 'CRITICAL'
                      ? 'bg-rose-500'
                      : selectedCase.urgency === 'HIGH'
                      ? 'bg-orange-500'
                      : selectedCase.urgency === 'MEDIUM'
                      ? 'bg-blue-500'
                      : 'bg-slate-400'
                  }`}
                ></span>
                <h2 className="text-base font-bold text-slate-800 dark:text-slate-100">รายละเอียดเคสช่วยเหลือ</h2>
              </div>
              <button
                onClick={() => setSelectedCase(null)}
                className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 flex items-center justify-center text-lg font-bold transition-colors"
              >
                &times;
              </button>
            </div>

            <div className="space-y-4 text-xs sm:text-sm">
              <div className="p-3 bg-amber-500/10 rounded-2xl border border-amber-500/30 text-amber-800 dark:text-amber-300 text-xs flex items-start gap-2">
                <span className="text-base">⚠️</span>
                <div>
                  <b>บันทึกการเข้าถึงข้อมูลส่วนบุคคล (Audit Log):</b> ระบบได้บันทึกการเปิดดูเบอร์โทรศัพท์เต็มของเคสนี้เพื่อความโปร่งใสและปฏิบัติตาม พ.ร.บ. คุ้มครองข้อมูลส่วนบุคคล
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 p-3 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-100 dark:border-slate-800">
                <div>
                  <p className="text-slate-500 dark:text-slate-400 text-xs">ผู้แจ้งเหตุ</p>
                  <p className="font-bold text-slate-800 dark:text-slate-100 text-base">{selectedCase.reporterName}</p>
                </div>
                <div>
                  <p className="text-slate-500 dark:text-slate-400 text-xs">เบอร์โทรศัพท์ (Unmasked)</p>
                  <p className="font-bold text-blue-600 dark:text-blue-400 text-base font-mono">
                    {isDetailLoading ? '⏳ กำลังดึงข้อมูล...' : unmaskedPhone || selectedCase.phoneNumber}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-slate-500 dark:text-slate-400 text-xs">จำนวนคนขอความช่วยเหลือ</p>
                  <p className="font-semibold text-slate-800 dark:text-slate-200">👥 {selectedCase.peopleCount} คน</p>
                </div>
                <div>
                  <p className="text-slate-500 dark:text-slate-400 text-xs">ระดับความเร่งด่วน</p>
                  <span
                    className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-bold border mt-0.5 ${
                      getUrgencyBadge(selectedCase.urgency).className
                    }`}
                  >
                    {getUrgencyBadge(selectedCase.urgency).icon} {getUrgencyBadge(selectedCase.urgency).label}
                  </span>
                </div>
              </div>

              {/* Status change buttons inside modal */}
              <div>
                <p className="text-slate-500 dark:text-slate-400 text-xs mb-1.5">เปลี่ยนสถานะเคส</p>
                <div className="flex flex-wrap gap-2">
                  {['PENDING', 'IN_PROGRESS', 'RESOLVED', ...(currentUser?.role !== 'RESCUE' ? ['CANCELLED'] : [])].map((s) => {
                    const sc = getStatusConfig(s);
                    return (
                      <button
                        key={s}
                        onClick={() => handleUpdateStatus(selectedCase.id, s)}
                        className={`text-xs px-3 py-1.5 rounded-full border font-semibold transition-all ${
                          selectedCase.status === s
                            ? sc.badgeClass + ' ring-2 ring-offset-1 ring-blue-500'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-300 dark:border-slate-700 hover:border-slate-400'
                        }`}
                      >
                        {sc.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {(selectedCase.description?.includes('[ข้อมูลแจ้งซ้ำ') || selectedCase.description?.includes('[มีการส่งแจ้งซ้ำ')) && (
                <div className="p-3 bg-amber-50 dark:bg-amber-950/60 border border-amber-300 dark:border-amber-800 rounded-xl text-amber-800 dark:text-amber-200 text-xs flex items-start gap-2">
                  <span>⚠️</span>
                  <div>
                    <strong>มีการแจ้งขอความช่วยเหลือซ้ำ:</strong> ระบบได้ตรวจจับและรวมข้อมูลแจ้งซ้ำของผู้ประสบภัยไว้ในบันทึกรายละเอียดด้านล่าง
                  </div>
                </div>
              )}

              <div>
                <p className="text-slate-500 dark:text-slate-400 text-xs mb-1">สิ่งของที่ต้องการ</p>
                <div className="flex flex-wrap gap-1.5">
                  {selectedCase.itemsNeeded?.length ? (
                    selectedCase.itemsNeeded.map((item, idx) => (
                      <span
                        key={idx}
                        className="bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200/50 dark:border-blue-800/50 text-xs px-2.5 py-1 rounded-lg font-medium"
                      >
                        {item}
                      </span>
                    ))
                  ) : (
                    <span className="text-slate-400 text-xs">-</span>
                  )}
                </div>
              </div>

              <div>
                <p className="text-slate-500 dark:text-slate-400 text-xs">สถานที่ / จุดสังเกต</p>
                <p className="text-slate-700 dark:text-slate-200 font-medium">{selectedCase.addressDetail || '-'}</p>
              </div>

              <div>
                <p className="text-slate-500 dark:text-slate-400 text-xs">พิกัด GPS</p>
                <p className="font-mono text-slate-700 dark:text-slate-300 text-xs">
                  {selectedCase.latitude}, {selectedCase.longitude}
                </p>
              </div>

              {selectedCase.description && (
                <div>
                  <p className="text-slate-500 dark:text-slate-400 text-xs mb-1">รายละเอียดเพิ่มเติม</p>
                  <p className="text-slate-700 dark:text-slate-200 bg-slate-50 dark:bg-slate-800/80 p-3 rounded-xl border border-slate-200 dark:border-slate-700">
                    {selectedCase.description}
                  </p>
                </div>
              )}

              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center gap-2">
                <button
                  onClick={() => {
                    setSelectedCase(null);
                    handleFocusOnMap(selectedCase);
                  }}
                  className="text-xs text-blue-600 dark:text-blue-400 hover:underline font-medium flex items-center gap-1"
                >
                  🗺️ ดูตำแหน่งบนแผนที่
                </button>
                <button
                  onClick={() => setSelectedCase(null)}
                  className="bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold px-5 py-2.5 rounded-xl transition-colors"
                >
                  ปิดหน้าต่าง
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Alert & Screen Shake Settings */}
      {isAlertSettingsOpen && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-[9999] flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl max-w-md w-full p-6 border border-slate-200 dark:border-slate-800 space-y-5 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2.5">
                <span className="w-10 h-10 rounded-2xl bg-red-100 dark:bg-red-950/60 text-red-600 dark:text-red-400 flex items-center justify-center text-xl shrink-0">
                  🔔
                </span>
                <div>
                  <h3 className="font-bold text-slate-800 dark:text-slate-100 text-base">
                    ตั้งค่าระบบแจ้งเตือนเคสวิกฤต
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    กำหนดการแสดงการ์ดมุมบนขวา และการสั่นหน้าจอ
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsAlertSettingsOpen(false)}
                className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 flex items-center justify-center text-lg font-bold transition-colors"
              >
                &times;
              </button>
            </div>

            <div className="space-y-4">
              {/* Toggle 1: Show Alert Card */}
              <div className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60">
                <div className="pr-3">
                  <p className="text-xs font-bold text-slate-800 dark:text-slate-100">
                    แสดงการ์ดแจ้งเตือนสีแดงมุมบนขวา
                  </p>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                    แสดงแถบป๊อปอัปแจ้งเตือนเคสวิกฤตที่เข้ามาใหม่
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => updateAlertConfig({ showAlertCard: !alertConfig.showAlertCard })}
                  className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                    alertConfig.showAlertCard ? 'bg-red-600' : 'bg-slate-300 dark:bg-slate-700'
                  }`}
                >
                  <span
                    className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                      alertConfig.showAlertCard ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>

              {/* Toggle 2: Enable Screen Shake */}
              <div className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60">
                <div className="pr-3">
                  <p className="text-xs font-bold text-slate-800 dark:text-slate-100">
                    เขย่าหน้าจอเมื่อมีเคสวิกฤต (Screen Shake)
                  </p>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                    สั่นหน้าจอ Dashboard เพื่อเรียกความสนใจเจ้าหน้าที่
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => updateAlertConfig({ enableShake: !alertConfig.enableShake })}
                  className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                    alertConfig.enableShake ? 'bg-red-600' : 'bg-slate-300 dark:bg-slate-700'
                  }`}
                >
                  <span
                    className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                      alertConfig.enableShake ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>

              {/* Toggle 3: Sound Bell Alert */}
              <div className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60">
                <div className="pr-3">
                  <p className="text-xs font-bold text-slate-800 dark:text-slate-100 flex items-center gap-1.5">
                    <span>🔔</span> เสียงกริ่งแจ้งเตือนฉุกเฉิน (Emergency Bell Sound)
                  </p>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                    ส่งเสียงกริ่งแจ้งเตือนตามระยะเวลาที่เขย่าหน้าจอ
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => updateAlertConfig({ enableSound: alertConfig.enableSound === false ? true : false })}
                  className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                    alertConfig.enableSound !== false ? 'bg-red-600' : 'bg-slate-300 dark:bg-slate-700'
                  }`}
                >
                  <span
                    className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                      alertConfig.enableSound !== false ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>

              {/* Slider 3: Shake & Sound Duration */}
              <div
                className={`p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 space-y-2 transition-opacity ${
                  alertConfig.enableShake ? 'opacity-100' : 'opacity-40 pointer-events-none'
                }`}
              >
                <div className="flex justify-between items-center text-xs">
                  <span className="font-bold text-slate-800 dark:text-slate-100">
                    ระยะเวลาการสั่นหน้าจอ &amp; เสียงกริ่ง
                  </span>
                  <span className="font-extrabold text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/50 px-2 py-0.5 rounded-lg border border-red-200 dark:border-red-900">
                    {alertConfig.shakeDuration} วินาที
                  </span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="15"
                  step="1"
                  value={alertConfig.shakeDuration}
                  onChange={(e) => updateAlertConfig({ shakeDuration: Number(e.target.value) || 1 })}
                  className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-red-600"
                />
                <div className="flex justify-between text-[10px] text-slate-400">
                  <span>1 วินาที</span>
                  <span>5 วินาที (ค่าเริ่มต้น)</span>
                  <span>15 วินาที</span>
                </div>
              </div>

              {/* Test Button */}
              <button
                type="button"
                onClick={handleTestAlert}
                className="w-full py-2.5 px-4 rounded-xl text-xs font-bold bg-amber-500 hover:bg-amber-600 text-white shadow-sm transition-all flex items-center justify-center gap-2 active:scale-98"
              >
                <span>⚡</span>
                <span>ทดสอบการแจ้งเตือน เสียงกริ่ง และการสั่น (จำลอง 1 เคส)</span>
              </button>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="button"
                onClick={() => setIsAlertSettingsOpen(false)}
                className="px-5 py-2 text-xs font-bold rounded-xl bg-slate-900 hover:bg-slate-800 text-white dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-white transition-all shadow-sm"
              >
                เสร็จสิ้น
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
