import { z } from 'zod';
import { authenticatedUserId, ensureDbUser, HttpError, jsonError } from '@/lib/server';
import { getSql } from '@/lib/sql';

const reportSchema = z.object({
  subjectUserId: z.string().min(1).optional(),
  messageId: z.string().uuid().optional(),
  reviewId: z.string().uuid().optional(),
  jobId: z.string().uuid().optional(),
  reason: z.enum(['spam', 'fraud', 'abuse_or_harassment', 'unsafe_content', 'other']),
  details: z.string().trim().max(2000).default(''),
}).refine((value) => Boolean(value.subjectUserId || value.messageId || value.reviewId || value.jobId), 'A report target is required');

export async function GET(request: Request) {
  try {
    const userId = await authenticatedUserId(request);
    await ensureDbUser(userId);
    const sql = getSql();
    const rows = await sql`
      SELECT id, subject_user_id AS "subjectUserId", message_id AS "messageId", review_id AS "reviewId", job_id AS "jobId", reason, details, status, created_at AS "createdAt"
      FROM moderation_reports
      WHERE reporter_id = ${userId}
      ORDER BY created_at DESC
      LIMIT 100
    `;
    return Response.json(rows);
  } catch (error) { return jsonError(error); }
}

export async function POST(request: Request) {
  try {
    const userId = await authenticatedUserId(request);
    await ensureDbUser(userId);
    const payload = reportSchema.parse(await request.json());
    const sql = getSql();

    if (payload.messageId) {
      const access = await sql`
        SELECT m.id
        FROM messages m
        JOIN conversations c ON c.id = m.conversation_id
        WHERE m.id = ${payload.messageId}
          AND (c.customer_id = ${userId} OR c.trader_id = ${userId})
          AND m.sender_id <> ${userId}
        LIMIT 1
      `;
      if (!access.length) throw new HttpError(403, 'You cannot report this message');
    }

    const rows = await sql`
      INSERT INTO moderation_reports(reporter_id, subject_user_id, message_id, review_id, job_id, reason, details)
      VALUES (${userId}, ${payload.subjectUserId ?? null}, ${payload.messageId ?? null}, ${payload.reviewId ?? null}, ${payload.jobId ?? null}, ${payload.reason}, ${payload.details})
      RETURNING id, status, created_at AS "createdAt"
    `;
    return Response.json(rows[0], { status: 201 });
  } catch (error) { return jsonError(error); }
}
