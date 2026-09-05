import { Link } from 'expo-router';
import { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Button, Chip, Searchbar, Text } from 'react-native-paper';
import { FormSelect } from '@/components/FormSelect';
import { EmptyState, LoadingScreen, Screen } from '@/components/Screen';
import { TraderCard } from '@/components/TraderCard';
import { TRADE_CATEGORIES } from '@/constants/options';
import { colors } from '@/constants/theme';
import { apiFetch, errorMessage } from '@/lib/api';
import type { TraderProfile } from '@/types';

export default function DirectoryScreen() {
  const [traders, setTraders] = useState<TraderProfile[]>([]);
  const [trade, setTrade] = useState<string>();
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  async function load(selected?: string) {
    try { setLoading(true); setError(''); setTraders(await apiFetch(`/api/traders${selected ? `?trade=${encodeURIComponent(selected)}` : ''}`)); }
    catch (e) { setError(errorMessage(e)); }
    finally { setLoading(false); }
  }
  useEffect(() => { const timer = setTimeout(() => void load(), 0); return () => clearTimeout(timer); }, []);
  const filtered = traders.filter((trader) => `${trader.businessName} ${trader.tradeCategory} ${trader.subSkills.join(' ')}`.toLowerCase().includes(query.toLowerCase()));

  if (loading) return <LoadingScreen label="Finding local trades…" />;
  return <Screen title="Find Trades" subtitle="Search BuildPair profiles, real work galleries and verified-customer reviews before you invite anyone to quote.">
    <View style={styles.searchPanel}>
      <View style={styles.search}><Searchbar style={styles.searchbar} placeholder="What trade or skill do you need?" value={query} onChangeText={setQuery} /></View>
      <View style={styles.select}><FormSelect label="Trade" value={trade} options={TRADE_CATEGORIES} onChange={(value) => { setTrade(value); void load(value); }} placeholder="All trades" /></View>
      {trade ? <Button mode="text" onPress={() => { setTrade(undefined); void load(); }}>Clear</Button> : null}
    </View>
    <View style={styles.filterChips}><Chip icon="check-circle-outline">BuildPair listings</Chip><Chip icon="star-outline">Customer reviews</Chip><Chip icon="image-multiple-outline">Work galleries</Chip></View>
    <View style={styles.resultsHeader}><Text variant="titleLarge" style={styles.title}>{filtered.length} trade{filtered.length === 1 ? '' : 's'} found</Text>{trade ? <Chip>{trade}</Chip> : null}</View>
    {error ? <EmptyState title="Directory unavailable" body={error} action={<Button onPress={() => load(trade)}>Try again</Button>} /> : null}
    {!error && !filtered.length ? <EmptyState title="No matches yet" body="Try another trade or remove your search." /> : <View style={styles.grid}>{filtered.map((trader) => <TraderCard key={trader.id} trader={trader} />)}</View>}
    <Text variant="bodySmall" style={styles.disclaimer}>BuildPair distinguishes verified reviews from information supplied by tradespeople. Check qualifications, registers and insurance that matter for your particular job before appointing anyone.</Text>
    <View style={styles.legalLinks}><Link href="/(public)/legal" asChild><Button compact mode="text">Legal & safety</Button></Link><Link href="/(public)/privacy" asChild><Button compact mode="text">Privacy</Button></Link></View>
  </Screen>;
}

const styles = StyleSheet.create({
  searchPanel: { backgroundColor: colors.surfaceRaised, borderWidth: 1, borderColor: colors.border, borderRadius: 20, padding: 14, flexDirection: 'row', gap: 10, alignItems: 'flex-end', flexWrap: 'wrap' },
  search: { flex: 2, minWidth: 250 },
  searchbar: { backgroundColor: colors.surfaceSoft, borderWidth: 1, borderColor: colors.border },
  select: { flex: 1, minWidth: 210 },
  filterChips: { flexDirection: 'row', gap: 7, flexWrap: 'wrap' },
  resultsHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 8, flexWrap: 'wrap' },
  title: { fontWeight: '900', color: colors.charcoal },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 14, alignItems: 'stretch' },
  disclaimer: { textAlign: 'center', color: colors.muted, marginTop: 8, lineHeight: 19 },
  legalLinks: { flexDirection: 'row', justifyContent: 'center', flexWrap: 'wrap', gap: 4 },
});
