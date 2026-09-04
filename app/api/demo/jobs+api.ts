import { demoJobs } from '@/lib/demo-data';

export function GET() {
  return Response.json(demoJobs);
}
