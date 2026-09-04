import { useAuth } from '@clerk/expo';
import { Linking, StyleSheet, View } from 'react-native';
import { Button, Text } from 'react-native-paper';
import { AppCard } from '@/components/AppCard';
import { Screen } from '@/components/Screen';
import { SUBSCRIPTION_TIERS } from '@/constants/options';
import { apiFetch, errorMessage } from '@/lib/api';

export default function SubscriptionScreen() {
  const { getToken } = useAuth();
  async function openEndpoint(path: string, body = {}) {
    try { const { url } = await apiFetch<{ url: string }>(path, { method: 'POST', body: JSON.stringify(body) }, getToken); await Linking.openURL(url); }
    catch (e) { alert(errorMessage(e)); }
  }
  return <Screen title="Plans and payouts" subtitle="Subscriptions unlock leads. Stripe Connect lets customers pay you through BuildMate.">
    <View style={styles.grid}>{Object.entries(SUBSCRIPTION_TIERS).map(([key, tier]) => <View key={key} style={styles.plan}><AppCard><Text variant="headlineSmall">{tier.name}</Text><Text variant="headlineMedium">{tier.price}</Text>{tier.features.map((feature) => <Text key={feature}>✓ {feature}</Text>)}{key !== 'free' ? <Button mode="contained" onPress={() => openEndpoint('/api/stripe/subscription', { tier: key })}>Choose {tier.name}</Button> : null}</AppCard></View>)}</View>
    <AppCard><Text variant="titleLarge">Receive job payments</Text><Text>Complete Stripe Express onboarding so deposits and balances can be routed to your bank. BuildMate never handles raw card numbers.</Text><Button mode="contained" icon="bank" onPress={() => openEndpoint('/api/stripe/connect')}>Set up Stripe payouts</Button></AppCard>
    <Button mode="outlined" onPress={() => openEndpoint('/api/stripe/billing-portal')}>Manage or cancel subscription</Button>
  </Screen>;
}

const styles = StyleSheet.create({ grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 }, plan: { flex: 1, minWidth: 240 } });
