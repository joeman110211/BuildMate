import { and, desc, eq, sql } from 'drizzle-orm';
import { getDb } from '@/db/client';
import { reviews, traderProfiles } from '@/db/schema';
import { demoTraders } from '@/lib/demo-data';
import { previewDataEnabled } from '@/lib/preview';
import { jsonError } from '@/lib/server';
import { TRADER_TRIAL_DAYS } from '@/lib/subscription';

function canonicalTradeCategory(category: string) {
  if (category === 'Plastering') return 'Plastering & Rendering';
  if (category === 'Joinery') return 'Carpentry & Joinery';
  return category;
}

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const trade = url.searchParams.get('trade');
    const activeAccount = sql`NOT EXISTS (
      SELECT 1 FROM users u
      WHERE u.id = ${traderProfiles.userId}
        AND (coalesce(u.is_suspended, false) = true OR coalesce(u.is_deleted, false) = true OR coalesce(u.email, '') LIKE '%@buildpair.test')
    )`;
    const createdTrialEnd = sql<Date>`${traderProfiles.createdAt} + (${TRADER_TRIAL_DAYS} * interval '1 day')`;
    const effectiveTrialEnd = sql<Date>`greatest(coalesce(${traderProfiles.trialEndsAt}, ${createdTrialEnd}), ${createdTrialEnd})`;
    const activeLeadAccess = sql`${traderProfiles.isSubscriptionActive} = true and (${traderProfiles.stripeSubscriptionId} is not null or ${effectiveTrialEnd} > now())`;
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
      trialEndsAt: effectiveTrialEnd,
      averageRating: sql<number>`coalesce(avg(${reviews.rating}), 0)::float`,
      reviewCount: sql<number>`count(${reviews.id})::int`,
      verifiedCredentialCount: sql<number>`(SELECT count(*)::int FROM trader_credentials tc WHERE tc.trader_id = ${traderProfiles.userId} AND tc.status = 'verified' AND (tc.expires_at IS NULL OR tc.expires_at > now()))`,
      availabilitySummary: sql<string | null>`(SELECT CASE WHEN count(*) > 0 THEN 'Available soon' ELSE NULL END FROM trader_availability ta WHERE ta.trader_id = ${traderProfiles.userId} AND ta.status = 'available' AND ta.ends_at >= now() AND ta.starts_at <= now() + interval '30 days')`,
    }).from(traderProfiles).leftJoin(reviews, and(eq(reviews.traderId, traderProfiles.userId), eq(reviews.verifiedCompletion, true))).where(where)
      .groupBy(traderProfiles.id)
      .orderBy(
        desc(sql`${traderProfiles.subscriptionTier} = 'featured'`),
        desc(sql`(SELECT count(*) FROM trader_credentials tc WHERE tc.trader_id = ${traderProfiles.userId} AND tc.status = 'verified' AND (tc.expires_at IS NULL OR tc.expires_at > now()))`),
        desc(sql`avg(${reviews.rating})`),
      ).limit(100);

    const previewTraders = previewDataEnabled(request)
      ? demoTraders
          .map((trader) => ({ ...trader, tradeCategory: canonicalTradeCategory(trader.tradeCategory) }))
          .filter((trader) => !trade || trader.tradeCategory === trade)
          .map((trader) => ({ ...trader, averageRating: 0, reviewCount: 0, verifiedCredentialCount: 0, availabilitySummary: null, isPreview: true }))
      : [];
    const combined = [...rows.map((trader) => ({ ...trader, isPreview: false })), ...previewTraders].slice(0, 100);

    return Response.json(combined);
  } catch (error) { return jsonError(error); }
}
