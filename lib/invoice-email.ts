type InvoiceEmailItem = {
  description: string;
  quantity: number;
  unitPrice: number;
};

export type InvoiceEmailInput = {
  invoiceNumber: string;
  customerName: string;
  customerEmail: string;
  items: InvoiceEmailItem[];
  subtotal: number;
  vatAmount: number;
  depositAmount: number;
  totalAmount: number;
  dueAt?: Date | null;
  notes?: string | null;
};

export type InvoiceEmailResult = {
  ok: boolean;
  id?: string;
  reason?: 'not_configured' | 'provider_rejected';
};

const money = (value: number) => new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP' }).format(value / 100);
const escape = (value: string) => value.replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]!));

export async function sendInvoiceEmail(input: InvoiceEmailInput): Promise<InvoiceEmailResult> {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.INVOICE_FROM_EMAIL;
  if (!apiKey || !from) return { ok: false, reason: 'not_configured' };

  const rows = input.items.map((item) => `<tr><td>${escape(item.description)}</td><td>${item.quantity}</td><td>${money(item.unitPrice)}</td><td>${money(Math.round(item.quantity * item.unitPrice))}</td></tr>`).join('');
  const dueText = input.dueAt ? input.dueAt.toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' }) : null;
  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      from,
      to: [input.customerEmail],
      subject: `BuildPair invoice ${input.invoiceNumber}`,
      html: `<h1>Invoice ${escape(input.invoiceNumber)}</h1><p>For ${escape(input.customerName)}</p><table cellpadding="8" border="1" cellspacing="0"><thead><tr><th>Item</th><th>Qty</th><th>Unit</th><th>Total</th></tr></thead><tbody>${rows}</tbody></table><p>Subtotal: ${money(input.subtotal)}<br>VAT: ${money(input.vatAmount)}<br><strong>Total: ${money(input.totalAmount)}</strong><br>Deposit: ${money(input.depositAmount)}${dueText ? `<br><strong>Due: ${escape(dueText)}</strong>` : ''}</p>${input.notes ? `<p>${escape(input.notes)}</p>` : ''}<p>Sent securely via BuildPair.</p>`,
    }),
    signal: AbortSignal.timeout(10000),
  });

  if (!response.ok) return { ok: false, reason: 'provider_rejected' };
  const body = await response.json() as { id?: string };
  return { ok: true, id: body.id };
}
