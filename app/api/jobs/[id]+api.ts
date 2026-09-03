import { and, eq, ne } from 'drizzle-orm';
import { getDb } from '@/db/client';
import { jobMilestones, jobs, quotes, reviews, traderProfiles } from '@/db/schema';
import { authenticatedUserId, ensureDbUser, HttpError, jsonError } from '@/lib/server';

export async function GET(request: Request, { id }: { id: string }) {
  try {
    const userId = await authenticatedUserId(request);
    const user = await ensureDbUser(userId);
    const db = getDb();
    const job = await db.query.jobs.findFirst({ where: eq(jobs.id, id) });
    if (!job) throw new HttpError(404, 'Job not found');
    const accepted = job.acceptedQuoteId ? await db.query.quotes.findFirst({ where: eq(quotes.id, job.acceptedQuoteId) }) : null;
    const allowed = job.customerId === userId || accepted?.traderId === userId;
    if (!allowed) throw new HttpError(403, 'You cannot access this job');
    const milestones = await db.select().from(jobMilestones).where(eq(jobMilestones.jobId, id));
    const existingReview = user.role === 'customer' ? await db.query.reviews.findFirst({ where: and(eq(reviews.jobId, id), eq(reviews.customerId, userId)) }) : null;
    let trader = null;
    if (accepted) trader = await db.query.traderProfiles.findFirst({ where: eq(traderProfiles.userId, accepted.traderId) });
    return Response.json({ job, acceptedQuote: accepted, milestones, trader, existingReview });
  } catch (error) { return jsonError(error); }
}

export async function PATCH(request: Request, { id }: { id: string }) {
  try {
    const userId = await authenticatedUserId(request);
    const user = await ensureDbUser(userId);
    const payload = await request.json() as { action?: string };
    if (payload.action !== 'complete') throw new HttpError(400, 'Unsupported job action');
    if (user.role !== 'trader') throw new HttpError(403, 'Trader account required');
    const db = getDb();
    const [owned] = await db.select({ job: jobs, quote: quotes }).from(jobs).innerJoin(quotes, eq(quotes.id, jobs.acceptedQuoteId))
      .where(and(eq(jobs.id, id), eq(quotes.traderId, userId))).limit(1);
    if (!owned) throw new HttpError(404, 'Job not found');
    await db.update(jobMilestones).set({ status: 'completed', completedAt: new Date() })
      .where(and(eq(jobMilestones.jobId, id), ne(jobMilestones.title, 'Deposit'), ne(jobMilestones.status, 'paid')));
    await db.update(jobs).set({ status: 'completed', updatedAt: new Date() }).where(eq(jobs.id, id));
    return Response.json({ completed: true });
  } catch (error) { return jsonError(error); }
}
