import { useAuth } from '@clerk/expo';
import { Linking, StyleSheet, View } from 'react-native';
import { Button, Text } from 'react-native-paper';
import { AppCard } from '@/components/AppCard';
import { Screen } from '@/components/Screen';
import { SUBSCRIPTION_TIERS } from '@/constants/options';
import { apiFetch, errorMessage } from '@/lib/api';
import { TRADER_TRIAL_DAYS } from '@/lib/subscription';

export default function SubscriptionScreen() {
  const { getToken } = useAuth();
  const paymentsEnabled = Boolean(process.env.EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY?.trim());
  async function openEndpoint(path: string, body = {}) {
    try { const { url } = await apiFetch<{ url: string }>(path, { method: 'POST', body: JSON.stringify(body) }, getToken); await Linking.openURL(url); }
    catch (e) { alert(errorMessage(e)); }
  }
  return <Screen title="Plans and payouts" subtitle="Start with your free trial, then choose the BuildPair plan that fits your business.">
    <AppCard>
      <Text variant="titleLarge">{TRADER_TRIAL_DAYS}-day trader trial</Text>
      <Text>New trader profiles get {TRADER_TRIAL_DAYS} days of Basic listing and lead access without needing a paid subscription.</Text>
      {!paymentsEnabled ? <Text>Private beta protection: paid billing is currently switched off, so your lead access will not suddenly disappear when the trial date passes. BuildPair will make any future paid-plan change clear before it affects access.</Text> : <Text>If you choose a paid plan during the trial, Stripe will not bill before the free period ends.</Text>}
    </AppCard>
    <View style={styles.grid}>{Object.entries(SUBSCRIPTION_TIERS).map(([key, tier]) => <View key={key} style={styles.plan}><AppCard><Text variant="headlineSmall">{tier.name}</Text><Text variant="headlineMedium">{key === 'free' ? tier.price : `${tier.price} after trial`}</Text>{tier.features.map((feature) => <Text key={feature}>✓ {feature}</Text>)}{key !== 'free' ? <Button mode="contained" disabled={!paymentsEnabled} onPress={() => openEndpoint('/api/stripe/subscription', { tier: key })}>{paymentsEnabled ? `Choose ${tier.name}` : 'Paid plans not active in beta'}</Button> : null}</AppCard></View>)}</View>
    <AppCard><Text variant="titleLarge">Receive job payments</Text><Text>{paymentsEnabled ? 'Complete Stripe Express onboarding so customer deposits and balances can be routed to your bank. BuildPair never handles raw card numbers.' : 'BuildPair card payments are not active during the current beta. Customers can record payments they have already made directly to you, but BuildPair does not move that money.'}</Text><Button mode="contained" icon="bank" disabled={!paymentsEnabled} onPress={() => openEndpoint('/api/stripe/connect')}>{paymentsEnabled ? 'Set up Stripe payouts' : 'Stripe payouts not active in beta'}</Button></AppCard>
    <Button mode="outlined" disabled={!paymentsEnabled} onPress={() => openEndpoint('/api/stripe/billing-portal')}>Manage or cancel subscription</Button>
  </Screen>;
}

const styles = StyleSheet.create({ grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 }, plan: { flex: 1, minWidth: 240 } });
