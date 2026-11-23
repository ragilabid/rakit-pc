import { defineConfig, devices } from '@playwright/test';

const customBaseUrl = process.env.PLAYWRIGHT_BASE_URL;
const baseURL =
  customBaseUrl && customBaseUrl.trim().length > 0 ? customBaseUrl.trim() : 'http://127.0.0.1:4173';

const isExternalTarget = Boolean(
  customBaseUrl &&
  !customBaseUrl.includes('127.0.0.1:4173') &&
  !customBaseUrl.includes('localhost:4173'),
);

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  reporter: 'list',
  use: {
    baseURL,
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: isExternalTarget
    ? undefined
    : {
        command: 'npm run preview -- --host 127.0.0.1 --port 4173',
        url: 'http://127.0.0.1:4173',
        reuseExistingServer: !process.env.CI,
      },
});
