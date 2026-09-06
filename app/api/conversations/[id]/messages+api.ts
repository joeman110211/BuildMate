import { z } from 'zod';
import { classifyMessageSafety, isRiskAtLeast, type MessageRiskLevel } from '@/lib/message-safety';
import { assertRateLimit } from '@/lib/rate-limit';
import { authenticatedUserId, ensureDbUser, HttpError, jsonError } from '@/lib/server';
import { getSql } from '@/lib/sql';

const messageSchema = z.object({ body: z.string().trim().min(1).max(4000) });

type Participant = {
  id: string;
  jobId: string;
  customerId: string;
  traderId: string;
  moderationStatus: 'open' | 'warned' | 'restricted' | 'closed';
  moderationReason: string;
};
type MessageRow = {
  id: string;
  conversationId: string;
  senderId: string;
  body: string;
  readAt: string | null;
  createdAt: string;
  aiRiskLevel: MessageRiskLevel;
  aiModerationReason: string;
};

async function requireParticipant(conversationId: string, userId: string) {
  const sql = getSql();
  const rows = await sql`
    SELECT id,
           job_id AS "jobId",
           customer_id AS "customerId",
           trader_id AS "traderId",
           moderation_status AS "moderationStatus",
           moderation_reason AS "moderationReason"
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
      SELECT id,
             conversation_id AS "conversationId",
             sender_id AS "senderId",
             body,
             read_at AS "readAt",
             created_at AS "createdAt",
             ai_risk_level AS "aiRiskLevel",
             ai_moderation_reason AS "aiModerationReason"
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
    const participant = await requireParticipant(id, userId);
    if (participant.moderationStatus === 'closed') throw new HttpError(423, 'This conversation has been closed by BuildPair moderation');
    if (participant.moderationStatus === 'restricted') throw new HttpError(423, 'Messaging is temporarily restricted while BuildPair reviews this conversation');
    await assertRateLimit(request, 'job-message', 120, 3600, userId);
    const payload = messageSchema.parse(await request.json());
    const safety = classifyMessageSafety(payload.body);
    const sql = getSql();

    const priorRisk = await sql`
      SELECT count(*)::int AS count
      FROM messages
      WHERE conversation_id = ${id}
        AND sender_id = ${userId}
        AND ai_risk_level IN ('medium', 'high', 'severe')
    ` as unknown as { count: number }[];
    const repeatedRisk = isRiskAtLeast(safety.riskLevel, 'medium') && (priorRisk[0]?.count ?? 0) >= 1;
    const restrict = safety.riskLevel === 'severe' || repeatedRisk;
    const nextStatus = restrict
      ? 'restricted'
      : isRiskAtLeast(safety.riskLevel, 'medium')
        ? 'warned'
        : participant.moderationStatus;

    const rows = await sql`
      INSERT INTO messages(conversation_id, sender_id, body, ai_risk_level, ai_moderation_reason)
      VALUES (${id}, ${userId}, ${payload.body}, ${safety.riskLevel}, ${safety.reason})
      RETURNING id,
                conversation_id AS "conversationId",
                sender_id AS "senderId",
                body,
                read_at AS "readAt",
                created_at AS "createdAt",
                ai_risk_level AS "aiRiskLevel",
                ai_moderation_reason AS "aiModerationReason"
    ` as unknown as MessageRow[];
    const created = rows[0];
    if (!created) throw new Error('Message could not be saved');

    await sql`UPDATE conversations SET last_message_at = now(), updated_at = now() WHERE id = ${id}`;
    if (nextStatus !== participant.moderationStatus || safety.reason) {
      await sql`
        UPDATE conversations
        SET moderation_status = ${nextStatus},
            moderation_reason = ${safety.reason || participant.moderationReason},
            moderation_updated_at = now(),
            updated_at = now()
        WHERE id = ${id}
      `;
    }

    if (isRiskAtLeast(safety.riskLevel, 'medium')) {
      await sql`
        INSERT INTO moderation_reports(reporter_id, subject_user_id, message_id, job_id, reason, details)
        VALUES (
          ${userId},
          ${userId},
          ${created.id},
          ${participant.jobId},
          ${safety.reportReason},
          ${`Automatically flagged by BuildPair message safety: ${safety.reason}. Risk level: ${safety.riskLevel}.`}
        )
      `;
    }

    const warning = restrict
      ? 'BuildPair has temporarily restricted this conversation and sent it to moderation for review.'
      : isRiskAtLeast(safety.riskLevel, 'medium')
        ? 'BuildPair detected language or behaviour that may breach the chat rules. Keep the conversation factual and respectful.'
        : null;

    return Response.json({ ...created, conversationStatus: nextStatus, warning }, { status: 201 });
  } catch (error) { return jsonError(error); }
}
