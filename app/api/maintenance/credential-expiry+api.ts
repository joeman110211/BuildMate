import { createNotification } from '@/lib/notifications';
import { getSql } from '@/lib/sql';
import { HttpError, jsonError } from '@/lib/server';

export async function GET(request: Request) {
  try {
    const expected = process.env.CRON_SECRET;
    const provided = request.headers.get('authorization')?.replace(/^Bearer\s+/i, '');
    if (!expected || provided !== expected) throw new HttpError(401, 'Maintenance authentication required');
    const sql = getSql();

    await sql`
      UPDATE trader_credentials
      SET status = 'expired', updated_at = now()
      WHERE status = 'verified' AND expires_at IS NOT NULL AND expires_at <= now()
    `;

    const rows = await sql`
      SELECT tc.id, tc.trader_id AS "traderId", tc.name, tc.expires_at AS "expiresAt"
      FROM trader_credentials tc
      WHERE tc.status = 'verified'
        AND tc.expires_at > now()
        AND tc.expires_at <= now() + interval '30 days'
        AND NOT EXISTS (
          SELECT 1 FROM notifications n
          WHERE n.user_id = tc.trader_id
            AND n.type = 'credential_expiry'
            AND n.body LIKE '%' || tc.id::text || '%'
            AND n.created_at > now() - interval '7 days'
        )
    ` as unknown as { id: string; traderId: string; name: string; expiresAt: string }[];

    for (const credential of rows) {
      const days = Math.max(1, Math.ceil((new Date(credential.expiresAt).getTime() - Date.now()) / 86400000));
      await createNotification(credential.traderId, {
        type: 'credential_expiry',
        title: 'Credential expiry reminder',
        body: `${credential.name} expires in ${days} day${days === 1 ? '' : 's'}. Reference ${credential.id}. Upload renewed evidence to keep your trust status current.`,
        href: '/trader/trust',
        email: true,
      });
    }

    return Response.json({ processed: rows.length });
  } catch (error) { return jsonError(error); }
}
