import { and, desc, eq, sql } from 'drizzle-orm';
import { getDb } from '@/db/client';
import { reviews, traderProfiles } from '@/db/schema';
import { demoTraders } from '@/lib/demo-data';
import { jsonError } from '@/lib/server';

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const trade = url.searchParams.get('trade');
    const activeAccount = sql`NOT EXISTS (SELECT 1 FROM users u WHERE u.id = ${traderProfiles.userId} AND u.is_suspended = true)`;
    const activeLeadAccess = sql`${traderProfiles.isSubscriptionActive} = true and (${traderProfiles.stripeSubscriptionId} is not null or ${traderProfiles.createdAt} + interval '14 days' > now())`;
    const trialEndsAt = sql<Date>`${traderProfiles.createdAt} + interval '14 days'`;
    const where = trade
      ? and(activeLeadAccess, eq(traderProfiles.tradeCategory, trade), activeAccount)
      : and(activeLeadAccess, activeAccount);
    const db = getDb();
    const rows = await db.select({
      id: traderProfiles.id,
      userId: traderProfiles.userId,
      businessName: traderProfiles.businessName,
      tradeCategory: traderProfiles.tradeCategory,
      subSkills: traderProfiles.subSkills,
      bio: traderProfiles.bio,
      radiusMiles: traderProfiles.radiusMiles,
      locationLabel: traderProfiles.locationLabel,
      externalLinks: traderProfiles.externalLinks,
      photos: traderProfiles.photos,
      subscriptionTier: traderProfiles.subscriptionTier,
      isSubscriptionActive: activeLeadAccess,
      trialEndsAt,
      averageRating: sql<number>`coalesce(avg(${reviews.rating}), 0)::float`,
      reviewCount: sql<number>`count(${reviews.id})::int`,
    }).from(traderProfiles).leftJoin(reviews, and(eq(reviews.traderId, traderProfiles.userId), eq(reviews.verifiedCompletion, true))).where(where)
      .groupBy(traderProfiles.id).orderBy(desc(sql`${traderProfiles.subscriptionTier} = 'featured'`), desc(sql`avg(${reviews.rating})`)).limit(100);
    if (!rows.length) {
      const seeded = trade ? demoTraders.filter((trader) => trader.tradeCategory === trade) : demoTraders;
      return Response.json(seeded);
    }
    return Response.json(rows);
  } catch (error) { return jsonError(error); }
}
