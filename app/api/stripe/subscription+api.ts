import type Stripe from 'stripe';
import { eq } from 'drizzle-orm';
import { z } from 'zod';
import { getDb } from '@/db/client';
import { traderProfiles } from '@/db/schema';
import { HttpError, jsonError, requireRole } from '@/lib/server';
import { getStripe, providerReturnUrl } from '@/lib/stripe';
import { trialEndsAt } from '@/lib/subscription';

const inputSchema = z.object({ tier: z.enum(['basic', 'featured']) });

const plans = {
  basic: { name: 'BuildPair Basic', unitAmount: 1999, priceEnv: 'STRIPE_BASIC_PRICE_ID' },
  featured: { name: 'BuildPair Featured', unitAmount: 2999, priceEnv: 'STRIPE_FEATURED_PRICE_ID' },
} as const;

export async function POST(request: Request) {
  try {
    const trader = await requireRole(request, 'trader');
    const { tier } = inputSchema.parse(await request.json());
    const db = getDb();
    const [profile] = await db.select({
      stripeCustomerId: traderProfiles.stripeCustomerId,
      createdAt: traderProfiles.createdAt,
      trialEndsAt: traderProfiles.trialEndsAt,
    }).from(traderProfiles).where(eq(traderProfiles.userId, trader.id)).limit(1);
    if (!profile) throw new HttpError(409, 'Complete your profile first');

    const stripe = getStripe();
    let customerId = profile.stripeCustomerId;
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: trader.email ?? undefined,
        phone: trader.phone ?? undefined,
        metadata: { buildpairUserId: trader.id },
      });
      customerId = customer.id;
      await db.update(traderProfiles).set({ stripeCustomerId: customerId }).where(eq(traderProfiles.userId, trader.id));
    }

    const subscriptionData: Stripe.Checkout.SessionCreateParams.SubscriptionData = {
      metadata: { buildpairUserId: trader.id, tier },
    };
    const minimumTrialEnd = trialEndsAt(profile.createdAt);
    const storedTrialEnd = profile.trialEndsAt ? new Date(profile.trialEndsAt) : null;
    const freeTrialEnd = storedTrialEnd && storedTrialEnd > minimumTrialEnd ? storedTrialEnd : minimumTrialEnd;
    const trialEndMs = freeTrialEnd.getTime();
    const now = Date.now();
    if (trialEndMs > now) {
      // Stripe Checkout requires an explicit trial_end to be at least 48 hours away.
      // If less than 48 hours remain, give one final trial day rather than charging early.
      if (trialEndMs >= now + 48 * 60 * 60 * 1000) subscriptionData.trial_end = Math.floor(trialEndMs / 1000);
      else subscriptionData.trial_period_days = 1;
    }

    const plan = plans[tier];
    const configuredPriceId = process.env[plan.priceEnv]?.trim();
    const lineItem: Stripe.Checkout.SessionCreateParams.LineItem = configuredPriceId
      ? { price: configuredPriceId, quantity: 1 }
      : {
          price_data: {
            currency: 'gbp',
            unit_amount: plan.unitAmount,
            recurring: { interval: 'month' },
            product_data: { name: plan.name },
          },
          quantity: 1,
        };

    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      customer: customerId,
      client_reference_id: trader.id,
      line_items: [lineItem],
      allow_promotion_codes: true,
      success_url: providerReturnUrl('subscription', 'complete'),
      cancel_url: providerReturnUrl('subscription', 'cancelled'),
      metadata: { buildpairUserId: trader.id, tier },
      subscription_data: subscriptionData,
    });

    return Response.json({ url: session.url });
  } catch (error) {
    return jsonError(error);
  }
}
