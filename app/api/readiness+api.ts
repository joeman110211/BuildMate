const requiredEnvironment = [
  'EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY',
  'CLERK_SECRET_KEY',
  'DATABASE_URL',
  'GEMINI_API_KEY',
  'RESEND_API_KEY',
  'INVOICE_FROM_EMAIL',
  'CLOUDINARY_API_KEY',
  'CLOUDINARY_API_SECRET',
] as const;

const optionalEnvironment = [
  'DATABASE_URL_UNPOOLED',
  'ADMIN_CLERK_USER_IDS',
  'APP_URL',
  'CLOUDINARY_CLOUD_NAME',
  'EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY',
  'STRIPE_SECRET_KEY',
  'STRIPE_WEBHOOK_SECRET',
  'STRIPE_CONNECT_WEBHOOK_SECRET',
] as const;

function configured(name: string) {
  return Boolean(process.env[name]?.trim());
}

export function GET() {
  const missing = requiredEnvironment.filter((name) => !configured(name));
  const optionalMissing = optionalEnvironment.filter((name) => !configured(name));

  return Response.json(
    {
      status: missing.length === 0 ? 'ready' : 'configuration_required',
      ready: missing.length === 0,
      missing,
      optionalMissing,
      timestamp: new Date().toISOString(),
    },
    {
      status: missing.length === 0 ? 200 : 503,
      headers: { 'Cache-Control': 'no-store' },
    },
  );
}
