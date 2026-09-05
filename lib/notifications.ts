import { getSql } from '@/lib/sql';

type NotificationInput = {
  type: string;
  title: string;
  body: string;
  href?: string | null;
  email?: boolean;
};

function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]!));
}

export async function createNotification(userId: string, input: NotificationInput) {
  const sql = getSql();
  const rows = await sql`
    INSERT INTO notifications(user_id, type, title, body, href)
    VALUES (${userId}, ${input.type}, ${input.title}, ${input.body}, ${input.href ?? null})
    RETURNING id, created_at AS "createdAt"
  ` as unknown as { id: string; createdAt: string }[];

  if (input.email && process.env.RESEND_API_KEY && process.env.INVOICE_FROM_EMAIL) {
    const users = await sql`SELECT email FROM users WHERE id = ${userId} LIMIT 1` as unknown as { email: string | null }[];
    const email = users[0]?.email;
    if (email) {
      void fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          from: process.env.INVOICE_FROM_EMAIL,
          to: [email],
          subject: input.title,
          html: `<div style="font-family:Arial,sans-serif;max-width:640px;margin:auto"><h2>${escapeHtml(input.title)}</h2><p>${escapeHtml(input.body)}</p>${input.href ? `<p><a href="${escapeHtml(`${process.env.APP_URL ?? 'https://buildpair.co.uk'}${input.href}`)}">Open in BuildPair</a></p>` : ''}<p style="color:#666;font-size:12px">Sent by BuildPair.</p></div>`,
        }),
      }).catch(() => undefined);
    }
  }

  return rows[0];
}

export async function notifyMany(userIds: string[], input: NotificationInput) {
  const unique = [...new Set(userIds.filter(Boolean))];
  await Promise.allSettled(unique.map((userId) => createNotification(userId, input)));
}

export async function addJobEvent(jobId: string, actorId: string | null, eventType: string, title: string, description?: string | null, metadata: Record<string, unknown> = {}) {
  const sql = getSql();
  await sql`
    INSERT INTO job_events(job_id, actor_id, event_type, title, description, metadata)
    VALUES (${jobId}, ${actorId}, ${eventType}, ${title}, ${description ?? null}, ${JSON.stringify(metadata)}::jsonb)
  `;
}
