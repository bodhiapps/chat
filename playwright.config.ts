import { defineConfig, devices } from '@playwright/test';
import { config } from 'dotenv';
import path from 'path';
import fs from 'fs';

const envTestPath = path.join(process.cwd(), 'e2e', '.env.test');
if (fs.existsSync(envTestPath)) {
  config({ path: envTestPath, quiet: true });
}

const isCI = !!process.env.CI;
const isDebug = !!process.env.PWDEBUG;
const testPort = 15173;
const baseURL = `http://localhost:${testPort}/chat/`;

export default defineConfig({
  testDir: './e2e',
  testMatch: '**/*.spec.ts',
  fullyParallel: !isCI,
  forbidOnly: isCI,
  retries: isCI ? 2 : 0,
  workers: isCI ? 1 : undefined,
  reporter: [
    ['list'],
    ['html', { outputFolder: 'playwright-report' }],
    ...(isCI ? [['junit', { outputFile: 'test-results/junit.xml' }] as const] : []),
  ],
  timeout: isCI || isDebug ? 180000 : 60000,

  globalSetup: './e2e/global-setup.ts',

  use: {
    baseURL,
    actionTimeout: isCI ? 60000 : 10000,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'on-first-retry',
  },

  expect: {
    timeout: isCI ? 60000 : 10000,
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],

  webServer: {
    command: `npm run dev -- --port ${testPort}`,
    url: baseURL,
    reuseExistingServer: false,
    timeout: 120000,
    stderr: 'pipe',
    stdout: 'pipe',
  },
});
