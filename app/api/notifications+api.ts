import { z } from 'zod';
import { authenticatedUserId, ensureDbUser, HttpError, jsonError } from '@/lib/server';
import { getSql } from '@/lib/sql';

const schema = z.object({ id: z.string().uuid().optional(), action: z.enum(['read','read_all']) });

export async function GET(request: Request) {
  try {
    const userId = await authenticatedUserId(request);
    await ensureDbUser(userId);
    const rows = await getSql()`
      SELECT id, type, title, body, href, read_at AS "readAt", created_at AS "createdAt"
      FROM notifications
      WHERE user_id = ${userId}
      ORDER BY created_at DESC
      LIMIT 100
    `;
    return Response.json(rows);
  } catch (error) { return jsonError(error); }
}

export async function PATCH(request: Request) {
  try {
    const userId = await authenticatedUserId(request);
    await ensureDbUser(userId);
    const input = schema.parse(await request.json());
    const sql = getSql();
    if (input.action === 'read_all') {
      await sql`UPDATE notifications SET read_at = coalesce(read_at, now()) WHERE user_id = ${userId}`;
      return Response.json({ readAll: true });
    }
    if (!input.id) throw new HttpError(400, 'Notification id is required');
    const rows = await sql`UPDATE notifications SET read_at = coalesce(read_at, now()) WHERE id = ${input.id} AND user_id = ${userId} RETURNING id`;
    if (!rows.length) throw new HttpError(404, 'Notification not found');
    return Response.json({ read: true });
  } catch (error) { return jsonError(error); }
}
