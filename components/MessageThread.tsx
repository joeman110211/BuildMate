import { useAuth } from '@clerk/expo';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Alert, StyleSheet, View } from 'react-native';
import { Button, IconButton, Text, TextInput } from 'react-native-paper';
import { EmptyState, LoadingScreen, Screen } from '@/components/Screen';
import { colors } from '@/constants/theme';
import { apiFetch, errorMessage } from '@/lib/api';

type Message = { id: string; conversationId: string; senderId: string; body: string; readAt: string | null; createdAt: string };

export function MessageThread({ conversationId }: { conversationId: string }) {
  const { getToken, userId } = useAuth();
  const getTokenRef = useRef(getToken);
  const [messages, setMessages] = useState<Message[]>([]);
  const [body, setBody] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => { getTokenRef.current = getToken; }, [getToken]);
  const load = useCallback(async () => {
    try { setMessages(await apiFetch<Message[]>(`/api/conversations/${conversationId}/messages`, {}, () => getTokenRef.current())); setError(''); }
    catch (e) { setError(errorMessage(e)); }
    finally { setLoading(false); }
  }, [conversationId]);
  useEffect(() => { void load(); const refresh = setInterval(() => void load(), 5000); return () => clearInterval(refresh); }, [load]);

  const send = async () => {
    const text = body.trim();
    if (!text || sending) return;
    setSending(true);
    try {
      const created = await apiFetch<Message>(`/api/conversations/${conversationId}/messages`, { method: 'POST', body: JSON.stringify({ body: text }) }, () => getTokenRef.current());
      setMessages((current) => current.some((message) => message.id === created.id) ? current : [...current, created]);
      setBody(''); setError('');
    } catch (e) { setError(errorMessage(e)); }
    finally { setSending(false); }
  };

  const report = async (messageId: string) => {
    try {
      await apiFetch('/api/reports', { method: 'POST', body: JSON.stringify({ messageId, reason: 'abuse_or_harassment', details: 'Reported from a BuildPair job conversation.' }) }, () => getTokenRef.current());
      Alert.alert('Report received', 'The message has been added to the moderation queue.');
    } catch (e) { Alert.alert('Could not report message', errorMessage(e)); }
  };

  if (loading) return <LoadingScreen label="Loading conversation…" />;
  return <Screen title="Job Conversation" subtitle="Keep arrangements and changes here so both sides have a clear record.">
    {error ? <Text style={styles.error}>{error}</Text> : null}
    <View style={styles.thread}>
      {!messages.length ? <EmptyState title="No messages yet" body="Send the first message below." /> : messages.map((message) => {
        const mine = message.senderId === userId;
        return <View key={message.id} style={[styles.messageRow, mine && styles.messageRowMine]}>
          <View style={[styles.bubble, mine ? styles.mine : styles.theirs]}>
            <Text style={[styles.messageText, mine && styles.mineText]}>{message.body}</Text>
            <View style={styles.meta}><Text style={[styles.time, mine && styles.mineTime]}>{new Date(message.createdAt).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}</Text>{!mine ? <Button compact textColor={colors.muted} onPress={() => void report(message.id)}>Report</Button> : null}</View>
          </View>
        </View>;
      })}
    </View>
    <View style={styles.composer}>
      <TextInput style={styles.input} mode="outlined" placeholder="Write a message…" value={body} onChangeText={setBody} multiline maxLength={4000} />
      <IconButton icon="send" mode="contained" containerColor={colors.primary} iconColor="#FFFFFF" size={24} loading={sending} disabled={sending || !body.trim()} onPress={() => void send()} accessibilityLabel="Send message" />
    </View>
  </Screen>;
}

const styles = StyleSheet.create({
  thread: { minHeight: 320, backgroundColor: '#FBFBF9', borderRadius: 18, padding: 12, gap: 10, borderWidth: 1, borderColor: colors.border },
  messageRow: { flexDirection: 'row', justifyContent: 'flex-start' },
  messageRowMine: { justifyContent: 'flex-end' },
  bubble: { maxWidth: '82%', paddingHorizontal: 14, paddingTop: 11, paddingBottom: 7, borderRadius: 18, gap: 4 },
  mine: { backgroundColor: colors.primary, borderBottomRightRadius: 5 },
  theirs: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderBottomLeftRadius: 5 },
  messageText: { color: colors.text, lineHeight: 22 },
  mineText: { color: '#FFFFFF' },
  meta: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  time: { color: colors.muted, fontSize: 11 },
  mineTime: { color: '#FFE3D2' },
  composer: { flexDirection: 'row', alignItems: 'flex-end', gap: 8, backgroundColor: colors.surface, borderRadius: 18 },
  input: { flex: 1, backgroundColor: colors.surface },
  error: { color: colors.danger },
});
