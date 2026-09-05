import { z } from 'zod';
import { addJobEvent, createNotification } from '@/lib/notifications';
import { getSql } from '@/lib/sql';
import { authenticatedUserId, ensureDbUser, HttpError, jsonError } from '@/lib/server';

const schema = z.object({ action: z.enum(['accept','decline','withdraw']) });

export async function PATCH(request: Request, { id }: { id: string }) {
  try {
    const userId = await authenticatedUserId(request);
    await ensureDbUser(userId);
    const { action } = schema.parse(await request.json());
    const sql = getSql();
    const rows = await sql`
      SELECT id, job_id AS "jobId", trader_id AS "traderId", customer_id AS "customerId",
             title, amount_delta AS "amountDelta", duration_delta_days AS "durationDeltaDays", status
      FROM job_variations WHERE id = ${id} LIMIT 1
    ` as unknown as Array<{ id: string; jobId: string; traderId: string; customerId: string; title: string; amountDelta: number; durationDeltaDays: number; status: string }>;
    const variation = rows[0];
    if (!variation) throw new HttpError(404, 'Variation not found');
    if (variation.status !== 'pending') throw new HttpError(409, 'This variation has already been responded to');

    let status: 'accepted' | 'declined' | 'withdrawn';
    if (action === 'withdraw') {
      if (variation.traderId !== userId) throw new HttpError(403, 'Only the tradesperson can withdraw this variation');
      status = 'withdrawn';
    } else {
      if (variation.customerId !== userId) throw new HttpError(403, 'Only the homeowner can respond to this variation');
      status = action === 'accept' ? 'accepted' : 'declined';
    }

    await sql`UPDATE job_variations SET status = ${status}, responded_at = now() WHERE id = ${id} AND status = 'pending'`;
    await addJobEvent(variation.jobId, userId, `variation_${status}`, `Variation ${status}`, variation.title, { amountDelta: variation.amountDelta, durationDeltaDays: variation.durationDeltaDays });

    const notifyUser = action === 'withdraw' ? variation.customerId : variation.traderId;
    await createNotification(notifyUser, {
      type: `variation_${status}`,
      title: `Variation ${status}`,
      body: `${variation.title} was ${status}. The job timeline now records the decision.`,
      href: action === 'withdraw' ? `/customer/jobs/${variation.jobId}` : `/trader/my-jobs`,
      email: status === 'accepted' || status === 'declined',
    });
    return Response.json({ id, status });
  } catch (error) { return jsonError(error); }
}
