import { and, desc, inArray, isNull } from 'drizzle-orm';
import { getDb } from '@/db/client';
import { jobs } from '@/db/schema';
import { demoJobs } from '@/lib/demo-data';
import { outwardCode } from '@/lib/postcode';
import { previewDataEnabled } from '@/lib/preview';
import { jsonError } from '@/lib/server';

function publicPreviewJobs() {
  return demoJobs.map((job) => ({
    ...job,
    isPreview: true,
    postcode: outwardCode(job.postcode),
    latitude: null,
    longitude: null,
  }));
}

export async function GET(request: Request) {
  const previewEnabled = previewDataEnabled(request);

  try {
    const rows = await getDb().select().from(jobs)
      .where(and(isNull(jobs.targetTraderId), inArray(jobs.status, ['open', 'quoted'])))
      .orderBy(desc(jobs.createdAt))
      .limit(50);

    const realIds = new Set(rows.map((job) => job.id));
    const previewJobs = previewEnabled
      ? publicPreviewJobs().filter((job) => !realIds.has(job.id))
      : [];
    const combined = [
      ...rows.map((job) => ({ ...job, isPreview: false })),
      ...previewJobs,
    ].slice(0, 50);

    return Response.json(combined.map((job) => ({
      ...job,
      postcode: outwardCode(job.postcode),
      latitude: null,
      longitude: null,
    })));
  } catch (error) {
    // Staging fixtures live in the application bundle. If Neon has a temporary
    // wobble, public visitors should still see the beta marketplace rather than
    // a dead page and a useless "failed to fetch" message.
    if (previewEnabled) {
      console.error('Public jobs database query failed; serving staging previews instead.', error);
      return Response.json(publicPreviewJobs());
    }
    return jsonError(error);
  }
}
