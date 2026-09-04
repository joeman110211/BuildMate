import { eq } from 'drizzle-orm';
import { getDb } from '@/db/client';
import { traderProfiles } from '@/db/schema';
import { HttpError, jsonError, requireRole } from '@/lib/server';
import { hasActiveLeadAccess } from '@/lib/subscription';

export async function GET(request: Request) {
  try {
    const trader = await requireRole(request, 'trader');
    const profile = await getDb().query.traderProfiles.findFirst({ where: eq(traderProfiles.userId, trader.id) });
    if (!profile) throw new HttpError(404, 'Trader profile not found');
    return Response.json({ ...profile, isSubscriptionActive: hasActiveLeadAccess(profile) });
  } catch (error) { return jsonError(error); }
}
