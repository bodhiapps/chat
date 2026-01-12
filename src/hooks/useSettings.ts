import { useState, useEffect, useCallback } from 'react';
import { db } from '@/db/database';
import { DEFAULT_SETTINGS, VALIDATION_RANGES } from '@/lib/settings-defaults';
import type { Settings } from '@/lib/settings-defaults';

type SettingsCategory = keyof Settings;
type ValidationErrors = Partial<Record<string, string>>;

function deepMerge<T>(target: T, source: Partial<T>): T {
  const output = { ...target };
  for (const key in source) {
    if (Object.prototype.hasOwnProperty.call(source, key)) {
      const sourceValue = source[key];
      const targetValue = output[key];
      if (
        sourceValue &&
        typeof sourceValue === 'object' &&
        !Array.isArray(sourceValue) &&
        targetValue &&
        typeof targetValue === 'object' &&
        !Array.isArray(targetValue)
      ) {
        output[key] = deepMerge(targetValue, sourceValue as Partial<typeof targetValue>);
      } else if (sourceValue !== undefined) {
        output[key] = sourceValue as T[Extract<keyof T, string>];
      }
    }
  }
  return output;
}

function validateNumericField(key: string, value: number): string | undefined {
  const ranges = VALIDATION_RANGES as Record<string, { min: number; max: number }>;
  if (ranges[key]) {
    const { min, max } = ranges[key];
    if (value < min || value > max) {
      return `Value must be between ${min} and ${max}`;
    }
  }
  return undefined;
}

export function useSettings(userId: string) {
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);
  const [isLoading, setIsLoading] = useState(true);
  const [validationErrors, setValidationErrors] = useState<ValidationErrors>({});

  useEffect(() => {
    async function loadSettings() {
      try {
        const stored = await db.userSettings.get(userId);
        if (stored) {
          const parsedSettings = JSON.parse(stored.settings) as Partial<Settings>;
          const merged = deepMerge(DEFAULT_SETTINGS, parsedSettings);
          setSettings(merged);
        }
      } catch (error) {
        console.error('Failed to load settings:', error);
      } finally {
        setIsLoading(false);
      }
    }

    loadSettings();
  }, [userId]);

  const saveSettings = useCallback(
    async (newSettings: Settings) => {
      try {
        await db.userSettings.put({
          userId,
          settings: JSON.stringify(newSettings),
          lastModified: Date.now(),
        });
      } catch (error) {
        console.error('Failed to save settings:', error);
      }
    },
    [userId]
  );

  const updateSetting = useCallback(
    <K extends SettingsCategory>(
      category: K,
      key: keyof Settings[K],
      value: Settings[K][keyof Settings[K]]
    ) => {
      if (typeof value === 'number') {
        const error = validateNumericField(key as string, value);
        if (error) {
          setValidationErrors(prev => ({ ...prev, [key]: error }));
          return;
        }
        setValidationErrors(prev => {
          const next = { ...prev };
          delete next[key as string];
          return next;
        });
      }

      setSettings(prev => {
        const updated = {
          ...prev,
          [category]: {
            ...prev[category],
            [key]: value,
          },
        };
        saveSettings(updated);
        return updated;
      });
    },
    [saveSettings]
  );

  const resetAllToDefaults = useCallback(() => {
    setSettings(DEFAULT_SETTINGS);
    setValidationErrors({});
    saveSettings(DEFAULT_SETTINGS);
  }, [saveSettings]);

  return {
    settings,
    isLoading,
    validationErrors,
    updateSetting,
    resetAllToDefaults,
  };
}
