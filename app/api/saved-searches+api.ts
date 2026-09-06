import { z } from 'zod';
import { TRADE_CATEGORIES } from '@/constants/options';
import { InvalidPostcodeError, lookupPostcode } from '@/lib/postcode';
import { assertRateLimit } from '@/lib/rate-limit';
import { getSql } from '@/lib/sql';
import { HttpError, jsonError, requireRole } from '@/lib/server';

const createSchema = z.object({
  name: z.string().trim().min(2).max(100),
  category: z.enum(TRADE_CATEGORIES).optional(),
  keywords: z.string().trim().max(300).optional(),
  postcode: z.string().trim().max(12).optional(),
  radiusMiles: z.number().int().min(1).max(150).default(15),
  emergencyOnly: z.boolean().default(false),
  enabled: z.boolean().default(true),
});
const updateSchema = createSchema.partial().extend({ id: z.string().uuid() });
const deleteSchema = z.object({ id: z.string().uuid() });

type SearchLocation = { postcode: string | null; latitude: number | null; longitude: number | null };

async function resolveSearchLocation(postcode?: string): Promise<SearchLocation> {
  const value = postcode?.trim();
  if (!value) return { postcode: null, latitude: null, longitude: null };
  try {
    const location = await lookupPostcode(value);
    return { postcode: location.postcode, latitude: location.latitude, longitude: location.longitude };
  } catch (error) {
    if (error instanceof InvalidPostcodeError) throw new HttpError(400, error.message);
    throw error;
  }
}

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
    await assertRateLimit(request, 'saved-job-search-create', 30, 3600, trader.id);
    const input = createSchema.parse(await request.json());
    const existing = await getSql()`SELECT count(*)::int AS count FROM saved_job_searches WHERE trader_id = ${trader.id}` as unknown as Array<{ count: number }>;
    if ((existing[0]?.count ?? 0) >= 25) throw new HttpError(409, 'You can keep up to 25 saved job searches. Delete an old search before adding another.');
    const location = await resolveSearchLocation(input.postcode);
    const rows = await getSql()`
      INSERT INTO saved_job_searches(trader_id, name, category, keywords, postcode, latitude, longitude, radius_miles, emergency_only, enabled)
      VALUES (${trader.id}, ${input.name}, ${input.category ?? null}, ${input.keywords || null}, ${location.postcode}, ${location.latitude}, ${location.longitude}, ${input.radiusMiles}, ${input.emergencyOnly}, ${input.enabled})
      RETURNING id, name, category, keywords, postcode, radius_miles AS "radiusMiles", emergency_only AS "emergencyOnly", enabled
    `;
    return Response.json(rows[0], { status: 201 });
  } catch (error) { return jsonError(error); }
}

export async function PATCH(request: Request) {
  try {
    const trader = await requireRole(request, 'trader');
    await assertRateLimit(request, 'saved-job-search-update', 120, 3600, trader.id);
    const input = updateSchema.parse(await request.json());
    const currentRows = await getSql()`
      SELECT id, name, category, keywords, postcode, latitude, longitude, radius_miles, emergency_only, enabled
      FROM saved_job_searches
      WHERE id = ${input.id} AND trader_id = ${trader.id}
      LIMIT 1
    ` as unknown as Array<Record<string, unknown>>;
    if (!currentRows.length) throw new HttpError(404, 'Saved search not found');
    const current = currentRows[0] as Record<string, unknown>;
    const location = input.postcode !== undefined
      ? await resolveSearchLocation(input.postcode)
      : {
          postcode: current.postcode as string | null,
          latitude: current.latitude == null ? null : Number(current.latitude),
          longitude: current.longitude == null ? null : Number(current.longitude),
        };
    const rows = await getSql()`
      UPDATE saved_job_searches
      SET name = ${input.name ?? String(current.name)},
          category = ${input.category ?? (current.category as string | null)},
          keywords = ${input.keywords !== undefined ? (input.keywords || null) : (current.keywords as string | null)},
          postcode = ${location.postcode},
          latitude = ${location.latitude},
          longitude = ${location.longitude},
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
