import { Link, Redirect } from 'expo-router';
import { StyleSheet, View } from 'react-native';
import { Button, Chip, Text } from 'react-native-paper';
import { AppCard } from '@/components/AppCard';
import { BuildMateLogo } from '@/components/BuildMateLogo';
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
      <BuildMateLogo tagline />
      <Text variant="headlineSmall" style={styles.heading}>One login. Two ways to use BuildPair.</Text>
      <Text style={styles.subheading}>Choose the profile you need today. You can add the other later without creating another login.</Text>
    </View>

    <View style={styles.cards}>
      <AppCard style={styles.roleCard}>
        <View style={styles.roleTop}>
          <View style={styles.roleIcon}><Text style={styles.emoji}>🏠</Text></View>
          <View style={styles.roleHeading}>
            <Text variant="headlineSmall" style={styles.title}>I’m a Homeowner</Text>
            <Text variant="bodySmall" style={styles.kicker}>POST • COMPARE • HIRE</Text>
          </View>
        </View>
        <Text style={styles.body}>Find trusted trades, post jobs, compare quotes and keep everything organised in one place.</Text>
        <Link href={signUpHref('customer')} asChild><Button mode="contained" contentStyle={styles.primaryButton} style={styles.primaryAction}>Create Homeowner Account</Button></Link>
        <Link href={signInHref('customer')} asChild><Button mode="text">Homeowner Sign In</Button></Link>
      </AppCard>

      <AppCard style={styles.roleCard}>
        <View style={styles.roleTop}>
          <View style={styles.roleIcon}><Text style={styles.emoji}>🔨</Text></View>
          <View style={styles.roleHeading}>
            <Text variant="headlineSmall" style={styles.title}>I’m a Tradesperson</Text>
            <Chip compact style={styles.trialChip} textStyle={styles.trialChipText}>14 days free</Chip>
          </View>
        </View>
        <Text style={styles.body}>Find local work, build a trusted profile, quote customers and manage your jobs.</Text>
        <Link href={signUpHref('trader')} asChild><Button mode="contained" contentStyle={styles.primaryButton} style={styles.primaryAction}>Create Tradesperson Account</Button></Link>
        <Link href={signInHref('trader')} asChild><Button mode="text">Tradesperson Sign In</Button></Link>
      </AppCard>
    </View>

    <AppCard elevated={false} style={styles.browseCard}>
      <View style={styles.browseCopy}>
        <Text variant="titleMedium" style={styles.title}>Just looking?</Text>
        <Text style={styles.browseText}>You can browse local trade profiles before creating an account.</Text>
      </View>
      <Link href="/(public)/directory" asChild><Button mode="outlined" contentStyle={styles.browseButton}>Browse trades</Button></Link>
    </AppCard>
  </Screen>;
}

const styles = StyleSheet.create({
  hero: { width: '100%', maxWidth: 820, alignSelf: 'center', alignItems: 'center', paddingVertical: 24, paddingHorizontal: 18, borderRadius: 24, backgroundColor: colors.surfaceStrong, gap: 10 },
  heading: { maxWidth: 680, textAlign: 'center', fontWeight: '900', color: colors.charcoal, lineHeight: 31, marginTop: 6 },
  subheading: { maxWidth: 620, textAlign: 'center', color: colors.muted, fontSize: 16, lineHeight: 23 },
  cards: { width: '100%', maxWidth: 820, alignSelf: 'center', gap: 16 },
  roleCard: { padding: 20 },
  roleTop: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  roleIcon: { width: 52, height: 52, borderRadius: 16, backgroundColor: colors.surfaceSoft, borderWidth: 1, borderColor: colors.border, alignItems: 'center', justifyContent: 'center' },
  emoji: { fontSize: 27 },
  roleHeading: { flex: 1, alignItems: 'flex-start', gap: 6 },
  title: { fontWeight: '900', color: colors.charcoal },
  kicker: { color: colors.muted, fontWeight: '800', letterSpacing: 1.1 },
  body: { color: colors.muted, lineHeight: 23, fontSize: 16 },
  trialChip: { alignSelf: 'flex-start', backgroundColor: '#E8F4EA' },
  trialChipText: { color: colors.success, fontWeight: '800' },
  primaryButton: { minHeight: 52 },
  primaryAction: { borderRadius: 16 },
  browseCard: { width: '100%', maxWidth: 820, alignSelf: 'center', backgroundColor: colors.surfaceSoft, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 },
  browseCopy: { flex: 1, minWidth: 220, gap: 3 },
  browseText: { color: colors.muted, lineHeight: 21 },
  browseButton: { minHeight: 44, minWidth: 150 },
});
