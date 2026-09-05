import { z } from 'zod';
import { accountModes, authenticatedUserId, ensureDbUser, HttpError, jsonError } from '@/lib/server';
import { getSql } from '@/lib/sql';

const createConversationSchema = z.object({
  jobId: z.string().uuid(),
  traderId: z.string().min(1).optional(),
});

type ConversationRow = {
  id: string;
  jobId: string;
  jobTitle: string;
  customerId: string;
  traderId: string;
  otherUserId: string;
  lastMessage: string | null;
  lastMessageAt: string;
};

type JobRow = { id: string; customerId: string; targetTraderId: string | null };
type CreatedConversation = { id: string; jobId: string; customerId: string; traderId: string; lastMessageAt: string };

export async function GET(request: Request) {
  try {
    const userId = await authenticatedUserId(request);
    const user = await ensureDbUser(userId);
    const modes = await accountModes(userId);
    const activeMode = modes.activeMode ?? user.role;
    if (!activeMode) throw new HttpError(403, 'Choose an account mode first');
    const sql = getSql();
    const rows = activeMode === 'customer'
      ? await sql`
          SELECT c.id,
                 c.job_id AS "jobId",
                 j.title AS "jobTitle",
                 c.customer_id AS "customerId",
                 c.trader_id AS "traderId",
                 c.trader_id AS "otherUserId",
                 (SELECT m.body FROM messages m WHERE m.conversation_id = c.id ORDER BY m.created_at DESC LIMIT 1) AS "lastMessage",
                 c.last_message_at AS "lastMessageAt"
          FROM conversations c
          JOIN jobs j ON j.id = c.job_id
          WHERE c.customer_id = ${userId}
          ORDER BY c.last_message_at DESC
          LIMIT 100
        ` as unknown as ConversationRow[]
      : await sql`
          SELECT c.id,
                 c.job_id AS "jobId",
                 j.title AS "jobTitle",
                 c.customer_id AS "customerId",
                 c.trader_id AS "traderId",
                 c.customer_id AS "otherUserId",
                 (SELECT m.body FROM messages m WHERE m.conversation_id = c.id ORDER BY m.created_at DESC LIMIT 1) AS "lastMessage",
                 c.last_message_at AS "lastMessageAt"
          FROM conversations c
          JOIN jobs j ON j.id = c.job_id
          WHERE c.trader_id = ${userId}
          ORDER BY c.last_message_at DESC
          LIMIT 100
        ` as unknown as ConversationRow[];
    return Response.json(rows);
  } catch (error) { return jsonError(error); }
}

export async function POST(request: Request) {
  try {
    const userId = await authenticatedUserId(request);
    const user = await ensureDbUser(userId);
    const modes = await accountModes(userId);
    const activeMode = modes.activeMode ?? user.role;
    if (!activeMode) throw new HttpError(403, 'Choose an account mode first');
    const payload = createConversationSchema.parse(await request.json());
    const sql = getSql();
    const jobRows = await sql`SELECT id, customer_id AS "customerId", target_trader_id AS "targetTraderId" FROM jobs WHERE id = ${payload.jobId} LIMIT 1` as unknown as JobRow[];
    const job = jobRows[0];
    if (!job) throw new HttpError(404, 'Job not found');

    const traderId = activeMode === 'trader' ? userId : payload.traderId;
    if (!traderId) throw new HttpError(400, 'Trader is required');
    if (activeMode === 'customer' && job.customerId !== userId) throw new HttpError(403, 'You cannot message from this job');
    if (activeMode === 'trader' && traderId !== userId) throw new HttpError(403, 'Invalid trader');

    const eligible = await sql`
      SELECT 1 AS allowed FROM quotes WHERE job_id = ${payload.jobId} AND trader_id = ${traderId}
      UNION ALL
      SELECT 1 AS allowed WHERE ${job.targetTraderId} = ${traderId}
      LIMIT 1
    ` as unknown as { allowed: number }[];
    if (!eligible.length) throw new HttpError(403, 'Messaging opens after a quote or direct job request');

    const rows = await sql`
      INSERT INTO conversations(job_id, customer_id, trader_id)
      VALUES (${payload.jobId}, ${job.customerId}, ${traderId})
      ON CONFLICT (job_id, customer_id, trader_id)
      DO UPDATE SET updated_at = now()
      RETURNING id, job_id AS "jobId", customer_id AS "customerId", trader_id AS "traderId", last_message_at AS "lastMessageAt"
    ` as unknown as CreatedConversation[];
    return Response.json(rows[0], { status: 201 });
  } catch (error) { return jsonError(error); }
}
