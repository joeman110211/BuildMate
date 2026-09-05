import { useAuth } from '@clerk/expo';
import type { Href } from 'expo-router';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Button, Icon, Text } from 'react-native-paper';
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

export function MessagesHub({ basePath }: { basePath: '/customer' | '/trader' }) {
  const { getToken } = useAuth();
  const getTokenRef = useRef(getToken);
  const router = useRouter();
  const [rows, setRows] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => { getTokenRef.current = getToken; }, [getToken]);
  const load = useCallback(async () => {
    try { setRows(await apiFetch<Conversation[]>('/api/conversations', {}, () => getTokenRef.current())); setError(''); }
    catch (e) { setError(errorMessage(e)); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => { void load(); const refresh = setInterval(() => void load(), 10000); return () => clearInterval(refresh); }, [load]);

  if (loading) return <LoadingScreen label="Loading messages…" />;
  return <Screen title="Messages" subtitle="Every conversation stays attached to the job it belongs to.">
    {error ? <EmptyState title="Couldn’t load messages" body={error} action={<Button onPress={load}>Try again</Button>} /> : null}
    {!error && !rows.length ? <EmptyState title="No conversations yet" body="A conversation opens after a quote or direct job request, so job discussions never float around without context." /> : rows.map((row) => <Pressable key={row.id} accessibilityRole="button" onPress={() => router.push(`${basePath}/messages/${row.id}` as Href)} style={({ pressed }) => [styles.conversation, pressed && styles.pressed]}>
      <View style={styles.avatar}><Icon source="briefcase-outline" size={24} color={colors.primary} /></View>
      <View style={styles.flex}><View style={styles.row}><Text variant="titleMedium" style={styles.title}>{row.jobTitle}</Text><Text style={styles.time}>{formatConversationTime(row.lastMessageAt)}</Text></View><Text style={styles.muted} numberOfLines={2}>{row.lastMessage ?? 'Conversation ready. Send the first message.'}</Text></View>
      <Icon source="chevron-right" size={24} color={colors.muted} />
    </Pressable>)}
  </Screen>;
}

function formatConversationTime(value: string) {
  const date = new Date(value);
  const today = new Date();
  if (date.toDateString() === today.toDateString()) return date.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
  return date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' });
}

const styles = StyleSheet.create({
  conversation: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: 18, padding: 14, flexDirection: 'row', alignItems: 'center', gap: 12, shadowColor: '#111827', shadowOpacity: 0.04, shadowRadius: 10, shadowOffset: { width: 0, height: 3 }, elevation: 2 },
  pressed: { opacity: 0.75 },
  avatar: { width: 48, height: 48, borderRadius: 24, backgroundColor: colors.surfaceSoft, alignItems: 'center', justifyContent: 'center' },
  flex: { flex: 1, gap: 4 },
  row: { flexDirection: 'row', justifyContent: 'space-between', gap: 10, alignItems: 'center' },
  title: { fontWeight: '900', color: colors.text, flex: 1 },
  time: { color: colors.muted, fontSize: 12 },
  muted: { color: colors.muted, lineHeight: 20 },
});
