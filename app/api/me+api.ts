import { eq } from 'drizzle-orm';
import { getDb } from '@/db/client';
import { traderProfiles } from '@/db/schema';
import { traderProfileShowcase } from '@/db/showcase-schema';
import { InvalidPostcodeError, lookupPostcode } from '@/lib/postcode';
import { getSql } from '@/lib/sql';
import { accountAccess, accountModes, authenticatedUserId, ensureDbUser, HttpError, jsonError } from '@/lib/server';
import { trialEndsAt, TRADER_TRIAL_DAYS } from '@/lib/subscription';
import { roleSchema, traderProfileSchema } from '@/lib/validation';

export async function GET(request: Request) {
  try {
    const userId = await authenticatedUserId(request);
    const user = await ensureDbUser(userId);
    const [access, modes] = await Promise.all([accountAccess(userId), accountModes(userId)]);
    return Response.json({ ...user, ...modes, isAdmin: access.isAdmin, isSuspended: access.isSuspended });
  } catch (error) { return jsonError(error); }
}

export async function PATCH(request: Request) {
  try {
    const userId = await authenticatedUserId(request);
    await ensureDbUser(userId);
    const payload = roleSchema.parse(await request.json());
    const before = await accountModes(userId);
    const wasEnabled = payload.role === 'customer' ? before.customerEnabled : before.traderEnabled;

    if (payload.role === 'customer') {
      await getSql()`
        UPDATE users
        SET customer_enabled = true,
            active_mode = 'customer',
            role = COALESCE(role, 'customer'),
            updated_at = NOW()
        WHERE id = ${userId}
      `;
    } else {
      await getSql()`
        UPDATE users
        SET trader_enabled = true,
            active_mode = 'trader',
            role = COALESCE(role, 'trader'),
            updated_at = NOW()
        WHERE id = ${userId}
      `;
    }

    const user = await ensureDbUser(userId);
    const [access, modes] = await Promise.all([accountAccess(userId), accountModes(userId)]);
    return Response.json({
      ...user,
      ...modes,
      isAdmin: access.isAdmin,
      isSuspended: access.isSuspended,
      wasEnabled,
    });
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
    await ensureDbUser(userId);
    const modes = await accountModes(userId);
    if (!modes.traderEnabled) throw new HttpError(403, 'Trader account required');
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
      columns: { stripeSubscriptionId: true, createdAt: true, trialEndsAt: true },
    });

    const minimumTrialEnd = existingProfile?.createdAt ? trialEndsAt(existingProfile.createdAt) : trialEndsAt();
    const storedTrialEnd = existingProfile?.trialEndsAt ? new Date(existingProfile.trialEndsAt) : null;
    const effectiveTrialEnd = storedTrialEnd && storedTrialEnd > minimumTrialEnd ? storedTrialEnd : minimumTrialEnd;

    // New BuildPair trader profiles receive 14 days of Basic lead access from
    // first profile publication. Existing accounts keep any longer trial already granted.
    // Editing a profile never restarts the trial clock.
    const trialListing = existingProfile?.stripeSubscriptionId
      ? {}
      : { subscriptionTier: 'basic' as const, isSubscriptionActive: true, trialEndsAt: effectiveTrialEnd };

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
      trialEndsAt: traderProfiles.trialEndsAt,
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
        if (!missingShowcaseTable(error)) throw error;
      }
    }

    return Response.json({ ...profile, trialDays: TRADER_TRIAL_DAYS });
  } catch (error) { return jsonError(error); }
}
