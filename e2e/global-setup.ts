import { BodhiServerManager, resolveTestHfHome } from './utils/index.js';
import path from 'path';
import { fileURLToPath } from 'url';
import { config } from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let bodhiServer: BodhiServerManager | null = null;

export default async function globalSetup() {
  console.log('[global-setup] Starting Bodhi server for e2e tests...');

  config({ path: path.resolve(__dirname, '.env.test.local'), quiet: true });

  const requiredEnvVars = [
    'INTEG_TEST_AUTH_URL',
    'INTEG_TEST_AUTH_REALM',
    'INTEG_TEST_CLIENT_ID',
    'INTEG_TEST_CLIENT_SECRET',
    'INTEG_TEST_USERNAME',
    'INTEG_TEST_PASSWORD',
  ];

  const missingVars = requiredEnvVars.filter((varName) => !process.env[varName]);
  if (missingVars.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missingVars.join(', ')}. ` +
        `Please create e2e/.env.test from e2e/.env.example and fill in the values.`
    );
  }

  const hfHome = resolveTestHfHome({ testDir: __dirname });

  bodhiServer = new BodhiServerManager({
    hf_home: hfHome,
    port: 22222,
    appStatus: 'ready',
    authUrl: process.env.INTEG_TEST_AUTH_URL!,
    authRealm: process.env.INTEG_TEST_AUTH_REALM!,
    clientId: process.env.INTEG_TEST_CLIENT_ID!,
    clientSecret: process.env.INTEG_TEST_CLIENT_SECRET!,
    host: '127.0.0.1',
    timeout: 30000,
    logLevel: 'debug',
    logToStdout: true,
  });

  try {
    const bodhiServerUrl = await bodhiServer.start();
    console.log(`[global-setup] Bodhi server started at ${bodhiServerUrl}`);
  } catch (error) {
    console.error('[global-setup] Failed to start Bodhi server:', error);
    throw error;
  }

  return async () => {
    console.log('[global-teardown] Stopping Bodhi server...');
    if (bodhiServer) {
      await bodhiServer.stop();
      console.log('[global-teardown] Bodhi server stopped');
    }
  };
}
