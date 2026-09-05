import { and, desc, inArray, isNull } from 'drizzle-orm';
import { getDb } from '@/db/client';
import { jobs } from '@/db/schema';
import { demoJobs } from '@/lib/demo-data';
import { outwardCode } from '@/lib/postcode';
import { previewDataEnabled } from '@/lib/preview-data';
import { jsonError } from '@/lib/server';

export async function GET() {
  try {
    const rows = await getDb().select().from(jobs)
      .where(and(isNull(jobs.targetTraderId), inArray(jobs.status, ['open', 'quoted'])))
      .orderBy(desc(jobs.createdAt))
      .limit(50);

    const realIds = new Set(rows.map((job) => job.id));
    const previewJobs = previewDataEnabled()
      ? demoJobs.filter((job) => !realIds.has(job.id)).map((job) => ({ ...job, isPreview: true }))
      : [];
    const combined = [
      ...rows.map((job) => ({ ...job, isPreview: false })),
      ...previewJobs,
    ].slice(0, 50);
    const publicRows = combined.map((job) => ({
      ...job,
      postcode: outwardCode(job.postcode),
      latitude: null,
      longitude: null,
    }));

    return Response.json(publicRows);
  } catch (error) {
    return jsonError(error);
  }
}
