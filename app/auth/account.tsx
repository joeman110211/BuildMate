import { Link, Redirect } from 'expo-router';
import { StyleSheet, View } from 'react-native';
import { Button, Text } from 'react-native-paper';
import { AppCard } from '@/components/AppCard';
import { LoadingScreen, Screen } from '@/components/Screen';
import { colors } from '@/constants/theme';
import { dashboardHref, signInHref, signUpHref } from '@/lib/account-mode';
import { useCurrentUser } from '@/hooks/useCurrentUser';

export default function AccountEntryScreen() {
  const { user, loading, isSignedIn } = useCurrentUser();

  if (loading) return <LoadingScreen label="Loading BuildMate…" />;
  if (isSignedIn && user?.activeMode) return <Redirect href={dashboardHref(user.activeMode)} />;
  if (isSignedIn) return <Redirect href="/auth/choose-role" />;

  return (
    <Screen title="Join BuildMate" subtitle="Choose the side of BuildMate you want to use. One login can have both profiles.">
      <View style={styles.cards}>
        <AppCard>
          <Text variant="headlineSmall" style={styles.title}>🏠 I’m a Homeowner</Text>
          <Text style={styles.body}>Find trusted trades, post jobs and get quotes.</Text>
          <Link href={signUpHref('customer')} asChild>
            <Button mode="contained" contentStyle={styles.button}>Create Homeowner Account</Button>
          </Link>
        </AppCard>

        <AppCard>
          <Text variant="headlineSmall" style={styles.title}>🔨 I’m a Tradesperson</Text>
          <Text style={styles.body}>Find work, build your profile and manage customers.</Text>
          <Link href={signUpHref('trader')} asChild>
            <Button mode="contained" contentStyle={styles.button}>Create Tradesperson Account</Button>
          </Link>
        </AppCard>
      </View>

      <View style={styles.signInSection}>
        <Text variant="titleMedium" style={styles.signInTitle}>Already have an account?</Text>
        <View style={styles.signInButtons}>
          <Link href={signInHref('customer')} asChild>
            <Button mode="outlined">🏠 Homeowner Sign In</Button>
          </Link>
          <Link href={signInHref('trader')} asChild>
            <Button mode="outlined">🔨 Tradesperson Sign In</Button>
          </Link>
        </View>
      </View>

      <Link href="/(public)/directory" asChild>
        <Button>Browse trades without signing in</Button>
      </Link>
    </Screen>
  );
}

const styles = StyleSheet.create({
  cards: { gap: 14 },
  title: { fontWeight: '800' },
  body: { color: colors.muted, marginBottom: 4 },
  button: { minHeight: 50 },
  signInSection: { marginTop: 8, gap: 10 },
  signInTitle: { textAlign: 'center', fontWeight: '700' },
  signInButtons: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 8 },
});
