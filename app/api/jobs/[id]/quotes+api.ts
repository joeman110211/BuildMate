import { and, eq } from 'drizzle-orm';
import { getDb } from '@/db/client';
import { jobs, quotes, traderProfiles } from '@/db/schema';
import { HttpError, jsonError, requireRole } from '@/lib/server';

export async function GET(request: Request, { id }: { id: string }) {
  try {
    const customer = await requireRole(request, 'customer');
    const db = getDb();
    const job = await db.query.jobs.findFirst({ where: and(eq(jobs.id, id), eq(jobs.customerId, customer.id)) });
    if (!job) throw new HttpError(404, 'Job not found');
    const rows = await db.select({
      id: quotes.id, jobId: quotes.jobId, traderId: quotes.traderId,
      laborCost: quotes.laborCost, materialsCost: quotes.materialsCost, vatAmount: quotes.vatAmount,
      depositAmount: quotes.depositAmount, totalAmount: quotes.totalAmount, paymentTerms: quotes.paymentTerms,
      notes: quotes.notes, status: quotes.status, businessName: traderProfiles.businessName,
    }).from(quotes).innerJoin(traderProfiles, eq(traderProfiles.userId, quotes.traderId)).where(eq(quotes.jobId, id));
    return Response.json({ job, quotes: rows });
  } catch (error) { return jsonError(error); }
}
