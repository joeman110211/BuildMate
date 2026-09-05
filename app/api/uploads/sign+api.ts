import { createHash } from 'node:crypto';
import { accountModes, authenticatedUserId, ensureDbUser, HttpError, jsonError } from '@/lib/server';

type UploadKind = 'job' | 'trader';

const folders: Record<UploadKind, string> = {
  job: 'buildpair/job-photos',
  trader: 'buildpair/trader-gallery',
};

const DEFAULT_CLOUDINARY_CLOUD_NAME = 'qrrcn7ma';

export async function POST(request: Request) {
  try {
    const userId = await authenticatedUserId(request);
    await ensureDbUser(userId);
    const modes = await accountModes(userId);
    const body = await request.json() as { kind?: UploadKind };
    if (!body.kind || !(body.kind in folders)) throw new HttpError(400, 'Invalid upload type');
    if (body.kind === 'trader' && !modes.traderEnabled) throw new HttpError(403, 'Trader account required');
    if (body.kind === 'job' && !modes.customerEnabled) throw new HttpError(403, 'Customer account required');

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
