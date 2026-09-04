import { useClerk } from '@clerk/expo';
import { Link, useRouter } from 'expo-router';
import { StyleSheet, View } from 'react-native';
import { Button, Text } from 'react-native-paper';
import { colors } from '@/constants/theme';
import { useCurrentUser } from '@/hooks/useCurrentUser';

const authConfigured = Boolean(process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY);

function HeaderBrand() {
  return <Link href="/(public)/directory" asChild><Button><Text variant="titleLarge" style={styles.brand}>BuildMate</Text></Button></Link>;
}

function AuthenticatedHeader() {
  const { user, isSignedIn } = useCurrentUser();
  const { signOut } = useClerk();
  const router = useRouter();
  const dashboard = user?.role === 'trader' ? '/trader/dashboard' : user?.role === 'customer' ? '/customer/dashboard' : '/auth/choose-role';

  return <View style={styles.header}>
    <HeaderBrand />
    <View style={styles.actions}>
      <Link href="/(public)/jobs" asChild><Button>Jobs</Button></Link>
      {isSignedIn ? <>
        <Button mode="contained" onPress={() => router.push(dashboard)}>Dashboard</Button>
        <Button onPress={() => signOut(() => router.replace('/(public)/directory'))}>Sign out</Button>
      </> : <>
        <Link href="/auth/sign-in" asChild><Button>Sign in</Button></Link>
        <Link href="/auth/sign-up" asChild><Button mode="contained">Join</Button></Link>
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
  header: { minHeight: 68, paddingHorizontal: 14, borderBottomWidth: 1, borderColor: colors.border, backgroundColor: colors.surface, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  brand: { color: colors.primary, fontWeight: '900' },
  actions: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  preview: { opacity: 0.6, marginRight: 4 },
});
