import { and, desc, eq, inArray, or, sql } from 'drizzle-orm';
import { getDb } from '@/db/client';
import { jobs, traderProfiles } from '@/db/schema';
import { InvalidPostcodeError, lookupPostcode, outwardCode } from '@/lib/postcode';
import { authenticatedUserId, ensureDbUser, HttpError, jsonError, requireRole } from '@/lib/server';
import { jobSchema } from '@/lib/validation';

export async function GET(request: Request) {
  try {
    const userId = await authenticatedUserId(request);
    const user = await ensureDbUser(userId);
    const db = getDb();
    let rows;
    if (user.role === 'customer') {
      rows = await db.select().from(jobs).where(eq(jobs.customerId, user.id)).orderBy(desc(jobs.createdAt));
    } else if (user.role === 'trader') {
      const profile = await db.query.traderProfiles.findFirst({ where: eq(traderProfiles.userId, user.id) });
      if (!profile) throw new HttpError(409, 'Complete your trader profile first');

      const acceptedWork = sql`${jobs.acceptedQuoteId} in (select id from quotes where trader_id = ${user.id})`;
      let access = acceptedWork;

      if (profile.isSubscriptionActive && profile.subscriptionTier === 'basic') {
        access = or(
          acceptedWork,
          and(eq(jobs.targetTraderId, user.id), inArray(jobs.status, ['open', 'quoted'])),
        )!;
      }

      if (profile.isSubscriptionActive && profile.subscriptionTier === 'featured') {
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

      rows = await db.select().from(jobs).where(access).orderBy(desc(jobs.createdAt)).limit(100);
      rows = rows.map((job) => {
        const openMarketplaceJob = job.targetTraderId == null && ['open', 'quoted'].includes(job.status);
        return openMarketplaceJob
          ? { ...job, postcode: outwardCode(job.postcode), latitude: null, longitude: null }
          : job;
      });
    } else throw new HttpError(403, 'Choose an account type first');
    return Response.json(rows);
  } catch (error) { return jsonError(error); }
}

export async function POST(request: Request) {
  try {
    const user = await requireRole(request, 'customer');
    const payload = jobSchema.parse(await request.json());

    let location;
    try { location = await lookupPostcode(payload.postcode); }
    catch (error) {
      if (error instanceof InvalidPostcodeError) throw new HttpError(400, error.message);
      throw error;
    }

    const [job] = await getDb().insert(jobs).values({
      customerId: user.id,
      ...payload,
      targetTraderId: payload.targetTraderId ?? null,
      postcode: location.postcode,
      locationLabel: location.locationLabel,
      latitude: location.latitude,
      longitude: location.longitude,
    }).returning();
    return Response.json(job, { status: 201 });
  } catch (error) { return jsonError(error); }
}
