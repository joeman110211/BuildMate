import { and, desc, eq, inArray, or, sql } from 'drizzle-orm';
import { getDb } from '@/db/client';
import { jobs, traderProfiles } from '@/db/schema';
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
      rows = await db.select().from(jobs).where(or(
        and(eq(jobs.category, profile.tradeCategory), inArray(jobs.status, ['open', 'quoted']), or(eq(jobs.targetTraderId, user.id), sql`${jobs.targetTraderId} is null`)),
        sql`${jobs.acceptedQuoteId} in (select id from quotes where trader_id = ${user.id})`,
      )).orderBy(desc(jobs.createdAt)).limit(100);
    } else throw new HttpError(403, 'Choose an account type first');
    return Response.json(rows);
  } catch (error) { return jsonError(error); }
}

export async function POST(request: Request) {
  try {
    const user = await requireRole(request, 'customer');
    const payload = jobSchema.parse(await request.json());
    const [job] = await getDb().insert(jobs).values({ customerId: user.id, ...payload, targetTraderId: payload.targetTraderId ?? null }).returning();
    return Response.json(job, { status: 201 });
  } catch (error) { return jsonError(error); }
}
