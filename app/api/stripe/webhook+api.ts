import type Stripe from 'stripe';
import { eq } from 'drizzle-orm';
import { getDb } from '@/db/client';
import { jobMilestones, payments, traderProfiles } from '@/db/schema';
import { getSql } from '@/lib/sql';
import { getStripe } from '@/lib/stripe';

export async function POST(request: Request) {
  const signature = request.headers.get('stripe-signature');
  const secrets = [process.env.STRIPE_WEBHOOK_SECRET, process.env.STRIPE_CONNECT_WEBHOOK_SECRET]
    .map((value) => value?.trim())
    .filter((value): value is string => Boolean(value));

  if (!signature || secrets.length === 0) return new Response('Webhook not configured', { status: 400 });

  try {
    const payload = await request.text();
    const stripe = getStripe();
    let event: Stripe.Event | undefined;

    for (const secret of secrets) {
      try {
        event = await stripe.webhooks.constructEventAsync(payload, signature, secret);
        break;
      } catch {
        // Platform and Connect destinations have different signing secrets.
      }
    }

    if (!event) return new Response('Invalid webhook', { status: 400 });
    await handleEvent(event);
    return Response.json({ received: true });
  } catch (error) {
    console.error('Stripe webhook failure', error);
    return new Response('Invalid webhook', { status: 400 });
  }
}

async function recordStripeMilestoneAudit(milestoneId: string) {
  try {
    await getSql()`
      UPDATE job_milestones
      SET payment_method = 'stripe', payment_confirmed_by = NULL
      WHERE id = ${milestoneId}
    `;
  } catch {
    // Older deployments can briefly receive a webhook before migration 0009 is
    // applied. Payment success must not be lost merely because audit columns lag.
  }
}

async function handleEvent(event: Stripe.Event) {
  const db = getDb();

  if (event.type === 'account.updated') {
    const account = event.data.object;
    await db.update(traderProfiles).set({ stripeChargesEnabled: Boolean(account.charges_enabled), updatedAt: new Date() }).where(eq(traderProfiles.stripeAccountId, account.id));
    return;
  }

  if (event.type === 'customer.subscription.updated' || event.type === 'customer.subscription.created') {
    const subscription = event.data.object;
    // Accept metadata written before and after the BuildPair rebrand so existing
    // test/live Stripe objects are not orphaned during the transition.
    const userId = subscription.metadata.buildpairUserId ?? subscription.metadata.buildmateUserId;
    const tier = subscription.metadata.tier;
    if (userId && (tier === 'basic' || tier === 'featured')) {
      const active = ['active', 'trialing'].includes(subscription.status);
      await db.update(traderProfiles).set({ stripeSubscriptionId: subscription.id, subscriptionTier: active ? tier : 'free', isSubscriptionActive: active, updatedAt: new Date() }).where(eq(traderProfiles.userId, userId));
    }
    return;
  }

  if (event.type === 'customer.subscription.deleted') {
    const subscription = event.data.object;
    await db.update(traderProfiles).set({ subscriptionTier: 'free', isSubscriptionActive: false, updatedAt: new Date() }).where(eq(traderProfiles.stripeSubscriptionId, subscription.id));
    return;
  }

  if (event.type === 'payment_intent.succeeded') {
    const intent = event.data.object;
    const jobId = intent.metadata.buildpairJobId ?? intent.metadata.buildmateJobId;
    const { milestoneId, customerId, traderId } = intent.metadata;
    if (!jobId || !milestoneId || !customerId || !traderId) return;
    const milestone = await db.query.jobMilestones.findFirst({ where: eq(jobMilestones.id, milestoneId) });
    if (!milestone) return;
    const chargeAmount = intent.amount_received || intent.amount;
    await db.insert(payments).values({ jobId, milestoneId, customerId, traderId, amount: chargeAmount, platformFee: intent.application_fee_amount ?? 0, stripePaymentIntentId: intent.id, status: 'paid', paidAt: new Date() }).onConflictDoUpdate({ target: payments.stripePaymentIntentId, set: { status: 'paid', paidAt: new Date() } });
    await db.update(jobMilestones).set({ status: 'paid', paidAt: new Date(), completedAt: milestone.completedAt ?? new Date() }).where(eq(jobMilestones.id, milestoneId));
    await recordStripeMilestoneAudit(milestoneId);
    return;
  }

  if (event.type === 'payment_intent.payment_failed') {
    const intent = event.data.object;
    await db.update(payments).set({ status: 'failed' }).where(eq(payments.stripePaymentIntentId, intent.id));
  }
}
