import crypto from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';
import { createClerkClient } from '@clerk/backend';
import { clerkSetup } from '@clerk/testing/playwright';
import { test as setup } from '@playwright/test';

const baseURL = process.env.E2E_BASE_URL || 'https://staging.buildpair.co.uk';
const runId = (process.env.GITHUB_RUN_ID || Date.now().toString()).replace(/[^a-zA-Z0-9-]/g, '');
const customerEmail = process.env.E2E_CUSTOMER_EMAIL || `buildpair-customer+clerk_test_${runId}@example.com`;
const traderEmail = process.env.E2E_TRADER_EMAIL || `buildpair-trader+clerk_test_${runId}@example.com`;
const stateFile = path.join(process.cwd(), 'playwright', '.e2e-users.json');

async function ensureTestUser(client, email, firstName) {
  const existing = await client.users.getUserList({ emailAddress: [email], limit: 1 });
  if (existing.data[0]) return existing.data[0];
  return client.users.createUser({
    emailAddress: [email],
    password: `Bp!${crypto.randomUUID()}aA9`,
    firstName,
    lastName: 'BuildPair E2E',
  });
}

setup.describe.configure({ mode: 'serial' });

setup('prepare Clerk testing token and disposable users', async () => {
  if (!process.env.CLERK_SECRET_KEY) throw new Error('CLERK_SECRET_KEY is required for authenticated E2E tests');

  const response = await fetch(`${baseURL}/api/client-config`);
  if (!response.ok) throw new Error(`Could not read BuildPair client config: HTTP ${response.status}`);
  const config = await response.json();
  if (!config.clerkPublishableKey) throw new Error('Target Clerk publishable key is missing');
  process.env.CLERK_PUBLISHABLE_KEY = config.clerkPublishableKey;

  const clerkClient = createClerkClient({ secretKey: process.env.CLERK_SECRET_KEY });
  await ensureTestUser(clerkClient, customerEmail, 'Customer');
  await ensureTestUser(clerkClient, traderEmail, 'Trader');
  await fs.mkdir(path.dirname(stateFile), { recursive: true });
  await fs.writeFile(stateFile, JSON.stringify({ customerEmail, traderEmail }), 'utf8');
  await clerkSetup();
});
