import { useClerk } from '@clerk/expo';
import type { Href } from 'expo-router';
import { Link, useRouter } from 'expo-router';
import { Pressable, StyleSheet, useWindowDimensions, View } from 'react-native';
import { Button, IconButton } from 'react-native-paper';
import { BuildPairLogo } from '@/components/BuildPairLogo';
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
  const notificationsHref = (currentMode === 'customer' ? '/customer/notifications' : '/trader/notifications') as Href;
  const compact = width < 900;

  return <View style={styles.header}>
    <Link href={home} asChild><Pressable style={styles.brandButton} accessibilityLabel="BuildPair home"><BuildPairLogo compact /></Pressable></Link>
    <View style={styles.actions}>
      {!compact ? <Link href="/(public)/directory" asChild><Button>Find Trades</Button></Link> : null}
      {!compact ? <Link href={messagesHref} asChild><Button>Messages</Button></Link> : null}
      <IconButton icon="bell-outline" size={22} onPress={() => router.push(notificationsHref)} accessibilityLabel="Notifications" />
      <IconButton icon="cog-outline" size={22} onPress={() => router.push('/settings')} accessibilityLabel="Settings" />
      <Link href={modeSetupHref(otherMode)} asChild><Button compact mode={otherEnabled ? 'text' : 'outlined'}>{compact && otherEnabled ? 'Switch mode' : modeAction}</Button></Link>
      {user?.isAdmin && !compact ? <Link href="/admin/moderation" asChild><Button>Moderation</Button></Link> : null}
      <Button compact icon="logout" onPress={() => signOut(() => router.replace('/auth/account'))}>{compact ? '' : 'Sign out'}</Button>
    </View>
  </View>;
}

const styles = StyleSheet.create({
  header: { minHeight: 66, paddingHorizontal: 12, backgroundColor: colors.surfaceRaised, borderBottomWidth: 1, borderColor: colors.border, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', zIndex: 4 },
  brandButton: { minHeight: 54, justifyContent: 'center', paddingHorizontal: 4 },
  actions: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 2 },
});
