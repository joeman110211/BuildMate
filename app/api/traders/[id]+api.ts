import { and, eq, sql } from 'drizzle-orm';
import { getDb } from '@/db/client';
import { reviews, traderProfiles, users } from '@/db/schema';
import { authenticatedUserId, ensureDbUser, HttpError, jsonError } from '@/lib/server';

export async function GET(request: Request, { id }: { id: string }) {
  try {
    const db = getDb();
    const activeLeadAccess = sql`${traderProfiles.isSubscriptionActive} = true and (${traderProfiles.trialEndsAt} is null or ${traderProfiles.trialEndsAt} > now() or ${traderProfiles.stripeSubscriptionId} is not null)`;
    const [profile] = await db.select({
      id: traderProfiles.id,
      userId: traderProfiles.userId,
      businessName: traderProfiles.businessName,
      tradeCategory: traderProfiles.tradeCategory,
      subSkills: traderProfiles.subSkills,
      bio: traderProfiles.bio,
      radiusMiles: traderProfiles.radiusMiles,
      locationLabel: traderProfiles.locationLabel,
      qualifications: traderProfiles.qualifications,
      externalLinks: traderProfiles.externalLinks,
      photos: traderProfiles.photos,
      subscriptionTier: traderProfiles.subscriptionTier,
      isSubscriptionActive: activeLeadAccess,
      trialEndsAt: traderProfiles.trialEndsAt,
      averageRating: sql<number>`coalesce(avg(${reviews.rating}), 0)::float`,
      reviewCount: sql<number>`count(${reviews.id})::int`,
    }).from(traderProfiles).leftJoin(reviews, and(eq(reviews.traderId, traderProfiles.userId), eq(reviews.verifiedCompletion, true)))
      .where(and(eq(traderProfiles.id, id), sql`NOT EXISTS (SELECT 1 FROM users u WHERE u.id = ${traderProfiles.userId} AND u.is_suspended = true)`))
      .groupBy(traderProfiles.id).limit(1);
    if (!profile) throw new HttpError(404, 'Trader profile not found');

    const verifiedReviews = await db.select({ id: reviews.id, rating: reviews.rating, comment: reviews.comment, createdAt: reviews.createdAt })
      .from(reviews).where(and(eq(reviews.traderId, profile.userId), eq(reviews.verifiedCompletion, true))).limit(50);

    let contact: { email: string | null; phone: string | null } | null = null;
    try {
      const viewerId = await authenticatedUserId(request);
      await ensureDbUser(viewerId);
      if (profile.isSubscriptionActive) {
        const [owner] = await db.select({ email: users.email, phone: users.phone }).from(users).where(eq(users.id, profile.userId)).limit(1);
        contact = owner ?? null;
      }
    } catch { /* guest or suspended viewer: deliberately no contact details */ }

    return Response.json({ ...profile, reviews: verifiedReviews, contact, contactLocked: !contact });
  } catch (error) { return jsonError(error); }
}
