export function GET() {
  return Response.json({ status: 'ok', service: 'buildmate-api', timestamp: new Date().toISOString() });
}
