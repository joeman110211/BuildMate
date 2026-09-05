import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  timeout: 90_000,
  expect: { timeout: 15_000 },
  fullyParallel: false,
  retries: 1,
  reporter: [['list'], ['html', { open: 'never', outputFolder: 'playwright-report' }]],
  use: {
    baseURL: process.env.E2E_BASE_URL || 'http://127.0.0.1:3000',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  projects: [
    {
      name: 'setup',
      testMatch: /global\.setup\.mjs/,
    },
    {
      name: 'desktop-core-flow',
      testMatch: /core-flow\.spec\.mjs/,
      use: { ...devices['Desktop Chrome'] },
      dependencies: ['setup'],
    },
    {
      name: 'small-android-public-ui',
      testMatch: /mobile-layout\.spec\.mjs/,
      use: { ...devices['Pixel 5'] },
      dependencies: ['setup'],
    },
  ],
});
