'use client';

import React, { useEffect, useRef } from 'react';

const DEFAULT_LAT = 6.936108289854234;
const DEFAULT_LNG = 100.41659201221182;

interface CaseItem {
  id: string;
  reporterName: string;
  phoneNumber?: string;
  peopleCount?: number;
  latitude: number;
  longitude: number;
  urgency: string;
  status: string;
  addressDetail?: string;
  itemsNeeded?: string[];
  description?: string;
}

interface MapPickerProps {
  latitude: number;
  longitude: number;
  onChangeLocation?: (lat: number, lng: number) => void;
  cases?: CaseItem[];
  readOnly?: boolean;
  onSelectCase?: (caseItem: any) => void | Promise<void>;
  onStatusChange?: (caseId: string, newStatus: string) => void;
  onDeleteCase?: (caseItem: any) => void;
  canDeleteCase?: boolean;
  focusedCaseId?: string | null;
  onFocusHandled?: () => void;
  isActive?: boolean;
}

export default function MapPicker({
  latitude,
  longitude,
  onChangeLocation,
  cases = [],
  readOnly = false,
  onSelectCase,
  onStatusChange,
  onDeleteCase,
  canDeleteCase = false,
  focusedCaseId,
  onFocusHandled,
  isActive = true,
}: MapPickerProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const activeMarkerRef = useRef<any>(null);
  const caseMarkersGroupRef = useRef<any>(null);
  const beaconLayerRef = useRef<any>(null);
  const leafletLibRef = useRef<any>(null);
  const markerMapRef = useRef<Map<string, any>>(new Map());
  const recentlyFocusedRef = useRef<boolean>(false);

  // Status labels & colors for popup
  const statusLabel: Record<string, string> = {
    PENDING: '⏳ รอดำเนินการ',
    IN_PROGRESS: '🚤 กำลังช่วย',
    RESOLVED: '✅ ช่วยแล้ว',
    CANCELLED: '❌ ยกเลิก',
  };

  const statusColor: Record<string, string> = {
    PENDING: '#d97706',
    IN_PROGRESS: '#2563eb',
    RESOLVED: '#059669',
    CANCELLED: '#6b7280',
  };

  // Helper to safely render all case pins on the map
  const renderMarkers = (L: any, map: any, caseList: CaseItem[]) => {
    if (!caseMarkersGroupRef.current) return;
    caseMarkersGroupRef.current.clearLayers();
    markerMapRef.current.clear();

    if (!caseList || caseList.length === 0) return;

    caseList.forEach((c) => {
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

      const currentStatusLabel = statusLabel[c.status] || c.status;
      const currentStatusColor = statusColor[c.status] || '#6b7280';

      // Custom Pin HTML Icon
      const pinIcon = L.divIcon({
        className: 'custom-case-marker',
        html: `
          <div style="position: relative; width: 34px; height: 34px; display: flex; align-items: center; justify-content: center; cursor: pointer;">
            ${
              isCritical
                ? '<div style="position: absolute; width: 38px; height: 38px; border-radius: 50%; background: rgba(225, 29, 72, 0.45); animation: pulse 1.5s infinite;"></div>'
                : ''
            }
            <div style="width: 28px; height: 28px; border-radius: 50% 50% 50% 0; background: ${markerColor}; transform: rotate(-45deg); border: 2.5px solid #ffffff; box-shadow: 0 3px 8px rgba(0,0,0,0.35); display: flex; align-items: center; justify-content: center;">
              <span style="transform: rotate(45deg); color: white; font-size: 12px; font-weight: bold;">
                ${isCritical ? '🚨' : isHigh ? '⚡' : '📍'}
              </span>
            </div>
          </div>
        `,
        iconSize: [34, 34],
        iconAnchor: [17, 34],
        popupAnchor: [0, -36],
      });

      const marker = L.marker([lat, lng], { icon: pinIcon });

      const itemsHtml =
        Array.isArray(c.itemsNeeded) && c.itemsNeeded.length > 0
          ? `<div style="display: flex; flex-wrap: wrap; gap: 3px; margin: 5px 0;">
              ${c.itemsNeeded
                .map(
                  (item) =>
                    `<span style="background: #f1f5f9; color: #334155; font-size: 10px; padding: 2px 6px; border-radius: 4px; border: 1px solid #e2e8f0;">${item}</span>`
                )
                .join('')}
             </div>`
          : '';

      const statusButtonsHtml = onStatusChange
        ? `<div style="display: flex; gap: 4px; margin-top: 8px; flex-wrap: wrap;">
            ${['PENDING', 'IN_PROGRESS', 'RESOLVED']
              .filter((s) => s !== c.status)
              .map(
                (s) =>
                  `<button
                    data-case-id="${c.id}"
                    data-new-status="${s}"
                    class="map-status-change-btn"
                    style="flex: 1; min-width: 70px; padding: 4px 6px; background: ${statusColor[s]}18; color: ${statusColor[s]}; border: 1px solid ${statusColor[s]}44; border-radius: 8px; font-size: 10px; font-weight: 600; cursor: pointer; transition: all 0.15s; white-space: nowrap;"
                  >${statusLabel[s]}</button>`
              )
              .join('')}
           </div>`
        : '';

      const popupContent = `
        <div style="font-family: 'Prompt', sans-serif; min-width: 220px; max-width: 280px; padding: 2px;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px; gap: 8px;">
            <span style="font-size: 10px; font-weight: 700; padding: 2px 8px; border-radius: 9999px; background: ${markerColor}18; color: ${markerColor}; border: 1px solid ${markerColor}33; white-space: nowrap;">
              ${urgencyLabel}
            </span>
            <span style="font-size: 10px; font-weight: 600; color: ${currentStatusColor}; white-space: nowrap; flex-shrink: 0;">
              ${currentStatusLabel}
            </span>
          </div>
          <h4 style="font-weight: bold; font-size: 14px; margin: 0 0 4px 0; color: #1e293b; line-height: 1.3;">
            ${c.reporterName}
          </h4>
          <p style="font-size: 12px; color: #475569; margin: 0 0 3px 0;">
            👥 ขอความช่วยเหลือ: <b>${c.peopleCount || 1} คน</b>
          </p>
          ${c.addressDetail ? `<p style="font-size: 11px; color: #64748b; margin: 0 0 5px 0; line-height: 1.4;">📍 ${c.addressDetail}</p>` : ''}
          ${itemsHtml}
          ${statusButtonsHtml}
          ${
            onSelectCase
              ? `<button id="map-detail-btn-${c.id}" style="width: 100%; margin-top: 8px; padding: 7px 12px; background: #2563eb; color: white; border: none; border-radius: 8px; font-size: 11px; font-weight: 600; cursor: pointer;">
                  🔓 ดูรายละเอียด / เบอร์เต็ม →
                 </button>`
              : ''
          }
          ${
            canDeleteCase && onDeleteCase
              ? `<button id="map-delete-btn-${c.id}" style="width: 100%; margin-top: 6px; padding: 6px 12px; background: #fee2e2; color: #dc2626; border: 1px solid #fecaca; border-radius: 8px; font-size: 11px; font-weight: 600; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 4px;">
                  🗑️ ลบเคสนี้
                 </button>`
              : ''
          }
        </div>
      `;

      marker.bindPopup(popupContent, { maxWidth: 300 });

      marker.on('popupopen', () => {
        if (onSelectCase) {
          const detailBtn = document.getElementById(`map-detail-btn-${c.id}`);
          if (detailBtn) {
            detailBtn.onclick = (e) => {
              e.stopPropagation();
              onSelectCase(c);
            };
          }
        }

        if (canDeleteCase && onDeleteCase) {
          const deleteBtn = document.getElementById(`map-delete-btn-${c.id}`);
          if (deleteBtn) {
            deleteBtn.onclick = (e) => {
              e.stopPropagation();
              try {
                marker.closePopup();
              } catch {}
              onDeleteCase(c);
            };
          }
        }

        if (onStatusChange) {
          const statusBtns = document.querySelectorAll<HTMLButtonElement>(
            `.map-status-change-btn[data-case-id="${c.id}"]`
          );
          statusBtns.forEach((btn) => {
            btn.onclick = (e) => {
              e.stopPropagation();
              const newStatus = btn.getAttribute('data-new-status');
              if (newStatus) {
                onStatusChange(c.id, newStatus);
                try {
                  marker.closePopup();
                } catch {}
              }
            };
          });
        }
      });

      caseMarkersGroupRef.current.addLayer(marker);
      markerMapRef.current.set(c.id, { marker, lat, lng });
    });
  };

  // Safe bounds fitter
  const fitBoundsToCases = (L: any, map: any, caseList: CaseItem[]) => {
    if (!map || !L || !caseList || caseList.length === 0) return;
    if (focusedCaseId || recentlyFocusedRef.current) return;
    const validCoords = caseList
      .filter((c) => !isNaN(Number(c.latitude)) && !isNaN(Number(c.longitude)))
      .map((c) => [Number(c.latitude), Number(c.longitude)] as [number, number]);

    if (validCoords.length > 0) {
      try {
        const bounds = L.latLngBounds(validCoords);
        map.fitBounds(bounds, { padding: [50, 50], maxZoom: 16 });
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

      // Fix default icons
      delete (L.Icon.Default.prototype as any)._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
        iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
        shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
      });

      if (!mapInstanceRef.current && mapContainerRef.current) {
        const startLat = latitude || DEFAULT_LAT;
        const startLng = longitude || DEFAULT_LNG;

        const map = L.map(mapContainerRef.current, {
          center: [startLat, startLng],
          zoom: 14,
          scrollWheelZoom: true,
        });

        mapInstanceRef.current = map;

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
          maxZoom: 19,
        }).addTo(map);

        // Layer group for all case markers
        const markersGroup = L.layerGroup().addTo(map);
        caseMarkersGroupRef.current = markersGroup;

        // Layer group for glowing highlight beacon
        const beaconGroup = L.layerGroup().addTo(map);
        beaconLayerRef.current = beaconGroup;

        // Render markers initially
        if (cases && cases.length > 0) {
          renderMarkers(L, map, cases);
          if (!focusedCaseId) {
            fitBoundsToCases(L, map, cases);
          }
        }

        if (!readOnly) {
          const activePinIcon = L.divIcon({
            className: 'custom-active-picker-pin',
            html: `
              <div style="position: relative; width: 36px; height: 36px; display: flex; align-items: center; justify-content: center;">
                <div style="width: 30px; height: 30px; border-radius: 50% 50% 50% 0; background: #059669; transform: rotate(-45deg); border: 3px solid #ffffff; box-shadow: 0 4px 10px rgba(0,0,0,0.4); display: flex; align-items: center; justify-content: center;">
                  <span style="transform: rotate(45deg); color: white; font-size: 14px;">📍</span>
                </div>
              </div>
            `,
            iconSize: [36, 36],
            iconAnchor: [18, 36],
          });

          const marker = L.marker([startLat, startLng], {
            draggable: true,
            icon: activePinIcon,
          }).addTo(map);
          activeMarkerRef.current = marker;

          marker.on('dragend', () => {
            const pos = marker.getLatLng();
            if (onChangeLocation) onChangeLocation(pos.lat, pos.lng);
          });

          map.on('click', (e: any) => {
            marker.setLatLng(e.latlng);
            if (onChangeLocation) onChangeLocation(e.latlng.lat, e.latlng.lng);
          });
        }

        // Recalculate container dimensions safely
        setTimeout(() => {
          if (isMounted && mapInstanceRef.current) {
            try {
              mapInstanceRef.current.invalidateSize();
            } catch {}
          }
        }, 150);
        setTimeout(() => {
          if (isMounted && mapInstanceRef.current) {
            try {
              mapInstanceRef.current.invalidateSize();
            } catch {}
          }
        }, 400);
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
  }, []);

  // When tab becomes active, invalidate map size smoothly to avoid Leaflet positioning glitches
  useEffect(() => {
    if (isActive && mapInstanceRef.current) {
      setTimeout(() => {
        try {
          mapInstanceRef.current?.invalidateSize();
        } catch {}
      }, 50);
      setTimeout(() => {
        try {
          mapInstanceRef.current?.invalidateSize();
        } catch {}
      }, 250);
    }
  }, [isActive]);

  // Sync active marker if external latitude/longitude changes (create form)
  useEffect(() => {
    if (activeMarkerRef.current && mapInstanceRef.current && !readOnly) {
      activeMarkerRef.current.setLatLng([latitude, longitude]);
      try {
        mapInstanceRef.current.panTo([latitude, longitude]);
      } catch {}
    }
  }, [latitude, longitude, readOnly]);

  // Sync cases markers and AUTO-FIT BOUNDS whenever `cases` prop changes (e.g. filter clicked)
  useEffect(() => {
    if (mapInstanceRef.current && caseMarkersGroupRef.current && leafletLibRef.current) {
      renderMarkers(leafletLibRef.current, mapInstanceRef.current, cases);
      // If we are not currently flying to a focused case, fit bounds to the filtered cases
      if (!focusedCaseId) {
        fitBoundsToCases(leafletLibRef.current, mapInstanceRef.current, cases);
      }
    }
  }, [cases]);

  // Handle focusedCaseId with GLOWING HIGHLIGHT BEACON and safe flyTo
  useEffect(() => {
    if (!focusedCaseId || !mapInstanceRef.current || !leafletLibRef.current) return;

    recentlyFocusedRef.current = true;
    const map = mapInstanceRef.current;
    const L = leafletLibRef.current;

    // Invalidate size first to prevent `_leaflet_pos` errors
    try {
      map.invalidateSize();
    } catch {}

    const timer = setTimeout(() => {
      const entry = markerMapRef.current.get(focusedCaseId);
      if (!entry) return;

      // 1. Show glowing pulsing beacon behind/around the marker
      if (beaconLayerRef.current) {
        beaconLayerRef.current.clearLayers();

        const beaconIcon = L.divIcon({
          className: 'case-focus-beacon-wrapper',
          html: `<div class="focus-beacon-gold"></div>`,
          iconSize: [50, 50],
          iconAnchor: [25, 25],
        });

        const beaconMarker = L.marker([entry.lat, entry.lng], {
          icon: beaconIcon,
          interactive: false,
          zIndexOffset: -100,
        });

        beaconLayerRef.current.addLayer(beaconMarker);

        // Auto remove beacon after 6 seconds
        setTimeout(() => {
          if (beaconLayerRef.current) {
            beaconLayerRef.current.removeLayer(beaconMarker);
          }
        }, 6000);
      }

      // 2. Fly to marker coordinates safely with crisp street-level zoom (17)
      try {
        map.flyTo([entry.lat, entry.lng], 17, { animate: true, duration: 0.85 });
      } catch {
        map.setView([entry.lat, entry.lng], 17);
      }

      // 3. Open marker popup safely after fly animation completes
      setTimeout(() => {
        try {
          if (entry.marker && mapInstanceRef.current) {
            entry.marker.openPopup();
          }
        } catch (err) {
          console.warn('Popup open error:', err);
        }
        if (onFocusHandled) {
          onFocusHandled();
        }
      }, 800);

      // Keep recentlyFocusedRef true for 4 seconds so fitBounds cannot override the zoom
      setTimeout(() => {
        recentlyFocusedRef.current = false;
      }, 4000);
    }, 120);

    return () => clearTimeout(timer);
  }, [focusedCaseId]);

  // Helper buttons
  const handleResetToHatYai = () => {
    if (mapInstanceRef.current) {
      try {
        mapInstanceRef.current.setView([DEFAULT_LAT, DEFAULT_LNG], 14);
        if (!readOnly && activeMarkerRef.current && onChangeLocation) {
          activeMarkerRef.current.setLatLng([DEFAULT_LAT, DEFAULT_LNG]);
          onChangeLocation(DEFAULT_LAT, DEFAULT_LNG);
        }
      } catch {}
    }
  };

  const handleFitAllCases = () => {
    if (!mapInstanceRef.current || !leafletLibRef.current) return;
    fitBoundsToCases(leafletLibRef.current, mapInstanceRef.current, cases);
  };

  return (
    <div className="relative w-full h-full min-h-[350px] rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 shadow-inner bg-slate-100 dark:bg-slate-900">
      <div ref={mapContainerRef} className="w-full h-full" style={{ minHeight: '350px' }} />

      {/* Floating Map Controls */}
      <div className="absolute top-3 right-3 flex flex-col gap-2 z-[1000]">
        <button
          type="button"
          onClick={handleResetToHatYai}
          className="bg-white/95 hover:bg-white dark:bg-slate-800/95 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-100 text-xs font-semibold px-3 py-1.5 rounded-lg shadow-md border border-slate-200 dark:border-slate-700 backdrop-blur-sm transition-all flex items-center gap-1.5"
          title="ย้ายมุมมองไปที่จุดเริ่มต้น (หาดใหญ่)"
        >
          <span>🎯</span> จุดเริ่มต้น (หาดใหญ่)
        </button>

        {cases && cases.length > 0 && (
          <button
            type="button"
            onClick={handleFitAllCases}
            className="bg-blue-600/90 hover:bg-blue-600 text-white text-xs font-semibold px-3 py-1.5 rounded-lg shadow-md backdrop-blur-sm transition-all flex items-center gap-1.5"
            title="ปรับมุมมองให้เห็นทุกเคสที่แสดงอยู่"
          >
            <span>🗺️</span> ปรับพอดีเคส ({cases.length})
          </button>
        )}
      </div>

      {!readOnly && (
        <div className="absolute bottom-3 left-3 bg-white/95 dark:bg-slate-800/95 backdrop-blur-sm px-3 py-1.5 rounded-lg text-xs font-medium text-slate-700 dark:text-slate-200 shadow-md border border-slate-200 dark:border-slate-700 z-[1000] flex items-center gap-1.5">
          <span>📍</span> คลิกบนแผนที่หรือลากหมุดสีเขียวเพื่อเลือกพิกัด
        </div>
      )}
    </div>
  );
}
