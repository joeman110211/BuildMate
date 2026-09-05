import { useUser } from '@clerk/expo';
import { Link } from 'expo-router';
import { StyleSheet, View } from 'react-native';
import { Button, Chip, Text } from 'react-native-paper';
import { AppCard } from '@/components/AppCard';
import { LoadingScreen, Screen } from '@/components/Screen';
import { colors } from '@/constants/theme';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { modeSetupHref } from '@/lib/account-mode';

export default function CustomerProfile() {
  const { user, loading } = useCurrentUser();
  const { user: clerkUser } = useUser();
  if (loading) return <LoadingScreen />;

  const name = clerkUser?.fullName || clerkUser?.firstName || 'BuildPair homeowner';
  return <Screen title="Profile & Account" subtitle="Manage your BuildPair account and the ways you use it.">
    <AppCard>
      <View style={styles.identity}><View style={styles.avatar}><Text style={styles.avatarText}>{name.slice(0, 1).toUpperCase()}</Text></View><View style={styles.flex}><Text variant="headlineSmall" style={styles.title}>{name}</Text><Text style={styles.muted}>{user?.email || clerkUser?.primaryEmailAddress?.emailAddress || 'Email linked through your sign-in provider'}</Text><View style={styles.chips}><Chip compact icon="home-outline">Homeowner</Chip>{user?.traderEnabled ? <Chip compact icon="hammer-wrench">Tradesperson enabled</Chip> : null}</View></View></View>
    </AppCard>

    <AppCard>
      <Text variant="titleLarge" style={styles.title}>Account modes</Text>
      <Text style={styles.muted}>One login can have both sides of BuildPair. Your jobs, messages and business profile stay attached to the same identity.</Text>
      <View style={styles.modeRow}><View style={styles.flex}><Text variant="titleMedium" style={styles.title}>🏠 Homeowner</Text><Text style={styles.muted}>Post jobs, receive quotes and hire trades.</Text></View><Chip icon="check">Active</Chip></View>
      <View style={styles.modeRow}><View style={styles.flex}><Text variant="titleMedium" style={styles.title}>🔨 Tradesperson</Text><Text style={styles.muted}>Build a public profile, find work and manage customers.</Text></View>{user?.traderEnabled ? <Link href={modeSetupHref('trader')} asChild><Button mode="outlined">Switch</Button></Link> : <Link href={modeSetupHref('trader')} asChild><Button mode="contained">Become a Tradesperson</Button></Link>}</View>
    </AppCard>

    <AppCard>
      <Text variant="titleLarge" style={styles.title}>Quick links</Text>
      <View style={styles.actions}><Link href="/(public)/directory" asChild><Button mode="outlined" icon="magnify">Find Trades</Button></Link><Link href="/customer/new-job" asChild><Button mode="outlined" icon="plus">Post a Job</Button></Link><Link href="/customer/messages" asChild><Button mode="outlined" icon="message-text-outline">Messages</Button></Link></View>
    </AppCard>
  </Screen>;
}

const styles = StyleSheet.create({
  identity: { flexDirection: 'row', alignItems: 'center', gap: 14, flexWrap: 'wrap' },
  avatar: { width: 72, height: 72, borderRadius: 22, backgroundColor: colors.charcoal, alignItems: 'center', justifyContent: 'center' },
  avatarText: { color: colors.primary, fontWeight: '900', fontSize: 28 },
  flex: { flex: 1, minWidth: 220, gap: 5 },
  title: { fontWeight: '900', color: colors.charcoal },
  muted: { color: colors.muted, lineHeight: 22 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 4 },
  modeRow: { paddingVertical: 8, flexDirection: 'row', alignItems: 'center', gap: 12, flexWrap: 'wrap', borderTopWidth: 1, borderTopColor: colors.border },
  actions: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
});
