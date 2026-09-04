import { desc, eq } from 'drizzle-orm';
import { getDb } from '@/db/client';
import { invoices } from '@/db/schema';
import { jsonError, requireRole } from '@/lib/server';
import { invoiceSchema } from '@/lib/validation';

export async function GET(request: Request) {
  try {
    const trader = await requireRole(request, 'trader');
    return Response.json(await getDb().select().from(invoices).where(eq(invoices.traderId, trader.id)).orderBy(desc(invoices.createdAt)));
  } catch (error) { return jsonError(error); }
}

export async function POST(request: Request) {
  try {
    const trader = await requireRole(request, 'trader');
    const payload = invoiceSchema.parse(await request.json());
    const { sendNow, dueAt, customerId, jobId, ...invoiceFields } = payload;
    const subtotal = invoiceFields.items.reduce((sum, item) => sum + Math.round(item.quantity * item.unitPrice), 0);
    const totalAmount = subtotal + invoiceFields.vatAmount;
    const [invoice] = await getDb().insert(invoices).values({
      ...invoiceFields,
      traderId: trader.id,
      customerId: customerId ?? null,
      jobId: jobId ?? null,
      dueAt: dueAt ? new Date(dueAt) : null,
      subtotal,
      totalAmount,
      status: sendNow ? 'sent' : 'draft',
    }).returning();
    let deliveryWarning: string | undefined;
    if (sendNow) {
      const apiKey = process.env.RESEND_API_KEY;
      const from = process.env.INVOICE_FROM_EMAIL;
      if (!apiKey || !from) deliveryWarning = 'Invoice saved as sent, but email delivery is not configured';
      else {
        const money = (value: number) => new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP' }).format(value / 100);
        const escape = (value: string) => value.replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]!));
        const rows = payload.items.map((item) => `<tr><td>${escape(item.description)}</td><td>${item.quantity}</td><td>${money(item.unitPrice)}</td><td>${money(Math.round(item.quantity * item.unitPrice))}</td></tr>`).join('');
        const response = await fetch('https://api.resend.com/emails', { method: 'POST', headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ from, to: [payload.customerEmail], subject: `BuildMate invoice ${payload.invoiceNumber}`, html: `<h1>Invoice ${escape(payload.invoiceNumber)}</h1><p>For ${escape(payload.customerName)}</p><table cellpadding="8" border="1" cellspacing="0"><thead><tr><th>Item</th><th>Qty</th><th>Unit</th><th>Total</th></tr></thead><tbody>${rows}</tbody></table><p>Subtotal: ${money(subtotal)}<br>VAT: ${money(payload.vatAmount)}<br><strong>Total: ${money(totalAmount)}</strong><br>Deposit: ${money(payload.depositAmount)}</p>${payload.notes ? `<p>${escape(payload.notes)}</p>` : ''}<p>Sent securely via BuildMate.</p>` }) });
        if (!response.ok) deliveryWarning = 'Invoice saved, but the email provider rejected delivery';
      }
    }
    return Response.json({ ...invoice, deliveryWarning }, { status: 201 });
  } catch (error) { return jsonError(error); }
}
