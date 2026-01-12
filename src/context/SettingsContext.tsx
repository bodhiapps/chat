import { useState, useEffect, type ReactNode } from 'react';
import { useTheme } from '@/components/theme-provider';
import { useSettings } from '@/hooks/useSettings';
import { SettingsContext } from './SettingsContextDefinition';

export function SettingsProvider({ userId, children }: { userId: string; children: ReactNode }) {
  const { settings, isLoading, validationErrors, updateSetting, resetAllToDefaults } =
    useSettings(userId);
  const [isSettingsDialogOpen, setIsSettingsDialogOpen] = useState(false);
  const { setTheme } = useTheme();

  useEffect(() => {
    if (!isLoading) {
      setTheme(settings.general.theme);
    }
  }, [isLoading, settings.general.theme, setTheme]);

  const openSettingsDialog = () => setIsSettingsDialogOpen(true);
  const closeSettingsDialog = () => setIsSettingsDialogOpen(false);

  return (
    <SettingsContext.Provider
      value={{
        settings,
        isLoading,
        validationErrors,
        updateSetting,
        resetAllToDefaults,
        isSettingsDialogOpen,
        openSettingsDialog,
        closeSettingsDialog,
      }}
    >
      {children}
    </SettingsContext.Provider>
  );
}
