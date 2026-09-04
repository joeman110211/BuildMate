import { and, eq } from 'drizzle-orm';
import { getDb } from '@/db/client';
import { jobs, reviews } from '@/db/schema';
import { HttpError, jsonError, requireRole } from '@/lib/server';
import { reviewSchema } from '@/lib/validation';

export async function POST(request: Request) {
  try {
    const customer = await requireRole(request, 'customer');
    const payload = reviewSchema.parse(await request.json());
    const job = await getDb().query.jobs.findFirst({ where: and(eq(jobs.id, payload.jobId), eq(jobs.customerId, customer.id)) });
    if (!job) throw new HttpError(404, 'Job not found');
    if (job.status !== 'completed') throw new HttpError(409, 'The job must be completed before review');
    const [review] = await getDb().insert(reviews).values({ ...payload, customerId: customer.id, verifiedCompletion: true }).returning();
    return Response.json(review, { status: 201 });
  } catch (error) { return jsonError(error); }
}
