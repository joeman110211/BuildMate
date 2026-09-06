import { expect, test } from '@playwright/test';

for (const [mode, label] of [['customer', 'Homeowner'], ['trader', 'Tradesperson']]) {
  test(`${label} sign-in exposes email, recovery, Google and Facebook options`, async ({ page }) => {
    await page.goto(`/auth/sign-in?mode=${mode}`, { waitUntil: 'domcontentloaded' });
    await expect(page.getByText(`${label} Sign In`, { exact: true })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Continue with Google' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Continue with Facebook' })).toBeVisible();
    await expect(page.getByLabel('Email address')).toBeVisible();
    await expect(page.getByLabel('Password', { exact: true })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Forgot password?' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Sign in with email' })).toBeDisabled();
  });

  test(`${label} sign-up exposes email, Google and Facebook options`, async ({ page }) => {
    await page.goto(`/auth/sign-up?mode=${mode}`, { waitUntil: 'domcontentloaded' });
    await expect(page.getByText(`Create ${label} Account`, { exact: true })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Continue with Google' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Continue with Facebook' })).toBeVisible();
    await expect(page.getByLabel('Email address')).toBeVisible();
    await expect(page.getByLabel('Password', { exact: true })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Create account with email' })).toBeDisabled();
  });
}
