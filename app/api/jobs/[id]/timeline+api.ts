import { getSql } from '@/lib/sql';
import { authenticatedUserId, ensureDbUser, HttpError, jsonError } from '@/lib/server';

export async function GET(request: Request, { id }: { id: string }) {
  try {
    const userId = await authenticatedUserId(request);
    await ensureDbUser(userId);
    const sql = getSql();
    const access = await sql`
      SELECT j.id, j.customer_id AS "customerId", j.created_at AS "createdAt", j.title,
             q.trader_id AS "traderId"
      FROM jobs j
      LEFT JOIN quotes q ON q.id = j.accepted_quote_id
      WHERE j.id = ${id}
        AND (j.customer_id = ${userId} OR q.trader_id = ${userId})
      LIMIT 1
    ` as unknown as { id: string; customerId: string; traderId: string | null; createdAt: string; title: string }[];
    const job = access[0];
    if (!job) throw new HttpError(404, 'Job not found');

    const rows = await sql`
      SELECT id, event_type AS "eventType", title, description, metadata,
             actor_id AS "actorId", created_at AS "createdAt"
      FROM job_events
      WHERE job_id = ${id}
      ORDER BY created_at ASC
    ` as unknown as Array<Record<string, unknown>>;

    if (!rows.length) {
      rows.push({ id: `created-${id}`, eventType: 'job_created', title: 'Job posted', description: job.title, actorId: job.customerId, createdAt: job.createdAt, metadata: {} });
    }
    return Response.json(rows);
  } catch (error) { return jsonError(error); }
}
