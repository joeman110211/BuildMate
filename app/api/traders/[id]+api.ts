import { and, eq, sql } from 'drizzle-orm';
import { getDb } from '@/db/client';
import { reviews, traderProfiles, users } from '@/db/schema';
import { traderProfileShowcase } from '@/db/showcase-schema';
import { demoTraders } from '@/lib/demo-data';
import { authenticatedUserId, ensureDbUser, HttpError, jsonError } from '@/lib/server';

const defaultShowcase = {
  template: 'classic' as const,
  colourTheme: 'burnt_orange' as const,
  coverPhotoUrl: null,
  profileImageUrl: null,
  logoUrl: null,
  yearsExperience: 0,
  yearEstablished: null,
  serviceAreas: [] as string[],
  beforeAfterProjects: [] as { before: string; after: string; caption?: string }[],
};

export async function GET(request: Request, { id }: { id: string }) {
  try {
    const db = getDb();
    const activeLeadAccess = sql`${traderProfiles.isSubscriptionActive} = true and (${traderProfiles.stripeSubscriptionId} is not null or ${traderProfiles.createdAt} + interval '14 days' > now())`;
    const trialEndsAt = sql<Date>`${traderProfiles.createdAt} + interval '14 days'`;
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
      trialEndsAt,
      createdAt: traderProfiles.createdAt,
      averageRating: sql<number>`coalesce(avg(${reviews.rating}), 0)::float`,
      reviewCount: sql<number>`count(${reviews.id})::int`,
    }).from(traderProfiles).leftJoin(reviews, and(eq(reviews.traderId, traderProfiles.userId), eq(reviews.verifiedCompletion, true)))
      .where(and(eq(traderProfiles.id, id), sql`NOT EXISTS (SELECT 1 FROM users u WHERE u.id = ${traderProfiles.userId} AND u.is_suspended = true)`))
      .groupBy(traderProfiles.id).limit(1);
    if (!profile) {
      const demoProfile = demoTraders.find((trader) => trader.id === id);
      if (!demoProfile) throw new HttpError(404, 'Trader profile not found');
      return Response.json({
        ...demoProfile,
        ...defaultShowcase,
        yearsExperience: 12,
        serviceAreas: demoProfile.locationLabel ? [demoProfile.locationLabel] : [],
        createdAt: '2026-08-01T10:00:00.000Z',
        qualifications: ['Public liability insurance declared', 'Trade experience self-certified'],
        reviews: [
          { id: `${demoProfile.id}-review-1`, rating: 5, comment: 'Clear quote, turned up when promised and left the place tidy.', createdAt: '2026-08-18T10:00:00.000Z' },
          { id: `${demoProfile.id}-review-2`, rating: 4, comment: 'Good communication and a solid finish for the price.', createdAt: '2026-08-29T14:00:00.000Z' },
        ],
        contact: null,
        contactLocked: true,
      });
    }

    const [showcase] = await db.select().from(traderProfileShowcase).where(eq(traderProfileShowcase.userId, profile.userId)).limit(1);
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

    return Response.json({ ...profile, ...defaultShowcase, ...(showcase ?? {}), reviews: verifiedReviews, contact, contactLocked: !contact });
  } catch (error) { return jsonError(error); }
}
