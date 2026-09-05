import { useClerk } from '@clerk/expo';
import type { Href } from 'expo-router';
import { Link, useRouter } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';
import { Button, Text } from 'react-native-paper';
import { BuildPairLogo } from '@/components/BuildPairLogo';
import { colors } from '@/constants/theme';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { dashboardHref } from '@/lib/account-mode';
import type { UserRole } from '@/types';

const authConfigured = Boolean(process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY);

function HeaderBrand() {
  return <Link href="/(public)/directory" asChild><Pressable style={styles.brandPressable} accessibilityLabel="BuildPair"><BuildPairLogo compact /></Pressable></Link>;
}

function AuthenticatedHeader() {
  const { user, isSignedIn } = useCurrentUser();
  const { signOut } = useClerk();
  const router = useRouter();

  let mode: UserRole | null = null;
  if (user?.activeMode === 'customer' && user.customerEnabled) mode = 'customer';
  else if (user?.activeMode === 'trader' && user.traderEnabled) mode = 'trader';
  else if (user?.customerEnabled) mode = 'customer';
  else if (user?.traderEnabled) mode = 'trader';

  const dashboard = (mode ? dashboardHref(mode) : '/auth/choose-role') as Href;

  return <View style={styles.header}>
    <HeaderBrand />
    <View style={styles.actions}>
      <Link href="/(public)/jobs" asChild><Button>Jobs</Button></Link>
      {isSignedIn ? <>
        <Button mode="contained" onPress={() => router.push(dashboard)}>Dashboard</Button>
        <Button onPress={() => signOut(() => router.replace('/auth/account'))}>Sign out</Button>
      </> : <>
        <Link href="/auth/account" asChild><Button>Sign in</Button></Link>
        <Link href="/auth/account" asChild><Button mode="contained">Join</Button></Link>
      </>}
    </View>
  </View>;
}

function PreviewHeader() {
  return <View style={styles.header}>
    <HeaderBrand />
    <View style={styles.actions}>
      <Link href="/(public)/jobs" asChild><Button>Jobs</Button></Link>
      <Text variant="bodySmall" style={styles.preview}>Public preview</Text>
      <Button disabled>Sign in</Button>
      <Button mode="contained" disabled>Join</Button>
    </View>
  </View>;
}

export function PublicHeader() {
  return authConfigured ? <AuthenticatedHeader /> : <PreviewHeader />;
}

const styles = StyleSheet.create({
  header: { minHeight: 68, paddingHorizontal: 14, borderBottomWidth: 1, borderColor: colors.border, backgroundColor: colors.surfaceRaised, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  brandPressable: { minHeight: 54, justifyContent: 'center', paddingHorizontal: 3 },
  actions: { flexDirection: 'row', alignItems: 'center', gap: 2, flexWrap: 'wrap', justifyContent: 'flex-end' },
  preview: { opacity: 0.6, marginRight: 4 },
});
