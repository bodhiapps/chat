import os from 'os';

export const isCI = process.env.CI === 'true';
export type Platform = 'windows' | 'mac' | 'linux';

export function getCurrentPlatform(): Platform {
  if (os.platform() === 'win32') return 'windows';
  if (os.platform() === 'darwin') return 'mac';
  return 'linux';
}
