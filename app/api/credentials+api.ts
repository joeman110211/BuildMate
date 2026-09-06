import { z } from 'zod';
import { createNotification } from '@/lib/notifications';
import { assertRateLimit } from '@/lib/rate-limit';
import { getSql } from '@/lib/sql';
import { HttpError, jsonError, requireAdmin, requireRole } from '@/lib/server';

const createSchema = z.object({
  credentialType: z.enum(['identity','public_liability','qualification','gas_safe','niceic','napit','trustmark','other']),
  name: z.string().trim().min(2).max(160),
  issuer: z.string().trim().max(160).optional(),
  referenceNumber: z.string().trim().max(120).optional(),
  documentUrl: z.string().url().max(1200).optional(),
  expiresAt: z.string().datetime().optional(),
});
const reviewSchema = z.object({
  id: z.string().uuid(),
  status: z.enum(['verified','rejected']),
  rejectionReason: z.string().trim().max(500).optional(),
});
const PUBLIC_REFERENCE_TYPES = ['gas_safe', 'niceic', 'napit', 'trustmark'] as const;

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const publicTraderId = url.searchParams.get('traderId');
    const sql = getSql();
    if (publicTraderId) {
      // Public profiles should prove verified status without publishing identity,
      // insurance policy or qualification document identifiers. Register numbers
      // remain useful only for schemes that homeowners can independently check.
      const rows = await sql`
        SELECT id, credential_type AS "credentialType", name, issuer,
               CASE WHEN credential_type = ANY(${PUBLIC_REFERENCE_TYPES}::text[]) THEN reference_number ELSE NULL END AS "referenceNumber",
               expires_at AS "expiresAt", verified_at AS "verifiedAt", status
        FROM trader_credentials
        WHERE trader_id = ${publicTraderId}
          AND status = 'verified'
          AND (expires_at IS NULL OR expires_at > now())
        ORDER BY verified_at DESC NULLS LAST, created_at DESC
        LIMIT 50
      `;
      return Response.json(rows);
    }

    const trader = await requireRole(request, 'trader');
    const rows = await sql`
      SELECT id, credential_type AS "credentialType", name, issuer,
             reference_number AS "referenceNumber", document_url AS "documentUrl",
             expires_at AS "expiresAt", status, verified_at AS "verifiedAt",
             rejection_reason AS "rejectionReason", created_at AS "createdAt"
      FROM trader_credentials
      WHERE trader_id = ${trader.id}
      ORDER BY created_at DESC
      LIMIT 100
    `;
    return Response.json(rows);
  } catch (error) { return jsonError(error); }
}

export async function POST(request: Request) {
  try {
    const trader = await requireRole(request, 'trader');
    await assertRateLimit(request, 'credential-submit', 15, 86400, trader.id);
    const input = createSchema.parse(await request.json());
    if (input.expiresAt && new Date(input.expiresAt).getTime() <= Date.now()) {
      throw new HttpError(400, 'Expired evidence cannot be submitted for current verification');
    }
    const sql = getSql();
    const counts = await sql`SELECT count(*)::int AS count FROM trader_credentials WHERE trader_id = ${trader.id}` as unknown as Array<{ count: number }>;
    if ((counts[0]?.count ?? 0) >= 50) throw new HttpError(409, 'You can keep up to 50 credential records. Remove obsolete evidence before submitting more.');
    const rows = await sql`
      INSERT INTO trader_credentials(trader_id, credential_type, name, issuer, reference_number, document_url, expires_at)
      VALUES (${trader.id}, ${input.credentialType}, ${input.name}, ${input.issuer ?? null}, ${input.referenceNumber ?? null}, ${input.documentUrl ?? null}, ${input.expiresAt ?? null}::timestamptz)
      RETURNING id, credential_type AS "credentialType", name, status, expires_at AS "expiresAt", created_at AS "createdAt"
    `;
    await createNotification(trader.id, {
      type: 'credential_submitted',
      title: 'Verification submitted',
      body: `${input.name} has been added to your verification queue.`,
      href: '/trader/trust',
    });
    return Response.json(rows[0], { status: 201 });
  } catch (error) { return jsonError(error); }
}

export async function PATCH(request: Request) {
  try {
    await requireAdmin(request);
    const input = reviewSchema.parse(await request.json());
    const sql = getSql();
    const rows = await sql`
      UPDATE trader_credentials
      SET status = ${input.status},
          verified_at = CASE WHEN ${input.status} = 'verified' THEN now() ELSE NULL END,
          rejection_reason = ${input.status === 'rejected' ? input.rejectionReason ?? 'The submitted evidence could not be verified.' : null},
          updated_at = now()
      WHERE id = ${input.id}
      RETURNING trader_id AS "traderId", name, status
    ` as unknown as { traderId: string; name: string; status: string }[];
    const credential = rows[0];
    if (!credential) throw new HttpError(404, 'Credential not found');
    await createNotification(credential.traderId, {
      type: 'credential_reviewed',
      title: credential.status === 'verified' ? 'Credential verified' : 'Credential needs attention',
      body: credential.status === 'verified' ? `${credential.name} is now shown as verified on your BuildPair profile.` : `${credential.name} could not be verified. Check the details and resubmit evidence.`,
      href: '/trader/trust',
      email: true,
    });
    return Response.json({ reviewed: true, status: credential.status });
  } catch (error) { return jsonError(error); }
}
