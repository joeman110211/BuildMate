import { z } from 'zod';
import { getSql } from '@/lib/sql';
import { HttpError, jsonError, requireRole } from '@/lib/server';

const createSchema = z.object({
  name: z.string().trim().min(2).max(100),
  category: z.string().trim().max(120).optional(),
  keywords: z.string().trim().max(300).optional(),
  postcode: z.string().trim().max(12).optional(),
  radiusMiles: z.number().int().min(1).max(150).default(15),
  emergencyOnly: z.boolean().default(false),
  enabled: z.boolean().default(true),
});
const updateSchema = createSchema.partial().extend({ id: z.string().uuid() });
const deleteSchema = z.object({ id: z.string().uuid() });

export async function GET(request: Request) {
  try {
    const trader = await requireRole(request, 'trader');
    const rows = await getSql()`
      SELECT id, name, category, keywords, postcode, radius_miles AS "radiusMiles",
             emergency_only AS "emergencyOnly", enabled, created_at AS "createdAt", updated_at AS "updatedAt"
      FROM saved_job_searches
      WHERE trader_id = ${trader.id}
      ORDER BY created_at DESC
    `;
    return Response.json(rows);
  } catch (error) { return jsonError(error); }
}

export async function POST(request: Request) {
  try {
    const trader = await requireRole(request, 'trader');
    const input = createSchema.parse(await request.json());
    const rows = await getSql()`
      INSERT INTO saved_job_searches(trader_id, name, category, keywords, postcode, radius_miles, emergency_only, enabled)
      VALUES (${trader.id}, ${input.name}, ${input.category ?? null}, ${input.keywords ?? null}, ${input.postcode?.toUpperCase() ?? null}, ${input.radiusMiles}, ${input.emergencyOnly}, ${input.enabled})
      RETURNING id, name, category, keywords, postcode, radius_miles AS "radiusMiles", emergency_only AS "emergencyOnly", enabled
    `;
    return Response.json(rows[0], { status: 201 });
  } catch (error) { return jsonError(error); }
}

export async function PATCH(request: Request) {
  try {
    const trader = await requireRole(request, 'trader');
    const input = updateSchema.parse(await request.json());
    const currentRows = await getSql()`SELECT * FROM saved_job_searches WHERE id = ${input.id} AND trader_id = ${trader.id} LIMIT 1` as unknown as Array<Record<string, unknown>>;
    if (!currentRows.length) throw new HttpError(404, 'Saved search not found');
    const current = currentRows[0] as Record<string, unknown>;
    const rows = await getSql()`
      UPDATE saved_job_searches
      SET name = ${input.name ?? String(current.name)},
          category = ${input.category ?? (current.category as string | null)},
          keywords = ${input.keywords ?? (current.keywords as string | null)},
          postcode = ${input.postcode?.toUpperCase() ?? (current.postcode as string | null)},
          radius_miles = ${input.radiusMiles ?? Number(current.radius_miles)},
          emergency_only = ${input.emergencyOnly ?? Boolean(current.emergency_only)},
          enabled = ${input.enabled ?? Boolean(current.enabled)},
          updated_at = now()
      WHERE id = ${input.id} AND trader_id = ${trader.id}
      RETURNING id, name, category, keywords, postcode, radius_miles AS "radiusMiles", emergency_only AS "emergencyOnly", enabled
    `;
    return Response.json(rows[0]);
  } catch (error) { return jsonError(error); }
}

export async function DELETE(request: Request) {
  try {
    const trader = await requireRole(request, 'trader');
    const { id } = deleteSchema.parse(await request.json());
    const rows = await getSql()`DELETE FROM saved_job_searches WHERE id = ${id} AND trader_id = ${trader.id} RETURNING id`;
    if (!rows.length) throw new HttpError(404, 'Saved search not found');
    return Response.json({ deleted: true });
  } catch (error) { return jsonError(error); }
}
