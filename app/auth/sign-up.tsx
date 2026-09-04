import { useSignUp } from '@clerk/expo/legacy';
import { Link, useRouter } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Button, HelperText, SegmentedButtons, Text, TextInput } from 'react-native-paper';
import { Screen } from '@/components/Screen';
import { errorMessage } from '@/lib/api';

export default function SignUpScreen() {
  const { isLoaded, signUp, setActive } = useSignUp();
  const router = useRouter();
  const [method, setMethod] = useState<'password' | 'phone'>('password');
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [code, setCode] = useState('');
  const [verifying, setVerifying] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  async function submit() {
    if (!isLoaded || !signUp) return;
    try {
      setBusy(true); setError('');
      if (!verifying) {
        if (method === 'password') {
          await signUp.create({ emailAddress: identifier.trim(), password });
          await signUp.prepareEmailAddressVerification({ strategy: 'email_code' });
        } else {
          await signUp.create({ phoneNumber: identifier.trim() });
          await signUp.preparePhoneNumberVerification({ strategy: 'phone_code' });
        }
        setVerifying(true);
      } else {
        const result = method === 'password'
          ? await signUp.attemptEmailAddressVerification({ code })
          : await signUp.attemptPhoneNumberVerification({ code });
        if (!result.createdSessionId) throw new Error('Verification is incomplete');
        await setActive({ session: result.createdSessionId });
        router.replace('/auth/choose-role');
      }
    } catch (e) { setError(errorMessage(e)); } finally { setBusy(false); }
  }

  return <Screen title="Create your account" subtitle="Customers post work free. Tradespeople can start on the free profile tier.">
    <SegmentedButtons value={method} onValueChange={(value) => { setMethod(value as typeof method); setVerifying(false); setError(''); }} buttons={[{ value: 'password', label: 'Email & password' }, { value: 'phone', label: 'Phone OTP' }]} />
    {!verifying ? <>
      <TextInput label={method === 'password' ? 'Email address' : 'Mobile number (+44…)'} value={identifier} onChangeText={setIdentifier} autoCapitalize="none" keyboardType={method === 'password' ? 'email-address' : 'phone-pad'} mode="outlined" />
      {method === 'password' ? <TextInput label="Password (8+ characters)" value={password} onChangeText={setPassword} secureTextEntry mode="outlined" /> : null}
      <View nativeID="clerk-captcha" />
    </> : <>
      <Text variant="bodyMedium">We sent a verification code to {identifier}.</Text>
      <TextInput label="Verification code" value={code} onChangeText={setCode} keyboardType="number-pad" mode="outlined" />
    </>}
    <HelperText type="error" visible={Boolean(error)}>{error}</HelperText>
    <Button mode="contained" loading={busy} disabled={busy || (!verifying && (!identifier || (method === 'password' && password.length < 8))) || (verifying && !code)} onPress={submit} contentStyle={styles.button}>
      {verifying ? 'Verify and continue' : 'Create account'}
    </Button>
    <View style={styles.footer}><Text>Already registered?</Text><Link href="/auth/sign-in" asChild><Button>Sign in</Button></Link></View>
  </Screen>;
}

const styles = StyleSheet.create({ button: { minHeight: 48 }, footer: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', flexWrap: 'wrap' } });
