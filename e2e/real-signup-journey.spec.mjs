import crypto from 'node:crypto';
import { createClerkClient } from '@clerk/backend';
import { setupClerkTestingToken } from '@clerk/testing/playwright';
import { expect, test } from '@playwright/test';

const baseURL = process.env.E2E_BASE_URL || 'https://staging.buildpair.co.uk';
const runId = (process.env.GITHUB_RUN_ID || Date.now().toString()).replace(/[^a-zA-Z0-9-]/g, '');
const traderEmail = `buildpair-journey-trader+clerk_test_${runId}@example.com`;
const customerEmail = `buildpair-journey-homeowner+clerk_test_${runId}@example.com`;
const traderPassword = `Bp!${crypto.randomUUID()}Aa9`;
const customerPassword = `Bp!${crypto.randomUUID()}Aa9`;
const businessName = `BuildPair Real Journey ${runId}`;
const jobTitle = `Bathroom tiling real journey ${runId}`;
const invoiceNumber = `E2E-${runId}`;

async function api(page, pathName, options = {}) {
  await page.waitForFunction(() => Boolean(globalThis.Clerk?.session));
  const token = await page.evaluate(() => globalThis.Clerk.session.getToken());
  if (!token) throw new Error(`No active Clerk token for ${pathName}`);
  const response = await fetch(`${baseURL}${pathName}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
  });
  const text = await response.text();
  let body;
  try { body = text ? JSON.parse(text) : null; } catch { body = text; }
  if (!response.ok) throw new Error(`${options.method || 'GET'} ${pathName} -> HTTP ${response.status}: ${text}`);
  return body;
}

async function selectOption(page, label, option) {
  await page.getByRole('button', { name: new RegExp(`^${label}:`) }).click();
  await page.getByText(option, { exact: true }).last().click();
}

async function chooseModeIfNeeded(page, mode) {
  const target = mode === 'trader' ? /\/trader\/onboarding/ : /\/customer\/dashboard/;
  try {
    await page.waitForURL(target, { timeout: 8_000 });
    return;
  } catch {
    // The chooser is deliberately user-operable even when automatic mode opening is slow.
  }

  await page.waitForURL(/\/auth\/choose-role/, { timeout: 15_000 });
  const title = mode === 'trader' ? 'Tradesperson' : 'Homeowner';
  const action = mode === 'trader' ? /Add Tradesperson Profile|Continue as Tradesperson/ : /Add Homeowner Profile|Continue as Homeowner/;
  await page.getByText(title, { exact: true }).last().click();
  const button = page.getByRole('button', { name: action });
  await expect(button).toBeEnabled();
  await button.click();
  await page.waitForURL(target, { timeout: 20_000 });
}

async function realEmailSignup(page, mode, email, password) {
  await setupClerkTestingToken({ page });
  await page.goto(`${baseURL}/auth/sign-up?mode=${mode}`, { waitUntil: 'domcontentloaded' });
  await expect(page.getByLabel('Email address')).toBeVisible();
  await page.getByLabel('Email address').fill(email);
  await page.locator('input[name="password"]').fill(password);
  await page.getByRole('button', { name: 'Create account with email' }).click();

  await expect(page.getByLabel('Verification code')).toBeVisible({ timeout: 20_000 });
  expect(page.url()).toContain('/auth/sign-up/verify-email-address');
  await page.getByLabel('Verification code').fill('424242');
  await page.getByRole('button', { name: 'Verify and continue' }).click();
  await chooseModeIfNeeded(page, mode);
}

async function createTraderProfile(page) {
  await expect(page.getByText('Business Details', { exact: true }).first()).toBeVisible();
  await page.getByLabel('Business or trading name').fill(businessName);
  await selectOption(page, 'Primary trade', 'Tiling');
  await page.getByRole('checkbox', { name: 'Bathrooms' }).click();
  await page.getByLabel('Years of experience').fill('12');
  await page.getByLabel('Year established').fill('2014');
  await page.getByLabel('Base postcode').fill('TW18 4AA');
  await page.getByLabel('Other areas you cover').fill('Staines, Egham, Chertsey');
  await page.getByRole('button', { name: 'Continue' }).click();

  await page.getByLabel('Business bio').fill('Experienced bathroom and floor tiling contractor used for BuildPair automated real-user journey testing. Reliable quoting, clear communication and tidy workmanship.');
  await page.getByLabel('Qualifications, cards and certificates (one per line)').fill('NVQ Wall and Floor Tiling\nPublic liability insured');
  await page.getByRole('button', { name: 'Continue' }).click();

  await expect(page.getByText('Portfolio', { exact: true }).first()).toBeVisible();
  await page.getByRole('button', { name: 'Continue' }).click();

  await expect(page.getByText('Confirm & publish')).toBeVisible();
  await page.getByRole('checkbox').click();
  const publish = page.getByRole('button', { name: 'Save & Publish Profile' });
  await expect(publish).toBeEnabled();
  await publish.click();
  await page.waitForURL(/\/trader\/dashboard/, { timeout: 25_000 });

  const me = await api(page, '/api/me');
  expect(me.traderEnabled).toBe(true);
  const profile = await api(page, '/api/me/profile');
  expect(profile.businessName).toBe(businessName);
  expect(profile.tradeCategory).toBe('Tiling');
  expect(profile.isSubscriptionActive).toBe(true);
  return { me, profile };
}

async function postDirectJob(page, traderId) {
  const url = `${baseURL}/customer/new-job?traderId=${encodeURIComponent(traderId)}&traderName=${encodeURIComponent(businessName)}&tradeCategory=${encodeURIComponent('Tiling')}`;
  await page.goto(url, { waitUntil: 'domcontentloaded' });
  await expect(page.getByText(`Direct quote request for ${businessName}`)).toBeVisible();

  await selectOption(page, 'Property type', 'House');
  await page.getByRole('button', { name: 'Continue' }).click();
  await page.getByLabel('Short job title').fill(jobTitle);
  await page.getByLabel('Detailed job description').fill('Retile the main bathroom floor and shower walls, prepare the surfaces, waterproof the wet area, grout and silicone everything ready for use.');
  await page.getByRole('button', { name: 'Continue' }).click();
  await page.getByRole('button', { name: 'Continue' }).click();

  await page.getByLabel('Job postcode').fill('TW18 4AA');
  await selectOption(page, 'Budget bracket', '£1,500–£5,000');
  await selectOption(page, 'Urgency', 'Within 1 month');
  await page.getByRole('button', { name: 'Continue' }).click();
  await expect(page.getByText(jobTitle, { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Send Quote Request' }).click();
  await page.waitForURL(/\/customer\/(messages|jobs)/, { timeout: 25_000 });

  const jobs = await api(page, '/api/jobs');
  const job = jobs.find((item) => item.title === jobTitle);
  expect(job).toBeTruthy();
  expect(job.targetTraderId).toBe(traderId);
  return job;
}

async function sendTraderQuote(page, job) {
  await page.goto(`${baseURL}/trader/quotes/new?jobId=${encodeURIComponent(job.id)}&title=${encodeURIComponent(job.title)}`, { waitUntil: 'domcontentloaded' });
  await expect(page.getByText('Create an itemised quote')).toBeVisible();
  await page.getByLabel('Labour total (£)').fill('1200');
  await page.getByLabel('Materials (£)').fill('300');
  await page.getByLabel('Included scope').fill('Preparation, waterproofing, tiling, grouting, silicone and final clean.');
  await page.getByLabel('Estimated duration (days)').fill('5');
  await page.getByLabel('Deposit requested (£)').fill('200');
  await page.getByLabel('Additional notes').fill('Real BuildPair browser journey quote.');
  await page.getByRole('button', { name: 'Send quote' }).click();
  await page.waitForURL(/\/trader\/dashboard/, { timeout: 25_000 });
}

async function acceptQuote(page, jobId) {
  await page.goto(`${baseURL}/customer/compare/${jobId}`, { waitUntil: 'domcontentloaded' });
  await expect(page.getByText(businessName, { exact: true })).toBeVisible({ timeout: 20_000 });
  const accept = page.getByRole('button', { name: 'Accept Quote' });
  await expect(accept).toBeEnabled();
  await accept.click();
  await page.waitForURL(new RegExp(`/customer/jobs/${jobId}`), { timeout: 25_000 });
  const detail = await api(page, `/api/jobs/${jobId}`);
  expect(detail.job.status).toBe('in_progress');
  expect(detail.acceptedQuote).toBeTruthy();
  return detail;
}

async function createInvoice(page) {
  await page.goto(`${baseURL}/trader/invoices/new`, { waitUntil: 'domcontentloaded' });
  await expect(page.getByText('Create invoice')).toBeVisible();
  await page.getByLabel('Invoice number').fill(invoiceNumber);
  await page.getByLabel('Customer name').fill('BuildPair Test Homeowner');
  await page.getByLabel('Customer email').fill(customerEmail);
  await page.getByLabel('Description').fill('Bathroom tiling labour and materials');
  await page.getByLabel('Quantity').fill('1');
  await page.getByLabel('Unit price (£)').fill('1500');
  await page.getByLabel('Deposit already paid / requested (£)').fill('200');
  await page.getByLabel('Notes').fill('Generated by the BuildPair real signup-to-invoice browser journey.');

  page.once('dialog', async (dialog) => dialog.accept());
  await page.getByRole('button', { name: 'Save and send invoice' }).click();
  await page.waitForURL(/\/trader\/invoices/, { timeout: 25_000 });

  const invoices = await api(page, '/api/invoices');
  const invoice = invoices.find((item) => item.invoiceNumber === invoiceNumber);
  expect(invoice).toBeTruthy();
  expect(invoice.totalAmount).toBe(150000);
  expect(['draft', 'sent']).toContain(invoice.status);
  return invoice;
}

async function cleanupTestUsers() {
  if (!process.env.CLERK_SECRET_KEY) return;
  const client = createClerkClient({ secretKey: process.env.CLERK_SECRET_KEY });
  for (const email of [traderEmail, customerEmail]) {
    try {
      const result = await client.users.getUserList({ emailAddress: [email], limit: 10 });
      for (const user of result.data) await client.users.deleteUser(user.id);
    } catch (error) {
      console.warn(`Could not clean Clerk test user ${email}:`, error instanceof Error ? error.message : error);
    }
  }
}

test.describe.configure({ mode: 'serial' });

test.afterAll(async () => {
  await cleanupTestUsers();
});

test('real browser journey: trader signup -> profile -> homeowner signup -> direct job -> quote -> accept -> invoice', async ({ browser }) => {
  const traderContext = await browser.newContext();
  const customerContext = await browser.newContext();
  const traderPage = await traderContext.newPage();
  const customerPage = await customerContext.newPage();

  try {
    await test.step('Tradesperson signs up with email and verifies the real Clerk flow', async () => {
      await realEmailSignup(traderPage, 'trader', traderEmail, traderPassword);
    });

    const { me: traderUser } = await test.step('Tradesperson completes and publishes a real profile', async () => createTraderProfile(traderPage));

    await test.step('Homeowner signs up with a separate fresh email account', async () => {
      await realEmailSignup(customerPage, 'customer', customerEmail, customerPassword);
      const me = await api(customerPage, '/api/me');
      expect(me.customerEnabled).toBe(true);
    });

    const job = await test.step('Homeowner sends this exact tradesperson a direct quote request', async () => postDirectJob(customerPage, traderUser.id));

    await test.step('Tradesperson opens the real quote form and sends an itemised quote', async () => sendTraderQuote(traderPage, job));

    const quoteData = await api(customerPage, `/api/jobs/${job.id}/quotes`);
    expect(quoteData.quotes.some((quote) => quote.businessName === businessName && quote.totalAmount === 150000)).toBe(true);

    await test.step('Homeowner compares and accepts the quote in the real UI', async () => acceptQuote(customerPage, job.id));

    await test.step('Tradesperson marks the job complete through the live API used by the UI', async () => {
      await api(traderPage, `/api/jobs/${job.id}`, { method: 'PATCH', body: JSON.stringify({ action: 'complete' }) });
      const detail = await api(customerPage, `/api/jobs/${job.id}`);
      expect(detail.job.status).toBe('completed');
    });

    await test.step('Tradesperson creates and sends/safely-saves a real invoice', async () => createInvoice(traderPage));
  } finally {
    await traderContext.close();
    await customerContext.close();
  }
});
