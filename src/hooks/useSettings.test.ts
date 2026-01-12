import { renderHook, act, waitFor } from '@testing-library/react';
import { describe, it, expect, beforeEach } from 'vitest';
import { useSettings } from './useSettings';
import { db } from '@/db/database';
import { DEFAULT_SETTINGS } from '@/lib/settings-defaults';

describe('useSettings', () => {
  const TEST_USER_ID = 'test-user-123';

  beforeEach(async () => {
    await db.userSettings.clear();
  });

  it('returns default settings when no stored settings exist', async () => {
    const { result } = renderHook(() => useSettings(TEST_USER_ID));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.settings).toEqual(DEFAULT_SETTINGS);
  });

  it('loads settings from database', async () => {
    const customSettings = {
      ...DEFAULT_SETTINGS,
      generation: { ...DEFAULT_SETTINGS.generation, temperature: 0.5 },
    };

    await db.userSettings.put({
      userId: TEST_USER_ID,
      settings: JSON.stringify(customSettings),
      lastModified: Date.now(),
    });

    const { result } = renderHook(() => useSettings(TEST_USER_ID));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.settings.generation.temperature).toBe(0.5);
  });

  it('updates settings and persists to database', async () => {
    const { result } = renderHook(() => useSettings(TEST_USER_ID));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    act(() => {
      result.current.updateSetting('generation', 'temperature', 1.2);
    });

    await waitFor(() => {
      expect(result.current.settings.generation.temperature).toBe(1.2);
    });

    const stored = await db.userSettings.get(TEST_USER_ID);
    expect(stored).toBeDefined();
    const parsedSettings = JSON.parse(stored!.settings);
    expect(parsedSettings.generation.temperature).toBe(1.2);
  });

  it('validates numeric ranges and sets error', async () => {
    const { result } = renderHook(() => useSettings(TEST_USER_ID));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    act(() => {
      result.current.updateSetting('generation', 'temperature', 5.0);
    });

    expect(result.current.validationErrors.temperature).toBeDefined();
    expect(result.current.settings.generation.temperature).toBe(0.8);
  });

  it('resets all settings to defaults', async () => {
    const { result } = renderHook(() => useSettings(TEST_USER_ID));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    act(() => {
      result.current.updateSetting('generation', 'temperature', 1.5);
    });

    await waitFor(() => {
      expect(result.current.settings.generation.temperature).toBe(1.5);
    });

    act(() => {
      result.current.resetAllToDefaults();
    });

    await waitFor(() => {
      expect(result.current.settings.generation.temperature).toBe(0.8);
    });

    const stored = await db.userSettings.get(TEST_USER_ID);
    expect(stored).toBeDefined();
    const parsedSettings = JSON.parse(stored!.settings);
    expect(parsedSettings).toEqual(DEFAULT_SETTINGS);
  });

  it('deep merges stored settings with defaults for missing fields', async () => {
    const partialSettings = {
      general: DEFAULT_SETTINGS.general,
      generation: { temperature: 0.6 },
      display: DEFAULT_SETTINGS.display,
    };

    await db.userSettings.put({
      userId: TEST_USER_ID,
      settings: JSON.stringify(partialSettings),
      lastModified: Date.now(),
    });

    const { result } = renderHook(() => useSettings(TEST_USER_ID));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.settings.generation.temperature).toBe(0.6);
    expect(result.current.settings.generation.top_p).toBe(0.95);
    expect(result.current.settings.generation.top_k).toBe(40);
  });
});
