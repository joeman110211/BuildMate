import { and, eq, sql } from 'drizzle-orm';
import { getDb } from '@/db/client';
import { reviews, traderProfiles, users } from '@/db/schema';
import { authenticatedUserId, HttpError, jsonError } from '@/lib/server';

export async function GET(request: Request, { id }: { id: string }) {
  try {
    const db = getDb();
    const [profile] = await db.select({
      id: traderProfiles.id,
      userId: traderProfiles.userId,
      businessName: traderProfiles.businessName,
      tradeCategory: traderProfiles.tradeCategory,
      subSkills: traderProfiles.subSkills,
      bio: traderProfiles.bio,
      radiusMiles: traderProfiles.radiusMiles,
      qualifications: traderProfiles.qualifications,
      externalLinks: traderProfiles.externalLinks,
      photos: traderProfiles.photos,
      subscriptionTier: traderProfiles.subscriptionTier,
      isSubscriptionActive: traderProfiles.isSubscriptionActive,
      averageRating: sql<number>`coalesce(avg(${reviews.rating}), 0)::float`,
      reviewCount: sql<number>`count(${reviews.id})::int`,
    }).from(traderProfiles).leftJoin(reviews, and(eq(reviews.traderId, traderProfiles.userId), eq(reviews.verifiedCompletion, true)))
      .where(eq(traderProfiles.id, id)).groupBy(traderProfiles.id).limit(1);
    if (!profile) throw new HttpError(404, 'Trader profile not found');

    const verifiedReviews = await db.select({ id: reviews.id, rating: reviews.rating, comment: reviews.comment, createdAt: reviews.createdAt })
      .from(reviews).where(and(eq(reviews.traderId, profile.userId), eq(reviews.verifiedCompletion, true))).limit(50);

    let contact: { email: string | null; phone: string | null } | null = null;
    try {
      await authenticatedUserId(request);
      if (profile.isSubscriptionActive) {
        const [owner] = await db.select({ email: users.email, phone: users.phone }).from(users).where(eq(users.id, profile.userId)).limit(1);
        contact = owner ?? null;
      }
    } catch { /* guest: deliberately no contact details */ }

    return Response.json({ ...profile, reviews: verifiedReviews, contact, contactLocked: !contact });
  } catch (error) { return jsonError(error); }
}
