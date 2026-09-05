import { and, eq, sql } from 'drizzle-orm';
import { getDb } from '@/db/client';
import { reviews, traderProfiles, users } from '@/db/schema';
import { traderProfileShowcase } from '@/db/showcase-schema';
import { demoTraders } from '@/lib/demo-data';
import { previewDataEnabled } from '@/lib/preview';
import { authenticatedUserId, ensureDbUser, HttpError, jsonError } from '@/lib/server';
import { betaLeadGraceEnabled, TRADER_TRIAL_DAYS } from '@/lib/subscription';

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

function previewProfile(id: string) {
  if (!previewDataEnabled()) return null;
  const demoProfile = demoTraders.find((trader) => trader.id === id);
  if (!demoProfile) return null;
  return {
    ...demoProfile,
    averageRating: 0,
    reviewCount: 0,
    isPreview: true,
    ...defaultShowcase,
    yearsExperience: 12,
    serviceAreas: demoProfile.locationLabel ? [demoProfile.locationLabel] : [],
    createdAt: '2026-08-01T10:00:00.000Z',
    qualifications: ['Preview profile for BuildPair beta demonstration'],
    reviews: [],
    contact: null,
    contactLocked: true,
  };
}

export async function GET(request: Request, { id }: { id: string }) {
  try {
    // Preview profiles are static beta content. Resolve them before touching the database so a
    // database migration or optional profile-extension issue cannot break a public preview card.
    const preview = previewProfile(id);
    if (preview) return Response.json(preview);

    const db = getDb();
    const createdTrialEnd = sql<Date>`${traderProfiles.createdAt} + (${TRADER_TRIAL_DAYS} * interval '1 day')`;
    const effectiveTrialEnd = sql<Date>`greatest(coalesce(${traderProfiles.trialEndsAt}, ${createdTrialEnd}), ${createdTrialEnd})`;
    const activeLeadAccess = betaLeadGraceEnabled()
      ? sql`${traderProfiles.isSubscriptionActive} = true`
      : sql`${traderProfiles.isSubscriptionActive} = true and (${traderProfiles.stripeSubscriptionId} is not null or ${effectiveTrialEnd} > now())`;
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
      trialEndsAt: effectiveTrialEnd,
      createdAt: traderProfiles.createdAt,
      averageRating: sql<number>`coalesce(avg(${reviews.rating}), 0)::float`,
      reviewCount: sql<number>`count(${reviews.id})::int`,
    }).from(traderProfiles).leftJoin(reviews, and(eq(reviews.traderId, traderProfiles.userId), eq(reviews.verifiedCompletion, true)))
      .where(and(eq(traderProfiles.id, id), sql`NOT EXISTS (SELECT 1 FROM users u WHERE u.id = ${traderProfiles.userId} AND u.is_suspended = true)`))
      .groupBy(traderProfiles.id).limit(1);
    if (!profile) throw new HttpError(404, 'Trader profile not found');

    // Showcase fields are an optional profile extension. A missing/out-of-date extension must not
    // turn an otherwise valid public trader profile into a 500 page.
    let showcase: Record<string, unknown> = {};
    try {
      const [storedShowcase] = await db.select().from(traderProfileShowcase).where(eq(traderProfileShowcase.userId, profile.userId)).limit(1);
      showcase = storedShowcase ?? {};
    } catch {
      console.warn('[buildpair-profile] Optional showcase data unavailable', { profileId: profile.id });
    }

    const loadVerifiedReviews = () => db.select({ id: reviews.id, rating: reviews.rating, comment: reviews.comment, createdAt: reviews.createdAt })
      .from(reviews).where(and(eq(reviews.traderId, profile.userId), eq(reviews.verifiedCompletion, true))).limit(50);
    let verifiedReviews: Awaited<ReturnType<typeof loadVerifiedReviews>> = [];
    try {
      verifiedReviews = await loadVerifiedReviews();
    } catch {
      console.warn('[buildpair-profile] Verified reviews unavailable', { profileId: profile.id });
    }

    let contact: { email: string | null; phone: string | null } | null = null;
    try {
      const viewerId = await authenticatedUserId(request);
      await ensureDbUser(viewerId);
      if (profile.isSubscriptionActive) {
        const [owner] = await db.select({ email: users.email, phone: users.phone }).from(users).where(eq(users.id, profile.userId)).limit(1);
        contact = owner ?? null;
      }
    } catch { /* guest or suspended viewer: deliberately no contact details */ }

    return Response.json({ ...profile, isPreview: false, ...defaultShowcase, ...showcase, reviews: verifiedReviews, contact, contactLocked: !contact });
  } catch (error) { return jsonError(error); }
}
