import { eq } from 'drizzle-orm';
import { getDb } from '@/db/client';
import { traderProfiles } from '@/db/schema';
import { HttpError, jsonError, requireRole } from '@/lib/server';
import { appUrl, getStripe } from '@/lib/stripe';

export async function POST(request: Request) {
  try {
    const trader = await requireRole(request, 'trader');
    const profile = await getDb().query.traderProfiles.findFirst({ where: eq(traderProfiles.userId, trader.id) });
    if (!profile?.stripeCustomerId) throw new HttpError(409, 'No billing account exists yet');
    const session = await getStripe().billingPortal.sessions.create({ customer: profile.stripeCustomerId, return_url: `${appUrl()}/trader/subscription` });
    return Response.json({ url: session.url });
  } catch (error) { return jsonError(error); }
}
