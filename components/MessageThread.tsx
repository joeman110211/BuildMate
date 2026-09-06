import { useAuth } from '@clerk/expo';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Alert, StyleSheet, View } from 'react-native';
import { Button, Chip, IconButton, Text, TextInput } from 'react-native-paper';
import { AppCard } from '@/components/AppCard';
import { EmptyState, LoadingScreen, Screen } from '@/components/Screen';
import { colors } from '@/constants/theme';
import { apiFetch, errorMessage } from '@/lib/api';

type MessageRiskLevel = 'none' | 'low' | 'medium' | 'high' | 'severe';
type Message = {
  id: string;
  conversationId: string;
  senderId: string;
  body: string;
  readAt: string | null;
  createdAt: string;
  aiRiskLevel?: MessageRiskLevel;
  aiModerationReason?: string | null;
};
type ConversationStatus = {
  id: string;
  moderationStatus: 'open' | 'warned' | 'restricted' | 'closed';
  moderationReason: string;
  moderationUpdatedAt: string | null;
};
type SendResult = Message & { conversationStatus?: ConversationStatus['moderationStatus']; warning?: string | null };
type AssistantResult = { summary: string; suggestions: string[]; source: 'ai' | 'rules' };

export function MessageThread({ conversationId }: { conversationId: string }) {
  const { getToken, userId } = useAuth();
  const getTokenRef = useRef(getToken);
  const [messages, setMessages] = useState<Message[]>([]);
  const [conversation, setConversation] = useState<ConversationStatus>();
  const [body, setBody] = useState('');
  const [assistant, setAssistant] = useState<AssistantResult>();
  const [warning, setWarning] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [assistantLoading, setAssistantLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => { getTokenRef.current = getToken; }, [getToken]);
  const load = useCallback(async () => {
    try {
      const [nextMessages, nextConversation] = await Promise.all([
        apiFetch<Message[]>(`/api/conversations/${conversationId}/messages`, {}, () => getTokenRef.current()),
        apiFetch<ConversationStatus>(`/api/conversations/${conversationId}`, {}, () => getTokenRef.current()),
      ]);
      setMessages(nextMessages);
      setConversation(nextConversation);
      setError('');
    } catch (e) { setError(errorMessage(e)); }
    finally { setLoading(false); }
  }, [conversationId]);
  useEffect(() => { void load(); const refresh = setInterval(() => void load(), 5000); return () => clearInterval(refresh); }, [load]);

  const send = async () => {
    const text = body.trim();
    if (!text || sending || conversation?.moderationStatus === 'restricted' || conversation?.moderationStatus === 'closed') return;
    setSending(true);
    try {
      const created = await apiFetch<SendResult>(`/api/conversations/${conversationId}/messages`, { method: 'POST', body: JSON.stringify({ body: text }) }, () => getTokenRef.current());
      setMessages((current) => current.some((message) => message.id === created.id) ? current : [...current, created]);
      setBody('');
      setAssistant(undefined);
      setWarning(created.warning ?? '');
      if (created.conversationStatus) {
        setConversation((current) => current ? { ...current, moderationStatus: created.conversationStatus! } : current);
      }
      setError('');
      if (created.conversationStatus === 'restricted') await load();
    } catch (e) { setError(errorMessage(e)); }
    finally { setSending(false); }
  };

  const getReplyIdeas = async () => {
    if (assistantLoading) return;
    setAssistantLoading(true);
    try {
      const result = await apiFetch<AssistantResult>('/api/ai/message-assistant', {
        method: 'POST',
        body: JSON.stringify({ conversationId, draft: body.trim() || undefined }),
      }, () => getTokenRef.current());
      setAssistant(result);
      setError('');
    } catch (e) { setError(errorMessage(e)); }
    finally { setAssistantLoading(false); }
  };

  const report = async (messageId: string) => {
    try {
      await apiFetch('/api/reports', { method: 'POST', body: JSON.stringify({ messageId, reason: 'abuse_or_harassment', details: 'Reported from a BuildPair job conversation.' }) }, () => getTokenRef.current());
      Alert.alert('Report received', 'The message has been added to the moderation queue.');
    } catch (e) { Alert.alert('Could not report message', errorMessage(e)); }
  };

  if (loading) return <LoadingScreen label="Loading conversation…" />;
  const moderationStatus = conversation?.moderationStatus ?? 'open';
  const locked = moderationStatus === 'restricted' || moderationStatus === 'closed';
  const moderationText = moderationStatus === 'closed'
    ? 'This conversation has been closed by BuildPair moderation. You can still read the history, but new messages are disabled.'
    : moderationStatus === 'restricted'
      ? 'Messaging is temporarily restricted while BuildPair reviews this conversation.'
      : moderationStatus === 'warned'
        ? 'BuildPair has detected language or behaviour that may breach the chat rules. Keep messages factual and respectful.'
        : '';

  return <Screen title="Job Conversation" subtitle="Keep arrangements and changes here so both sides have a clear record.">
    <AppCard style={styles.aiNotice} elevated={false}>
      <View style={styles.noticeHeader}><Chip icon="creation">BuildPair AI</Chip><Text variant="labelMedium" style={styles.noticeTitle}>Reply help and safety moderation</Text></View>
      <Text style={styles.muted}>BuildPair AI may analyse messages in this conversation to suggest replies, identify possible scams or abuse, and help keep the marketplace safe. AI can make mistakes, so serious moderation decisions can be reviewed by a person.</Text>
    </AppCard>

    {moderationText ? <AppCard style={moderationStatus === 'warned' ? styles.warningCard : styles.restrictedCard} elevated={false}>
      <Text variant="titleMedium" style={styles.warningTitle}>{moderationStatus === 'warned' ? 'Chat warning' : moderationStatus === 'closed' ? 'Conversation closed' : 'Messaging restricted'}</Text>
      <Text style={styles.warningText}>{moderationText}</Text>
      {conversation?.moderationReason ? <Text variant="bodySmall" style={styles.muted}>Reason recorded: {conversation.moderationReason}</Text> : null}
    </AppCard> : null}
    {warning ? <AppCard style={styles.warningCard} elevated={false}><Text style={styles.warningText}>{warning}</Text></AppCard> : null}
    {error ? <Text style={styles.error}>{error}</Text> : null}

    <View style={styles.thread}>
      {!messages.length ? <EmptyState title="No messages yet" body="Send the first message below." /> : messages.map((message) => {
        const mine = message.senderId === userId;
        const flagged = mine && message.aiRiskLevel && ['medium', 'high', 'severe'].includes(message.aiRiskLevel);
        return <View key={message.id} style={[styles.messageRow, mine && styles.messageRowMine]}>
          <View style={[styles.bubble, mine ? styles.mine : styles.theirs]}>
            <Text style={[styles.messageText, mine && styles.mineText]}>{message.body}</Text>
            {flagged ? <Text variant="bodySmall" style={styles.flaggedText}>BuildPair safety check: {message.aiModerationReason || 'This message may breach chat rules.'}</Text> : null}
            <View style={styles.meta}><Text style={[styles.time, mine && styles.mineTime]}>{new Date(message.createdAt).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}</Text>{!mine ? <Button compact textColor={colors.muted} onPress={() => void report(message.id)}>Report</Button> : null}</View>
          </View>
        </View>;
      })}
    </View>

    <AppCard style={styles.assistantCard} elevated={false}>
      <View style={styles.assistantHeader}>
        <View style={styles.assistantTitleBlock}><Text variant="titleMedium" style={styles.title}>Need help wording a reply?</Text><Text style={styles.muted}>AI suggestions are drafts. Check facts, prices and promises before sending.</Text></View>
        <Button mode="outlined" icon="creation" loading={assistantLoading} disabled={assistantLoading || locked} onPress={() => void getReplyIdeas()}>AI reply ideas</Button>
      </View>
      {assistant ? <>
        <Text variant="bodySmall" style={styles.summary}>{assistant.summary}</Text>
        <View style={styles.suggestions}>{assistant.suggestions.map((suggestion, index) => <Button key={`${index}-${suggestion.slice(0, 24)}`} mode="text" style={styles.suggestionButton} contentStyle={styles.suggestionContent} onPress={() => setBody(suggestion)}>{suggestion}</Button>)}</View>
      </> : null}
    </AppCard>

    <View style={styles.composer}>
      <TextInput style={styles.input} mode="outlined" placeholder={locked ? 'Messaging is currently unavailable' : 'Write a message…'} value={body} onChangeText={setBody} multiline maxLength={4000} disabled={locked} />
      <IconButton icon="send" mode="contained" containerColor={colors.primary} iconColor="#FFFFFF" size={24} loading={sending} disabled={sending || locked || !body.trim()} onPress={() => void send()} accessibilityLabel="Send message" />
    </View>
  </Screen>;
}

