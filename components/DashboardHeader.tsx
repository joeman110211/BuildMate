import { useClerk } from '@clerk/expo';
import type { Href } from 'expo-router';
import { Link, useRouter } from 'expo-router';
import { StyleSheet, View } from 'react-native';
import { Button, Text } from 'react-native-paper';
import { colors } from '@/constants/theme';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { modeSetupHref } from '@/lib/account-mode';
import type { UserRole } from '@/types';

export function DashboardHeader({ home }: { home: '/customer/dashboard' | '/trader/dashboard' }) {
  const { signOut } = useClerk();
  const router = useRouter();
  const { user } = useCurrentUser();
  const currentMode: UserRole = home.startsWith('/customer') ? 'customer' : 'trader';
  const otherMode: UserRole = currentMode === 'customer' ? 'trader' : 'customer';
  const otherEnabled = otherMode === 'customer' ? user?.customerEnabled : user?.traderEnabled;
  const otherLabel = otherMode === 'customer' ? 'Homeowner' : 'Tradesperson';
  const modeAction = otherEnabled ? `Switch to ${otherLabel}` : `Add ${otherLabel}`;
  const messagesHref = (currentMode === 'customer' ? '/customer/messages' : '/trader/messages') as Href;

  return <View style={styles.header}>
    <Link href={home} asChild><Button><Text variant="titleLarge" style={styles.brand}>BuildMate</Text></Button></Link>
    <View style={styles.actions}>
      <Link href="/(public)/directory" asChild><Button>Directory</Button></Link>
      <Link href={messagesHref} asChild><Button>Messages</Button></Link>
      <Link href={modeSetupHref(otherMode)} asChild><Button>{modeAction}</Button></Link>
      {user?.isAdmin ? <Link href="/admin/moderation" asChild><Button>Moderation</Button></Link> : null}
      <Button onPress={() => signOut(() => router.replace('/auth/account'))}>Sign out</Button>
    </View>
  </View>;
}

const styles = StyleSheet.create({ header: { minHeight: 66, paddingHorizontal: 12, backgroundColor: colors.surface, borderBottomWidth: 1, borderColor: colors.border, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }, brand: { color: colors.primary, fontWeight: '900' }, actions: { flexDirection: 'row', flexWrap: 'wrap' } });
