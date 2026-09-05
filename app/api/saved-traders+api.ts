import { z } from 'zod';
import { getSql } from '@/lib/sql';
import { HttpError, jsonError, requireRole } from '@/lib/server';

const schema = z.object({ traderId: z.string().min(1), saved: z.boolean().default(true) });

export async function GET(request: Request) {
  try {
    const customer = await requireRole(request, 'customer');
    const rows = await getSql()`
      SELECT st.trader_id AS "traderId",
             tp.id AS "profileId",
             tp.business_name AS "businessName",
             tp.trade_category AS "tradeCategory",
             tp.location_label AS "locationLabel",
             tp.radius_miles AS "radiusMiles",
             tps.profile_image_url AS "profileImageUrl",
             coalesce(avg(r.rating) FILTER (WHERE r.verified_completion = true), 0)::float AS "averageRating",
             count(r.id) FILTER (WHERE r.verified_completion = true)::int AS "reviewCount",
             count(tc.id) FILTER (WHERE tc.status = 'verified')::int AS "verifiedCredentialCount",
             st.created_at AS "savedAt"
      FROM saved_traders st
      JOIN trader_profiles tp ON tp.user_id = st.trader_id
      LEFT JOIN trader_profile_showcase tps ON tps.user_id = st.trader_id
      LEFT JOIN reviews r ON r.trader_id = st.trader_id
      LEFT JOIN trader_credentials tc ON tc.trader_id = st.trader_id
      WHERE st.customer_id = ${customer.id}
      GROUP BY st.trader_id, tp.id, tps.profile_image_url, st.created_at
      ORDER BY st.created_at DESC
    `;
    return Response.json(rows);
  } catch (error) { return jsonError(error); }
}

export async function POST(request: Request) {
  try {
    const customer = await requireRole(request, 'customer');
    const { traderId, saved } = schema.parse(await request.json());
    if (traderId === customer.id) throw new HttpError(400, 'You cannot save your own trade profile');
    const sql = getSql();
    const exists = await sql`SELECT 1 FROM trader_profiles WHERE user_id = ${traderId} LIMIT 1`;
    if (!exists.length) throw new HttpError(404, 'Tradesperson not found');
    if (saved) {
      await sql`INSERT INTO saved_traders(customer_id, trader_id) VALUES (${customer.id}, ${traderId}) ON CONFLICT DO NOTHING`;
    } else {
      await sql`DELETE FROM saved_traders WHERE customer_id = ${customer.id} AND trader_id = ${traderId}`;
    }
    return Response.json({ traderId, saved });
  } catch (error) { return jsonError(error); }
}
