import { NextRequest, NextResponse } from 'next/server';
import { searchLocalLandmarks, HATYAI_BOUNDING_BOX } from '@/lib/landmarks-hatyai';

export const dynamic = 'force-dynamic';

export interface GeocodeResultItem {
  id: string;
  name: string;
  displayName: string;
  latitude: number;
  longitude: number;
  source: 'LOCAL_DICT' | 'GEOCODER';
  category?: string;
  subdistrict?: string;
  district?: string;
  province?: string;
}

// In-Memory cache for external geocoder results (5-minute TTL)
interface CacheEntry {
  timestamp: number;
  data: GeocodeResultItem[];
}
const geocodeCache = new Map<string, CacheEntry>();
const CACHE_TTL_MS = 5 * 60 * 1000;

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q')?.trim() || '';

    if (!query || query.length < 1) {
      return NextResponse.json({ results: [] });
    }

    const normalizedQuery = query.toLowerCase();

    // 1. Tier 1: Search Local Hat Yai & Songkhla Landmark Dictionary (Instant < 10ms)
    const localMatches = searchLocalLandmarks(query, 6);
    const results: GeocodeResultItem[] = localMatches.map((item) => ({
      id: `local-${item.id}`,
      name: item.name,
      displayName: `${item.name} (ต.${item.subdistrict} อ.${item.district})`,
      latitude: item.latitude,
      longitude: item.longitude,
      source: 'LOCAL_DICT',
      category: item.category,
      subdistrict: item.subdistrict,
      district: item.district,
      province: item.province,
    }));

    // 2. Check Cache for Tier 2 Geocoder results
    const cached = geocodeCache.get(normalizedQuery);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
      const merged = mergeAndDeduplicate(results, cached.data);
      return NextResponse.json({ results: merged });
    }

    // 3. Tier 2: Call Forward Geocoder (Nominatim) with Hat Yai / Songkhla Viewbox
    // Only call if query has at least 2 characters to avoid noisy requests
    let externalResults: GeocodeResultItem[] = [];

    if (query.length >= 2) {
      try {
        // Viewbox: minLng, maxLat, maxLng, minLat
        const viewbox = `${HATYAI_BOUNDING_BOX.minLng},${HATYAI_BOUNDING_BOX.maxLat},${HATYAI_BOUNDING_BOX.maxLng},${HATYAI_BOUNDING_BOX.minLat}`;
        const searchUrl = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(
          query
        )}&format=json&addressdetails=1&limit=5&countrycodes=th&viewbox=${viewbox}&bounded=0`;

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 2500); // 2.5s timeout

        const response = await fetch(searchUrl, {
          headers: {
            'User-Agent': 'RTAF-Flood-Relief-System-Geocoding/1.0',
            'Accept-Language': 'th,en',
          },
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        if (response.ok) {
          const data = await response.json();
          if (Array.isArray(data)) {
            externalResults = data
              .filter((item: any) => {
                const lat = parseFloat(item.lat);
                const lon = parseFloat(item.lon);
                // Hard boundary filter: Keep only results inside Songkhla & nearby region
                return (
                  !isNaN(lat) &&
                  !isNaN(lon) &&
                  lat >= HATYAI_BOUNDING_BOX.minLat - 0.1 &&
                  lat <= HATYAI_BOUNDING_BOX.maxLat + 0.15 &&
                  lon >= HATYAI_BOUNDING_BOX.minLng - 0.15 &&
                  lon <= HATYAI_BOUNDING_BOX.maxLng + 0.2
                );
              })
              .map((item: any, idx: number) => {
                const lat = parseFloat(item.lat);
                const lon = parseFloat(item.lon);
                const addr = item.address || {};
                const road = addr.road || addr.suburb || addr.neighbourhood || '';
                const subdistrict = addr.subdistrict || addr.quarter || '';
                const city = addr.city || addr.town || addr.district || 'หาดใหญ่';

                return {
                  id: `osm-${item.place_id || idx}`,
                  name: item.name || road || query,
                  displayName: item.display_name,
                  latitude: lat,
                  longitude: lon,
                  source: 'GEOCODER' as const,
                  subdistrict: subdistrict,
                  district: city,
                  province: 'สงขลา',
                };
              });

            // Cache the external results
            geocodeCache.set(normalizedQuery, {
              timestamp: Date.now(),
              data: externalResults,
            });
          }
        }
      } catch (err) {
        // Fail-soft: If Nominatim times out or network is down, local dictionary results still return smoothly!
        console.warn('Geocoding service fallback to local dictionary:', err);
      }
    }

    const finalResults = mergeAndDeduplicate(results, externalResults);
    return NextResponse.json({ results: finalResults });
  } catch (error) {
    console.error('Error in geocode API route:', error);
    return NextResponse.json({ results: [] }, { status: 500 });
  }
}

/**
 * รวมผลลัพธ์และคัดกรองพิกัดที่ซ้ำซ้อนหรือใกล้เคียงกันมากเกินไป (< 50 เมตร)
 */
function mergeAndDeduplicate(
  localList: GeocodeResultItem[],
  externalList: GeocodeResultItem[]
): GeocodeResultItem[] {
  const merged: GeocodeResultItem[] = [...localList];

  for (const ext of externalList) {
    const isDuplicate = merged.some((m) => {
      // Distance estimation in degrees (~0.0005 deg is roughly 55 meters)
      const latDiff = Math.abs(m.latitude - ext.latitude);
      const lngDiff = Math.abs(m.longitude - ext.longitude);
      return latDiff < 0.0005 && lngDiff < 0.0005;
    });

    if (!isDuplicate) {
      merged.push(ext);
    }
  }

  return merged.slice(0, 8);
}
