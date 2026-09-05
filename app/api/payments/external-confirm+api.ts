import { z } from 'zod';
import { HttpError, jsonError, requireRole } from '@/lib/server';
import { getSql } from '@/lib/sql';

const schema = z.object({ milestoneId: z.uuid() });

type MilestoneRow = {
  id: string;
  title: string;
  status: 'pending' | 'completed' | 'paid';
  jobId: string;
  jobStatus: string;
  customerId: string;
};

function stripePaymentsEnabled() {
  return Boolean(
    process.env.STRIPE_SECRET_KEY?.trim()
    && process.env.EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY?.trim(),
  );
}

export async function POST(request: Request) {
  try {
    const customer = await requireRole(request, 'customer');
    const { milestoneId } = schema.parse(await request.json());

    if (stripePaymentsEnabled()) {
      throw new HttpError(409, 'BuildPair secure payments are enabled. Use the card payment option for this milestone.');
    }

    const sql = getSql();
    const rows = await sql`
      SELECT m.id,
             m.title,
             m.status,
             m.job_id AS "jobId",
             j.status AS "jobStatus",
             j.customer_id AS "customerId"
      FROM job_milestones m
      JOIN jobs j ON j.id = m.job_id
      WHERE m.id = ${milestoneId}
        AND j.customer_id = ${customer.id}
      LIMIT 1
    ` as unknown as MilestoneRow[];
    const milestone = rows[0];
    if (!milestone) throw new HttpError(404, 'Payment milestone not found');
    if (milestone.status === 'paid') throw new HttpError(409, 'Milestone is already marked paid');
    if (!['in_progress', 'completed'].includes(milestone.jobStatus)) throw new HttpError(409, 'This job is not ready for payment confirmation');
    if (milestone.title !== 'Deposit' && milestone.status !== 'completed') {
      throw new HttpError(409, 'The tradesperson must mark the work complete before you confirm the final payment');
    }

    const updated = await sql`
      UPDATE job_milestones
      SET status = 'paid',
          paid_at = now(),
          completed_at = coalesce(completed_at, now()),
          payment_method = 'customer_confirmed_external',
          payment_confirmed_by = ${customer.id}
      WHERE id = ${milestoneId}
        AND status <> 'paid'
      RETURNING id,
                job_id AS "jobId",
                title,
                amount,
                status,
                completed_at AS "completedAt",
                paid_at AS "paidAt",
                payment_method AS "paymentMethod"
    ` as unknown as Array<Record<string, unknown>>;
    if (!updated[0]) throw new HttpError(409, 'Milestone payment status changed before confirmation completed');

    return Response.json({
      ...updated[0],
      confirmation: 'customer_confirmed_external',
      notice: 'BuildPair recorded your confirmation only. No card payment was processed by BuildPair.',
    });
  } catch (error) {
    return jsonError(error);
  }
}
