import fs from 'node:fs/promises';
import path from 'node:path';
import { clerk } from '@clerk/testing/playwright';
import { expect, test } from '@playwright/test';

const baseURL = process.env.E2E_BASE_URL || 'https://staging.buildpair.co.uk';
const stateFile = path.join(process.cwd(), 'playwright', '.e2e-users.json');

async function expectNoHorizontalOverflow(page, label) {
  const metrics = await page.evaluate(() => ({
    innerWidth: window.innerWidth,
    scrollWidth: document.documentElement.scrollWidth,
    bodyWidth: document.body.scrollWidth,
  }));
  expect(metrics.scrollWidth, `${label}: document overflows horizontally`).toBeLessThanOrEqual(metrics.innerWidth + 2);
  expect(metrics.bodyWidth, `${label}: body overflows horizontally`).toBeLessThanOrEqual(metrics.innerWidth + 2);
}

async function getToken(page) {
  await page.waitForFunction(() => Boolean(globalThis.Clerk?.session));
  const token = await page.evaluate(() => globalThis.Clerk.session.getToken());
  if (!token) throw new Error('No Clerk token available in mobile layout test');
  return token;
}

async function api(token, pathName, options = {}) {
  const response = await fetch(`${baseURL}${pathName}`, {
    ...options,
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json', ...(options.headers || {}) },
  });
  if (!response.ok) throw new Error(`${options.method || 'GET'} ${pathName}: HTTP ${response.status} ${await response.text()}`);
  return response.json();
}

test('small Android public and auth surfaces fit without furniture-removal chaos', async ({ page }) => {
  await page.goto('/auth/account');
  const heading = page.getByText('One login. Two ways to use BuildPair.');
  await expect(heading).toBeVisible();
  const headingBox = await heading.boundingBox();
  expect(headingBox?.y ?? 9999).toBeLessThan(300);
  await expectNoHorizontalOverflow(page, 'account chooser');

  await page.goto('/auth/sign-in?mode=customer');
  await expect(page.getByText(/Homeowner Sign In/i)).toBeVisible();
  await expectNoHorizontalOverflow(page, 'customer sign in');

  await page.goto('/directory');
  await page.waitForLoadState('networkidle');
  await expectNoHorizontalOverflow(page, 'trader directory');

  await page.goto('/jobs');
  await page.waitForLoadState('networkidle');
  await expect(page.getByText(/Latest job requests/i)).toBeVisible();
  await expectNoHorizontalOverflow(page, 'public jobs');

  await page.goto('/traders/demo-joe-loveridge-tiling');
  await page.waitForLoadState('networkidle');
  await expect(page.getByText(/beta preview/i).first()).toBeVisible();
  await expectNoHorizontalOverflow(page, 'preview trader profile');
});

test('small Android trader onboarding starts above the fold and stays usable', async ({ page }) => {
  const state = JSON.parse(await fs.readFile(stateFile, 'utf8'));
  await page.goto('/');
  await clerk.signIn({ page, emailAddress: state.traderEmail });
  const token = await getToken(page);
  await api(token, '/api/me', { method: 'PATCH', body: JSON.stringify({ role: 'trader' }) });

  await page.goto('/trader/onboarding');
  await expect(page.getByText('Business Details', { exact: true }).first()).toBeVisible();
  const titleBox = await page.getByText('Business Details', { exact: true }).first().boundingBox();
  expect(titleBox?.y ?? 9999, 'Trader onboarding starts too far below the top of a small phone').toBeLessThan(300);
  await expect(page.getByLabel('Business or trading name')).toBeVisible();
  await expectNoHorizontalOverflow(page, 'trader onboarding');
});
