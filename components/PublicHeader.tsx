import { useClerk } from '@clerk/expo';
import { Link, useRouter } from 'expo-router';
import { StyleSheet, View } from 'react-native';
import { Button, Text } from 'react-native-paper';
import { colors } from '@/constants/theme';
import { useCurrentUser } from '@/hooks/useCurrentUser';

export function PublicHeader() {
  const { user, isSignedIn } = useCurrentUser();
  const { signOut } = useClerk();
  const router = useRouter();
  const dashboard = user?.role === 'trader' ? '/(trader)/dashboard' : user?.role === 'customer' ? '/(customer)/dashboard' : '/(auth)/choose-role';
  return <View style={styles.header}>
    <Link href="/(public)/directory" asChild><Button><Text variant="titleLarge" style={styles.brand}>BuildMate</Text></Button></Link>
    <View style={styles.actions}>
      {isSignedIn ? <>
        <Button mode="contained" onPress={() => router.push(dashboard)}>Dashboard</Button>
        <Button onPress={() => signOut(() => router.replace('/(public)/directory'))}>Sign out</Button>
      </> : <>
        <Link href="/(auth)/sign-in" asChild><Button>Sign in</Button></Link>
        <Link href="/(auth)/sign-up" asChild><Button mode="contained">Join</Button></Link>
      </>}
    </View>
  </View>;
}

const styles = StyleSheet.create({ header: { minHeight: 68, paddingHorizontal: 14, borderBottomWidth: 1, borderColor: colors.border, backgroundColor: colors.surface, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }, brand: { color: colors.primary, fontWeight: '900' }, actions: { flexDirection: 'row', alignItems: 'center', gap: 2 } });
