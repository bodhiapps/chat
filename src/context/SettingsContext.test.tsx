import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, act, waitFor } from '@testing-library/react';
import { SettingsProvider } from './SettingsContext';
import { useSettingsContext } from '@/hooks/useSettingsContext';
import { db } from '@/db/database';

function TestComponent() {
  const { settings, isSettingsDialogOpen, openSettingsDialog, closeSettingsDialog } =
    useSettingsContext();

  return (
    <div>
      <div data-testid="temperature">{settings.generation.temperature}</div>
      <div data-testid="dialog-state">{isSettingsDialogOpen ? 'open' : 'closed'}</div>
      <button onClick={openSettingsDialog}>Open</button>
      <button onClick={closeSettingsDialog}>Close</button>
    </div>
  );
}

describe('SettingsContext', () => {
  const TEST_USER_ID = 'test-user-ctx';

  beforeEach(async () => {
    await db.userSettings.clear();
  });

  it('provides settings via context', async () => {
    render(
      <SettingsProvider userId={TEST_USER_ID}>
        <TestComponent />
      </SettingsProvider>
    );

    await waitFor(() => {
      const temp = screen.getByTestId('temperature');
      expect('0.8', temp.textContent);
    });
  });

  it('manages dialog open/close state', async () => {
    render(
      <SettingsProvider userId={TEST_USER_ID}>
        <TestComponent />
      </SettingsProvider>
    );

    const dialogState = screen.getByTestId('dialog-state');
    expect('closed', dialogState.textContent);

    const openBtn = screen.getByText('Open');
    act(() => {
      openBtn.click();
    });

    expect('open', dialogState.textContent);

    const closeBtn = screen.getByText('Close');
    act(() => {
      closeBtn.click();
    });

    expect('closed', dialogState.textContent);
  });

  it('throws error when used outside provider', () => {
    expect(() => {
      render(<TestComponent />);
    }).toThrow('useSettingsContext must be used within a SettingsProvider');
  });
});
