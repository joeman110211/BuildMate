import fs from 'node:fs/promises';
import path from 'node:path';
import { clerk } from '@clerk/testing/playwright';
import { test as teardown } from '@playwright/test';

const baseURL = process.env.E2E_BASE_URL || 'https://staging.buildpair.co.uk';
const stateFile = path.join(process.cwd(), 'playwright', '.e2e-users.json');

async function deleteBuildPairAccount(browser, email) {
  const context = await browser.newContext();
  const page = await context.newPage();
  try {
    await page.goto(`${baseURL}/`, { waitUntil: 'domcontentloaded' });
    await clerk.signIn({ page, emailAddress: email });
    await page.waitForFunction(() => Boolean(globalThis.Clerk?.session));
    const token = await page.evaluate(() => globalThis.Clerk.session.getToken());
    if (!token) throw new Error(`No session token for cleanup account ${email}`);
    const response = await fetch(`${baseURL}/api/me/delete`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ confirmation: 'DELETE MY ACCOUNT' }),
    });
    if (!response.ok) throw new Error(`Cleanup failed for ${email}: HTTP ${response.status} ${await response.text()}`);
  } catch (error) {
    console.warn(error instanceof Error ? error.message : String(error));
  } finally {
    await context.close();
  }
}

teardown('remove disposable homeowner and tradesperson test accounts', async ({ browser }) => {
  let state;
  try {
    state = JSON.parse(await fs.readFile(stateFile, 'utf8'));
  } catch {
    console.warn('No E2E account state file found; nothing to clean up.');
    return;
  }

  for (const email of [state.customerEmail, state.traderEmail].filter(Boolean)) {
    await deleteBuildPairAccount(browser, email);
  }
  await fs.rm(stateFile, { force: true });
});
