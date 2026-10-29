import { prisma } from './prisma';
import { sanitizeText } from './auth';

/**
 * Calculate distance in meters between two lat/lng coordinates (Haversine formula)
 */
export function calculateDistanceMeters(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371e3; // Earth radius in meters
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return Math.round(R * c);
}

export interface DuplicateCheckParams {
  phoneNumber: string;
  latitude: number;
  longitude: number;
  maxDistanceMeters?: number; // default 100 meters
  maxAgeHours?: number; // default 48 hours
  requireBothPhoneAndLocation?: boolean;
}

/**
 * Check if an active case already exists with the same phone number OR nearby coordinates
 */
export async function findDuplicateActiveCase({
  phoneNumber,
  latitude,
  longitude,
  maxDistanceMeters = 100,
  maxAgeHours = 48,
  requireBothPhoneAndLocation = false,
}: DuplicateCheckParams) {
  const cleanPhone = phoneNumber.replace(/\D/g, '');
  const timeThreshold = new Date(Date.now() - maxAgeHours * 60 * 60 * 1000);

  // 1. First find active cases within the timeframe
  const activeCases = await prisma.reliefCase.findMany({
    where: {
      status: { in: ['PENDING', 'IN_PROGRESS'] },
      createdAt: { gte: timeThreshold },
    },
    orderBy: { createdAt: 'desc' },
  });

  // 2. Check for exact phone match or close proximity match
  for (const item of activeCases) {
    const itemPhone = item.phoneNumber.replace(/\D/g, '');
    const isSamePhone = Boolean(cleanPhone && itemPhone && cleanPhone === itemPhone);

    const distance = calculateDistanceMeters(
      latitude,
      longitude,
      item.latitude,
      item.longitude
    );
    const isNearby = distance <= maxDistanceMeters;

    if (requireBothPhoneAndLocation) {
      if (isSamePhone && isNearby) {
        return {
          matchedCase: item,
          reason: 'SAME_PHONE_AND_LOCATION',
          distanceMeters: distance,
        };
      }
    } else {
      if (isSamePhone || isNearby) {
        return {
          matchedCase: item,
          reason: isSamePhone && isNearby
            ? 'SAME_PHONE_AND_LOCATION'
            : isSamePhone
            ? 'SAME_PHONE'
            : 'NEARBY_LOCATION',
          distanceMeters: distance,
        };
      }
    }
  }

  return null;
}

/**
 * Merge new report details into an existing case instead of creating a clutter duplicate
 */
export async function mergeDuplicateCase({
  existingCaseId,
  reporterName,
  newDescription,
  newItems,
  newUrgency,
  clientIp,
  source = 'PUBLIC',
}: {
  existingCaseId: string;
  reporterName: string;
  newDescription?: string;
  newItems?: string[];
  newUrgency?: string;
  clientIp?: string;
  source?: string;
}) {
  const existing = await prisma.reliefCase.findUnique({
    where: { id: existingCaseId },
  });

  if (!existing) return null;

  // Merge items needed without duplicates
  let currentItems: string[] = [];
  try {
    currentItems = JSON.parse(existing.itemsNeeded || '[]');
  } catch {
    currentItems = [];
  }

  const mergedItems = Array.from(new Set([...currentItems, ...(newItems || [])]));

  // Timestamp for appended notes
  const nowStr = new Date().toLocaleString('th-TH', { timeZone: 'Asia/Bangkok' });
  const appendNote = newDescription?.trim()
    ? `\n\n[ข้อมูลแจ้งซ้ำเพิ่มเติมเมื่อ ${nowStr} โดย ${sanitizeText(reporterName)}]: ${sanitizeText(newDescription.trim())}`
    : `\n\n[มีการส่งแจ้งซ้ำยืนยันความต้องการเมื่อ ${nowStr} โดย ${sanitizeText(reporterName)}]`;

  const updatedDescription = (existing.description || '') + appendNote;

  // Upgrade urgency if new report is more urgent (e.g. CRITICAL > HIGH > MEDIUM > LOW)
  const urgencyWeight: Record<string, number> = { CRITICAL: 4, HIGH: 3, MEDIUM: 2, LOW: 1 };
  const currentWeight = urgencyWeight[existing.urgency] || 2;
  const newWeight = urgencyWeight[newUrgency || ''] || 2;
  const finalUrgency = newWeight > currentWeight ? newUrgency! : existing.urgency;

  const updated = await prisma.reliefCase.update({
    where: { id: existingCaseId },
    data: {
      description: updatedDescription,
      itemsNeeded: JSON.stringify(mergedItems),
      urgency: finalUrgency,
    },
  });

  // Record audit log for duplicate report merged
  await prisma.auditLog.create({
    data: {
      action: 'DUPLICATE_REPORT_MERGED',
      targetId: existingCaseId,
      details: `Merged repeat report from ${source} (${reporterName}). Urgency: ${finalUrgency}`,
      ipAddress: clientIp,
    },
  });

  return updated;
}
