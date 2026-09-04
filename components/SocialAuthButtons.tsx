import { useSSO } from '@clerk/expo';
import type { OAuthStrategy } from '@clerk/expo/types';
import * as AuthSession from 'expo-auth-session';
import { useRouter } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import { useState } from 'react';
import { Platform, StyleSheet, View } from 'react-native';
import { Button, Divider, Text } from 'react-native-paper';
import { errorMessage } from '@/lib/api';

WebBrowser.maybeCompleteAuthSession();

type Props = {
  onError: (message: string) => void;
};

const providers: Array<{ strategy: OAuthStrategy; label: string }> = [
  { strategy: 'oauth_google', label: 'Continue with Google' },
  { strategy: 'oauth_facebook', label: 'Continue with Facebook' },
];

export function SocialAuthButtons({ onError }: Props) {
  const { startSSOFlow } = useSSO();
  const router = useRouter();
  const [loadingStrategy, setLoadingStrategy] = useState<OAuthStrategy | null>(null);

  async function continueWith(strategy: OAuthStrategy) {
    try {
      setLoadingStrategy(strategy);
      onError('');

      const redirectUrl = Platform.OS === 'web'
        ? undefined
        : AuthSession.makeRedirectUri({ scheme: 'buildmate', path: 'auth/sign-in' });

      const { createdSessionId, setActive, signIn, signUp } = await startSSOFlow({
        strategy,
        ...(redirectUrl ? { redirectUrl } : {}),
      });

      if (!createdSessionId || !setActive) {
        const status = signIn?.status ?? signUp?.status ?? 'incomplete';
        throw new Error(`Social sign-in returned without a usable session (${status}).`);
      }

      await setActive({ session: createdSessionId });
      router.replace('/auth/choose-role');
    } catch (error) {
      onError(errorMessage(error));
    } finally {
      setLoadingStrategy(null);
    }
  }

  return (
    <View style={styles.container}>
      {providers.map((provider) => (
        <Button
          key={provider.strategy}
          mode="outlined"
          loading={loadingStrategy === provider.strategy}
          disabled={loadingStrategy !== null}
          onPress={() => void continueWith(provider.strategy)}
          contentStyle={styles.button}
        >
          {provider.label}
        </Button>
      ))}
      <View style={styles.orRow}>
        <Divider style={styles.divider} />
        <Text variant="bodySmall" style={styles.orText}>or use email</Text>
        <Divider style={styles.divider} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: 10 },
  button: { minHeight: 48 },
  orRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginVertical: 4 },
  divider: { flex: 1 },
  orText: { opacity: 0.65 },
});
