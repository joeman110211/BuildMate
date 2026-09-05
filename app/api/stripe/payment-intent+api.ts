import { and, eq } from 'drizzle-orm';
import { z } from 'zod';
import { getDb } from '@/db/client';
import { jobMilestones, jobs, payments, quotes, traderProfiles } from '@/db/schema';
import { HttpError, jsonError, requireRole } from '@/lib/server';
import { getStripe, providerReturnUrl } from '@/lib/stripe';

const schema = z.object({ milestoneId: z.uuid(), platform: z.enum(['native', 'web']).default('native') });

export async function POST(request: Request) {
  try {
    const customer = await requireRole(request, 'customer');
    const input = schema.parse(await request.json());
    const db = getDb();
    const [row] = await db.select({ milestone: jobMilestones, job: jobs, quote: quotes, profile: traderProfiles })
      .from(jobMilestones).innerJoin(jobs, eq(jobs.id, jobMilestones.jobId)).innerJoin(quotes, eq(quotes.id, jobMilestones.quoteId)).innerJoin(traderProfiles, eq(traderProfiles.userId, quotes.traderId))
      .where(and(eq(jobMilestones.id, input.milestoneId), eq(jobs.customerId, customer.id))).limit(1);
    if (!row) throw new HttpError(404, 'Payment milestone not found');
    if (row.milestone.status === 'paid') throw new HttpError(409, 'Milestone is already paid');
    if (row.milestone.title !== 'Deposit' && row.milestone.status !== 'completed') throw new HttpError(409, 'The trader must mark this milestone complete before payment');
    if (!row.profile.stripeAccountId || !row.profile.stripeChargesEnabled) throw new HttpError(409, 'Trader has not completed Stripe payout onboarding');
    const stripe = getStripe();
    const feePercent = Math.min(20, Math.max(0, Number(process.env.PLATFORM_FEE_PERCENT ?? 5)));
    const fee = Math.round(row.milestone.amount * feePercent / 100);
    const metadata = { buildpairJobId: row.job.id, milestoneId: row.milestone.id, customerId: customer.id, traderId: row.quote.traderId };
    if (input.platform === 'web') {
      const session = await stripe.checkout.sessions.create({ mode: 'payment', customer_email: customer.email ?? undefined, line_items: [{ price_data: { currency: 'gbp', product_data: { name: `${row.milestone.title}: ${row.job.title}` }, unit_amount: row.milestone.amount }, quantity: 1 }], payment_intent_data: { application_fee_amount: fee, transfer_data: { destination: row.profile.stripeAccountId }, metadata }, success_url: providerReturnUrl('payment', 'complete'), cancel_url: providerReturnUrl('payment', 'cancelled'), metadata });
      return Response.json({ url: session.url });
    }
    const intent = await stripe.paymentIntents.create({ amount: row.milestone.amount, currency: 'gbp', automatic_payment_methods: { enabled: true }, application_fee_amount: fee, transfer_data: { destination: row.profile.stripeAccountId }, metadata });
    await db.insert(payments).values({ jobId: row.job.id, milestoneId: row.milestone.id, customerId: customer.id, traderId: row.quote.traderId, amount: row.milestone.amount, platformFee: fee, stripePaymentIntentId: intent.id });
    return Response.json({ clientSecret: intent.client_secret });
  } catch (error) { return jsonError(error); }
}
