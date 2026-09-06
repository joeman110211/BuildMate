import fs from 'node:fs/promises';
import path from 'node:path';
import { clerk } from '@clerk/testing/playwright';
import { expect, test } from '@playwright/test';

const baseURL = process.env.E2E_BASE_URL || 'https://staging.buildpair.co.uk';
const stateFile = path.join(process.cwd(), 'playwright', '.e2e-users.json');

async function tokenFor(page) {
  await page.waitForFunction(() => Boolean(globalThis.Clerk?.session));
  const token = await page.evaluate(() => globalThis.Clerk.session.getToken());
  if (!token) throw new Error('No Clerk token for trader onboarding validation');
  return token;
}

async function activateTrader(token) {
  const response = await fetch(`${baseURL}/api/me`, {
    method: 'PATCH',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ role: 'trader' }),
  });
  if (!response.ok) throw new Error(`Could not enable trader mode: HTTP ${response.status} ${await response.text()}`);
}

test('trader onboarding allows three trade work types, visibly ticks selections, keeps Continue reachable and enforces the 50-character bio minimum', async ({ page }) => {
  const state = JSON.parse(await fs.readFile(stateFile, 'utf8'));
  await page.goto(`${baseURL}/`, { waitUntil: 'domcontentloaded' });
  await clerk.signIn({ page, emailAddress: state.traderEmail });
  await activateTrader(await tokenFor(page));

  await page.goto(`${baseURL}/trader/onboarding`, { waitUntil: 'domcontentloaded' });
  await expect(page.getByText('Business Details', { exact: true }).first()).toBeVisible();
  await expect(page.getByText('What work do you offer?', { exact: true })).toBeVisible();
  await page.getByLabel('Business or trading name').fill('BuildPair Onboarding Check');

  const tiling = page.getByRole('checkbox', { name: 'Tiling' });
  const bathrooms = page.getByRole('checkbox', { name: 'Bathroom Fitting' });
  const plumbing = page.getByRole('checkbox', { name: 'Plumbing' });
  await tiling.click();
  await bathrooms.click();
  await plumbing.click();

  await expect(tiling).toBeChecked();
  await expect(bathrooms).toBeChecked();
  await expect(plumbing).toBeChecked();
  await expect(tiling.getByText('✓')).toBeVisible();
  await expect(page.getByText(/Selected 3 of 3 work types/)).toBeVisible();

  const fourthWorkType = page.getByRole('checkbox', { name: 'Electrical' });
  await expect(fourthWorkType).toBeDisabled();
  await expect(fourthWorkType).not.toBeChecked();
  await expect(page.getByText(/Maximum reached for your current plan/)).toBeVisible();

  await page.getByLabel('Base postcode').fill('TW18 4AB');
  const firstContinue = page.getByRole('button', { name: 'Continue' });
  await expect(firstContinue).toBeVisible();
  await expect(firstContinue).toBeEnabled();
  await firstContinue.click();

  await expect(page.getByText('Build Your Profile', { exact: true }).first()).toBeVisible();
  await expect(page.getByText(/Minimum 50 characters required\./)).toBeVisible();
  const bio = page.getByLabel('Business bio');
  await bio.fill('Too short');
  await expect(page.getByText(/41 more to go\./)).toBeVisible();
  await expect(page.getByRole('button', { name: 'Continue' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Continue' })).toBeDisabled();

  await bio.fill('Experienced tiling contractor providing reliable bathroom and floor installations across the local area.');
  await expect(page.getByText(/Requirement met ✓/)).toBeVisible();
  await expect(page.getByRole('button', { name: 'Continue' })).toBeEnabled();
});