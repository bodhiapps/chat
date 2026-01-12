import { useBodhi } from '@bodhiapp/bodhi-js-react';
import { Cable, SlidersHorizontal } from 'lucide-react';
import { toast } from 'sonner';
import StatusIndicator from './StatusIndicator';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import { useSettingsContext } from '@/hooks/useSettingsContext';
import { SettingsDialog } from './settings/SettingsDialog';

export default function Header() {
  const {
    clientState,
    isReady,
    isServerReady,
    isInitializing,
    setupState,
    auth,
    isAuthenticated,
    login,
    logout,
    showSetup,
  } = useBodhi();

  const { openSettingsDialog } = useSettingsContext();

  const handleLogin = async () => {
    const authState = await login();
    if (authState?.status === 'error' && authState.error) {
      toast.error(authState.error.message);
    }
  };

  const isSettingsLoading = isInitializing || setupState !== 'ready';

  return (
    <>
      <header className="flex items-center justify-between px-4 py-3 border-b bg-background border-border">
        <div className="flex items-center gap-2">
          <h1 className="text-lg font-semibold" data-testid="app-title">
            Demo Chat
          </h1>
          <span className="text-sm text-muted-foreground" data-testid="app-subtitle">
            powered by Bodhi Platform
          </span>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 border-r border-border pr-3">
            <StatusIndicator
              label="Client"
              status={isReady}
              tooltip={isReady ? 'Client ready' : 'Client not ready'}
            />
            <StatusIndicator
              label="Server"
              status={isServerReady}
              tooltip={isServerReady ? 'Server ready' : 'Server not ready'}
            />
            <span className="text-xs text-muted-foreground" title="Connection mode">
              mode={clientState.mode || 'unknown'}
            </span>
          </div>

          <Button
            data-testid="btn-app-settings"
            onClick={openSettingsDialog}
            variant="ghost"
            size="icon"
            title="App Settings"
          >
            <SlidersHorizontal />
          </Button>

          <Button
            data-testid="btn-settings"
            onClick={showSetup}
            variant="ghost"
            size="icon"
            title="Connection Settings"
          >
            {isSettingsLoading ? <Spinner /> : <Cable />}
          </Button>

          <section
            data-testid="section-auth"
            data-teststate={isAuthenticated ? 'authenticated' : 'unauthenticated'}
          >
            {isAuthenticated ? (
              <div className="flex items-center gap-2">
                <span
                  data-testid="span-auth-name"
                  className="text-sm text-foreground"
                  title={auth.user?.email}
                >
                  {auth.user?.name || auth.user?.email || 'User'}
                </span>
                <Button data-testid="btn-auth-logout" onClick={logout} variant="ghost">
                  Logout
                </Button>
              </div>
            ) : (
              <Button data-testid="btn-auth-login" onClick={handleLogin}>
                Login
              </Button>
            )}
          </section>
        </div>
      </header>
      <SettingsDialog />
    </>
  );
}
