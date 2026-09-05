import fs from 'node:fs/promises';
import path from 'node:path';
import { clerk } from '@clerk/testing/playwright';
import { expect, test } from '@playwright/test';

const baseURL = process.env.E2E_BASE_URL || 'https://buildmate-nine.vercel.app';
const stateFile = path.join(process.cwd(), 'playwright', '.e2e-users.json');

async function signInAndGetToken(browser, email) {
  const context = await browser.newContext();
  const page = await context.newPage();
  await page.goto(`${baseURL}/`);
  await clerk.signIn({ page, emailAddress: email });
  await page.waitForFunction(() => Boolean(globalThis.Clerk?.session));
  const token = await page.evaluate(() => globalThis.Clerk.session.getToken());
  if (!token) throw new Error(`No Clerk session token returned for ${email}`);
  return { context, page, token };
}

async function api(token, pathName, options = {}) {
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

test('homeowner to tradesperson job lifecycle works end to end', async ({ browser }) => {
  const state = JSON.parse(await fs.readFile(stateFile, 'utf8'));
  const customer = await signInAndGetToken(browser, state.customerEmail);
  const trader = await signInAndGetToken(browser, state.traderEmail);

  try {
    await api(customer.token, '/api/me', { method: 'PATCH', body: JSON.stringify({ role: 'customer' }) });
    const customerUser = await api(customer.token, '/api/me');
    expect(customerUser.customerEnabled).toBe(true);

    await api(trader.token, '/api/me', { method: 'PATCH', body: JSON.stringify({ role: 'trader' }) });
    const traderUser = await api(trader.token, '/api/me');
    expect(traderUser.traderEnabled).toBe(true);

    const profile = await api(trader.token, '/api/me', {
      method: 'PUT',
      body: JSON.stringify({
        businessName: 'BuildPair Automated QA Trade',
        tradeCategory: 'Tiling',
        subSkills: ['Bathrooms', 'Floors'],
        bio: 'Automated BuildPair end-to-end test tradesperson profile used only to verify the complete customer and trader workflow.',
        radiusMiles: 20,
        postcode: 'TW18 4AA',
        qualifications: ['Automated test profile - not a public trader'],
        externalLinks: {},
        photos: [],
        selfCertified: true,
        showcase: {
          template: 'modern',
          colourTheme: 'burnt_orange',
          coverPhotoUrl: '',
          profileImageUrl: '',
          logoUrl: '',
          yearsExperience: 10,
          yearEstablished: 2016,
          serviceAreas: ['Staines-upon-Thames'],
          beforeAfterProjects: [],
        },
      }),
    });
    expect(profile.isSubscriptionActive).toBe(true);
    expect(profile.trialDays).toBe(14);

    const unique = Date.now();
    const job = await api(customer.token, '/api/jobs', {
      method: 'POST',
      body: JSON.stringify({
        targetTraderId: traderUser.id,
        title: `BuildPair E2E bathroom tiling ${unique}`,
        category: 'Tiling',
        propertyType: 'House',
        postcode: 'TW18 4AA',
        urgency: 'Flexible',
        description: 'Automated end-to-end test job to retile a bathroom, prepare the walls, waterproof the wet area and complete the finish.',
        aiGeneratedSpec: null,
        budgetRange: '£1,500–£5,000',
        photos: [],
      }),
    });
    expect(job.customerId).toBe(customerUser.id);
    expect(job.targetTraderId).toBe(traderUser.id);
    expect(job.status).toBe('open');
    expect(job.conversationId).toBeTruthy();

    const traderJobs = await api(trader.token, '/api/jobs');
    expect(traderJobs.some((item) => item.id === job.id && item.isPreview === false)).toBe(true);

    const quote = await api(trader.token, '/api/quotes', {
      method: 'POST',
      body: JSON.stringify({
        jobId: job.id,
        laborCost: 120000,
        materialsCost: 30000,
        vatAmount: 0,
        depositAmount: 20000,
        paymentTerms: '£200 deposit, remaining balance after the completed work is checked by the customer.',
        notes: 'Automated BuildPair E2E quote.',
      }),
    });
    expect(quote.status).toBe('pending');
    expect(quote.totalAmount).toBe(150000);
    expect(quote.conversationId).toBeTruthy();

    await api(customer.token, `/api/quotes/${quote.id}`, {
      method: 'PATCH',
      body: JSON.stringify({ action: 'accept' }),
    });

    let detail = await api(customer.token, `/api/jobs/${job.id}`);
    expect(detail.job.status).toBe('in_progress');
    expect(detail.acceptedQuote.id).toBe(quote.id);
    expect(detail.milestones.length).toBeGreaterThanOrEqual(2);

    const conversationId = quote.conversationId || job.conversationId;
    await api(trader.token, `/api/conversations/${conversationId}/messages`, {
      method: 'POST',
      body: JSON.stringify({ body: 'Automated trader message: quote accepted and job arranged.' }),
    });
    const customerMessages = await api(customer.token, `/api/conversations/${conversationId}/messages`);
    expect(customerMessages.some((message) => message.body.includes('quote accepted'))).toBe(true);
    await api(customer.token, `/api/conversations/${conversationId}/messages`, {
      method: 'POST',
      body: JSON.stringify({ body: 'Automated homeowner reply: confirmed, please proceed.' }),
    });

    await api(trader.token, `/api/jobs/${job.id}`, {
      method: 'PATCH',
      body: JSON.stringify({ action: 'complete' }),
    });
    detail = await api(customer.token, `/api/jobs/${job.id}`);
    expect(detail.job.status).toBe('completed');

    const finalMilestone = detail.milestones.find((milestone) => milestone.title !== 'Deposit');
    expect(finalMilestone).toBeTruthy();
    expect(finalMilestone.status).toBe('completed');

    const confirmation = await api(customer.token, '/api/payments/external-confirm', {
      method: 'POST',
      body: JSON.stringify({ milestoneId: finalMilestone.id }),
    });
    expect(confirmation.confirmation).toBe('customer_confirmed_external');

    const review = await api(customer.token, '/api/reviews', {
      method: 'POST',
      body: JSON.stringify({
        jobId: job.id,
        traderId: traderUser.id,
        rating: 5,
        comment: 'Automated verified review confirming the BuildPair E2E workflow completed successfully.',
      }),
    });
    expect(review.verifiedCompletion).toBe(true);

    detail = await api(customer.token, `/api/jobs/${job.id}`);
    const paidFinal = detail.milestones.find((milestone) => milestone.id === finalMilestone.id);
    expect(paidFinal.status).toBe('paid');
    expect(detail.existingReview).toBeTruthy();

    const publicProfile = await api(customer.token, `/api/traders/${profile.id}`);
    expect(publicProfile.reviewCount).toBeGreaterThanOrEqual(1);
    expect(publicProfile.reviews.some((item) => item.id === review.id)).toBe(true);
  } finally {
    await customer.context.close();
    await trader.context.close();
  }
});
