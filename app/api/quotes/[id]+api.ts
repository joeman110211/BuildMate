import { and, eq, isNull, sql } from 'drizzle-orm';
import { getDb } from '@/db/client';
import { jobs, quotes } from '@/db/schema';
import { addJobEvent, createNotification } from '@/lib/notifications';
import { accountModes, authenticatedUserId, ensureDbUser, HttpError, jsonError } from '@/lib/server';

export async function PATCH(request: Request, { id }: { id: string }) {
  try {
    const userId = await authenticatedUserId(request);
    await ensureDbUser(userId);
    const modes = await accountModes(userId);
    const payload = await request.json() as { action?: string };
    const db = getDb();

    if (payload.action === 'withdraw') {
      if (!modes.traderEnabled) throw new HttpError(403, 'Trader account required');
      const [candidate] = await db.select({ quote: quotes, job: jobs }).from(quotes).innerJoin(jobs, eq(jobs.id, quotes.jobId))
        .where(and(eq(quotes.id, id), eq(quotes.traderId, userId))).limit(1);
      if (!candidate) throw new HttpError(404, 'Quote not found');
      if (candidate.quote.status !== 'pending' || !['open', 'quoted'].includes(candidate.job.status) || candidate.job.acceptedQuoteId) throw new HttpError(409, 'This quote can no longer be withdrawn');

      await db.update(quotes).set({ status: 'withdrawn', updatedAt: new Date() }).where(and(eq(quotes.id, id), eq(quotes.traderId, userId), eq(quotes.status, 'pending')));
      await db.update(jobs).set({ status: 'open', updatedAt: new Date() }).where(and(
        eq(jobs.id, candidate.job.id),
        isNull(jobs.acceptedQuoteId),
        sql`not exists (select 1 from quotes q where q.job_id = ${candidate.job.id} and q.status = 'pending')`,
      ));
      await addJobEvent(candidate.job.id, userId, 'quote_withdrawn', 'Quote withdrawn', 'A tradesperson withdrew their quote.', { quoteId: id });
      await createNotification(candidate.job.customerId, {
        type: 'quote_withdrawn',
        title: 'A quote was withdrawn',
        body: `A tradesperson withdrew their quote for ${candidate.job.title}.`,
        href: `/customer/jobs/${candidate.job.id}`,
      });
      return Response.json({ withdrawn: true });
    }

    if (payload.action !== 'accept') throw new HttpError(400, 'Unsupported quote action');
    if (!modes.customerEnabled) throw new HttpError(403, 'Customer account required');
    const [candidate] = await db.select({ quote: quotes, job: jobs }).from(quotes).innerJoin(jobs, eq(jobs.id, quotes.jobId))
      .where(and(eq(quotes.id, id), eq(jobs.customerId, userId))).limit(1);
    if (!candidate) throw new HttpError(404, 'Quote not found');
    if (!['open', 'quoted'].includes(candidate.job.status)) throw new HttpError(409, 'This job already has an accepted quote');
    if (candidate.quote.status !== 'pending') throw new HttpError(409, 'This quote is no longer available');
    if (candidate.quote.validUntil && candidate.quote.validUntil.getTime() < Date.now()) throw new HttpError(409, 'This quote has expired. Ask the tradesperson for an updated quote.');

    const otherQuotes = await db.select({ traderId: quotes.traderId }).from(quotes)
      .where(and(eq(quotes.jobId, candidate.job.id), eq(quotes.status, 'pending')));

    await db.execute(sql`select accept_job_quote(${id}::uuid, ${userId}::text)`);
    if (candidate.quote.proposedStartAt) {
      await db.update(jobs).set({ scheduledStartAt: candidate.quote.proposedStartAt, updatedAt: new Date() }).where(eq(jobs.id, candidate.job.id));
    }
    await addJobEvent(candidate.job.id, userId, 'quote_accepted', 'Quote accepted', 'The homeowner accepted a quote and the job moved into progress.', { quoteId: id, traderId: candidate.quote.traderId, totalAmount: candidate.quote.totalAmount });
    await createNotification(candidate.quote.traderId, {
      type: 'quote_accepted',
      title: 'Your quote was accepted',
      body: `You have won ${candidate.job.title}. Open the job to confirm arrangements and progress.`,
      href: '/trader/my-jobs',
      email: true,
    });
    await Promise.allSettled(otherQuotes.filter((quote) => quote.traderId !== candidate.quote.traderId).map((quote) => createNotification(quote.traderId, {
      type: 'quote_declined',
      title: 'Customer chose another quote',
      body: `${candidate.job.title} has been awarded to another tradesperson.`,
      href: '/trader/my-jobs',
    })));
    return Response.json({ accepted: true, scheduledStartAt: candidate.quote.proposedStartAt ?? null });
  } catch (error) { return jsonError(error); }
}