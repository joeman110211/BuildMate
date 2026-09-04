import type { PropsWithChildren } from 'react';
import { Redirect } from 'expo-router';
import { Button, Text } from 'react-native-paper';
import { LoadingScreen, Screen } from '@/components/Screen';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import type { UserRole } from '@/types';

export function RoleGate({ role, children }: PropsWithChildren<{ role: UserRole }>) {
  const { user, loading, error, refresh, isSignedIn } = useCurrentUser();

  if (loading) return <LoadingScreen label="Checking your account…" />;
  if (!isSignedIn) return <Redirect href="/auth/sign-in" />;

  if (error) {
    return (
      <Screen title="We couldn't load your account" subtitle="BuildMate could not finish checking your account. Your sign-in is still valid.">
        <Text>{error}</Text>
        <Button mode="contained" onPress={() => void refresh()}>Try again</Button>
      </Screen>
    );
  }

  if (!user?.role) return <Redirect href="/auth/choose-role" />;
  if (user.role !== role) return <Redirect href={user.role === 'trader' ? '/trader/dashboard' : '/customer/dashboard'} />;
  return children;
}
