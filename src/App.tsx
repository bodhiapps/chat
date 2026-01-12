import { useEffect, useRef } from 'react';
import { BodhiProvider, useBodhi, BodhiBadge } from '@bodhiapp/bodhi-js-react';
import { ThemeProvider } from '@/components/theme-provider';
import { Toaster } from '@/components/ui/sonner';
import { AUTH_CLIENT_ID, AUTH_SERVER_URL } from './env';
import { ChatProvider } from './context/ChatContext';
import { SettingsProvider } from './context/SettingsContext';
import Layout from './components/Layout';

function AppContent() {
  const { clientState, showSetup, auth } = useBodhi();
  const hasAutoOpenedRef = useRef(false);

  useEffect(() => {
    const shouldAutoOpen =
      clientState.status === 'direct-not-connected' || clientState.status === 'extension-not-found';

    if (shouldAutoOpen && !hasAutoOpenedRef.current) {
      showSetup();
      hasAutoOpenedRef.current = true;
    }
  }, [clientState.status, showSetup]);

  const userId = auth.user?.sub || 'anonymous';

  return (
    <SettingsProvider userId={userId}>
      <ChatProvider>
        <Layout />
        <Toaster />
      </ChatProvider>
    </SettingsProvider>
  );
}

function App() {
  return (
    <ThemeProvider defaultTheme="system">
      <BodhiProvider
        authClientId={AUTH_CLIENT_ID}
        clientConfig={{
          ...(AUTH_SERVER_URL && { authServerUrl: AUTH_SERVER_URL }),
        }}
        basePath="/chat/"
      >
        <AppContent />
        <div className="fixed bottom-4 right-6 z-50">
          <BodhiBadge size="md" variant="light" />
        </div>
      </BodhiProvider>
    </ThemeProvider>
  );
}

export default App;
