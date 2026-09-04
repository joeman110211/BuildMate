import { useSSO } from '@clerk/expo';
import type { OAuthStrategy } from '@clerk/expo/types';
import * as AuthSession from 'expo-auth-session';
import { useRouter } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
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

      // Clerk's Expo SSO flow expects a concrete callback URL. On web this resolves
      // to the current BuildMate origin; on Android/iOS it resolves to buildmate://.
      const redirectUrl = AuthSession.makeRedirectUri({
        scheme: 'buildmate',
        path: 'auth/social-continue',
      });

      const { createdSessionId, setActive } = await startSSOFlow({
        strategy,
        redirectUrl,
      });

      if (createdSessionId && setActive) {
        await setActive({
          session: createdSessionId,
          navigate: async ({ session }) => {
            if (session?.currentTask) {
              router.replace('/auth/social-continue');
              return;
            }
            router.replace('/auth/choose-role');
          },
        });
        return;
      }

      // A first-time social user commonly has no existing Clerk account yet.
      // Clerk preserves the in-progress flow so the continuation screen can
      // transfer SignIn -> SignUp and finish creating the account.
      router.replace('/auth/social-continue');
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
