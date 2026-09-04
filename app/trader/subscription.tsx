import { useAuth } from '@clerk/expo';
import { Linking, StyleSheet, View } from 'react-native';
import { Button, Text } from 'react-native-paper';
import { AppCard } from '@/components/AppCard';
import { Screen } from '@/components/Screen';
import { SUBSCRIPTION_TIERS } from '@/constants/options';
import { apiFetch, errorMessage } from '@/lib/api';

export default function SubscriptionScreen() {
  const { getToken } = useAuth();
  const paymentsEnabled = Boolean(process.env.EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY?.trim());
  async function openEndpoint(path: string, body = {}) {
    try { const { url } = await apiFetch<{ url: string }>(path, { method: 'POST', body: JSON.stringify(body) }, getToken); await Linking.openURL(url); }
    catch (e) { alert(errorMessage(e)); }
  }
  return <Screen title="Plans and payouts" subtitle="Subscriptions unlock leads. Stripe Connect lets customers pay you through BuildMate.">
    {!paymentsEnabled ? <AppCard><Text variant="titleLarge">14-day trader trial</Text><Text>Paid subscriptions are paused for beta. New trader profiles get 14 days of Basic listing access without taking payment, then Stripe subscriptions can take over when payments are enabled.</Text></AppCard> : null}
    <View style={styles.grid}>{Object.entries(SUBSCRIPTION_TIERS).map(([key, tier]) => <View key={key} style={styles.plan}><AppCard><Text variant="headlineSmall">{tier.name}</Text><Text variant="headlineMedium">{paymentsEnabled ? tier.price : key === 'free' ? tier.price : '14 days free'}</Text>{tier.features.map((feature) => <Text key={feature}>✓ {feature}</Text>)}{key !== 'free' ? <Button mode="contained" disabled={!paymentsEnabled} onPress={() => openEndpoint('/api/stripe/subscription', { tier: key })}>{paymentsEnabled ? `Choose ${tier.name}` : 'Starts after profile setup'}</Button> : null}</AppCard></View>)}</View>
    <AppCard><Text variant="titleLarge">Receive job payments</Text><Text>Complete Stripe Express onboarding so deposits and balances can be routed to your bank. BuildMate never handles raw card numbers.</Text><Button mode="contained" icon="bank" disabled={!paymentsEnabled} onPress={() => openEndpoint('/api/stripe/connect')}>{paymentsEnabled ? 'Set up Stripe payouts' : 'Payouts paused during beta'}</Button></AppCard>
    <Button mode="outlined" disabled={!paymentsEnabled} onPress={() => openEndpoint('/api/stripe/billing-portal')}>Manage or cancel subscription</Button>
  </Screen>;
}

const styles = StyleSheet.create({ grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 }, plan: { flex: 1, minWidth: 240 } });
