import { BODHI_EXEC_VARIANT, setAppStatus, setClientCredentials } from '@bodhiapp/app-bindings';
import { mkdtempSync } from 'fs';
import { createServer } from 'http';
import { tmpdir } from 'os';
import { dirname, join, resolve } from 'path';
import { fileURLToPath } from 'url';
import { isCI } from './platform-utils.js';

export interface BodhiServerConfig {
  authUrl?: string;
  authRealm?: string;
  clientId?: string;
  clientSecret?: string;
  port?: number;
  host?: string;
  home?: string;
  hf_home?: string;
  appStatus?: string;
  logLevel?: string;
  logToStdout?: boolean;
  binPath?: string;
  timeout?: number;
  keepAliveSecs?: number;
}

export class BodhiServerManager {
  private server: {
    start(): Promise<void>;
    stop(): Promise<void>;
    isRunning(): Promise<boolean>;
  } | null = null;
  private config: BodhiServerConfig;
  private actualPort: number | null = null;
  private tempHome: string | null = null;

  constructor(config: BodhiServerConfig = {}) {
    this.config = {
      timeout: 30000,
      logLevel: 'debug',
      logToStdout: false,
      host: '127.0.0.1',
      port: 22222,
      keepAliveSecs: 30 * 60,
      ...config,
    };
  }

  async start(): Promise<string> {
    if (this.server) {
      throw new Error('Server is already running');
    }

    const port = this.config.port!;

    await this.ensurePortAvailable(port);

    this.actualPort = port;
    const serverUrl = `http://127.0.0.1:${port}`;

    if (!this.config.home) {
      this.tempHome = mkdtempSync(join(tmpdir(), 'bodhi-test-'));
    }

    this.server = await this.createBodhiServerDirect();
    await this.server.start();

    const isRunning = await this.server.isRunning();
    if (!isRunning) {
      throw new Error('Bodhi server failed to start');
    }

    await this.waitForHealthCheck(serverUrl);

    console.log(`[bodhi-server] Server started at ${serverUrl}`);
    return serverUrl;
  }

  private async ensurePortAvailable(port: number): Promise<void> {
    return new Promise((resolve, reject) => {
      const server = createServer();
      server.once('error', (err: NodeJS.ErrnoException) => {
        if (err.code === 'EADDRINUSE') {
          reject(new Error(`Port ${port} is already in use. Cannot start Bodhi server.`));
        } else {
          reject(err);
        }
      });
      server.listen(port, () => {
        server.close(() => resolve());
      });
    });
  }

  private async createBodhiServerDirect(): Promise<{
    start(): Promise<void>;
    stop(): Promise<void>;
    isRunning(): Promise<boolean>;
  }> {
    const appBindings = await import('@bodhiapp/app-bindings');
    const {
      createNapiAppOptions,
      setEnvVar,
      setSystemSetting,
      setAppSetting,
      BodhiServer,
      BODHI_HOST,
      BODHI_PORT,
      BODHI_ENV_TYPE,
      BODHI_APP_TYPE,
      BODHI_VERSION,
      BODHI_LOG_LEVEL,
      BODHI_LOG_STDOUT,
      BODHI_AUTH_URL,
      BODHI_AUTH_REALM,
      BODHI_EXEC_LOOKUP_PATH,
      BODHI_KEEP_ALIVE_SECS,
    } = appBindings;

    let napiConfig = createNapiAppOptions();

    const home = this.config.home || this.tempHome!;
    napiConfig = setEnvVar(napiConfig, 'HOME', home);
    napiConfig = setEnvVar(napiConfig, BODHI_HOST, this.config.host!);
    napiConfig = setEnvVar(napiConfig, BODHI_PORT, this.actualPort!.toString());

    if (this.config.hf_home) {
      napiConfig = setEnvVar(napiConfig, 'HF_HOME', this.config.hf_home);
    }

    if (isCI) {
      napiConfig = setEnvVar(napiConfig, 'LLAMA_ARG_N_PARALLEL', '1');
    }

    napiConfig = setSystemSetting(napiConfig, BODHI_ENV_TYPE, 'development');
    napiConfig = setSystemSetting(napiConfig, BODHI_APP_TYPE, 'container');
    napiConfig = setSystemSetting(napiConfig, BODHI_VERSION, '1.0.0-test');

    if (this.config.authUrl) {
      napiConfig = setSystemSetting(napiConfig, BODHI_AUTH_URL, this.config.authUrl);
    }
    if (this.config.authRealm) {
      napiConfig = setSystemSetting(napiConfig, BODHI_AUTH_REALM, this.config.authRealm);
    }

    napiConfig = setAppSetting(napiConfig, BODHI_LOG_LEVEL, this.config.logLevel!);
    napiConfig = setAppSetting(napiConfig, BODHI_LOG_STDOUT, this.config.logToStdout!.toString());

    let binPath = this.config.binPath;
    if (!binPath) {
      const __filename = fileURLToPath(import.meta.url);
      const __dirname = dirname(__filename);
      binPath = resolve(__dirname, '../../bin');
    }
    napiConfig = setAppSetting(napiConfig, BODHI_EXEC_LOOKUP_PATH, binPath);
    napiConfig = setAppSetting(napiConfig, BODHI_EXEC_VARIANT, 'cpu');
    napiConfig = setAppSetting(
      napiConfig,
      BODHI_KEEP_ALIVE_SECS,
      this.config.keepAliveSecs!.toString()
    );

    if (this.config.appStatus) {
      napiConfig = setAppStatus(napiConfig, this.config.appStatus);
    }
    if (this.config.clientId && this.config.clientSecret) {
      napiConfig = setClientCredentials(napiConfig, this.config.clientId, this.config.clientSecret);
    }

    return new BodhiServer(napiConfig);
  }

  private async waitForHealthCheck(serverUrl: string): Promise<void> {
    const startTime = Date.now();
    const timeout = this.config.timeout!;

    while (Date.now() - startTime < timeout) {
      try {
        const response = await fetch(`${serverUrl}/ping`);
        if (response.ok) {
          console.log(`[bodhi-server] Health check passed at ${serverUrl}`);
          return;
        }
      } catch {
        // Server not ready yet
      }

      await new Promise((resolve) => setTimeout(resolve, 1000));
    }

    throw new Error(`Bodhi server failed to start within ${timeout}ms`);
  }

  async stop(): Promise<void> {
    if (this.server) {
      console.log('[bodhi-server] Stopping server...');

      try {
        await this.server.stop();
      } catch (error) {
        console.error('[bodhi-server] Error stopping server:', error);
      }

      this.server = null;
      this.actualPort = null;
    }

    if (this.tempHome) {
      try {
        const { rmSync } = await import('fs');
        rmSync(this.tempHome, { recursive: true, force: true });
      } catch (error) {
        console.warn('[bodhi-server] Could not clean up temp directory:', error);
      }
      this.tempHome = null;
    }
  }

  async isRunning(): Promise<boolean> {
    if (!this.server) {
      return false;
    }

    try {
      return await this.server.isRunning();
    } catch {
      return false;
    }
  }
}
