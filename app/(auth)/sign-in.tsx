import { router } from 'expo-router';
import { useState } from 'react';
import { StyleSheet } from 'react-native';
import { Button, HelperText, Text, TextInput } from 'react-native-paper';
import { Screen } from '@/native/components/Screen';
import { useAuth } from '@/native/auth';
import { colours } from '@/native/theme';

export default function SignIn() {
  const { signIn, configured } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const submit = async () => {
    setBusy(true); setError(null);
    const result = await signIn(email, password);
    setBusy(false);
    if (result.error) return setError(result.error);
    router.replace('/(tabs)');
  };
  return <Screen contentStyle={styles.page}>
    <Text variant="headlineMedium" style={styles.title}>Welcome back</Text>
    <Text style={styles.copy}>Sign in to your BuildMate account.</Text>
    {!configured && <HelperText type="info" visible>Backend keys are not configured on this build yet. Use Explore demo from the home screen.</HelperText>}
    <TextInput label="Email" value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" />
    <TextInput label="Password" value={password} onChangeText={setPassword} secureTextEntry />
    <HelperText type="error" visible={Boolean(error)}>{error ?? ' '}</HelperText>
    <Button mode="contained" loading={busy} disabled={busy || !email || !password} onPress={submit}>Sign in</Button>
    <Button onPress={() => router.push('/(auth)/sign-up')}>Create an account</Button>
  </Screen>;
}
const styles = StyleSheet.create({ page: { maxWidth: 520, width: '100%', alignSelf: 'center', gap: 12, paddingTop: 42 }, title: { color: colours.ink, fontWeight: '800' }, copy: { color: colours.muted, marginBottom: 10 } });
