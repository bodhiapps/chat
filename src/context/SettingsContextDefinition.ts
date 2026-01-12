import { createContext } from 'react';
import type { Settings } from '@/lib/settings-defaults';

export interface SettingsContextValue {
  settings: Settings;
  isLoading: boolean;
  validationErrors: Partial<Record<string, string>>;
  updateSetting: <K extends keyof Settings>(
    category: K,
    key: keyof Settings[K],
    value: Settings[K][keyof Settings[K]]
  ) => void;
  resetAllToDefaults: () => void;
  isSettingsDialogOpen: boolean;
  openSettingsDialog: () => void;
  closeSettingsDialog: () => void;
}

export const SettingsContext = createContext<SettingsContextValue | null>(null);
