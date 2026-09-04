import type { PropsWithChildren } from 'react';
import { Redirect } from 'expo-router';
import { LoadingScreen } from '@/components/Screen';
import { useCurrentUser } from '@/hooks/useCurrentUser';

export function AdminGate({ children }: PropsWithChildren) {
  const { user, loading, isSignedIn } = useCurrentUser();
  if (loading) return <LoadingScreen label="Checking administrator access…" />;
  if (!isSignedIn) return <Redirect href="/auth/sign-in" />;
  if (!user?.role) return <Redirect href="/auth/choose-role" />;
  if (!user.isAdmin) return <Redirect href={user.role === 'trader' ? '/trader/dashboard' : '/customer/dashboard'} />;
  return children;
}
