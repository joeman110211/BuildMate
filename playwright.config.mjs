import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  timeout: 120_000,
  expect: { timeout: 20_000 },
  fullyParallel: false,
  retries: 1,
  reporter: [['list'], ['html', { open: 'never', outputFolder: 'playwright-report' }]],
  use: {
    baseURL: process.env.E2E_BASE_URL || 'https://buildmate-nine.vercel.app',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
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
      name: 'small-android-320-public',
      testMatch: /mobile-layout\.spec\.mjs/,
      use: {
        ...devices['Pixel 5'],
        viewport: { width: 320, height: 568 },
        screen: { width: 320, height: 568 },
      },
    },
    {
      name: 'small-android-pixel5-public',
      testMatch: /mobile-layout\.spec\.mjs/,
      use: { ...devices['Pixel 5'] },
    },
    {
      name: 'production-services',
      testMatch: /production-services\.spec\.mjs/,
      use: { ...devices['Desktop Chrome'] },
      dependencies: ['setup'],
    },
  ],
});
