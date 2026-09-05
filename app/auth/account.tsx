import { Link, Redirect } from 'expo-router';
import { StyleSheet, View } from 'react-native';
import { Button, Chip, Text } from 'react-native-paper';
import { AppCard } from '@/components/AppCard';
import { LoadingScreen, Screen } from '@/components/Screen';
import { colors } from '@/constants/theme';
import { dashboardHref, signInHref, signUpHref } from '@/lib/account-mode';
import { useCurrentUser } from '@/hooks/useCurrentUser';

export default function AccountEntryScreen() {
  const { user, loading, isSignedIn } = useCurrentUser();

  if (loading) return <LoadingScreen label="Loading BuildPair…" />;
  if (isSignedIn && user?.activeMode) return <Redirect href={dashboardHref(user.activeMode)} />;
  if (isSignedIn) return <Redirect href="/auth/choose-role" />;

  return <Screen>
    <View style={styles.hero}>
      <View style={styles.logoMark}><Text style={styles.logoText}>BM</Text></View>
      <Text variant="displaySmall" style={styles.brand}>BuildPair</Text>
      <Text variant="headlineSmall" style={styles.heading}>Find trusted local trades or grow your trade business.</Text>
      <Text style={styles.subheading}>Choose how you want to use BuildPair. One login can hold both profiles.</Text>
    </View>

    <View style={styles.cards}>
      <AppCard style={styles.roleCard}>
        <View style={styles.roleTop}><View style={styles.roleIcon}><Text style={styles.emoji}>🏠</Text></View><Text variant="headlineSmall" style={styles.title}>I’m a Homeowner</Text></View>
        <Text style={styles.body}>Find trusted trades, post jobs, compare quotes and keep everything organised in one place.</Text>
        <Link href={signUpHref('customer')} asChild><Button mode="contained" icon="account-plus" contentStyle={styles.primaryButton}>Create Homeowner Account</Button></Link>
        <Link href={signInHref('customer')} asChild><Button mode="text">Homeowner Sign In</Button></Link>
      </AppCard>

      <AppCard style={styles.roleCard}>
        <View style={styles.roleTop}><View style={styles.roleIcon}><Text style={styles.emoji}>🔨</Text></View><View style={styles.tradeTitle}><Text variant="headlineSmall" style={styles.title}>I’m a Tradesperson</Text><Chip compact icon="gift-outline" style={styles.trialChip}>14 days free</Chip></View></View>
        <Text style={styles.body}>Find local work, build a trusted profile, quote customers and manage your jobs.</Text>
        <Link href={signUpHref('trader')} asChild><Button mode="contained" icon="briefcase-plus-outline" contentStyle={styles.primaryButton}>Create Tradesperson Account</Button></Link>
        <Link href={signInHref('trader')} asChild><Button mode="text">Tradesperson Sign In</Button></Link>
      </AppCard>
    </View>

    <View style={styles.browse}>
      <Text style={styles.browseText}>Just looking?</Text>
      <Link href="/(public)/directory" asChild><Button mode="outlined" icon="magnify">Browse trades without signing in</Button></Link>
    </View>
  </Screen>;
}

const styles = StyleSheet.create({
  hero: { alignItems: 'center', paddingTop: 16, paddingBottom: 8, gap: 8 },
  logoMark: { width: 58, height: 58, borderRadius: 18, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center', marginBottom: 4 },
  logoText: { color: '#FFFFFF', fontSize: 19, fontWeight: '900' },
  brand: { color: colors.primary, fontWeight: '900', letterSpacing: -1.2 },
  heading: { maxWidth: 680, textAlign: 'center', fontWeight: '800', color: colors.text, lineHeight: 31 },
  subheading: { maxWidth: 620, textAlign: 'center', color: colors.muted, fontSize: 16, lineHeight: 23 },
  cards: { width: '100%', maxWidth: 820, alignSelf: 'center', gap: 16 },
  roleCard: { padding: 20 },
  roleTop: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  roleIcon: { width: 52, height: 52, borderRadius: 16, backgroundColor: colors.surfaceSoft, alignItems: 'center', justifyContent: 'center' },
  emoji: { fontSize: 27 },
  tradeTitle: { flex: 1, flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 8 },
  title: { fontWeight: '900', color: colors.text },
  body: { color: colors.muted, lineHeight: 23, fontSize: 16 },
  trialChip: { backgroundColor: '#EAF7EC' },
  primaryButton: { minHeight: 52 },
  browse: { alignItems: 'center', gap: 6, marginTop: 4 },
  browseText: { color: colors.muted },
});
