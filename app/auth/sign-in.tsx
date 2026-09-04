import { useSignIn } from '@clerk/expo/legacy';
import { Link, useRouter } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Button, HelperText, SegmentedButtons, Text, TextInput } from 'react-native-paper';
import { Screen } from '@/components/Screen';
import { errorMessage } from '@/lib/api';
import { normalizeUkMobile } from '@/lib/phone';

export default function SignInScreen() {
  const { isLoaded, signIn, setActive } = useSignIn();
  const router = useRouter();
  const [method, setMethod] = useState<'password' | 'phone'>('password');
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [code, setCode] = useState('');
  const [pendingPhone, setPendingPhone] = useState(false);
  const [pendingEmailCode, setPendingEmailCode] = useState(false);
  const [verificationTarget, setVerificationTarget] = useState('');
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
      setBusy(true);
      setError('');

      if (pendingEmailCode) {
        const result = await signIn.attemptSecondFactor({ strategy: 'email_code', code: code.trim() });
        if (result.status !== 'complete') throw new Error('Email verification is incomplete');
        await finish(result.createdSessionId);
        return;
      }

      if (method === 'password') {
        const email = identifier.trim().toLowerCase();
        const result = await signIn.create({ identifier: email, password });
        if (result.status === 'complete') {
          await finish(result.createdSessionId);
          return;
        }

        if (result.status === 'needs_second_factor') {
          const emailFactor = result.supportedSecondFactors?.find((factor) => factor.strategy === 'email_code') as { emailAddressId?: string; safeIdentifier?: string } | undefined;
          if (!emailFactor?.emailAddressId) throw new Error('This sign-in needs verification, but no email verification method is available');
          await signIn.prepareSecondFactor({ strategy: 'email_code', emailAddressId: emailFactor.emailAddressId });
          setVerificationTarget(emailFactor.safeIdentifier ?? email);
          setCode('');
          setPendingEmailCode(true);
          return;
        }

        throw new Error(`Sign-in needs an additional step (${result.status ?? 'unknown status'})`);
      }

      if (!pendingPhone) {
        const phoneNumber = normalizeUkMobile(identifier);
        const result = await signIn.create({ identifier: phoneNumber });
        const phoneFactor = result.supportedFirstFactors?.find((factor) => factor.strategy === 'phone_code') as { phoneNumberId?: string; safeIdentifier?: string } | undefined;
        if (!phoneFactor?.phoneNumberId) throw new Error('SMS sign-in is not enabled for this account');
        await signIn.prepareFirstFactor({ strategy: 'phone_code', phoneNumberId: phoneFactor.phoneNumberId });
        setVerificationTarget(phoneFactor.safeIdentifier ?? phoneNumber);
        setCode('');
        setPendingPhone(true);
        return;
      }

      const result = await signIn.attemptFirstFactor({ strategy: 'phone_code', code: code.trim() });
      if (result.status !== 'complete') throw new Error('Phone verification is incomplete');
      await finish(result.createdSessionId);
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setBusy(false);
    }
  }

  function changeMethod(value: string) {
    setMethod(value as typeof method);
    setPendingPhone(false);
    setPendingEmailCode(false);
    setVerificationTarget('');
    setCode('');
    setError('');
  }

  const waitingForCode = pendingPhone || pendingEmailCode;

  return <Screen title="Welcome back" subtitle="Sign in to post work, quote jobs and manage payments.">
    <SegmentedButtons value={method} onValueChange={changeMethod} buttons={[{ value: 'password', label: 'Email & password' }, { value: 'phone', label: 'Phone OTP' }]} />
    {!waitingForCode ? <>
      <TextInput
        label={method === 'password' ? 'Email address' : 'UK mobile (07 / 447 / +447)'}
        value={identifier}
        onChangeText={setIdentifier}
        autoCapitalize="none"
        keyboardType={method === 'password' ? 'email-address' : 'phone-pad'}
        mode="outlined"
      />
      {method === 'phone' ? <HelperText type="info" visible>We accept 07911…, 447911… or +447911… and convert it automatically.</HelperText> : null}
      {method === 'password' ? <TextInput label="Password" value={password} onChangeText={setPassword} secureTextEntry mode="outlined" /> : null}
    </> : <>
      <Text variant="bodyMedium">Enter the verification code sent to {verificationTarget || identifier}.</Text>
      <TextInput label="Verification code" value={code} onChangeText={setCode} keyboardType="number-pad" mode="outlined" />
    </>}
    <HelperText type="error" visible={Boolean(error)}>{error}</HelperText>
    <Button mode="contained" loading={busy} disabled={busy || (!waitingForCode && !identifier) || (!waitingForCode && method === 'password' && !password) || (waitingForCode && !code.trim())} onPress={submit} contentStyle={styles.button}>
      {waitingForCode ? 'Verify and sign in' : 'Continue'}
    </Button>
    {waitingForCode ? <Button disabled={busy} onPress={() => { setPendingPhone(false); setPendingEmailCode(false); setCode(''); setError(''); }}>Back</Button> : null}
    <View style={styles.footer}><Text>New to BuildMate?</Text><Link href="/auth/sign-up" asChild><Button>Create account</Button></Link></View>
  </Screen>;
}

const styles = StyleSheet.create({ button: { minHeight: 48 }, footer: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', flexWrap: 'wrap' } });
