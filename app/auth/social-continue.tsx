import { useClerk, useSignIn, useSignUp } from '@clerk/expo';
import { useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Button, HelperText, Text, TextInput } from 'react-native-paper';
import { Screen } from '@/components/Screen';
import { errorMessage } from '@/lib/api';

type Stage = 'working' | 'requirements' | 'email-code' | 'blocked';

export default function SocialContinueScreen() {
  const clerk = useClerk();
  const router = useRouter();
  const { signIn, fetchStatus: signInFetchStatus } = useSignIn();
  const { signUp, fetchStatus: signUpFetchStatus } = useSignUp();
  const started = useRef(false);
  const [stage, setStage] = useState<Stage>('working');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [error, setError] = useState('');

  const busy = signInFetchStatus === 'fetching' || signUpFetchStatus === 'fetching';
  const missing = (signUp.missingFields ?? []).map(String);
  const needsFirstName = missing.includes('first_name');
  const needsLastName = missing.includes('last_name');
  const needsEmail = missing.includes('email_address') || missing.includes('email_address_or_phone_number');

  async function navigateAfterAuth(session: { currentTask?: { key?: unknown } | null } | null | undefined) {
    if (session?.currentTask) {
      setStage('blocked');
      setError(`Your account needs another security step before BuildMate can continue (${String(session.currentTask.key ?? 'session task')}).`);
      return;
    }
    router.replace('/auth/choose-role');
  }

  async function finalizeSignIn() {
    await signIn.finalize({ navigate: async ({ session }) => navigateAfterAuth(session) });
  }

  async function finalizeSignUp() {
    await signUp.finalize({ navigate: async ({ session }) => navigateAfterAuth(session) });
  }

  async function handleSignUpRequirements() {
    const unverified = (signUp.unverifiedFields ?? []).map(String);
    if (unverified.includes('email_address')) {
      const sent = await signUp.verifications.sendEmailCode();
      if (sent.error) throw sent.error;
      setStage('email-code');
      return;
    }
    setStage('requirements');
  }

  async function advanceFlow() {
    try {
      setError('');

      if (signIn.status === 'complete') {
        await finalizeSignIn();
        return;
      }

      // OAuth can start as sign-up but discover that the account already exists.
      if (signUp.isTransferable) {
        const transferred = await signIn.create({ transfer: true });
        if (transferred.error) throw transferred.error;
        const transferredSignInStatus = signIn.status as typeof signIn.status | 'complete';
        if (transferredSignInStatus === 'complete') {
          await finalizeSignIn();
          return;
        }
      }

      // This is the important case from the reported needs_identifier error:
      // a social sign-in for someone who does not have a BuildMate account yet.
      if (signIn.isTransferable) {
        const transferred = await signUp.create({ transfer: true });
        if (transferred.error) throw transferred.error;
        const transferredSignUpStatus = signUp.status as typeof signUp.status | 'complete';
        if (transferredSignUpStatus === 'complete') {
          await finalizeSignUp();
          return;
        }
      }

      if (signUp.status === 'complete') {
        await finalizeSignUp();
        return;
      }

      if (signUp.status === 'missing_requirements') {
        await handleSignUpRequirements();
        return;
      }

      const existingSessionId = signIn.existingSession?.sessionId ?? signUp.existingSession?.sessionId;
      if (existingSessionId) {
        await clerk.setActive({
          session: existingSessionId,
          navigate: async ({ session }) => navigateAfterAuth(session),
        });
        return;
      }

      setStage('blocked');
      setError(`Clerk could not complete this social login. Sign-in status: ${String(signIn.status)}; sign-up status: ${String(signUp.status)}.`);
    } catch (e) {
      setStage('blocked');
      setError(errorMessage(e));
    }
  }

  useEffect(() => {
    if (!clerk.loaded || started.current) return;
    started.current = true;
    void advanceFlow();
    // This flow intentionally runs once after Clerk restores the OAuth attempt.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clerk.loaded]);

  async function submitRequirements() {
    try {
      setError('');
      const values: { emailAddress?: string; firstName?: string; lastName?: string } = {};
      if (needsEmail) values.emailAddress = email.trim().toLowerCase();
      if (needsFirstName) values.firstName = firstName.trim();
      if (needsLastName) values.lastName = lastName.trim();

      const result = await signUp.update(values);
      if (result.error) throw result.error;

      if (signUp.status === 'complete') {
        await finalizeSignUp();
        return;
      }

      const unverified = (signUp.unverifiedFields ?? []).map(String);
      if (unverified.includes('email_address')) {
        const sent = await signUp.verifications.sendEmailCode();
        if (sent.error) throw sent.error;
        setCode('');
        setStage('email-code');
        return;
      }

      if (signUp.status === 'missing_requirements') {
        setStage('requirements');
        setError(`A little more information is required: ${(signUp.missingFields ?? []).map(String).join(', ')}.`);
        return;
      }

      throw new Error(`Social sign-up is incomplete (${String(signUp.status)}).`);
    } catch (e) {
      setError(errorMessage(e));
    }
  }

  async function verifyEmail() {
    try {
      setError('');
      const result = await signUp.verifications.verifyEmailCode({ code: code.trim() });
      if (result.error) throw result.error;
      if (signUp.status === 'complete') {
        await finalizeSignUp();
        return;
      }
      if (signUp.status === 'missing_requirements') {
        setStage('requirements');
        return;
      }
      throw new Error(`Email was verified but account setup is incomplete (${String(signUp.status)}).`);
    } catch (e) {
      setError(errorMessage(e));
    }
  }

  if (stage === 'working') {
    return <Screen title="Finishing sign in" subtitle="Connecting your social account to BuildMate…"><Text>Please wait…</Text><View nativeID="clerk-captcha" /></Screen>;
  }

  if (stage === 'email-code') {
    return (
      <Screen title="Verify your email" subtitle={`Enter the code Clerk sent to ${signUp.emailAddress ?? email}.`}>
        <TextInput label="Verification code" value={code} onChangeText={setCode} keyboardType="number-pad" autoComplete="one-time-code" mode="outlined" />
        <HelperText type="error" visible={Boolean(error)}>{error}</HelperText>
        <Button mode="contained" loading={busy} disabled={busy || !code.trim()} onPress={() => void verifyEmail()} contentStyle={styles.button}>Verify and continue</Button>
        <View nativeID="clerk-captcha" />
      </Screen>
    );
  }

  if (stage === 'requirements') {
    const canSubmit = (!needsEmail || Boolean(email.trim())) && (!needsFirstName || Boolean(firstName.trim())) && (!needsLastName || Boolean(lastName.trim()));
    return (
      <Screen title="Finish creating your account" subtitle="Your social account connected. Clerk just needs the missing details below.">
        {needsEmail ? <TextInput label="Email address" value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" autoComplete="email" mode="outlined" /> : null}
        {needsFirstName ? <TextInput label="First name" value={firstName} onChangeText={setFirstName} autoCapitalize="words" mode="outlined" /> : null}
        {needsLastName ? <TextInput label="Last name" value={lastName} onChangeText={setLastName} autoCapitalize="words" mode="outlined" /> : null}
        <HelperText type="error" visible={Boolean(error)}>{error}</HelperText>
        <Button mode="contained" loading={busy} disabled={busy || !canSubmit} onPress={() => void submitRequirements()} contentStyle={styles.button}>Continue</Button>
        <View nativeID="clerk-captcha" />
      </Screen>
    );
  }

  return (
    <Screen title="Couldn't finish sign in" subtitle="The social provider returned, but Clerk still needs another authentication step.">
      <HelperText type="error" visible>{error || 'Please return to sign in and try again.'}</HelperText>
      <Button mode="contained" onPress={() => router.replace('/auth/sign-in')}>Back to sign in</Button>
    </Screen>
  );
}

const styles = StyleSheet.create({ button: { minHeight: 48 } });
