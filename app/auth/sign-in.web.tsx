import { SignIn } from '@clerk/expo/web';
import { useLocalSearchParams } from 'expo-router';
import { View } from 'react-native';
import { Text } from 'react-native-paper';
import { modeSetupHref, parseAccountMode, signUpHref } from '@/lib/account-mode';

const appearance = {
  variables: {
    colorPrimary: '#D35400',
    borderRadius: '14px',
  },
  elements: {
    rootBox: { width: '100%', alignItems: 'flex-start', justifyContent: 'flex-start' },
    cardBox: { width: '100%', boxShadow: 'none' },
    card: { width: '100%', maxWidth: '480px', margin: '8px auto 24px', boxShadow: 'none', border: '1px solid #E5E7EB' },
  },
} as const;

export default function SignInWebScreen() {
  const params = useLocalSearchParams<{ mode?: string | string[] }>();
  const mode = parseAccountMode(params.mode);
  const redirectUrl = String(modeSetupHref(mode));
  const createUrl = mode ? String(signUpHref(mode)) : '/auth/account';
  const title = mode === 'trader' ? '🔨 Tradesperson Sign In' : mode === 'customer' ? '🏠 Homeowner Sign In' : 'Sign in to BuildMate';

  return (
    <View style={{ flex: 1, backgroundColor: '#FAFAFA', paddingTop: 16 }}>
      <Text variant="headlineSmall" style={{ textAlign: 'center', fontWeight: '800' }}>{title}</Text>
      <SignIn
        routing="path"
        path="/auth/sign-in"
        withSignUp
        signUpUrl={createUrl}
        forceRedirectUrl={redirectUrl}
        signUpForceRedirectUrl={redirectUrl}
        appearance={appearance}
      />
    </View>
  );
}
