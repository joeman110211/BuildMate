import process from 'node:process';
import assert from 'node:assert/strict';

if (process.env.CI !== 'true' || process.env.BUILDPAIR_E2E_MODE !== '1' || process.env.VERCEL_ENV) {
  throw new Error('Core E2E workflow is restricted to non-Vercel CI runs');
}

const baseUrl = (process.env.BUILDPAIR_E2E_BASE_URL ?? 'http://127.0.0.1:8081').replace(/\/$/, '');
const e2eToken = process.env.BUILDPAIR_E2E_TOKEN;
if (!e2eToken) throw new Error('BUILDPAIR_E2E_TOKEN is required');

function authHeaders(userId) {
  return {
    'content-type': 'application/json',
    'x-buildpair-e2e-token': e2eToken,
    'x-buildpair-e2e-user': userId,
  };
}

async function request(path, { userId, method = 'GET', body, expected = 200 } = {}) {
  const response = await fetch(`${baseUrl}${path}`, {
    method,
    headers: userId ? authHeaders(userId) : { 'content-type': 'application/json' },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const text = await response.text();
  let payload = null;
  if (text) {
    try { payload = JSON.parse(text); }
    catch { payload = text; }
  }
  assert.equal(
    response.status,
    expected,
    `${method} ${path} returned ${response.status}, expected ${expected}: ${text}`,
  );
  return payload;
}

console.log('1/9 Homeowner discovers a real trader');
const traders = await request('/api/traders?trade=Tiling');
assert.ok(Array.isArray(traders));
const trader = traders.find((candidate) => candidate.userId === 'e2e-trader');
assert.ok(trader, 'Seeded trader must appear in the directory');
assert.equal(trader.isPreview, false);

console.log('2/9 Homeowner sends the trader a real job request');
const job = await request('/api/jobs', {
  userId: 'e2e-customer',
  method: 'POST',
  expected: 201,
  body: {
    targetTraderId: 'e2e-trader',
    title: 'Retile family bathroom walls and floor',
    category: 'Tiling',
    propertyType: 'House',
    postcode: 'TW18 4AB',
    urgency: 'Within 2 weeks',
    description: 'Remove the existing bathroom tiles, prepare the walls and floor, waterproof the shower area and install new porcelain tiles throughout.',
    aiGeneratedSpec: null,
    budgetRange: '£1,500–£5,000',
    photos: [],
  },
});
assert.equal(job.targetTraderId, 'e2e-trader');
assert.equal(job.isPreview, false);
assert.equal(job.requiresPlatformPayment, false, 'Payments-off beta jobs must not require Stripe');
assert.ok(job.conversationId, 'Direct job should open a conversation');

console.log('3/9 Tradesperson receives the lead');
const traderJobs = await request('/api/jobs', { userId: 'e2e-trader' });
assert.ok(traderJobs.some((candidate) => candidate.id === job.id), 'Trader must receive the direct lead');

console.log('4/9 Tradesperson sends a quote');
const quote = await request('/api/quotes', {
  userId: 'e2e-trader',
  method: 'POST',
  expected: 201,
  body: {
    jobId: job.id,
    laborCost: 180000,
    materialsCost: 70000,
    vatAmount: 0,
    depositAmount: 50000,
    paymentTerms: 'Deposit on acceptance, balance after completion.',
    notes: 'Includes preparation, tanking, tiling, grout and silicone.',
  },
});
assert.equal(quote.totalAmount, 250000);
assert.equal(quote.status, 'pending');
assert.equal(quote.conversationId, job.conversationId);

console.log('5/9 Homeowner accepts the quote atomically');
await request(`/api/quotes/${quote.id}`, {
  userId: 'e2e-customer',
  method: 'PATCH',
  body: { action: 'accept' },
});
const awarded = await request(`/api/jobs/${job.id}`, { userId: 'e2e-customer' });
assert.equal(awarded.job.status, 'in_progress');
assert.equal(awarded.acceptedQuote.id, quote.id);
assert.ok(awarded.milestones.length >= 1);

console.log('6/9 Both sides communicate inside the job');
await request(`/api/conversations/${job.conversationId}/messages`, {
  userId: 'e2e-customer',
  method: 'POST',
  expected: 201,
  body: { body: 'Quote accepted. Monday morning works for us.' },
});
await request(`/api/conversations/${job.conversationId}/messages`, {
  userId: 'e2e-trader',
  method: 'POST',
  expected: 201,
  body: { body: 'Confirmed. I will arrive at 8:30am and protect the hallway first.' },
});
const messages = await request(`/api/conversations/${job.conversationId}/messages`, { userId: 'e2e-customer' });
assert.equal(messages.length, 2);
assert.equal(messages[0].senderId, 'e2e-customer');
assert.equal(messages[1].senderId, 'e2e-trader');

console.log('7/9 Tradesperson completes the agreed work');
await request(`/api/jobs/${job.id}`, {
  userId: 'e2e-trader',
  method: 'PATCH',
  body: { action: 'complete' },
});
const completed = await request(`/api/jobs/${job.id}`, { userId: 'e2e-customer' });
assert.equal(completed.job.status, 'completed');
assert.ok(completed.milestones.some((milestone) => milestone.title !== 'Deposit' && milestone.status === 'completed'));

console.log('8/9 Homeowner leaves a completion-verified beta review');
const review = await request('/api/reviews', {
  userId: 'e2e-customer',
  method: 'POST',
  expected: 201,
  body: {
    jobId: job.id,
    traderId: 'e2e-trader',
    rating: 5,
    comment: 'Work completed as agreed and the bathroom was left clean and tidy.',
  },
});
assert.equal(review.verifiedCompletion, true);

console.log('9/9 Verified review is reflected on the public trader profile');
const publicProfile = await request(`/api/traders/${trader.id}`);
assert.equal(publicProfile.isPreview, false);
assert.equal(publicProfile.reviewCount, 1);
assert.equal(publicProfile.averageRating, 5);
assert.equal(publicProfile.reviews.length, 1);

console.log('BuildPair core Homeowner ↔ Tradesperson E2E workflow passed.');
