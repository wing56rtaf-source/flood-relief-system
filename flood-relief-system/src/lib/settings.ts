import fs from 'fs';
import path from 'path';
import { prisma } from './prisma';

/**
 * Checks whether the public intake feature is enabled.
 * Single source of truth:
 * 1. Checks database SystemSetting table for key 'ENABLE_PUBLIC_INTAKE'
 * 2. If not found in DB, falls back to environment variable ENABLE_PUBLIC_INTAKE === 'true'
 * 3. Default is false (disabled)
 */
export async function isPublicIntakeEnabled(): Promise<boolean> {
  try {
    const setting = await prisma.systemSetting.findUnique({
      where: { key: 'ENABLE_PUBLIC_INTAKE' },
    });
    if (setting) {
      return setting.value.toLowerCase() === 'true';
    }
  } catch (error) {
    console.error('Error fetching SystemSetting ENABLE_PUBLIC_INTAKE:', error);
  }

  return process.env.ENABLE_PUBLIC_INTAKE?.toLowerCase() === 'true';
}

/**
 * Update system setting in database and sync environment
 */
export async function updateSystemSetting(key: string, value: string, updatedBy?: string) {
  process.env[key] = String(value);

  // Sync to .env file on disk if available
  try {
    const envPath = path.resolve(process.cwd(), '.env');
    if (fs.existsSync(envPath)) {
      let content = fs.readFileSync(envPath, 'utf8');
      const regex = new RegExp(`^${key}=.*$`, 'm');
      if (regex.test(content)) {
        content = content.replace(regex, `${key}="${value}"`);
      } else {
        content += `\n${key}="${value}"`;
      }
      fs.writeFileSync(envPath, content, 'utf8');
    }
  } catch (e) {
    console.error('Failed to update .env file:', e);
  }

  return prisma.systemSetting.upsert({
    where: { key },
    update: { value, updatedBy },
    create: { key, value, updatedBy },
  });
}
