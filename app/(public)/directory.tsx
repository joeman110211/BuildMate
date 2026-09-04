import { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Button, Searchbar, Text } from 'react-native-paper';
import { FormSelect } from '@/components/FormSelect';
import { EmptyState, LoadingScreen, Screen } from '@/components/Screen';
import { TraderCard } from '@/components/TraderCard';
import { TRADE_CATEGORIES } from '@/constants/options';
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
    catch (e) { setError(errorMessage(e)); } finally { setLoading(false); }
  }
  useEffect(() => { const timer = setTimeout(() => void load(), 0); return () => clearTimeout(timer); }, []);
  const filtered = traders.filter((t) => `${t.businessName} ${t.tradeCategory} ${t.subSkills.join(' ')}`.toLowerCase().includes(query.toLowerCase()));

  if (loading) return <LoadingScreen label="Finding trusted local trades…" />;
  return <Screen title="Find the right trade. Without the runaround." subtitle="Browse subscribed BuildMate tradespeople, verified-customer reviews and real work galleries.">
    <View style={styles.filters}>
      <View style={styles.search}><Searchbar placeholder="Search name or skill" value={query} onChangeText={setQuery} /></View>
      <View style={styles.select}><FormSelect label="Trade" value={trade} options={TRADE_CATEGORIES} onChange={(value) => { setTrade(value); void load(value); }} placeholder="All trades" /></View>
      {trade ? <Button onPress={() => { setTrade(undefined); void load(); }}>Clear</Button> : null}
    </View>
    {error ? <EmptyState title="Directory unavailable" body={error} action={<Button onPress={() => load(trade)}>Try again</Button>} /> : null}
    {!error && !filtered.length ? <EmptyState title="No matches yet" body="Try another trade or remove your search." /> : filtered.map((trader) => <TraderCard key={trader.id} trader={trader} />)}
    <Text variant="bodySmall" style={styles.disclaimer}>Qualifications and insurance are self-certified. Always check public register links and documentation before appointing a tradesperson.</Text>
  </Screen>;
}

const styles = StyleSheet.create({ filters: { flexDirection: 'row', gap: 10, alignItems: 'flex-end', flexWrap: 'wrap' }, search: { flex: 2, minWidth: 240 }, select: { flex: 1, minWidth: 200 }, disclaimer: { textAlign: 'center', opacity: 0.7, marginTop: 10 } });
