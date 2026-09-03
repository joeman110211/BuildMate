import type { PropsWithChildren } from 'react';
import { StripeProvider } from '@stripe/stripe-react-native';

export function AppStripeProvider({ children }: PropsWithChildren) {
  const key = process.env.EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY;
  if (!key) return <>{children}</>;
  return <StripeProvider publishableKey={key} merchantIdentifier="merchant.uk.co.buildmate.app"><>{children}</></StripeProvider>;
}
