import Stripe from 'stripe';

let stripeClient: Stripe | undefined;
export function getStripe() {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error('STRIPE_SECRET_KEY is not configured');
  stripeClient ??= new Stripe(key);
  return stripeClient;
}

export function appUrl() {
  return (process.env.APP_URL ?? process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:8081').replace(/\/$/, '');
}
