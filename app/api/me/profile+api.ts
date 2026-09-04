import { eq } from 'drizzle-orm';
import { getDb } from '@/db/client';
import { traderProfiles } from '@/db/schema';
import { traderProfileShowcase } from '@/db/showcase-schema';
import { HttpError, jsonError, requireRole } from '@/lib/server';
import { hasActiveLeadAccess } from '@/lib/subscription';

export async function GET(request: Request) {
  try {
    const trader = await requireRole(request, 'trader');
    const db = getDb();
    const profile = await db.query.traderProfiles.findFirst({ where: eq(traderProfiles.userId, trader.id) });
    if (!profile) throw new HttpError(404, 'Trader profile not found');
    const [showcase] = await db.select().from(traderProfileShowcase).where(eq(traderProfileShowcase.userId, trader.id)).limit(1);
    return Response.json({ ...profile, ...(showcase ?? {}), isSubscriptionActive: hasActiveLeadAccess(profile) });
  } catch (error) { return jsonError(error); }
}
