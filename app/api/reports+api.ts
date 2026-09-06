import { z } from 'zod';
import { assertRateLimit } from '@/lib/rate-limit';
import { authenticatedUserId, ensureDbUser, HttpError, jsonError } from '@/lib/server';
import { getSql } from '@/lib/sql';

const reportSchema = z.object({
  subjectUserId: z.string().min(1).optional(),
  messageId: z.string().uuid().optional(),
  reviewId: z.string().uuid().optional(),
  jobId: z.string().uuid().optional(),
  reason: z.enum(['spam', 'fraud', 'abuse_or_harassment', 'unsafe_content', 'other']),
  details: z.string().trim().max(2000).default(''),
}).superRefine((value, ctx) => {
  const targetCount = [value.subjectUserId, value.messageId, value.reviewId, value.jobId].filter(Boolean).length;
  if (targetCount !== 1) ctx.addIssue({ code: 'custom', message: 'Choose exactly one report target' });
});

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
    await assertRateLimit(request, 'moderation-report', 20, 86400, userId);
    const payload = reportSchema.parse(await request.json());
    const sql = getSql();
    let subjectUserId: string | null = null;

    if (payload.subjectUserId) {
      const target = await sql`
        SELECT id FROM users
        WHERE id = ${payload.subjectUserId}
          AND coalesce(is_deleted, false) = false
        LIMIT 1
      `;
      if (!target.length) throw new HttpError(404, 'Account to report was not found');
      subjectUserId = payload.subjectUserId;
    } else if (payload.messageId) {
      const access = await sql`
        SELECT m.sender_id AS "senderId"
        FROM messages m
        JOIN conversations c ON c.id = m.conversation_id
        WHERE m.id = ${payload.messageId}
          AND (c.customer_id = ${userId} OR c.trader_id = ${userId})
          AND m.sender_id <> ${userId}
        LIMIT 1
      ` as unknown as Array<{ senderId: string }>;
      if (!access[0]) throw new HttpError(403, 'You cannot report this message');
      subjectUserId = access[0].senderId;
    } else if (payload.reviewId) {
      const review = await sql`
        SELECT customer_id AS "authorId"
        FROM reviews
        WHERE id = ${payload.reviewId}
        LIMIT 1
      ` as unknown as Array<{ authorId: string }>;
      if (!review[0]) throw new HttpError(404, 'Review to report was not found');
      subjectUserId = review[0].authorId;
    } else if (payload.jobId) {
      const job = await sql`
        SELECT customer_id AS "authorId"
        FROM jobs
        WHERE id = ${payload.jobId}
        LIMIT 1
      ` as unknown as Array<{ authorId: string }>;
      if (!job[0]) throw new HttpError(404, 'Job to report was not found');
      subjectUserId = job[0].authorId;
    }

    if (!subjectUserId) throw new HttpError(400, 'A report target is required');
    if (subjectUserId === userId) throw new HttpError(400, 'You cannot report your own content or account');

    const duplicate = await sql`
      SELECT 1
      FROM moderation_reports
      WHERE reporter_id = ${userId}
        AND status = 'open'
        AND reason = ${payload.reason}
        AND coalesce(subject_user_id, '') = coalesce(${subjectUserId}, '')
        AND coalesce(message_id::text, '') = coalesce(${payload.messageId ?? null}::text, '')
        AND coalesce(review_id::text, '') = coalesce(${payload.reviewId ?? null}::text, '')
        AND coalesce(job_id::text, '') = coalesce(${payload.jobId ?? null}::text, '')
      LIMIT 1
    `;
    if (duplicate.length) throw new HttpError(409, 'You already have an open report for this item');

    const rows = await sql`
      INSERT INTO moderation_reports(reporter_id, subject_user_id, message_id, review_id, job_id, reason, details)
      VALUES (${userId}, ${subjectUserId}, ${payload.messageId ?? null}, ${payload.reviewId ?? null}, ${payload.jobId ?? null}, ${payload.reason}, ${payload.details})
      RETURNING id, status, created_at AS "createdAt"
    ` as unknown as Array<{ id: string; status: string; createdAt: string }>;
    return Response.json(rows[0], { status: 201 });
  } catch (error) { return jsonError(error); }
}
