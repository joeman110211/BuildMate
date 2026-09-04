import { useAuth } from '@clerk/expo';
import { useCallback, useEffect, useState } from 'react';
import { Alert, StyleSheet, View } from 'react-native';
import { Button, Text, TextInput } from 'react-native-paper';
import { EmptyState, LoadingScreen, Screen } from '@/components/Screen';
import { colors } from '@/constants/theme';
import { apiFetch, errorMessage } from '@/lib/api';

type Message = { id: string; conversationId: string; senderId: string; body: string; readAt: string | null; createdAt: string };

export function MessageThread({ conversationId }: { conversationId: string }) {
  const { getToken, userId } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [body, setBody] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    try { setMessages(await apiFetch(`/api/conversations/${conversationId}/messages`, {}, getToken)); setError(''); }
    catch (e) { setError(errorMessage(e)); }
    finally { setLoading(false); }
  }, [conversationId, getToken]);
  useEffect(() => { void load(); }, [load]);

  const send = async () => {
    const text = body.trim();
    if (!text || sending) return;
    setSending(true);
    try {
      const created = await apiFetch<Message>(`/api/conversations/${conversationId}/messages`, { method: 'POST', body: JSON.stringify({ body: text }) }, getToken);
      setMessages((current) => [...current, created]);
      setBody('');
      setError('');
    } catch (e) { setError(errorMessage(e)); }
    finally { setSending(false); }
  };

  const report = async (messageId: string) => {
    try {
      await apiFetch('/api/reports', { method: 'POST', body: JSON.stringify({ messageId, reason: 'abuse_or_harassment', details: 'Reported from a BuildMate job conversation.' }) }, getToken);
      Alert.alert('Report received', 'The message has been added to the moderation queue.');
    } catch (e) { Alert.alert('Could not report message', errorMessage(e)); }
  };

  if (loading) return <LoadingScreen label="Loading conversation…" />;
  return <Screen title="Job conversation" subtitle="Keep job decisions, changes and arrangements here so both sides have a clear record.">
    {error ? <Text style={styles.error}>{error}</Text> : null}
    {!messages.length ? <EmptyState title="No messages yet" body="Send the first message below." /> : messages.map((message) => {
      const mine = message.senderId === userId;
      return <View key={message.id} style={[styles.bubble, mine ? styles.mine : styles.theirs]}>
        <Text>{message.body}</Text>
        <View style={styles.meta}><Text style={styles.time}>{new Date(message.createdAt).toLocaleString()}</Text>{!mine ? <Button compact onPress={() => report(message.id)}>Report</Button> : null}</View>
      </View>;
    })}
    <TextInput mode="outlined" label="Message" value={body} onChangeText={setBody} multiline maxLength={4000} />
    <Button mode="contained" loading={sending} disabled={sending || !body.trim()} onPress={send}>Send message</Button>
  </Screen>;
}

const styles = StyleSheet.create({ bubble: { maxWidth: 760, padding: 12, borderRadius: 14, gap: 6 }, mine: { backgroundColor: '#FFF1E8', alignSelf: 'flex-end' }, theirs: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, alignSelf: 'flex-start' }, meta: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 }, time: { color: colors.muted, fontSize: 12 }, error: { color: colors.danger } });
