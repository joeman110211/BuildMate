import { and, desc, eq, inArray, or, sql } from 'drizzle-orm';
import { getDb } from '@/db/client';
import { jobs, traderProfiles } from '@/db/schema';
import { demoJobs } from '@/lib/demo-data';
import { InvalidPostcodeError, lookupPostcode, outwardCode } from '@/lib/postcode';
import { previewDataEnabled } from '@/lib/preview-data';
import { accountModes, authenticatedUserId, ensureDbUser, HttpError, jsonError, requireRole } from '@/lib/server';
import { getSql } from '@/lib/sql';
import { hasActiveLeadAccess, TRADER_TRIAL_DAYS } from '@/lib/subscription';
import { jobSchema } from '@/lib/validation';

export async function GET(request: Request) {
  try {
    const userId = await authenticatedUserId(request);
    const user = await ensureDbUser(userId);
    const modes = await accountModes(userId);
    const activeMode = modes.activeMode ?? user.role;
    const db = getDb();
    let rows;
    if (activeMode === 'customer' && modes.customerEnabled) {
      rows = (await db.select().from(jobs).where(eq(jobs.customerId, user.id)).orderBy(desc(jobs.createdAt)))
        .map((job) => ({ ...job, isPreview: false }));
    } else if (activeMode === 'trader' && modes.traderEnabled) {
      const [profile] = await db.select({
        tradeCategory: traderProfiles.tradeCategory,
        subscriptionTier: traderProfiles.subscriptionTier,
        isSubscriptionActive: traderProfiles.isSubscriptionActive,
        stripeSubscriptionId: traderProfiles.stripeSubscriptionId,
        trialEndsAt: traderProfiles.trialEndsAt,
        latitude: traderProfiles.latitude,
        longitude: traderProfiles.longitude,
        radiusMiles: traderProfiles.radiusMiles,
        createdAt: traderProfiles.createdAt,
      }).from(traderProfiles).where(eq(traderProfiles.userId, user.id)).limit(1);
      if (!profile) throw new HttpError(409, 'Complete your trader profile first');
      const activeLeadAccess = hasActiveLeadAccess(profile);

      const acceptedWork = sql`${jobs.acceptedQuoteId} in (select id from quotes where trader_id = ${user.id})`;
      let access = acceptedWork;

      if (activeLeadAccess && profile.subscriptionTier === 'basic') {
        access = or(
          acceptedWork,
          and(eq(jobs.targetTraderId, user.id), inArray(jobs.status, ['open', 'quoted'])),
        )!;
      }

      if (activeLeadAccess && profile.subscriptionTier === 'featured') {
        const withinRadius = profile.latitude != null && profile.longitude != null
          ? sql`${jobs.latitude} is not null and ${jobs.longitude} is not null and (
              3959 * acos(least(1, greatest(-1,
                cos(radians(${profile.latitude})) * cos(radians(${jobs.latitude})) *
                cos(radians(${jobs.longitude}) - radians(${profile.longitude})) +
                sin(radians(${profile.latitude})) * sin(radians(${jobs.latitude}))
              )))
            ) <= ${profile.radiusMiles}`
          : sql`false`;

        access = or(
          acceptedWork,
          and(
            inArray(jobs.status, ['open', 'quoted']),
            or(
              eq(jobs.targetTraderId, user.id),
              and(
                sql`${jobs.targetTraderId} is null`,
                eq(jobs.category, profile.tradeCategory),
                withinRadius,
              ),
            ),
          ),
        )!;
      }

      const databaseRows = await db.select().from(jobs).where(access).orderBy(desc(jobs.createdAt)).limit(100);
      const previewRows = activeLeadAccess && previewDataEnabled()
        ? demoJobs
            .filter((job) => profile.subscriptionTier === 'featured' || job.category === profile.tradeCategory)
            .map((job) => ({ ...job, isPreview: true }))
        : [];
      rows = [...databaseRows.map((job) => ({ ...job, isPreview: false })), ...previewRows].slice(0, 100);
      rows = rows.map((job) => {
        const openMarketplaceJob = job.targetTraderId == null && ['open', 'quoted'].includes(job.status);
        return openMarketplaceJob
          ? { ...job, postcode: outwardCode(job.postcode), latitude: null, longitude: null }
          : job;
      });
    } else throw new HttpError(403, 'Choose an account mode first');
    return Response.json(rows);
  } catch (error) { return jsonError(error); }
}

export async function POST(request: Request) {
  try {
    const user = await requireRole(request, 'customer');
    const payload = jobSchema.parse(await request.json());
    const db = getDb();

    if (payload.targetTraderId) {
      const targets = await getSql()`
        SELECT tp.trade_category AS "tradeCategory",
               tp.subscription_tier AS "subscriptionTier",
               (
                 tp.is_subscription_active = true
                 AND (
                   tp.stripe_subscription_id IS NOT NULL
                   OR greatest(
                     coalesce(tp.trial_ends_at, tp.created_at + (${TRADER_TRIAL_DAYS} * interval '1 day')),
                     tp.created_at + (${TRADER_TRIAL_DAYS} * interval '1 day')
                   ) > now()
                 )
               ) AS "isSubscriptionActive"
        FROM trader_profiles tp
        JOIN users u ON u.id = tp.user_id
        WHERE tp.user_id = ${payload.targetTraderId}
          AND coalesce(u.is_suspended, false) = false
        LIMIT 1
      ` as unknown as { tradeCategory: string; subscriptionTier: string; isSubscriptionActive: boolean }[];
      const target = targets[0];
      if (!target || !target.isSubscriptionActive || target.subscriptionTier === 'free') throw new HttpError(409, 'This tradesperson is not currently accepting direct BuildPair leads');
      if (target.tradeCategory !== payload.category) throw new HttpError(400, `This direct request must use the tradesperson's listed category: ${target.tradeCategory}`);
    }

    let location;
    try { location = await lookupPostcode(payload.postcode); }
    catch (error) {
      if (error instanceof InvalidPostcodeError) throw new HttpError(400, error.message);
      throw error;
    }

    const [job] = await db.insert(jobs).values({
      customerId: user.id,
      ...payload,
      targetTraderId: payload.targetTraderId ?? null,
      postcode: location.postcode,
      locationLabel: location.locationLabel,
      latitude: location.latitude,
      longitude: location.longitude,
    }).returning();
    if (!job) throw new Error('Job could not be created');

    let conversationId: string | null = null;
    if (payload.targetTraderId) {
      const conversations = await getSql()`
        INSERT INTO conversations(job_id, customer_id, trader_id)
        VALUES (${job.id}, ${user.id}, ${payload.targetTraderId})
        ON CONFLICT (job_id, customer_id, trader_id)
        DO UPDATE SET updated_at = now()
        RETURNING id
      ` as unknown as { id: string }[];
      conversationId = conversations[0]?.id ?? null;
    }

    return Response.json({ ...job, isPreview: false, conversationId }, { status: 201 });
  } catch (error) { return jsonError(error); }
}
