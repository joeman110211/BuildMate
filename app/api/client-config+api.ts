export function GET() {
  return Response.json(
    {
      clerkPublishableKey: process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY?.trim() || null,
      stripePublishableKey: process.env.EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY?.trim() || null,
      cloudinaryCloudName: process.env.EXPO_PUBLIC_CLOUDINARY_CLOUD_NAME?.trim() || process.env.CLOUDINARY_CLOUD_NAME?.trim() || null,
    },
    {
      headers: {
        'Cache-Control': 'no-store',
      },
    },
  );
}
