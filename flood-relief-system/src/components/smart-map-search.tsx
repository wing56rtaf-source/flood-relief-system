'use client';

import React, { useState, useEffect, useRef } from 'react';
import { searchLocalLandmarks, LocalLandmark } from '@/lib/landmarks-hatyai';

interface SearchResult {
  id: string;
  name: string;
  displayName: string;
  latitude: number;
  longitude: number;
  category?: string;
  subdistrict?: string;
  source: 'LOCAL' | 'API';
}

interface SmartMapSearchProps {
  onSelectLocation: (latitude: number, longitude: number, placeName: string) => void;
  placeholder?: string;
  className?: string;
}

const CATEGORY_ICONS: Record<string, string> = {
  UNIVERSITY: '🏛️',
  HOSPITAL: '🏥',
  MALL: '🏬',
  COMMUNITY: '🏘️',
  GOVERNMENT: '🏢',
  TRANSPORT: '🚏',
  FLOOD_RISK: '🌊',
};

const POPULAR_QUICK_CHIPS = [
  { label: 'ม.อ. (108-109)', query: 'ม.อ.', lat: 7.0086, lng: 100.4984 },
  { label: 'ซอย 17 ทุ่งรี', query: 'ทุ่งรี 17', lat: 7.0028, lng: 100.5039 },
  { label: 'ตลาดกิมหยง', query: 'กิมหยง', lat: 7.0069, lng: 100.4705 },
  { label: 'ห้างไดอาน่า', query: 'ไดอาน่า', lat: 6.9996, lng: 100.4828 },
  { label: 'หาดใหญ่ใน (เสี่ยงน้ำท่วม)', query: 'หาดใหญ่ใน', lat: 7.0122, lng: 100.4503 },
  { label: 'ตลาดน้ำคลองแห', query: 'คลองแห', lat: 7.0461, lng: 100.4746 },
];

