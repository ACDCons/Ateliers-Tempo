import { defineConfig, devices } from '@playwright/test';

const baseURL = 'http://localhost:3100';

export default defineConfig({
  globalSetup: './e2e/global-setup.ts',
  globalTeardown: './e2e/global-teardown.ts',
  testDir: './e2e',
  fullyParallel: false,
  workers: 1,
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
  webServer: {
    command: 'npm run dev -- --port 3100',
    url: baseURL,
    reuseExistingServer: false,
    timeout: 120_000,
    env: {
      DATABASE_URL: 'file:data/test.sqlite',
      NEXT_DIST_DIR: '.next-e2e',
      BETTER_AUTH_URL: baseURL,
    },
  },
});