const styles = StyleSheet.create({
  aiNotice: { backgroundColor: colors.blueSoft, borderColor: '#C9DDEA' },
  noticeHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, flexWrap: 'wrap' },
  noticeTitle: { color: colors.charcoal, fontWeight: '800' },
  warningCard: { backgroundColor: '#FFF8E8', borderColor: '#EAC987' },
  restrictedCard: { backgroundColor: '#FFF1EF', borderColor: '#E8AAA4' },
  warningTitle: { color: colors.charcoal, fontWeight: '900' },
  warningText: { color: colors.text, lineHeight: 22 },
  thread: { minHeight: 320, backgroundColor: colors.surfaceSoft, borderRadius: 20, padding: 12, gap: 10, borderWidth: 1, borderColor: colors.border },
  messageRow: { flexDirection: 'row', justifyContent: 'flex-start' },
  messageRowMine: { justifyContent: 'flex-end' },
  bubble: { maxWidth: '82%', paddingHorizontal: 14, paddingTop: 11, paddingBottom: 7, borderRadius: 18, gap: 4 },
  mine: { backgroundColor: colors.primary, borderBottomRightRadius: 5 },
  theirs: { backgroundColor: colors.surfaceRaised, borderWidth: 1, borderColor: colors.border, borderBottomLeftRadius: 5 },
  messageText: { color: colors.text, lineHeight: 22 },
  mineText: { color: '#FFFFFF' },
  flaggedText: { color: '#FFF3E8', fontWeight: '700', lineHeight: 18 },
  meta: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  time: { color: colors.muted, fontSize: 11 },
  mineTime: { color: '#FFE3D2' },
  assistantCard: { backgroundColor: colors.surfaceRaised },
  assistantHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' },
  assistantTitleBlock: { flex: 1, minWidth: 220, gap: 3 },
  title: { color: colors.charcoal, fontWeight: '900' },
  summary: { color: colors.muted, lineHeight: 20 },
  suggestions: { gap: 6 },
  suggestionButton: { alignSelf: 'stretch', borderWidth: 1, borderColor: colors.border, borderRadius: 14 },
  suggestionContent: { justifyContent: 'flex-start', minHeight: 44 },
  composer: { flexDirection: 'row', alignItems: 'flex-end', gap: 8, backgroundColor: colors.surfaceRaised, borderRadius: 18 },
  input: { flex: 1, backgroundColor: colors.surfaceRaised },
  muted: { color: colors.muted, lineHeight: 21 },
  error: { color: colors.danger },
});
