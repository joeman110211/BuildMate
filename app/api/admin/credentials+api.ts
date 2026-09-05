import { jsonError, requireAdmin } from '@/lib/server';
import { getSql } from '@/lib/sql';

export async function GET(request: Request) {
  try {
    await requireAdmin(request);
    const rows = await getSql()`
      SELECT tc.id, tc.trader_id AS "traderId", tp.business_name AS "businessName",
             tc.credential_type AS "credentialType", tc.name, tc.issuer,
             tc.reference_number AS "referenceNumber", tc.document_url AS "documentUrl",
             tc.expires_at AS "expiresAt", tc.status, tc.created_at AS "createdAt"
      FROM trader_credentials tc
      LEFT JOIN trader_profiles tp ON tp.user_id = tc.trader_id
      WHERE tc.status = 'submitted'
      ORDER BY tc.created_at ASC
      LIMIT 200
    `;
    return Response.json(rows);
  } catch (error) { return jsonError(error); }
}
