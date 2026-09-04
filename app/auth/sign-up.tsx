import { useSignUp } from '@clerk/expo/legacy';
import { Link, useRouter } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Button, HelperText, SegmentedButtons, Text, TextInput } from 'react-native-paper';
import { Screen } from '@/components/Screen';
import { errorMessage } from '@/lib/api';
import { normalizeUkMobile } from '@/lib/phone';

export default function SignUpScreen() {
  const { isLoaded, signUp, setActive } = useSignUp();
  const router = useRouter();
  const [method, setMethod] = useState<'password' | 'phone'>('password');
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [code, setCode] = useState('');
  const [verifying, setVerifying] = useState(false);
  const [verificationTarget, setVerificationTarget] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  async function submit() {
    if (!isLoaded || !signUp || !setActive) return;
    try {
      setBusy(true);
      setError('');

      if (!verifying) {
        if (method === 'password') {
          const email = identifier.trim().toLowerCase();
          await signUp.create({ emailAddress: email, password });
          await signUp.prepareEmailAddressVerification({ strategy: 'email_code' });
          setVerificationTarget(email);
        } else {
          const phoneNumber = normalizeUkMobile(identifier);
          await signUp.create({ phoneNumber });
          await signUp.preparePhoneNumberVerification({ strategy: 'phone_code' });
          setVerificationTarget(phoneNumber);
        }
        setCode('');
        setVerifying(true);
        return;
      }

      const result = method === 'password'
        ? await signUp.attemptEmailAddressVerification({ code: code.trim() })
        : await signUp.attemptPhoneNumberVerification({ code: code.trim() });

      if (result.status !== 'complete') {
        throw new Error('Verification was accepted, but account setup is still incomplete. Please try again.');
      }

      const sessionId = result.createdSessionId ?? signUp.createdSessionId;
      if (!sessionId) throw new Error('Account verified but no sign-in session was created');
      await setActive({ session: sessionId });
      router.replace('/auth/choose-role');
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setBusy(false);
    }
  }

  function changeMethod(value: string) {
    setMethod(value as typeof method);
    setVerifying(false);
    setVerificationTarget('');
    setCode('');
    setError('');
  }

  return <Screen title="Create your account" subtitle="Customers post work free. Tradespeople get a 14-day free trial before billing is required.">
    <SegmentedButtons value={method} onValueChange={changeMethod} buttons={[{ value: 'password', label: 'Email & password' }, { value: 'phone', label: 'Phone OTP' }]} />
    {!verifying ? <>
      <TextInput
        label={method === 'password' ? 'Email address' : 'UK mobile (07 / 447 / +447)'}
        value={identifier}
        onChangeText={setIdentifier}
        autoCapitalize="none"
        keyboardType={method === 'password' ? 'email-address' : 'phone-pad'}
        mode="outlined"
      />
      {method === 'phone' ? <HelperText type="info" visible>We accept 07911…, 447911… or +447911… and convert it automatically.</HelperText> : null}
      {method === 'password' ? <TextInput label="Password (8+ characters)" value={password} onChangeText={setPassword} secureTextEntry mode="outlined" /> : null}
      <View nativeID="clerk-captcha" />
    </> : <>
      <Text variant="bodyMedium">We sent a verification code to {verificationTarget || identifier}.</Text>
      <TextInput label="Verification code" value={code} onChangeText={setCode} keyboardType="number-pad" mode="outlined" />
    </>}
    <HelperText type="error" visible={Boolean(error)}>{error}</HelperText>
    <Button mode="contained" loading={busy} disabled={busy || (!verifying && (!identifier || (method === 'password' && password.length < 8))) || (verifying && !code.trim())} onPress={submit} contentStyle={styles.button}>
      {verifying ? 'Verify and continue' : 'Create account'}
    </Button>
    {verifying ? <Button disabled={busy} onPress={() => { setVerifying(false); setCode(''); setError(''); }}>Change details</Button> : null}
    <View style={styles.footer}><Text>Already registered?</Text><Link href="/auth/sign-in" asChild><Button>Sign in</Button></Link></View>
  </Screen>;
}

const styles = StyleSheet.create({ button: { minHeight: 48 }, footer: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', flexWrap: 'wrap' } });
