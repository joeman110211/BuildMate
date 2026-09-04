import { eq, sql } from 'drizzle-orm';
import { getDb } from '@/db/client';
import { traderProfiles, users } from '@/db/schema';
import { traderProfileShowcase } from '@/db/showcase-schema';
import { InvalidPostcodeError, lookupPostcode } from '@/lib/postcode';
import { accountAccess, authenticatedUserId, ensureDbUser, HttpError, jsonError } from '@/lib/server';
import { trialEndsAt } from '@/lib/subscription';
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
    const trialListing = process.env.STRIPE_SECRET_KEY?.trim()
      ? {}
      : { subscriptionTier: 'basic' as const, isSubscriptionActive: true, trialEndsAt: trialEndsAt() };

    const db = getDb();
    const [profile] = await db.insert(traderProfiles).values({ userId, ...values, ...trialListing }).onConflictDoUpdate({
      target: traderProfiles.userId,
      set: {
        ...values,
        ...(process.env.STRIPE_SECRET_KEY?.trim()
          ? {}
          : {
              subscriptionTier: 'basic' as const,
              isSubscriptionActive: true,
              trialEndsAt: sql`coalesce(${traderProfiles.trialEndsAt}, excluded.trial_ends_at)`,
            }),
        updatedAt: new Date(),
      },
    }).returning();

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
      await db.insert(traderProfileShowcase).values({ userId, ...showcaseValues }).onConflictDoUpdate({
        target: traderProfileShowcase.userId,
        set: { ...showcaseValues, updatedAt: new Date() },
      });
    }

    return Response.json(profile);
  } catch (error) { return jsonError(error); }
}
