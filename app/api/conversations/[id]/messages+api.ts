import { z } from 'zod';
import { assertRateLimit } from '@/lib/rate-limit';
import { authenticatedUserId, ensureDbUser, HttpError, jsonError } from '@/lib/server';
import { getSql } from '@/lib/sql';

const messageSchema = z.object({ body: z.string().trim().min(1).max(4000) });

type Participant = { id: string; customerId: string; traderId: string };
type MessageRow = { id: string; conversationId: string; senderId: string; body: string; readAt: string | null; createdAt: string };

async function requireParticipant(conversationId: string, userId: string) {
  const sql = getSql();
  const rows = await sql`
    SELECT id, customer_id AS "customerId", trader_id AS "traderId"
    FROM conversations
    WHERE id = ${conversationId} AND (customer_id = ${userId} OR trader_id = ${userId})
    LIMIT 1
  ` as unknown as Participant[];
  if (!rows[0]) throw new HttpError(404, 'Conversation not found');
  return rows[0];
}

export async function GET(request: Request, { id }: { id: string }) {
  try {
    const userId = await authenticatedUserId(request);
    await ensureDbUser(userId);
    await requireParticipant(id, userId);
    const sql = getSql();
    await sql`UPDATE messages SET read_at = now() WHERE conversation_id = ${id} AND sender_id <> ${userId} AND read_at IS NULL`;
    const rows = await sql`
      SELECT id, conversation_id AS "conversationId", sender_id AS "senderId", body, read_at AS "readAt", created_at AS "createdAt"
      FROM messages
      WHERE conversation_id = ${id}
      ORDER BY created_at ASC
      LIMIT 500
    ` as unknown as MessageRow[];
    return Response.json(rows);
  } catch (error) { return jsonError(error); }
}

export async function POST(request: Request, { id }: { id: string }) {
  try {
    const userId = await authenticatedUserId(request);
    await ensureDbUser(userId);
    await requireParticipant(id, userId);
    await assertRateLimit(request, 'job-message', 120, 3600, userId);
    const payload = messageSchema.parse(await request.json());
    const sql = getSql();
    const rows = await sql`
      INSERT INTO messages(conversation_id, sender_id, body)
      VALUES (${id}, ${userId}, ${payload.body})
      RETURNING id, conversation_id AS "conversationId", sender_id AS "senderId", body, read_at AS "readAt", created_at AS "createdAt"
    ` as unknown as MessageRow[];
    await sql`UPDATE conversations SET last_message_at = now(), updated_at = now() WHERE id = ${id}`;
    return Response.json(rows[0], { status: 201 });
  } catch (error) { return jsonError(error); }
}
