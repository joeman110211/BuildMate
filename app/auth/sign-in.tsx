import { useSignIn } from '@clerk/expo/legacy';
import { Link, useRouter } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Button, HelperText, SegmentedButtons, Text, TextInput } from 'react-native-paper';
import { Screen } from '@/components/Screen';
import { errorMessage } from '@/lib/api';

export default function SignInScreen() {
  const { isLoaded, signIn, setActive } = useSignIn();
  const router = useRouter();
  const [method, setMethod] = useState<'password' | 'phone'>('password');
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [code, setCode] = useState('');
  const [pendingPhone, setPendingPhone] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  async function finish(sessionId: string | null | undefined) {
    if (!setActive) throw new Error('Authentication is still loading');
    if (!sessionId) throw new Error('Sign-in did not create a session');
    await setActive({ session: sessionId });
    router.replace('/auth/choose-role');
  }

  async function submit() {
    if (!isLoaded || !signIn) return;
    try {
      setBusy(true); setError('');
      if (method === 'password') {
        const result = await signIn.create({ identifier: identifier.trim(), password });
        await finish(result.createdSessionId);
      } else if (!pendingPhone) {
        const result = await signIn.create({ identifier: identifier.trim() });
        const phoneFactor = result.supportedFirstFactors?.find((factor) => factor.strategy === 'phone_code') as { phoneNumberId?: string } | undefined;
        if (!phoneFactor?.phoneNumberId) throw new Error('SMS sign-in is not enabled for this account');
        await signIn.prepareFirstFactor({ strategy: 'phone_code', phoneNumberId: phoneFactor.phoneNumberId });
        setPendingPhone(true);
      } else {
        const result = await signIn.attemptFirstFactor({ strategy: 'phone_code', code });
        await finish(result.createdSessionId);
      }
    } catch (e) { setError(errorMessage(e)); } finally { setBusy(false); }
  }

  return <Screen title="Welcome back" subtitle="Sign in to post work, quote jobs and manage payments.">
    <SegmentedButtons value={method} onValueChange={(value) => { setMethod(value as typeof method); setPendingPhone(false); setError(''); }} buttons={[{ value: 'password', label: 'Email & password' }, { value: 'phone', label: 'Phone OTP' }]} />
    <TextInput label={method === 'password' ? 'Email address' : 'Mobile number (+44…)'} value={identifier} onChangeText={setIdentifier} autoCapitalize="none" keyboardType={method === 'password' ? 'email-address' : 'phone-pad'} mode="outlined" />
    {method === 'password' ? <TextInput label="Password" value={password} onChangeText={setPassword} secureTextEntry mode="outlined" /> : null}
    {pendingPhone ? <TextInput label="6-digit code" value={code} onChangeText={setCode} keyboardType="number-pad" mode="outlined" /> : null}
    <HelperText type="error" visible={Boolean(error)}>{error}</HelperText>
    <Button mode="contained" loading={busy} disabled={busy || !identifier || (method === 'password' && !password) || (pendingPhone && !code)} onPress={submit} contentStyle={styles.button}>
      {pendingPhone ? 'Verify code' : 'Continue'}
    </Button>
    <View style={styles.footer}><Text>New to BuildMate?</Text><Link href="/auth/sign-up" asChild><Button>Create account</Button></Link></View>
  </Screen>;
}

const styles = StyleSheet.create({ button: { minHeight: 48 }, footer: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', flexWrap: 'wrap' } });
