import fs from 'node:fs/promises';
import path from 'node:path';
import { clerk } from '@clerk/testing/playwright';
import { expect, test } from '@playwright/test';

const baseURL = process.env.E2E_BASE_URL || 'https://staging.buildpair.co.uk';
const stateFile = path.join(process.cwd(), 'playwright', '.e2e-users.json');
const runId = (process.env.GITHUB_RUN_ID || Date.now().toString()).replace(/[^a-zA-Z0-9-]/g, '');

async function signIn(browser, email, role) {
  const context = await browser.newContext();
  const page = await context.newPage();
  await page.goto(`${baseURL}/`, { waitUntil: 'domcontentloaded' });
  await clerk.signIn({ page, emailAddress: email });
  await page.waitForFunction(() => Boolean(globalThis.Clerk?.session));
  const token = await page.evaluate(() => globalThis.Clerk.session.getToken());
  if (!token) throw new Error(`No Clerk token returned for ${email}`);
  await api(token, '/api/me', { method: 'PATCH', body: JSON.stringify({ role }) });
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

async function ensureTraderProfile(token) {
  return api(token, '/api/me', {
    method: 'PUT',
    body: JSON.stringify({
      businessName: `BuildPair Feature Matrix ${runId}`,
      tradeCategory: 'Tiling',
      subSkills: ['Bathrooms', 'Floors'],
      bio: 'BuildPair automated feature-matrix tradesperson profile used to verify marketplace tools, homeowner interactions, quoting and post-hire workflows.',
      radiusMiles: 25,
      postcode: 'TW18 4AA',
      qualifications: ['Automated E2E test profile'],
      externalLinks: {},
      photos: [],
      selfCertified: true,
      showcase: {
        template: 'modern',
        colourTheme: 'burnt_orange',
        coverPhotoUrl: '',
        profileImageUrl: '',
        logoUrl: '',
        yearsExperience: 12,
        yearEstablished: 2014,
        serviceAreas: ['Staines-upon-Thames', 'Egham'],
        beforeAfterProjects: [],
      },
    }),
  });
}

async function assertPage(page, route, expected) {
  const response = await page.goto(`${baseURL}${route}`, { waitUntil: 'domcontentloaded' });
  expect(response?.status() ?? 599, `${route} document status`).toBeLessThan(400);
  if (expected) await expect(page.getByText(expected, { exact: false }).first()).toBeVisible({ timeout: 20_000 });
  const body = await page.locator('body').innerText();
  expect(body).not.toMatch(/Unmatched Route|Page could not be found|Internal server error/i);
}

test.describe.configure({ mode: 'serial' });

test('homeowner and tradesperson satellite features work around a complete hired-job lifecycle', async ({ browser }) => {
  const state = JSON.parse(await fs.readFile(stateFile, 'utf8'));
  const customer = await signIn(browser, state.customerEmail, 'customer');
  const trader = await signIn(browser, state.traderEmail, 'trader');

  let savedSearchId;
  let availabilityId;
  let storyId;
  let traderUser;
  let profile;

  try {
    traderUser = await api(trader.token, '/api/me');
    const customerUser = await api(customer.token, '/api/me');
    profile = await ensureTraderProfile(trader.token);

    await test.step('Homeowner can save and unsave a tradesperson and see Saved Trades', async () => {
      await api(customer.token, '/api/saved-traders', { method: 'POST', body: JSON.stringify({ traderId: traderUser.id, saved: true }) });
      let saved = await api(customer.token, '/api/saved-traders');
      expect(saved.some((item) => item.traderId === traderUser.id)).toBe(true);
      await assertPage(customer.page, '/customer/saved-trades', 'Saved');
    });

    await test.step('Tradesperson can create, edit and list a saved job search', async () => {
      const created = await api(trader.token, '/api/saved-searches', {
        method: 'POST',
        body: JSON.stringify({
          name: `Bathroom leads ${runId}`,
          category: 'Tiling',
          keywords: 'bathroom tile shower wetroom',
          postcode: 'TW18 4AA',
          radiusMiles: 25,
          emergencyOnly: false,
          enabled: true,
        }),
      });
      savedSearchId = created.id;
      const updated = await api(trader.token, '/api/saved-searches', {
        method: 'PATCH',
        body: JSON.stringify({ id: savedSearchId, name: `Priority bathroom leads ${runId}`, radiusMiles: 30 }),
      });
      expect(updated.radiusMiles).toBe(30);
      const searches = await api(trader.token, '/api/saved-searches');
      expect(searches.some((item) => item.id === savedSearchId)).toBe(true);
      await assertPage(trader.page, '/trader/saved-searches', 'Saved');
    });

    await test.step('Tradesperson availability can be created, read and removed', async () => {
      const startsAt = new Date(Date.now() + 10 * 24 * 60 * 60 * 1000);
      startsAt.setUTCHours(8, 0, 0, 0);
      const endsAt = new Date(startsAt.getTime() + 8 * 60 * 60 * 1000);
      const entry = await api(trader.token, '/api/availability', {
        method: 'POST',
        body: JSON.stringify({ startsAt: startsAt.toISOString(), endsAt: endsAt.toISOString(), status: 'available', note: `E2E availability ${runId}` }),
      });
      availabilityId = entry.id;
      const entries = await api(trader.token, `/api/availability?traderId=${encodeURIComponent(traderUser.id)}`);
      expect(entries.some((item) => item.id === availabilityId)).toBe(true);
    });

    await test.step('Tradesperson trust credential submission creates a visible pending record and notification', async () => {
      const credential = await api(trader.token, '/api/credentials', {
        method: 'POST',
        body: JSON.stringify({ credentialType: 'public_liability', name: `E2E Public Liability ${runId}`, issuer: 'BuildPair Automated QA', referenceNumber: `QA-${runId}` }),
      });
      expect(credential.status).toBe('pending');
      const credentials = await api(trader.token, '/api/credentials');
      expect(credentials.some((item) => item.id === credential.id)).toBe(true);
      await assertPage(trader.page, '/trader/trust', 'Trust');
      const notifications = await api(trader.token, '/api/notifications');
      expect(notifications.some((item) => item.type === 'credential_submitted')).toBe(true);
    });

    await test.step('Tradesperson project stories can be created, publicly listed and removed later', async () => {
      const story = await api(trader.token, '/api/stories', {
        method: 'POST',
        body: JSON.stringify({
          title: `Bathroom transformation ${runId}`,
          locationLabel: 'Staines',
          summary: 'Automated before and after project story used to verify the BuildPair tradesperson portfolio and public social-proof workflow.',
          beforePhotos: [`https://example.com/buildpair-before-${runId}.jpg`],
          afterPhotos: [],
          durationDays: 5,
          completedAt: new Date().toISOString(),
        }),
      });
      storyId = story.id;
      const publicStories = await api(customer.token, `/api/stories?traderId=${encodeURIComponent(traderUser.id)}`);
      expect(publicStories.some((item) => item.id === storyId)).toBe(true);
      await assertPage(trader.page, '/trader/stories', 'Project Stories');
    });

    const job = await test.step('Homeowner posts a direct job to this tradesperson', async () => {
      const created = await api(customer.token, '/api/jobs', {
        method: 'POST',
        body: JSON.stringify({
          targetTraderId: traderUser.id,
          title: `Feature matrix bathroom ${runId}`,
          category: 'Tiling',
          propertyType: 'House',
          postcode: 'TW18 4AA',
          urgency: 'Within 1 month',
          description: 'Prepare and tile a bathroom floor and shower walls, waterproof the wet area, grout, silicone and leave the room ready for use.',
          budgetRange: '£1,500–£5,000',
          photos: [],
          isEmergency: false,
        }),
      });
      expect(created.customerId).toBe(customerUser.id);
      expect(created.targetTraderId).toBe(traderUser.id);
      expect(created.conversationId).toBeTruthy();
      await assertPage(customer.page, `/customer/jobs/${created.id}`, created.title);
      await assertPage(trader.page, `/trader/jobs/${created.id}`, created.title);
      return created;
    });

    await test.step('Homeowner and tradesperson can message each other in the same job conversation', async () => {
      const first = await api(customer.token, `/api/conversations/${job.conversationId}/messages`, {
        method: 'POST', body: JSON.stringify({ body: `Homeowner E2E message ${runId}: please confirm availability.` }),
      });
      expect(first.body).toContain('Homeowner E2E');
      const reply = await api(trader.token, `/api/conversations/${job.conversationId}/messages`, {
        method: 'POST', body: JSON.stringify({ body: `Tradesperson E2E reply ${runId}: availability confirmed.` }),
      });
      expect(reply.body).toContain('Tradesperson E2E');
      const messages = await api(customer.token, `/api/conversations/${job.conversationId}/messages`);
      expect(messages.some((item) => item.body.includes(`Tradesperson E2E reply ${runId}`))).toBe(true);
      await assertPage(customer.page, `/customer/messages/${job.conversationId}`, 'Messages');
      await assertPage(trader.page, `/trader/messages/${job.conversationId}`, 'Messages');
    });

    const quote = await test.step('Tradesperson sends a detailed quote and homeowner accepts it', async () => {
      const created = await api(trader.token, '/api/quotes', {
        method: 'POST',
        body: JSON.stringify({
          jobId: job.id,
          laborCost: 120000,
          materialsCost: 30000,
          vatAmount: 0,
          depositAmount: 20000,
          paymentTerms: '£200 deposit on acceptance, remaining balance after agreed completion checks.',
          scope: 'Preparation, waterproofing, tiling, grouting, silicone and final clean.',
          exclusions: 'Hidden defects and customer-requested extras are excluded unless approved as a variation.',
          notes: `Feature matrix quote ${runId}`,
          durationDays: 5,
          warrantyMonths: 12,
        }),
      });
      expect(created.totalAmount).toBe(150000);
      await assertPage(customer.page, `/customer/compare/${job.id}`, profile.businessName);
      await api(customer.token, `/api/quotes/${created.id}`, { method: 'PATCH', body: JSON.stringify({ action: 'accept' }) });
      const detail = await api(customer.token, `/api/jobs/${job.id}`);
      expect(detail.job.status).toBe('in_progress');
      expect(detail.acceptedQuote.id).toBe(created.id);
      return created;
    });

    await test.step('Job variations cover accept, decline and withdraw interactions', async () => {
      const accepted = await api(trader.token, '/api/variations', {
        method: 'POST', body: JSON.stringify({ jobId: job.id, title: `Extra waterproofing ${runId}`, description: 'Additional waterproofing requested after opening the existing shower area.', amountDelta: 12500, durationDeltaDays: 1 }),
      });
      const acceptedResult = await api(customer.token, `/api/variations/${accepted.id}`, { method: 'PATCH', body: JSON.stringify({ action: 'accept' }) });
      expect(acceptedResult.status).toBe('accepted');

      const declined = await api(trader.token, '/api/variations', {
        method: 'POST', body: JSON.stringify({ jobId: job.id, title: `Optional niche ${runId}`, description: 'Optional tiled shower niche requested as an additional feature to the agreed scope.', amountDelta: 22000, durationDeltaDays: 1 }),
      });
      const declinedResult = await api(customer.token, `/api/variations/${declined.id}`, { method: 'PATCH', body: JSON.stringify({ action: 'decline' }) });
      expect(declinedResult.status).toBe('declined');

      const withdrawn = await api(trader.token, '/api/variations', {
        method: 'POST', body: JSON.stringify({ jobId: job.id, title: `Withdrawn option ${runId}`, description: 'Temporary test variation that the tradesperson withdraws before homeowner approval.', amountDelta: 5000, durationDeltaDays: 0 }),
      });
      const withdrawnResult = await api(trader.token, `/api/variations/${withdrawn.id}`, { method: 'PATCH', body: JSON.stringify({ action: 'withdraw' }) });
      expect(withdrawnResult.status).toBe('withdrawn');
      const all = await api(customer.token, `/api/variations?jobId=${encodeURIComponent(job.id)}`);
      expect(all.filter((item) => [accepted.id, declined.id, withdrawn.id].includes(item.id))).toHaveLength(3);
    });

    await test.step('Notifications are generated, individually readable and mark-all-readable', async () => {
      const customerNotifications = await api(customer.token, '/api/notifications');
      expect(customerNotifications.length).toBeGreaterThan(0);
      const unread = customerNotifications.find((item) => !item.readAt);
      if (unread) {
        const result = await api(customer.token, '/api/notifications', { method: 'PATCH', body: JSON.stringify({ id: unread.id, action: 'read' }) });
        expect(result.read).toBe(true);
      }
      const allRead = await api(customer.token, '/api/notifications', { method: 'PATCH', body: JSON.stringify({ action: 'read_all' }) });
      expect(allRead.readAll).toBe(true);
      await assertPage(customer.page, '/customer/notifications', 'Notifications');
      await assertPage(trader.page, '/trader/notifications', 'Notifications');
    });

    await test.step('Homeowner can submit a moderation report about the job/tradesperson', async () => {
      const report = await api(customer.token, '/api/reports', {
        method: 'POST',
        body: JSON.stringify({ subjectUserId: traderUser.id, jobId: job.id, reason: 'other', details: `Automated E2E moderation workflow check ${runId}. No real complaint.` }),
      });
      expect(report.status).toBe('open');
      const reports = await api(customer.token, '/api/reports');
      expect(reports.some((item) => item.id === report.id)).toBe(true);
    });

    await test.step('Tradesperson can create a job-linked invoice and exercise invoice state controls safely', async () => {
      const invoice = await api(trader.token, '/api/invoices', {
        method: 'POST',
        body: JSON.stringify({
          invoiceNumber: `MATRIX-${runId}`,
          customerId: customerUser.id,
          customerName: 'BuildPair Automated Homeowner',
          customerEmail: state.customerEmail,
          jobId: job.id,
          items: [{ description: 'Bathroom tiling labour and materials', quantity: 1, unitPrice: 150000 }],
          vatAmount: 0,
          depositAmount: 20000,
          notes: 'Automated feature-matrix draft invoice. No email or real payment is sent.',
          sendNow: false,
        }),
      });
      expect(invoice.status).toBe('draft');
      const voided = await api(trader.token, `/api/invoices/${invoice.id}`, { method: 'PATCH', body: JSON.stringify({ action: 'void' }) });
      expect(voided.status).toBe('void');
      await assertPage(trader.page, '/trader/invoices', 'Invoices');
    });

    await test.step('Tradesperson completes the hired job, homeowner confirms payment and leaves a verified review', async () => {
      await api(trader.token, `/api/jobs/${job.id}`, { method: 'PATCH', body: JSON.stringify({ action: 'complete' }) });
      let detail = await api(customer.token, `/api/jobs/${job.id}`);
      expect(detail.job.status).toBe('completed');
      const finalMilestone = detail.milestones.find((item) => item.title !== 'Deposit' && item.status === 'completed');
      expect(finalMilestone).toBeTruthy();
      const confirmation = await api(customer.token, '/api/payments/external-confirm', { method: 'POST', body: JSON.stringify({ milestoneId: finalMilestone.id }) });
      expect(confirmation.confirmation).toBe('customer_confirmed_external');
      const review = await api(customer.token, '/api/reviews', {
        method: 'POST',
        body: JSON.stringify({ jobId: job.id, traderId: traderUser.id, rating: 5, comment: `Verified BuildPair E2E review ${runId}: completed work and interaction lifecycle confirmed.` }),
      });
      expect(review.verifiedCompletion).toBe(true);
      detail = await api(customer.token, `/api/jobs/${job.id}`);
      expect(detail.existingReview.id).toBe(review.id);
    });

    await test.step('Tradesperson analytics reflect marketplace activity and public profile remains accessible', async () => {
      const analytics = await api(trader.token, '/api/analytics/trader');
      expect(Number(analytics.directLeads)).toBeGreaterThanOrEqual(1);
      expect(Number(analytics.quotesSent)).toBeGreaterThanOrEqual(1);
      expect(Number(analytics.quotesWon)).toBeGreaterThanOrEqual(1);
      expect(Number(analytics.completedJobs)).toBeGreaterThanOrEqual(1);
      expect(Number(analytics.reviewCount)).toBeGreaterThanOrEqual(1);
      await assertPage(trader.page, '/trader/analytics', 'Analytics');
      await assertPage(customer.page, `/traders/${profile.id}`, profile.businessName);
    });

    await test.step('Both dashboards still show persisted state at the end of the journey', async () => {
      await assertPage(customer.page, '/customer/dashboard', 'Homeowner');
      await assertPage(customer.page, '/customer/jobs', 'Jobs');
      await assertPage(trader.page, '/trader/dashboard', 'Tradesperson');
      await assertPage(trader.page, '/trader/my-jobs', 'Jobs');
    });
  } finally {
    if (trader?.token && savedSearchId) await api(trader.token, '/api/saved-searches', { method: 'DELETE', body: JSON.stringify({ id: savedSearchId }) }).catch(() => {});
    if (trader?.token && availabilityId) await api(trader.token, '/api/availability', { method: 'DELETE', body: JSON.stringify({ id: availabilityId }) }).catch(() => {});
    if (trader?.token && storyId) await api(trader.token, '/api/stories', { method: 'DELETE', body: JSON.stringify({ id: storyId }) }).catch(() => {});
    if (customer?.token && traderUser?.id) await api(customer.token, '/api/saved-traders', { method: 'POST', body: JSON.stringify({ traderId: traderUser.id, saved: false }) }).catch(() => {});
    await customer.context.close();
    await trader.context.close();
  }
});
