import { demoJobs } from '@/lib/demo-data';
import { previewDataEnabled } from '@/lib/preview';

export function GET() {
  if (!previewDataEnabled()) return Response.json({ error: 'Preview data is disabled' }, { status: 404 });
  return Response.json(demoJobs.map((job) => ({ ...job, isPreview: true })));
}
