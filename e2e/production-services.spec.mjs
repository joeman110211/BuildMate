import { clerk } from '@clerk/testing/playwright';
import { expect, test } from '@playwright/test';

const baseURL = process.env.E2E_BASE_URL || 'https://buildmate-nine.vercel.app';
const customerEmail = process.env.E2E_CUSTOMER_EMAIL || 'customer@buildpair.test';
const traderEmail = process.env.E2E_TRADER_EMAIL || 'trader@buildpair.test';

async function signInAndChooseMode(page, email, mode) {
  await page.goto('/');
  await clerk.signIn({ page, emailAddress: email });
  await page.goto(`/auth/choose-role?mode=${mode}`);
  await page.waitForURL(mode === 'customer' ? '**/customer/dashboard' : /\/trader\/(dashboard|onboarding)/, { timeout: 30_000 });
}

async function captureAuthorization(page, path) {
  const requestPromise = page.waitForRequest((request) => request.url().includes('/api/me') && Boolean(request.headers().authorization), { timeout: 20_000 });
  await page.goto(path);
  const appRequest = await requestPromise;
  return appRequest.headers().authorization;
}

test.describe('deployed production service smoke tests', () => {
  test.skip(process.env.RUN_PRODUCTION_SMOKES !== 'true', 'Set RUN_PRODUCTION_SMOKES=true only for an approved deployed environment.');
  test.describe.configure({ mode: 'serial' });

  test('readiness reports the non-Stripe production stack healthy', async ({ request }) => {
    const response = await request.get(new URL('/api/readiness', baseURL).toString());
    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(body.ready, JSON.stringify(body)).toBe(true);
  });

  test('Gemini generates a real deployed job specification', async ({ page, request }) => {
    await signInAndChooseMode(page, customerEmail, 'customer');
    const authorization = await captureAuthorization(page, '/customer/dashboard');
    const response = await request.post(new URL('/api/ai/job-spec', baseURL).toString(), {
      headers: { authorization, 'content-type': 'application/json' },
      data: {
        category: 'Tiling',
        propertyType: 'House',
        answers: [
          { question: 'What needs doing?', answer: 'Retile a small bathroom floor after removing cracked ceramic tiles.' },
          { question: 'What is there now?', answer: 'Existing ceramic floor tiles over a solid floor.' },
          { question: 'Any access or timing details?', answer: 'Normal front-door access and the room can be cleared before work starts.' },
        ],
      },
    });
    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(body.spec?.length || 0).toBeGreaterThan(80);
    expect(body.spec).toMatch(/Tradesperson to confirm/i);
  });

  test('Cloudinary accepts an upload signed by deployed BuildPair', async ({ page, request }) => {
    await signInAndChooseMode(page, customerEmail, 'customer');
    const authorization = await captureAuthorization(page, '/customer/dashboard');
    const sign = await request.post(new URL('/api/uploads/sign', baseURL).toString(), {
      headers: { authorization, 'content-type': 'application/json' },
      data: { kind: 'job' },
    });
    expect(sign.status()).toBe(200);
    const signed = await sign.json();
    expect(signed.cloudName).toBeTruthy();
    expect(signed.signature).toMatch(/^[a-f0-9]{40}$/);

    const onePixelPng = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAusB9Wl2n5sAAAAASUVORK5CYII=', 'base64');
    const upload = await request.post(`https://api.cloudinary.com/v1_1/${signed.cloudName}/image/upload`, {
      multipart: {
        file: { name: 'buildpair-production-smoke.png', mimeType: 'image/png', buffer: onePixelPng },
        api_key: signed.apiKey,
        timestamp: String(signed.timestamp),
        signature: signed.signature,
        asset_folder: signed.assetFolder,
      },
    });
    expect(upload.status()).toBe(200);
    const asset = await upload.json();
    expect(asset.secure_url).toMatch(/^https:\/\//);
    expect(asset.asset_folder).toBe(signed.assetFolder);
  });

  test('Resend accepts a real invoice delivery from deployed BuildPair', async ({ page, request }) => {
    const sink = process.env.E2E_RESEND_SINK_EMAIL;
    test.skip(!sink, 'Set E2E_RESEND_SINK_EMAIL to a controlled mailbox before testing delivery.');

    await signInAndChooseMode(page, traderEmail, 'trader');
    const authorization = await captureAuthorization(page, '/trader/dashboard');
    const response = await request.post(new URL('/api/invoices', baseURL).toString(), {
      headers: { authorization, 'content-type': 'application/json' },
      data: {
        invoiceNumber: `E2E-${Date.now()}`,
        customerName: 'BuildPair Production Smoke',
        customerEmail: sink,
        items: [{ description: 'Automated production email delivery check', quantity: 1, unitPrice: 100 }],
        vatAmount: 0,
        depositAmount: 0,
        notes: 'Automated BuildPair production smoke test. No payment is due.',
        dueAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        sendNow: true,
      },
    });
    expect(response.status()).toBe(201);
    const invoice = await response.json();
    expect(invoice.deliveryWarning).toBeFalsy();
    expect(invoice.status).toBe('sent');
  });
});
