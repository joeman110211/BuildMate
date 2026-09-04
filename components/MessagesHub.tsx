import { useAuth } from '@clerk/expo';
import type { Href } from 'expo-router';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Button, Text } from 'react-native-paper';
import { AppCard } from '@/components/AppCard';
import { EmptyState, LoadingScreen, Screen } from '@/components/Screen';
import { colors } from '@/constants/theme';
import { apiFetch, errorMessage } from '@/lib/api';

type Conversation = {
  id: string;
  jobId: string;
  jobTitle: string;
  customerId: string;
  traderId: string;
  otherUserId: string;
  lastMessage: string | null;
  lastMessageAt: string;
};

export function MessagesHub({ basePath }: { basePath: '/(customer)' | '/(trader)' }) {
  const { getToken } = useAuth();
  const router = useRouter();
  const [rows, setRows] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const load = useCallback(async () => {
    try { setRows(await apiFetch('/api/conversations', {}, getToken)); setError(''); }
    catch (e) { setError(errorMessage(e)); }
    finally { setLoading(false); }
  }, [getToken]);
  useEffect(() => { void load(); }, [load]);
  if (loading) return <LoadingScreen label="Loading messages…" />;
  return <Screen title="Messages" subtitle="Job conversations stay attached to the work, quote and people involved.">
    {error ? <EmptyState title="Couldn’t load messages" body={error} action={<Button onPress={load}>Try again</Button>} /> : null}
    {!error && !rows.length ? <EmptyState title="No conversations yet" body="A conversation opens after a trader has quoted a job or receives a direct job request." /> : rows.map((row) => <AppCard key={row.id}>
      <View style={styles.row}><Text variant="titleMedium" style={styles.title}>{row.jobTitle}</Text><Text style={styles.time}>{new Date(row.lastMessageAt).toLocaleDateString()}</Text></View>
      <Text style={styles.muted} numberOfLines={2}>{row.lastMessage ?? 'Conversation ready. Send the first message.'}</Text>
      <Button mode="outlined" onPress={() => router.push(`${basePath}/messages/${row.id}` as Href)}>Open conversation</Button>
    </AppCard>)}
  </Screen>;
}

const styles = StyleSheet.create({ row: { flexDirection: 'row', justifyContent: 'space-between', gap: 10, flexWrap: 'wrap' }, title: { fontWeight: '800', flex: 1 }, time: { color: colors.muted }, muted: { color: colors.muted } });
