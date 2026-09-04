import { eq } from 'drizzle-orm';
import { z } from 'zod';
import { getDb } from '@/db/client';
import { traderProfiles } from '@/db/schema';
import { HttpError, jsonError, requireRole } from '@/lib/server';
import { getStripe, providerReturnUrl } from '@/lib/stripe';

const inputSchema = z.object({ tier: z.enum(['basic', 'featured']) });

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
      const customer = await stripe.customers.create({ email: trader.email ?? undefined, phone: trader.phone ?? undefined, metadata: { buildmateUserId: trader.id } });
      customerId = customer.id;
      await db.update(traderProfiles).set({ stripeCustomerId: customerId }).where(eq(traderProfiles.userId, trader.id));
    }
    const price = tier === 'basic' ? process.env.STRIPE_BASIC_PRICE_ID : process.env.STRIPE_FEATURED_PRICE_ID;
    if (!price) throw new Error(`Stripe price for ${tier} is not configured`);
    const session = await stripe.checkout.sessions.create({
      mode: 'subscription', customer: customerId, line_items: [{ price, quantity: 1 }], allow_promotion_codes: true,
      success_url: providerReturnUrl('subscription', 'complete'),
      cancel_url: providerReturnUrl('subscription', 'cancelled'),
      metadata: { buildmateUserId: trader.id, tier },
      subscription_data: { metadata: { buildmateUserId: trader.id, tier } },
    });
    return Response.json({ url: session.url });
  } catch (error) { return jsonError(error); }
}