export default function SmartMapSearch({
  onSelectLocation,
  placeholder = '🔍 ค้นหาคำย่อ / ซอย / แลนด์มาร์ก (เช่น มอ, ทุ่งรี 17, ไดอาน่า, กิมหยง)...',
  className = '',
}: SmartMapSearchProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);

  const containerRef = useRef<HTMLDivElement>(null);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Search logic with instant local dictionary match + debounced API geocoding
  useEffect(() => {
    const query = searchTerm.trim();
    if (!query) {
      setResults([]);
      setIsOpen(false);
      setIsLoading(false);
      return;
    }

    // 1. Instant local dictionary search (< 1ms)
    const localMatches = searchLocalLandmarks(query, 5);
    const instantResults: SearchResult[] = localMatches.map((m) => ({
      id: `local-${m.id}`,
      name: m.name,
      displayName: `${m.name} (ต.${m.subdistrict} อ.${m.district})`,
      latitude: m.latitude,
      longitude: m.longitude,
      category: m.category,
      subdistrict: m.subdistrict,
      source: 'LOCAL',
    }));

    setResults(instantResults);
    setIsOpen(instantResults.length > 0);
    setSelectedIndex(-1);

    // 2. Debounced API search for deeper street / soi / geocoding lookup
    if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);

    debounceTimerRef.current = setTimeout(async () => {
      if (query.length < 2) return;
      setIsLoading(true);

      try {
        const res = await fetch(`/api/geocode?q=${encodeURIComponent(query)}`);
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data.results)) {
            const apiItems: SearchResult[] = data.results.map((r: any) => ({
              id: r.id,
              name: r.name,
              displayName: r.displayName,
              latitude: r.latitude,
              longitude: r.longitude,
              category: r.category,
              subdistrict: r.subdistrict,
              source: r.source === 'LOCAL_DICT' ? 'LOCAL' : 'API',
            }));

            // Merge and avoid duplicate pins
            const combined: SearchResult[] = [...instantResults];
            for (const item of apiItems) {
              const exists = combined.some(
                (c) =>
                  Math.abs(c.latitude - item.latitude) < 0.0005 &&
                  Math.abs(c.longitude - item.longitude) < 0.0005
              );
              if (!exists) {
                combined.push(item);
              }
            }

            setResults(combined.slice(0, 8));
            setIsOpen(combined.length > 0);
          }
        }
      } catch (err) {
        console.warn('Geocode API request failed:', err);
      } finally {
        setIsLoading(false);
      }
    }, 280);

    return () => {
      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    };
  }, [searchTerm]);

  const handleSelect = (item: SearchResult) => {
    setSearchTerm(item.name);
    setIsOpen(false);
    onSelectLocation(item.latitude, item.longitude, item.name);
  };

  const handleChipClick = (chip: (typeof POPULAR_QUICK_CHIPS)[0]) => {
    setSearchTerm(chip.label);
    setIsOpen(false);
    onSelectLocation(chip.lat, chip.lng, chip.label);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen || results.length === 0) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev < results.length - 1 ? prev + 1 : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev > 0 ? prev - 1 : results.length - 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (selectedIndex >= 0 && selectedIndex < results.length) {
        handleSelect(results[selectedIndex]);
      }
    } else if (e.key === 'Escape') {
      setIsOpen(false);
    }
  };

  return (
    <div ref={containerRef} className={`relative z-[1100] ${className}`}>
      {/* Search Bar Input Container */}
      <div className="relative flex items-center bg-white/95 dark:bg-slate-900/95 backdrop-blur-md rounded-xl shadow-lg border border-slate-200 dark:border-slate-700/80 transition-all focus-within:ring-2 focus-within:ring-blue-500/80 focus-within:border-blue-500">
        <span className="pl-3 pr-1 text-slate-400 dark:text-slate-500 text-sm select-none">
          {isLoading ? <span className="animate-spin inline-block">⏳</span> : '📍'}
        </span>

        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          onFocus={() => {
            if (results.length > 0) setIsOpen(true);
          }}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className="w-full py-2 px-2 text-xs font-medium text-slate-800 dark:text-slate-100 bg-transparent placeholder-slate-400 dark:placeholder-slate-500 outline-none"
        />

        {searchTerm && (
          <button
            type="button"
            onClick={() => {
              setSearchTerm('');
              setResults([]);
              setIsOpen(false);
            }}
            className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-xs transition-colors"
            title="ล้างข้อความค้นหา"
          >
            ✕
          </button>
        )}
      </div>

      {/* Quick Landmark Chips (Shows below input) */}
      <div className="flex items-center gap-1.5 mt-1.5 overflow-x-auto no-scrollbar py-0.5 px-0.5">
        <span className="text-[10px] text-slate-500 dark:text-slate-400 font-semibold whitespace-nowrap select-none">
          ด่วน:
        </span>
        {POPULAR_QUICK_CHIPS.map((chip) => (
          <button
            key={chip.label}
            type="button"
            onClick={() => handleChipClick(chip)}
            className="text-[10.5px] px-2 py-0.5 rounded-md bg-white/90 hover:bg-blue-50 dark:bg-slate-800/90 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 hover:text-blue-600 dark:hover:text-blue-400 border border-slate-200/90 dark:border-slate-700 shadow-xs whitespace-nowrap transition-all"
          >
            {chip.label}
          </button>
        ))}
      </div>

      {/* Auto-Suggest Dropdown */}
      {isOpen && results.length > 0 && (
        <div className="absolute left-0 right-0 top-full mt-1.5 max-h-64 overflow-y-auto bg-white/95 dark:bg-slate-900/95 backdrop-blur-md rounded-xl shadow-xl border border-slate-200 dark:border-slate-700 divide-y divide-slate-100 dark:divide-slate-800 animate-in fade-in slide-in-from-top-1 duration-150">
          {results.map((item, index) => {
            const icon = CATEGORY_ICONS[item.category || ''] || (item.source === 'LOCAL' ? '📍' : '🗺️');
            const isSelected = index === selectedIndex;

            return (
              <div
                key={item.id}
                onClick={() => handleSelect(item)}
                onMouseEnter={() => setSelectedIndex(index)}
                className={`p-2.5 cursor-pointer transition-colors flex items-start gap-2.5 text-left ${
                  isSelected
                    ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-900 dark:text-blue-100'
                    : 'hover:bg-slate-50 dark:hover:bg-slate-800/60 text-slate-800 dark:text-slate-200'
                }`}
              >
                <span className="text-base leading-none select-none mt-0.5">{icon}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-xs font-semibold text-slate-900 dark:text-slate-100 truncate">
                      {item.name}
                    </span>
                    {item.source === 'LOCAL' && (
                      <span className="text-[9px] px-1.5 py-0.2 rounded bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 font-medium">
                        จุดสังเกตหาดใหญ่
                      </span>
                    )}
                    {item.category === 'FLOOD_RISK' && (
                      <span className="text-[9px] px-1.5 py-0.2 rounded bg-rose-100 dark:bg-rose-900/40 text-rose-700 dark:text-rose-300 font-medium animate-pulse">
                        จุดเสี่ยงน้ำท่วม
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate mt-0.5">
                    {item.displayName}
                  </p>
                </div>
                <span className="text-[10px] text-slate-400 font-mono whitespace-nowrap select-none mt-1">
                  เลือก ↵
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

