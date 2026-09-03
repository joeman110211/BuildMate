import { and, eq, sql } from 'drizzle-orm';
import { getDb } from '@/db/client';
import { jobs, quotes } from '@/db/schema';
import { HttpError, jsonError, requireRole } from '@/lib/server';

export async function PATCH(request: Request, { id }: { id: string }) {
  try {
    const customer = await requireRole(request, 'customer');
    const payload = await request.json() as { action?: string };
    if (payload.action !== 'accept') throw new HttpError(400, 'Unsupported quote action');
    const db = getDb();
    const [candidate] = await db.select({ quote: quotes, job: jobs }).from(quotes).innerJoin(jobs, eq(jobs.id, quotes.jobId))
      .where(and(eq(quotes.id, id), eq(jobs.customerId, customer.id))).limit(1);
    if (!candidate) throw new HttpError(404, 'Quote not found');
    if (!['open', 'quoted'].includes(candidate.job.status)) throw new HttpError(409, 'This job already has an accepted quote');

    await db.execute(sql`select accept_job_quote(${id}::uuid, ${customer.id}::text)`);
    return Response.json({ accepted: true });
  } catch (error) { return jsonError(error); }
}
