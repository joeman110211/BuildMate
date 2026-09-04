import { router } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Button, HelperText, SegmentedButtons, Text, TextInput } from 'react-native-paper';
import { Screen } from '@/native/components/Screen';
import { useAuth } from '@/native/auth';
import type { UserRole } from '@/native/types';
import { colours } from '@/native/theme';

export default function SignUp() {
  const { signUp, configured } = useAuth();
  const [role, setRole] = useState<UserRole>('customer');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const submit = async () => {
    setBusy(true); setMessage(null);
    const result = await signUp(name, email, password, role);
    setBusy(false);
    if (result.error) return setMessage(result.error);
    if (result.needsEmailConfirmation) return setMessage('Account created. Check your email to confirm it, then sign in.');
    router.replace('/(tabs)');
  };
  return <Screen contentStyle={styles.page}>
    <Text variant="headlineMedium" style={styles.title}>Join BuildMate</Text>
    <Text style={styles.copy}>Choose how you will use BuildMate. You can build the rest of your profile after signup.</Text>
    <SegmentedButtons value={role} onValueChange={(value) => setRole(value as UserRole)} buttons={[{ value: 'customer', label: 'Customer' }, { value: 'trader', label: 'Tradesperson' }]} />
    {!configured && <HelperText type="info" visible>Backend keys still need attaching to this native build. The UI can be explored in demo mode.</HelperText>}
    <TextInput label="Full name" value={name} onChangeText={setName} />
    <TextInput label="Email" value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" />
    <TextInput label="Password" value={password} onChangeText={setPassword} secureTextEntry />
    <HelperText type={message?.startsWith('Account created') ? 'info' : 'error'} visible={Boolean(message)}>{message ?? ' '}</HelperText>
    <Button mode="contained" loading={busy} disabled={busy || !name || !email || password.length < 8} onPress={submit}>Create account</Button>
    <View><Button onPress={() => router.push('/(auth)/sign-in')}>Already registered? Sign in</Button></View>
  </Screen>;
}
const styles = StyleSheet.create({ page: { maxWidth: 520, width: '100%', alignSelf: 'center', gap: 12, paddingTop: 42 }, title: { color: colours.ink, fontWeight: '800' }, copy: { color: colours.muted, marginBottom: 10 } });
