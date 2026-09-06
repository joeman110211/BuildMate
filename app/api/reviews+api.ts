import { and, eq } from 'drizzle-orm';
import { getDb } from '@/db/client';
import { jobs, quotes, reviews } from '@/db/schema';
import { assertRateLimit } from '@/lib/rate-limit';
import { getSql } from '@/lib/sql';
import { HttpError, jsonError, requireRole } from '@/lib/server';
import { reviewSchema } from '@/lib/validation';

export async function POST(request: Request) {
  try {
    const customer = await requireRole(request, 'customer');
    await assertRateLimit(request, 'publish-review', 10, 3600, customer.id);
    const payload = reviewSchema.parse(await request.json());
    const db = getDb();

    const [relationship] = await db.select({
      job: jobs,
      acceptedTraderId: quotes.traderId,
    }).from(jobs)
      .innerJoin(quotes, eq(quotes.id, jobs.acceptedQuoteId))
      .where(and(eq(jobs.id, payload.jobId), eq(jobs.customerId, customer.id)))
      .limit(1);

    if (!relationship) throw new HttpError(404, 'Completed BuildPair job relationship not found');
    if (relationship.job.status !== 'completed') throw new HttpError(409, 'The job must be completed before review');
    if (relationship.acceptedTraderId !== payload.traderId) throw new HttpError(400, 'A verified review can only be left for the tradesperson whose quote was accepted');

    const paidStages = await getSql()`
      SELECT count(*)::int AS count
      FROM job_milestones
      WHERE job_id = ${payload.jobId}
        AND status = 'paid'
    ` as unknown as Array<{ count: number }>;
    if ((paidStages[0]?.count ?? 0) < 1) {
      throw new HttpError(409, 'Confirm the required payment stage before publishing a verified review');
    }

    const existing = await db.query.reviews.findFirst({ where: and(eq(reviews.jobId, payload.jobId), eq(reviews.customerId, customer.id)) });
    if (existing) throw new HttpError(409, 'A review has already been published for this job');

    const [review] = await db.insert(reviews).values({ ...payload, traderId: relationship.acceptedTraderId, customerId: customer.id, verifiedCompletion: true }).returning();
    if (!review) throw new Error('Review could not be published');
    return Response.json(review, { status: 201 });
  } catch (error) { return jsonError(error); }
}
