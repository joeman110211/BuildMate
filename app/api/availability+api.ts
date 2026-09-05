import { z } from 'zod';
import { authenticatedUserId, ensureDbUser, HttpError, jsonError, requireRole } from '@/lib/server';
import { getSql } from '@/lib/sql';

const createSchema = z.object({
  startsAt: z.string().datetime(),
  endsAt: z.string().datetime(),
  status: z.enum(['available','busy','unavailable']).default('available'),
  note: z.string().trim().max(300).optional(),
});
const deleteSchema = z.object({ id: z.string().uuid() });

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    let traderId = url.searchParams.get('traderId');
    if (!traderId) {
      const userId = await authenticatedUserId(request);
      await ensureDbUser(userId);
      traderId = userId;
    }
    const rows = await getSql()`
      SELECT id, starts_at AS "startsAt", ends_at AS "endsAt", status, note
      FROM trader_availability
      WHERE trader_id = ${traderId}
        AND ends_at >= now() - interval '1 day'
      ORDER BY starts_at ASC
      LIMIT 180
    `;
    return Response.json(rows);
  } catch (error) { return jsonError(error); }
}

export async function POST(request: Request) {
  try {
    const trader = await requireRole(request, 'trader');
    const input = createSchema.parse(await request.json());
    if (new Date(input.endsAt) <= new Date(input.startsAt)) throw new HttpError(400, 'Availability end must be after the start');
    const rows = await getSql()`
      INSERT INTO trader_availability(trader_id, starts_at, ends_at, status, note)
      VALUES (${trader.id}, ${input.startsAt}::timestamptz, ${input.endsAt}::timestamptz, ${input.status}, ${input.note ?? null})
      RETURNING id, starts_at AS "startsAt", ends_at AS "endsAt", status, note
    `;
    return Response.json(rows[0], { status: 201 });
  } catch (error) { return jsonError(error); }
}

export async function DELETE(request: Request) {
  try {
    const trader = await requireRole(request, 'trader');
    const { id } = deleteSchema.parse(await request.json());
    const rows = await getSql()`DELETE FROM trader_availability WHERE id = ${id} AND trader_id = ${trader.id} RETURNING id`;
    if (!rows.length) throw new HttpError(404, 'Availability entry not found');
    return Response.json({ deleted: true });
  } catch (error) { return jsonError(error); }
}
