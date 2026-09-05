import { createHash } from 'node:crypto';
import { authenticatedUserId, ensureDbUser, HttpError, jsonError } from '@/lib/server';

type UploadKind = 'job' | 'trader';

const folders: Record<UploadKind, string> = {
  job: 'buildpair/job-photos',
  trader: 'buildpair/trader-gallery',
};

const DEFAULT_CLOUDINARY_CLOUD_NAME = 'qrrcn7ma';

export async function POST(request: Request) {
  try {
    const userId = await authenticatedUserId(request);
    const user = await ensureDbUser(userId);
    const body = await request.json() as { kind?: UploadKind };
    if (!body.kind || !(body.kind in folders)) throw new HttpError(400, 'Invalid upload type');
    if (body.kind === 'trader' && user.role !== 'trader') throw new HttpError(403, 'Trader account required');
    if (body.kind === 'job' && user.role !== 'customer') throw new HttpError(403, 'Customer account required');

    const cloudName = process.env.CLOUDINARY_CLOUD_NAME?.trim() || DEFAULT_CLOUDINARY_CLOUD_NAME;
    const apiKey = process.env.CLOUDINARY_API_KEY;
    const apiSecret = process.env.CLOUDINARY_API_SECRET;
    if (!apiKey || !apiSecret) throw new Error('Cloudinary is not configured');

    const timestamp = Math.floor(Date.now() / 1000);
    const assetFolder = folders[body.kind];
    const toSign = `asset_folder=${assetFolder}&timestamp=${timestamp}${apiSecret}`;
    const signature = createHash('sha1').update(toSign).digest('hex');

    return Response.json({ cloudName, apiKey, timestamp, signature, assetFolder });
  } catch (error) {
    return jsonError(error);
  }
}
