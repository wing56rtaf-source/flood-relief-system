'use client';

import React, { useEffect, useRef } from 'react';

const DEFAULT_LAT = 7.0076;
const DEFAULT_LNG = 100.4712; // Hat Yai center

export interface PublicCaseItem {
  id: string;
  reporterName: string;
  peopleCount: number;
  urgency: string;
  status: string;
  latitude: number;
  longitude: number;
  addressDetail?: string;
  itemsNeeded?: string[];
  createdAt: string;
}

interface PublicMapProps {
  cases: PublicCaseItem[];
}

export default function PublicMap({ cases = [] }: PublicMapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const leafletLibRef = useRef<any>(null);

  const statusLabel: Record<string, string> = {
    PENDING: '⏳ รอดำเนินการ',
    IN_PROGRESS: '🚤 กำลังช่วยเหลือ',
    RESOLVED: '✅ ช่วยเหลือแล้ว',
  };

  const statusColor: Record<string, string> = {
    PENDING: '#d97706',
    IN_PROGRESS: '#2563eb',
    RESOLVED: '#059669',
  };

  const fitBoundsToCases = (L: any, map: any, caseList: PublicCaseItem[]) => {
    if (!map || !L || !caseList || caseList.length === 0) return;
    const validCoords = caseList
      .filter((c) => !isNaN(Number(c.latitude)) && !isNaN(Number(c.longitude)))
      .map((c) => [Number(c.latitude), Number(c.longitude)] as [number, number]);

    if (validCoords.length > 0) {
      try {
        const bounds = L.latLngBounds(validCoords);
        map.fitBounds(bounds, { padding: [40, 40], maxZoom: 16 });
      } catch (e) {
        console.warn('fitBounds error:', e);
      }
    }
  };

  useEffect(() => {
    let isMounted = true;

    async function initMap() {
      if (!mapContainerRef.current) return;
      const L = await import('leaflet');
      leafletLibRef.current = L;

      delete (L.Icon.Default.prototype as any)._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
        iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
        shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
      });

      if (!mapInstanceRef.current && mapContainerRef.current) {
        const map = L.map(mapContainerRef.current, {
          center: [DEFAULT_LAT, DEFAULT_LNG],
          zoom: 13,
          scrollWheelZoom: true,
        });

        mapInstanceRef.current = map;

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
          maxZoom: 19,
        }).addTo(map);

        const markersGroup = L.layerGroup().addTo(map);

        // Render public pins
        if (cases && cases.length > 0) {
          cases.forEach((c) => {
            const lat = Number(c.latitude);
            const lng = Number(c.longitude);
            if (isNaN(lat) || isNaN(lng)) return;

            const isCritical = c.urgency === 'CRITICAL';
            const isHigh = c.urgency === 'HIGH';
            const markerColor = isCritical ? '#e11d48' : isHigh ? '#ea580c' : '#2563eb';

            const urgencyLabel =
              c.urgency === 'CRITICAL'
                ? '🚨 วิกฤต'
                : c.urgency === 'HIGH'
                ? '⚡ ด่วนมาก'
                : c.urgency === 'MEDIUM'
                ? '📍 ปกติ'
                : '🌱 ต่ำ';

            const curStatus = statusLabel[c.status] || c.status;
            const curColor = statusColor[c.status] || '#64748b';

            const pinIcon = L.divIcon({
              className: 'public-case-marker',
              html: `
                <div style="position: relative; width: 32px; height: 32px; display: flex; align-items: center; justify-content: center; cursor: pointer;">
                  ${
                    isCritical
                      ? '<div style="position: absolute; width: 36px; height: 36px; border-radius: 50%; background: rgba(225, 29, 72, 0.45); animation: pulse 1.5s infinite;"></div>'
                      : ''
                  }
                  <div style="width: 26px; height: 26px; border-radius: 50% 50% 50% 0; background: ${markerColor}; transform: rotate(-45deg); border: 2px solid #ffffff; box-shadow: 0 3px 8px rgba(0,0,0,0.3); display: flex; align-items: center; justify-content: center;">
                    <span style="transform: rotate(45deg); color: white; font-size: 11px; font-weight: bold;">
                      ${isCritical ? '🚨' : isHigh ? '⚡' : '📍'}
                    </span>
                  </div>
                </div>
              `,
              iconSize: [32, 32],
              iconAnchor: [16, 32],
              popupAnchor: [0, -32],
            });

            const marker = L.marker([lat, lng], { icon: pinIcon });

            const itemsHtml =
              Array.isArray(c.itemsNeeded) && c.itemsNeeded.length > 0
                ? `<div style="display: flex; flex-wrap: wrap; gap: 3px; margin: 6px 0 2px 0;">
                    ${c.itemsNeeded
                      .map(
                        (item) =>
                          `<span style="background: #eff6ff; color: #1d4ed8; font-size: 10px; padding: 2px 6px; border-radius: 4px; border: 1px solid #bfdbfe;">${item}</span>`
                      )
                      .join('')}
                   </div>`
                : '';

            const popupContent = `
              <div style="font-family: 'Prompt', sans-serif; min-width: 210px; max-width: 260px; padding: 2px;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px; gap: 8px;">
                  <span style="font-size: 10px; font-weight: 700; padding: 2px 7px; border-radius: 9999px; background: ${markerColor}18; color: ${markerColor}; border: 1px solid ${markerColor}33;">
                    ${urgencyLabel}
                  </span>
                  <span style="font-size: 10px; font-weight: 600; color: ${curColor};">
                    ${curStatus}
                  </span>
                </div>
                <h4 style="font-weight: bold; font-size: 13px; margin: 0 0 3px 0; color: #1e293b;">
                  ${c.reporterName}
                </h4>
                <p style="font-size: 11px; color: #475569; margin: 0 0 3px 0;">
                  👥 ขอความช่วยเหลือ: <b>${c.peopleCount || 1} คน</b>
                </p>
                ${
                  c.addressDetail
                    ? `<p style="font-size: 11px; color: #64748b; margin: 0 0 4px 0; line-height: 1.35;">📍 ${c.addressDetail}</p>`
                    : ''
                }
                ${itemsHtml}
                <div style="margin-top: 6px; padding-top: 4px; border-top: 1px dashed #e2e8f0; font-size: 9px; color: #94a3b8; text-align: center;">
                  🔒 ข้อมูลส่วนบุคคลได้รับการคุ้มครอง
                </div>
              </div>
            `;

            marker.bindPopup(popupContent, { maxWidth: 280 });
            markersGroup.addLayer(marker);
          });

          fitBoundsToCases(L, map, cases);
        }

        setTimeout(() => {
          if (isMounted && mapInstanceRef.current) {
            mapInstanceRef.current.invalidateSize();
          }
        }, 200);
      }
    }

    initMap();

    return () => {
      isMounted = false;
      if (mapInstanceRef.current) {
        try {
          mapInstanceRef.current.remove();
        } catch {}
        mapInstanceRef.current = null;
      }
    };
  }, [cases]);

  const handleResetHatYai = () => {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.setView([DEFAULT_LAT, DEFAULT_LNG], 13);
    }
  };

  const handleFitAll = () => {
    if (mapInstanceRef.current && leafletLibRef.current) {
      fitBoundsToCases(leafletLibRef.current, mapInstanceRef.current, cases);
    }
  };

  return (
    <div className="relative w-full h-[380px] sm:h-[460px] md:h-[500px] rounded-3xl overflow-hidden border border-slate-200 dark:border-slate-800 shadow-xl bg-slate-100 dark:bg-slate-900">
      <div ref={mapContainerRef} className="w-full h-full" />

      {/* Floating Controls */}
      <div className="absolute top-3 right-3 flex flex-col gap-1.5 z-[1000]">
        <button
          type="button"
          onClick={handleResetHatYai}
          className="bg-white/95 hover:bg-white dark:bg-slate-800/95 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-100 text-xs font-semibold px-3 py-1.5 rounded-xl shadow-md border border-slate-200 dark:border-slate-700 backdrop-blur-sm transition-all flex items-center gap-1.5"
          title="ศูนย์กลางหาดใหญ่"
        >
          <span>🎯</span> ศูนย์กลางหาดใหญ่
        </button>
        {cases.length > 0 && (
          <button
            type="button"
            onClick={handleFitAll}
            className="bg-blue-600/95 hover:bg-blue-600 text-white text-xs font-semibold px-3 py-1.5 rounded-xl shadow-md backdrop-blur-sm transition-all flex items-center gap-1.5"
            title="ปรับพอดีทุกจุด"
          >
            <span>🗺️</span> ปรับพอดีทุกจุด ({cases.length})
          </button>
        )}
      </div>

      {/* Legend Badge */}
      <div className="absolute bottom-3 left-3 bg-white/95 dark:bg-slate-800/95 backdrop-blur-sm px-3 py-1.5 rounded-xl text-[11px] font-medium text-slate-700 dark:text-slate-300 shadow-md border border-slate-200 dark:border-slate-700 z-[1000] flex items-center gap-2.5">
        <span className="flex items-center gap-1">
          <span className="w-2.5 h-2.5 rounded-full bg-rose-600 inline-block"></span> วิกฤต
        </span>
        <span className="flex items-center gap-1">
          <span className="w-2.5 h-2.5 rounded-full bg-orange-500 inline-block"></span> ด่วนมาก
        </span>
        <span className="flex items-center gap-1">
          <span className="w-2.5 h-2.5 rounded-full bg-blue-600 inline-block"></span> ปกติ
        </span>
      </div>
    </div>
  );
}
