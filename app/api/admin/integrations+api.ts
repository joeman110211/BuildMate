import { createHash } from 'node:crypto';
import { GoogleGenAI } from '@google/genai';
import { z } from 'zod';
import { sendInvoiceEmail } from '@/lib/invoice-email';
import { HttpError, jsonError, requireAdmin } from '@/lib/server';

const diagnosticSchema = z.object({ provider: z.enum(['cloudinary', 'resend', 'gemini']) });
const DEFAULT_CLOUDINARY_CLOUD_NAME = 'qrrcn7ma';

function sha1(value: string) {
  return createHash('sha1').update(value).digest('hex');
}

async function testCloudinary() {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME?.trim() || DEFAULT_CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;
  if (!apiKey || !apiSecret) throw new HttpError(503, 'Cloudinary is not configured');

  const timestamp = Math.floor(Date.now() / 1000);
  const assetFolder = 'buildpair/diagnostics';
  const publicId = `diagnostic-${timestamp}`;
  const signature = sha1(`asset_folder=${assetFolder}&public_id=${publicId}&timestamp=${timestamp}${apiSecret}`);
  const uploadBody = new URLSearchParams({
    file: 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///ywAAAAAAQABAAACAUwAOw==',
    api_key: apiKey,
    timestamp: String(timestamp),
    asset_folder: assetFolder,
    public_id: publicId,
    signature,
  });
  const upload = await fetch(`https://api.cloudinary.com/v1_1/${encodeURIComponent(cloudName)}/image/upload`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: uploadBody,
    signal: AbortSignal.timeout(15000),
  });
  const uploadResult = await upload.json() as { public_id?: string; secure_url?: string; error?: { message?: string } };
  if (!upload.ok || !uploadResult.public_id || !uploadResult.secure_url) {
    throw new HttpError(502, `Cloudinary upload diagnostic failed${uploadResult.error?.message ? `: ${uploadResult.error.message}` : ''}`);
  }

  const destroyTimestamp = Math.floor(Date.now() / 1000);
  const destroySignature = sha1(`public_id=${uploadResult.public_id}&timestamp=${destroyTimestamp}${apiSecret}`);
  const destroy = await fetch(`https://api.cloudinary.com/v1_1/${encodeURIComponent(cloudName)}/image/destroy`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      api_key: apiKey,
      public_id: uploadResult.public_id,
      timestamp: String(destroyTimestamp),
      signature: destroySignature,
    }),
    signal: AbortSignal.timeout(15000),
  });
  const destroyResult = await destroy.json() as { result?: string };

  return {
    provider: 'cloudinary',
    status: 'ok',
    uploadUrl: uploadResult.secure_url,
    cleanup: destroy.ok && ['ok', 'not found'].includes(destroyResult.result ?? '') ? 'ok' : 'warning',
  };
}

async function testGemini() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new HttpError(503, 'Gemini is not configured');
  const ai = new GoogleGenAI({ apiKey });
  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: 'Reply with exactly BUILPAIR_DIAGNOSTIC_OK and nothing else.',
    config: { temperature: 0, maxOutputTokens: 30 },
  });
  const text = response.text?.trim() ?? '';
  if (!text.includes('BUILPAIR_DIAGNOSTIC_OK')) throw new HttpError(502, 'Gemini diagnostic returned an unexpected response');
  return { provider: 'gemini', status: 'ok', model: 'gemini-2.5-flash' };
}

async function testResend(adminEmail: string | null) {
  if (!adminEmail) throw new HttpError(409, 'Your BuildPair admin account has no email address to receive the diagnostic invoice');
  const delivery = await sendInvoiceEmail({
    invoiceNumber: `DIAGNOSTIC-${Date.now()}`,
    customerName: 'BuildPair production diagnostic',
    customerEmail: adminEmail,
    items: [{ description: 'Production invoice-delivery diagnostic only — no payment is due', quantity: 1, unitPrice: 0 }],
    subtotal: 0,
    vatAmount: 0,
    depositAmount: 0,
    totalAmount: 0,
    notes: 'This email confirms that the deployed BuildPair application can deliver invoice email through its configured Resend account.',
  });
  if (!delivery.ok) {
    throw new HttpError(502, delivery.reason === 'not_configured' ? 'Resend is not configured' : 'Resend rejected the diagnostic invoice');
  }
  return { provider: 'resend', status: 'ok', deliveryId: delivery.id, recipient: adminEmail };
}

export async function POST(request: Request) {
  try {
    const { user } = await requireAdmin(request);
    const { provider } = diagnosticSchema.parse(await request.json());
    if (provider === 'cloudinary') return Response.json(await testCloudinary(), { headers: { 'Cache-Control': 'no-store' } });
    if (provider === 'gemini') return Response.json(await testGemini(), { headers: { 'Cache-Control': 'no-store' } });
    return Response.json(await testResend(user.email), { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) {
    return jsonError(error);
  }
}
