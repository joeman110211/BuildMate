import type { PropsWithChildren } from 'react';
import { Redirect } from 'expo-router';
import { LoadingScreen } from '@/components/Screen';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import type { UserRole } from '@/types';

export function RoleGate({ role, children }: PropsWithChildren<{ role: UserRole }>) {
  const { user, loading, isSignedIn } = useCurrentUser();
  if (loading) return <LoadingScreen label="Checking your account…" />;
  if (!isSignedIn) return <Redirect href="/(auth)/sign-in" />;
  if (!user?.role) return <Redirect href="/(auth)/choose-role" />;
  if (user.role !== role) return <Redirect href={user.role === 'trader' ? '/(trader)/dashboard' : '/(customer)/dashboard'} />;
  return children;
}
