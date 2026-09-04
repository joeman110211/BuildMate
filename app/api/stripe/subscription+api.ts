import { eq } from 'drizzle-orm';
import { z } from 'zod';
import { getDb } from '@/db/client';
import { traderProfiles } from '@/db/schema';
import { HttpError, jsonError, requireRole } from '@/lib/server';
import { getStripe, providerReturnUrl } from '@/lib/stripe';

const inputSchema = z.object({ tier: z.enum(['basic', 'featured']) });

const plans = {
  basic: { name: 'BuildMate Basic', unitAmount: 1999 },
  featured: { name: 'BuildMate Featured', unitAmount: 2999 },
} as const;

export async function POST(request: Request) {
  try {
    const trader = await requireRole(request, 'trader');
    const { tier } = inputSchema.parse(await request.json());
    const db = getDb();
    const profile = await db.query.traderProfiles.findFirst({ where: eq(traderProfiles.userId, trader.id) });
    if (!profile) throw new HttpError(409, 'Complete your profile first');

    const stripe = getStripe();
    let customerId = profile.stripeCustomerId;
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: trader.email ?? undefined,
        phone: trader.phone ?? undefined,
        metadata: { buildmateUserId: trader.id },
      });
      customerId = customer.id;
      await db.update(traderProfiles).set({ stripeCustomerId: customerId }).where(eq(traderProfiles.userId, trader.id));
    }

    const plan = plans[tier];
    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      customer: customerId,
      line_items: [
        {
          price_data: {
            currency: 'gbp',
            unit_amount: plan.unitAmount,
            recurring: { interval: 'month' },
            product_data: { name: plan.name },
          },
          quantity: 1,
        },
      ],
      allow_promotion_codes: true,
      success_url: providerReturnUrl('subscription', 'complete'),
      cancel_url: providerReturnUrl('subscription', 'cancelled'),
      metadata: { buildmateUserId: trader.id, tier },
      subscription_data: { metadata: { buildmateUserId: trader.id, tier } },
    });

    return Response.json({ url: session.url });
  } catch (error) {
    return jsonError(error);
  }
}
