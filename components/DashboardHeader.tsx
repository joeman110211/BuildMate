import { useClerk } from '@clerk/expo';
import type { Href } from 'expo-router';
import { Link, useRouter } from 'expo-router';
import { StyleSheet, useWindowDimensions, View } from 'react-native';
import { Button, Text } from 'react-native-paper';
import { colors } from '@/constants/theme';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { modeSetupHref } from '@/lib/account-mode';
import type { UserRole } from '@/types';

export function DashboardHeader({ home }: { home: '/customer/dashboard' | '/trader/dashboard' }) {
  const { signOut } = useClerk();
  const router = useRouter();
  const { width } = useWindowDimensions();
  const { user } = useCurrentUser();
  const currentMode: UserRole = home.startsWith('/customer') ? 'customer' : 'trader';
  const otherMode: UserRole = currentMode === 'customer' ? 'trader' : 'customer';
  const otherEnabled = otherMode === 'customer' ? user?.customerEnabled : user?.traderEnabled;
  const otherLabel = otherMode === 'customer' ? 'Homeowner' : 'Tradesperson';
  const modeAction = otherEnabled ? `Switch to ${otherLabel}` : `Add ${otherLabel}`;
  const messagesHref = (currentMode === 'customer' ? '/customer/messages' : '/trader/messages') as Href;
  const compact = width < 900;

  return <View style={styles.header}>
    <Link href={home} asChild><Button compact contentStyle={styles.brandButton}><Text variant="titleLarge" style={styles.brand}>BuildPair</Text></Button></Link>
    <View style={styles.actions}>
      {!compact ? <Link href="/(public)/directory" asChild><Button>Find Trades</Button></Link> : null}
      {!compact ? <Link href={messagesHref} asChild><Button>Messages</Button></Link> : null}
      <Link href={modeSetupHref(otherMode)} asChild><Button compact mode={otherEnabled ? 'text' : 'outlined'}>{compact && otherEnabled ? `Switch mode` : modeAction}</Button></Link>
      {user?.isAdmin && !compact ? <Link href="/admin/moderation" asChild><Button>Moderation</Button></Link> : null}
      <Button compact icon="logout" onPress={() => signOut(() => router.replace('/auth/account'))}>{compact ? '' : 'Sign out'}</Button>
    </View>
  </View>;
}

const styles = StyleSheet.create({
  header: { minHeight: 64, paddingHorizontal: 10, backgroundColor: colors.surface, borderBottomWidth: 1, borderColor: colors.border, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', zIndex: 4 },
  brandButton: { minHeight: 52 },
  brand: { color: colors.primary, fontWeight: '900', letterSpacing: -0.7 },
  actions: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap' },
});
