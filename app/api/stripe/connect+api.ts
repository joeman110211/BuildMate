import { eq } from 'drizzle-orm';
import { getDb } from '@/db/client';
import { traderProfiles } from '@/db/schema';
import { HttpError, jsonError, requireRole } from '@/lib/server';
import { getStripe, providerReturnUrl } from '@/lib/stripe';

export async function POST(request: Request) {
  try {
    const trader = await requireRole(request, 'trader');
    const db = getDb();
    const profile = await db.query.traderProfiles.findFirst({ where: eq(traderProfiles.userId, trader.id) });
    if (!profile) throw new HttpError(409, 'Complete your profile first');
    const stripe = getStripe();
    let accountId = profile.stripeAccountId;
    if (!accountId) {
      const account = await stripe.accounts.create({
        type: 'express',
        country: 'GB',
        email: trader.email ?? undefined,
        capabilities: {
          card_payments: { requested: true },
          transfers: { requested: true },
        },
        metadata: { buildpairUserId: trader.id },
      });
      accountId = account.id;
      await db.update(traderProfiles).set({ stripeAccountId: accountId }).where(eq(traderProfiles.userId, trader.id));
    }
    const link = await stripe.accountLinks.create({
      account: accountId,
      type: 'account_onboarding',
      refresh_url: providerReturnUrl('connect', 'retry'),
      return_url: providerReturnUrl('connect', 'complete'),
    });
    return Response.json({ url: link.url });
  } catch (error) { return jsonError(error); }
}
