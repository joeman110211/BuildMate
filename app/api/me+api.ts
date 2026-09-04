import { eq } from 'drizzle-orm';
import { getDb } from '@/db/client';
import { traderProfiles, users } from '@/db/schema';
import { traderProfileShowcase } from '@/db/showcase-schema';
import { InvalidPostcodeError, lookupPostcode } from '@/lib/postcode';
import { accountAccess, authenticatedUserId, ensureDbUser, HttpError, jsonError } from '@/lib/server';
import { roleSchema, traderProfileSchema } from '@/lib/validation';

export async function GET(request: Request) {
  try {
    const userId = await authenticatedUserId(request);
    const user = await ensureDbUser(userId);
    const access = await accountAccess(userId);
    return Response.json({ ...user, isAdmin: access.isAdmin, isSuspended: access.isSuspended });
  } catch (error) { return jsonError(error); }
}

export async function PATCH(request: Request) {
  try {
    const userId = await authenticatedUserId(request);
    const current = await ensureDbUser(userId);
    const payload = roleSchema.parse(await request.json());
    if (current.role && current.role !== payload.role) throw new HttpError(409, 'Account role is already locked');
    const [user] = await getDb().update(users).set({ role: payload.role, updatedAt: new Date() }).where(eq(users.id, userId)).returning();
    const access = await accountAccess(userId);
    return Response.json({ ...user, isAdmin: access.isAdmin, isSuspended: access.isSuspended });
  } catch (error) { return jsonError(error); }
}

function missingShowcaseTable(error: unknown) {
  const candidate = error as { code?: string; message?: string; cause?: { code?: string; message?: string } };
  return candidate?.code === '42P01'
    || candidate?.cause?.code === '42P01'
    || candidate?.message?.includes('trader_profile_showcase')
    || candidate?.cause?.message?.includes('trader_profile_showcase');
}

export async function PUT(request: Request) {
  try {
    const userId = await authenticatedUserId(request);
    const current = await ensureDbUser(userId);
    if (current.role !== 'trader') throw new HttpError(403, 'Trader account required');
    const payload = traderProfileSchema.parse(await request.json());
    const { showcase, ...baseProfile } = payload;

    let location;
    try { location = await lookupPostcode(baseProfile.postcode); }
    catch (error) {
      if (error instanceof InvalidPostcodeError) throw new HttpError(400, error.message);
      throw error;
    }

    const values = {
      ...baseProfile,
      postcode: location.postcode,
      locationLabel: location.locationLabel,
      latitude: location.latitude,
      longitude: location.longitude,
    };

    const db = getDb();
    const existingProfile = await db.query.traderProfiles.findFirst({
      where: eq(traderProfiles.userId, userId),
      columns: { stripeSubscriptionId: true },
    });

    // Every new trader gets Basic lead access for the first 14 days. Until the
    // explicit trial_ends_at migration is applied, created_at is the source of
    // truth for that window, so no Stripe setup is required during onboarding.
    const trialListing = existingProfile?.stripeSubscriptionId
      ? {}
      : { subscriptionTier: 'basic' as const, isSubscriptionActive: true };

    const [profile] = await db.insert(traderProfiles).values({ userId, ...values, ...trialListing }).onConflictDoUpdate({
      target: traderProfiles.userId,
      set: { ...values, ...trialListing, updatedAt: new Date() },
    }).returning({
      id: traderProfiles.id,
      userId: traderProfiles.userId,
      businessName: traderProfiles.businessName,
      tradeCategory: traderProfiles.tradeCategory,
      subscriptionTier: traderProfiles.subscriptionTier,
      isSubscriptionActive: traderProfiles.isSubscriptionActive,
      createdAt: traderProfiles.createdAt,
      updatedAt: traderProfiles.updatedAt,
    });

    if (showcase) {
      const showcaseValues = {
        template: showcase.template,
        colourTheme: showcase.colourTheme,
        coverPhotoUrl: showcase.coverPhotoUrl || null,
        profileImageUrl: showcase.profileImageUrl || null,
        logoUrl: showcase.logoUrl || null,
        yearsExperience: showcase.yearsExperience,
        yearEstablished: showcase.yearEstablished ?? null,
        serviceAreas: showcase.serviceAreas,
        beforeAfterProjects: showcase.beforeAfterProjects,
      };
      try {
        await db.insert(traderProfileShowcase).values({ userId, ...showcaseValues }).onConflictDoUpdate({
          target: traderProfileShowcase.userId,
          set: { ...showcaseValues, updatedAt: new Date() },
        });
      } catch (error) {
        // Early production databases pre-date the showcase table. Do not make
        // basic trader onboarding fail while the idempotent migration is awaiting
        // approval; all showcase fields will save normally once it is applied.
        if (!missingShowcaseTable(error)) throw error;
      }
    }

    return Response.json(profile);
  } catch (error) { return jsonError(error); }
}
