import { authenticatedUserId, ensureDbUser, HttpError, jsonError } from '@/lib/server';
import { getSql } from '@/lib/sql';

type ConversationStatus = {
  id: string;
  jobId: string;
  customerId: string;
  traderId: string;
  moderationStatus: 'open' | 'warned' | 'restricted' | 'closed';
  moderationReason: string;
  moderationUpdatedAt: string | null;
};

export async function GET(request: Request, { id }: { id: string }) {
  try {
    const userId = await authenticatedUserId(request);
    await ensureDbUser(userId);
    const rows = await getSql()`
      SELECT id,
             job_id AS "jobId",
             customer_id AS "customerId",
             trader_id AS "traderId",
             moderation_status AS "moderationStatus",
             moderation_reason AS "moderationReason",
             moderation_updated_at AS "moderationUpdatedAt"
      FROM conversations
      WHERE id = ${id}
        AND (customer_id = ${userId} OR trader_id = ${userId})
      LIMIT 1
    ` as unknown as ConversationStatus[];
    if (!rows[0]) throw new HttpError(404, 'Conversation not found');
    return Response.json(rows[0]);
  } catch (error) { return jsonError(error); }
}
