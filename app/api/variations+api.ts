import { z } from 'zod';
import { addJobEvent, createNotification } from '@/lib/notifications';
import { assertRateLimit } from '@/lib/rate-limit';
import { getSql } from '@/lib/sql';
import { accountModes, authenticatedUserId, ensureDbUser, HttpError, jsonError, requireRole } from '@/lib/server';

const createSchema = z.object({
  jobId: z.string().uuid(),
  title: z.string().trim().min(3).max(160),
  description: z.string().trim().min(10).max(4000),
  amountDelta: z.number().int().min(-100000000).max(100000000).default(0),
  durationDeltaDays: z.number().int().min(-365).max(365).default(0),
});

export async function GET(request: Request) {
  try {
    const userId = await authenticatedUserId(request);
    await ensureDbUser(userId);
    const modes = await accountModes(userId);
    const jobId = new URL(request.url).searchParams.get('jobId');
    if (!jobId) throw new HttpError(400, 'jobId is required');
    const access = modes.customerEnabled
      ? await getSql()`SELECT 1 FROM jobs WHERE id = ${jobId} AND customer_id = ${userId} LIMIT 1`
      : await getSql()`SELECT 1 FROM quotes q JOIN jobs j ON j.accepted_quote_id = q.id WHERE j.id = ${jobId} AND q.trader_id = ${userId} LIMIT 1`;
    if (!access.length) throw new HttpError(403, 'You do not have access to this job');
    const rows = await getSql()`
      SELECT id, job_id AS "jobId", trader_id AS "traderId", customer_id AS "customerId",
             title, description, amount_delta AS "amountDelta", duration_delta_days AS "durationDeltaDays",
             status, created_at AS "createdAt", responded_at AS "respondedAt"
      FROM job_variations WHERE job_id = ${jobId} ORDER BY created_at DESC
    `;
    return Response.json(rows);
  } catch (error) { return jsonError(error); }
}

export async function POST(request: Request) {
  try {
    const trader = await requireRole(request, 'trader');
    await assertRateLimit(request, 'propose-variation', 30, 3600, trader.id);
    const input = createSchema.parse(await request.json());
    const sql = getSql();
    const jobs = await sql`
      SELECT j.customer_id AS "customerId", j.status, j.title
      FROM jobs j
      JOIN quotes q ON q.id = j.accepted_quote_id
      WHERE j.id = ${input.jobId} AND q.trader_id = ${trader.id}
      LIMIT 1
    ` as unknown as { customerId: string; status: string; title: string }[];
    const job = jobs[0];
    if (!job) throw new HttpError(403, 'Only the hired tradesperson can propose a variation');
    if (!['in_progress','completed'].includes(job.status)) throw new HttpError(409, 'Variations are available after a quote has been accepted');
    if (job.status === 'completed') throw new HttpError(409, 'Completed jobs cannot receive new variations');

    const pending = await sql`
      SELECT count(*)::int AS count
      FROM job_variations
      WHERE job_id = ${input.jobId} AND status = 'pending'
    ` as unknown as Array<{ count: number }>;
    if ((pending[0]?.count ?? 0) >= 20) throw new HttpError(409, 'Resolve or withdraw an existing variation before adding more changes');

    const rows = await sql`
      INSERT INTO job_variations(job_id, trader_id, customer_id, title, description, amount_delta, duration_delta_days)
      VALUES (${input.jobId}, ${trader.id}, ${job.customerId}, ${input.title}, ${input.description}, ${input.amountDelta}, ${input.durationDeltaDays})
      RETURNING id, status, created_at AS "createdAt"
    `;
    await addJobEvent(input.jobId, trader.id, 'variation_proposed', 'Variation proposed', input.title, { amountDelta: input.amountDelta, durationDeltaDays: input.durationDeltaDays });
    await createNotification(job.customerId, {
      type: 'variation_proposed',
      title: 'Job change needs your approval',
      body: `${input.title} has been proposed for ${job.title}. Review the price/time change before work proceeds.`,
      href: `/customer/jobs/${input.jobId}`,
      email: true,
    });
    return Response.json(rows[0], { status: 201 });
  } catch (error) { return jsonError(error); }
}
