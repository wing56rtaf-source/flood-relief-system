import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'flood_relief_secret_jwt_key_2026_antigravity';

export type UserRole = 'PRIME_ADMIN' | 'DATA_ENTRY' | 'RESCUE' | 'ADMIN' | 'STAFF';

export interface UserSessionPayload {
  userId: string;
  username: string;
  name: string;
  role: UserRole;
}

/**
 * Role Permission Helpers
 */
export function canCreateCase(role: string): boolean {
  return ['PRIME_ADMIN', 'ADMIN', 'DATA_ENTRY', 'STAFF'].includes(role);
}

export function canDeleteCase(role: string): boolean {
  return ['PRIME_ADMIN', 'ADMIN', 'DATA_ENTRY', 'STAFF'].includes(role);
}

export function canManageUsers(role: string): boolean {
  return ['PRIME_ADMIN', 'ADMIN', 'DATA_ENTRY'].includes(role);
}

export function canUpdateStatus(role: string): boolean {
  return ['PRIME_ADMIN', 'ADMIN', 'DATA_ENTRY', 'RESCUE', 'STAFF'].includes(role);
}

/**
 * Hash password using bcrypt with 10 salt rounds (per-user salt)
 */
export async function hashPassword(password: string): Promise<string> {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
}

/**
 * Compare plain password with bcrypt hash
 */
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

/**
 * Mask phone numbers strictly at the backend API layer (e.g. "0811234567" -> "081-XXX-4567")
 */
export function maskPhoneNumber(phone: string): string {
  if (!phone) return '';
  const cleanPhone = phone.replace(/\D/g, '');
  if (cleanPhone.length >= 10) {
    return `${cleanPhone.slice(0, 3)}-XXX-${cleanPhone.slice(-4)}`;
  }
  if (cleanPhone.length >= 9) {
    return `${cleanPhone.slice(0, 2)}-XXX-${cleanPhone.slice(-4)}`;
  }
  return 'XXX-XXX-XXXX';
}

/**
 * Sanitize plain text to prevent stored XSS injection
 */
export function sanitizeText(str: string): string {
  if (!str) return '';
  return str.replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

/**
 * Generate a cryptographically signed session token (JWT)
 */
export function generateSessionToken(payload: UserSessionPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '8h' });
}

/**
 * Verify and decode session token
 */
export function verifySessionToken(token: string): UserSessionPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as UserSessionPayload;
  } catch {
    return null;
  }
}
