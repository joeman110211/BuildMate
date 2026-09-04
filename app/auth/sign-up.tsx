import { useSignUp } from '@clerk/expo';
import { Link, useRouter } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Button, HelperText, Text, TextInput } from 'react-native-paper';
import { Screen } from '@/components/Screen';
import { SocialAuthButtons } from '@/components/SocialAuthButtons';
import { errorMessage } from '@/lib/api';

export default function SignUpScreen() {
  const { signUp, fetchStatus } = useSignUp();
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [code, setCode] = useState('');
  const [verifying, setVerifying] = useState(false);
  const [error, setError] = useState('');

  const busy = fetchStatus === 'fetching';

  async function startEmailSignUp() {
    try {
      setError('');
      const emailAddress = email.trim().toLowerCase();
      const result = await signUp.password({ emailAddress, password });
      if (result.error) throw result.error;
      await signUp.verifications.sendEmailCode();
      setCode('');
      setVerifying(true);
    } catch (e) {
      setError(errorMessage(e));
    }
  }

  async function verifyEmail() {
    try {
      setError('');
      await signUp.verifications.verifyEmailCode({ code: code.trim() });

      if (signUp.status !== 'complete') {
        const missing = signUp.missingFields?.join(', ');
        throw new Error(missing ? `Account verification still needs: ${missing}.` : `Account verification is incomplete (${signUp.status}).`);
      }

      await signUp.finalize({
        navigate: async ({ session }) => {
          if (session?.currentTask) {
            throw new Error(`Account needs another setup step before continuing (${session.currentTask.key}).`);
          }
          router.replace('/auth/choose-role');
        },
      });
    } catch (e) {
      setError(errorMessage(e));
    }
  }

  async function resendCode() {
    try {
      setError('');
      await signUp.verifications.sendEmailCode();
    } catch (e) {
      setError(errorMessage(e));
    }
  }

  if (verifying) {
    return (
      <Screen title="Verify your email" subtitle={`We sent a 6-digit code to ${email.trim().toLowerCase()}.`}>
        <TextInput
          label="Verification code"
          value={code}
          onChangeText={setCode}
          keyboardType="number-pad"
          autoComplete="one-time-code"
          mode="outlined"
        />
        <HelperText type="error" visible={Boolean(error)}>{error}</HelperText>
        <Button mode="contained" loading={busy} disabled={busy || !code.trim()} onPress={() => void verifyEmail()} contentStyle={styles.button}>
          Verify and continue
        </Button>
        <Button disabled={busy} onPress={() => void resendCode()}>Send another code</Button>
        <Button disabled={busy} onPress={() => { signUp.reset(); setVerifying(false); setCode(''); setError(''); }}>Change email</Button>
      </Screen>
    );
  }

  return (
    <Screen title="Create your account" subtitle="Customers post work free. Tradespeople get a 14-day free trial before billing is required.">
      <SocialAuthButtons onError={setError} />
      <TextInput
        label="Email address"
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        keyboardType="email-address"
        autoComplete="email"
        mode="outlined"
      />
      <TextInput
        label="Password"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        autoComplete="new-password"
        mode="outlined"
      />
      <Text variant="bodySmall" style={styles.hint}>Use at least 8 characters. Clerk also checks passwords against known data breaches.</Text>
      <View nativeID="clerk-captcha" />
      <HelperText type="error" visible={Boolean(error)}>{error}</HelperText>
      <Button
        mode="contained"
        loading={busy}
        disabled={busy || !email.trim() || password.length < 8}
        onPress={() => void startEmailSignUp()}
        contentStyle={styles.button}
      >
        Create account with email
      </Button>
      <View style={styles.footer}>
        <Text>Already registered?</Text>
        <Link href="/auth/sign-in" asChild><Button>Sign in</Button></Link>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  button: { minHeight: 48 },
  hint: { opacity: 0.7, marginTop: -4 },
  footer: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', flexWrap: 'wrap' },
});
