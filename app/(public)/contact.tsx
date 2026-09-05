import { useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { Button, Icon, Text, TextInput } from 'react-native-paper';
import { PublicFooter } from '@/components/PublicFooter';
import { colors } from '@/constants/theme';
import { apiFetch, errorMessage } from '@/lib/api';

export default function ContactPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [status, setStatus] = useState('');
  const [error, setError] = useState('');

  async function submit() {
    try {
      setSending(true);
      setError('');
      setStatus('');
      await apiFetch<{ ok: boolean }>('/api/contact', { method: 'POST', body: JSON.stringify({ name, email, subject, message }) });
      setStatus('Thanks. Your message has been sent to BuildPair support.');
      setName(''); setEmail(''); setSubject(''); setMessage('');
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setSending(false);
    }
  }

  return <ScrollView style={styles.page} contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
    <View style={styles.hero}>
      <Text style={styles.eyebrow}>Contact BuildPair</Text>
      <Text variant="displaySmall" style={styles.title}>Questions, feedback or support.</Text>
      <Text variant="bodyLarge" style={styles.intro}>Tell us what you need help with. Product feedback is welcome too, especially while BuildPair is being prepared for launch.</Text>
    </View>

    <View style={styles.content}>
      <View style={styles.contactCard}>
        <View style={styles.icon}><Icon source="email-outline" size={30} color={colors.primary} /></View>
        <Text variant="headlineSmall" style={styles.cardTitle}>Email</Text>
        <Text style={styles.body}>info@buildpair.co.uk</Text>
        <Text style={styles.body}>Use the form for general support, account questions, marketplace feedback or business enquiries.</Text>
      </View>

      <View style={styles.formCard}>
        <Text variant="headlineSmall" style={styles.cardTitle}>Send a message</Text>
        <TextInput mode="outlined" label="Name" value={name} onChangeText={setName} outlineStyle={styles.inputOutline} />
        <TextInput mode="outlined" label="Email" keyboardType="email-address" autoCapitalize="none" value={email} onChangeText={setEmail} outlineStyle={styles.inputOutline} />
        <TextInput mode="outlined" label="Subject" value={subject} onChangeText={setSubject} outlineStyle={styles.inputOutline} />
        <TextInput mode="outlined" label="Message" multiline numberOfLines={6} value={message} onChangeText={setMessage} outlineStyle={styles.inputOutline} />
        {error ? <Text style={styles.error}>{error}</Text> : null}
        {status ? <Text style={styles.success}>{status}</Text> : null}
        <Button mode="contained" icon="send" loading={sending} disabled={sending || !name.trim() || !email.trim() || message.trim().length < 10} onPress={submit}>Send message</Button>
      </View>
    </View>
    <PublicFooter />
  </ScrollView>;
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: colors.background },
  scroll: { flexGrow: 1 },
  hero: { backgroundColor: colors.charcoal, paddingHorizontal: 20, paddingVertical: 56, gap: 12 },
  eyebrow: { width: '100%', maxWidth: 1000, alignSelf: 'center', color: colors.secondary, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 1.2 },
  title: { width: '100%', maxWidth: 1000, alignSelf: 'center', color: '#FFFFFF', fontWeight: '900' },
  intro: { width: '100%', maxWidth: 1000, alignSelf: 'center', color: '#DDE1E3', lineHeight: 27 },
  content: { width: '100%', maxWidth: 1000, alignSelf: 'center', padding: 20, flexDirection: 'row', flexWrap: 'wrap', gap: 16, alignItems: 'flex-start' },
  contactCard: { flexGrow: 1, flexBasis: 260, backgroundColor: colors.primarySoft, borderRadius: 28, padding: 24, gap: 10 },
  formCard: { flexGrow: 2, flexBasis: 440, backgroundColor: colors.surfaceRaised, borderRadius: 28, padding: 24, borderWidth: 1, borderColor: colors.border, gap: 14 },
  icon: { width: 56, height: 56, borderRadius: 19, backgroundColor: '#FFFFFF', alignItems: 'center', justifyContent: 'center' },
  cardTitle: { color: colors.charcoal, fontWeight: '900' },
  body: { color: colors.muted, lineHeight: 23 },
  inputOutline: { borderRadius: 16 },
  error: { color: colors.danger, lineHeight: 20 },
  success: { color: colors.success, lineHeight: 20, fontWeight: '700' },
});
