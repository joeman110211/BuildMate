import { assertRateLimit } from '@/lib/rate-limit';
import { jsonError } from '@/lib/server';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(request: Request) {
  try {
    await assertRateLimit(request, 'contact-form', 6, 3600);
    const body = await request.json() as { name?: string; email?: string; subject?: string; message?: string; website?: string };
    const name = body.name?.trim() || '';
    const email = body.email?.trim() || '';
    const subject = body.subject?.trim() || 'BuildPair website enquiry';
    const message = body.message?.trim() || '';

    if (body.website) return Response.json({ ok: true });
    if (name.length < 2 || name.length > 100) return Response.json({ error: 'Please enter your name.' }, { status: 400 });
    if (!EMAIL_RE.test(email) || email.length > 200) return Response.json({ error: 'Please enter a valid email address.' }, { status: 400 });
    if (subject.length > 160) return Response.json({ error: 'The subject is too long.' }, { status: 400 });
    if (message.length < 10 || message.length > 5000) return Response.json({ error: 'Please enter a message between 10 and 5,000 characters.' }, { status: 400 });

    const apiKey = process.env.RESEND_API_KEY;
    const supportEmail = process.env.SUPPORT_EMAIL || 'info@buildpair.co.uk';
    const from = process.env.INVOICE_FROM_EMAIL || 'BuildPair <info@buildpair.co.uk>';
    if (!apiKey) throw new Error('RESEND_API_KEY is not configured');

    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from,
        to: [supportEmail],
        reply_to: email,
        subject: `[BuildPair contact] ${subject}`,
        text: `Name: ${name}\nEmail: ${email}\nSubject: ${subject}\n\n${message}`,
      }),
    });

    if (!response.ok) {
      const detail = await response.text();
      throw new Error(`Contact email could not be sent: ${detail.slice(0, 240)}`);
    }

    return Response.json({ ok: true });
  } catch (error) {
    return jsonError(error);
  }
}