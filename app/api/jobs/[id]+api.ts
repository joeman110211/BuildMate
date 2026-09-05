import { and, eq, inArray, isNull, ne } from 'drizzle-orm';
import { getDb } from '@/db/client';
import { jobMilestones, jobs, quotes, reviews, traderProfiles } from '@/db/schema';
import { addJobEvent, createNotification } from '@/lib/notifications';
import { accountModes, authenticatedUserId, ensureDbUser, HttpError, jsonError } from '@/lib/server';
import { getSql } from '@/lib/sql';

export async function GET(request: Request, { id }: { id: string }) {
  try {
    const userId = await authenticatedUserId(request);
    await ensureDbUser(userId);
    const db = getDb();
    const job = await db.query.jobs.findFirst({ where: eq(jobs.id, id) });
    if (!job) throw new HttpError(404, 'Job not found');
    const accepted = job.acceptedQuoteId ? await db.query.quotes.findFirst({ where: eq(quotes.id, job.acceptedQuoteId) }) : null;
    const allowed = job.customerId === userId || accepted?.traderId === userId;
    if (!allowed) throw new HttpError(403, 'You cannot access this job');
    const milestones = await db.select().from(jobMilestones).where(eq(jobMilestones.jobId, id));
    const existingReview = job.customerId === userId ? await db.query.reviews.findFirst({ where: and(eq(reviews.jobId, id), eq(reviews.customerId, userId)) }) : null;
    let trader = null;
    if (accepted) trader = await db.query.traderProfiles.findFirst({ where: eq(traderProfiles.userId, accepted.traderId) });
    const variations = await getSql()`
      SELECT id, job_id AS "jobId", trader_id AS "traderId", customer_id AS "customerId", title, description,
             amount_delta AS "amountDelta", duration_delta_days AS "durationDeltaDays", status,
             created_at AS "createdAt", responded_at AS "respondedAt"
      FROM job_variations WHERE job_id = ${id} ORDER BY created_at DESC
    `;
    const timeline = await getSql()`
      SELECT id, event_type AS "eventType", title, description, metadata, actor_id AS "actorId", created_at AS "createdAt"
      FROM job_events WHERE job_id = ${id} ORDER BY created_at ASC
    `;
    return Response.json({ job, acceptedQuote: accepted, milestones, trader, existingReview, variations, timeline });
  } catch (error) { return jsonError(error); }
}

export async function PATCH(request: Request, { id }: { id: string }) {
  try {
    const userId = await authenticatedUserId(request);
    await ensureDbUser(userId);
    const modes = await accountModes(userId);
    const payload = await request.json() as { action?: string };
    const db = getDb();

    if (payload.action === 'cancel') {
      if (!modes.customerEnabled) throw new HttpError(403, 'Customer account required');
      const pendingTraders = await db.select({ traderId: quotes.traderId }).from(quotes).where(and(eq(quotes.jobId, id), eq(quotes.status, 'pending')));
      const [cancelled] = await db.update(jobs).set({ status: 'cancelled', updatedAt: new Date() })
        .where(and(eq(jobs.id, id), eq(jobs.customerId, userId), isNull(jobs.acceptedQuoteId), inArray(jobs.status, ['open', 'quoted'])))
        .returning();
      if (!cancelled) throw new HttpError(409, 'Only open jobs can be cancelled before a quote is accepted');
      await db.update(quotes).set({ status: 'declined', updatedAt: new Date() })
        .where(and(eq(quotes.jobId, id), eq(quotes.status, 'pending')));
      await addJobEvent(id, userId, 'job_cancelled', 'Job cancelled', cancelled.title);
      await Promise.allSettled(pendingTraders.map(({ traderId }) => createNotification(traderId, {
        type: 'job_cancelled',
        title: 'Job cancelled by homeowner',
        body: `${cancelled.title} is no longer accepting quotes.`,
        href: '/trader/my-jobs',
      })));
      return Response.json({ cancelled: true });
    }

    if (payload.action !== 'complete') throw new HttpError(400, 'Unsupported job action');
    if (!modes.traderEnabled) throw new HttpError(403, 'Trader account required');
    const [owned] = await db.select({ job: jobs, quote: quotes }).from(jobs).innerJoin(quotes, eq(quotes.id, jobs.acceptedQuoteId))
      .where(and(eq(jobs.id, id), eq(quotes.traderId, userId))).limit(1);
    if (!owned) throw new HttpError(404, 'Job not found');
    if (owned.job.status !== 'in_progress') throw new HttpError(409, 'Only work in progress can be marked complete');
    const pendingVariation = await getSql()`SELECT 1 FROM job_variations WHERE job_id = ${id} AND status = 'pending' LIMIT 1`;
    if (pendingVariation.length) throw new HttpError(409, 'Resolve outstanding job variations before marking the work complete');
    await db.update(jobMilestones).set({ status: 'completed', completedAt: new Date() })
      .where(and(eq(jobMilestones.jobId, id), ne(jobMilestones.title, 'Deposit'), ne(jobMilestones.status, 'paid')));
    await db.update(jobs).set({ status: 'completed', updatedAt: new Date() }).where(eq(jobs.id, id));
    await addJobEvent(id, userId, 'work_completed', 'Tradesperson marked work complete', owned.job.title);
    await createNotification(owned.job.customerId, {
      type: 'work_completed',
      title: 'Work marked complete',
      body: `${owned.job.title} has been marked complete. Review the job, confirm the final payment stage and leave feedback when you are satisfied.`,
      href: `/customer/jobs/${id}`,
      email: true,
    });
    return Response.json({ completed: true });
  } catch (error) { return jsonError(error); }
}