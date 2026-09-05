import { SignUp } from '@clerk/expo/web';
import { useLocalSearchParams } from 'expo-router';
import { View } from 'react-native';
import { Text } from 'react-native-paper';
import { modeSetupHref, parseAccountMode, signInHref } from '@/lib/account-mode';

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

export default function SignUpWebScreen() {
  const params = useLocalSearchParams<{ mode?: string | string[] }>();
  const mode = parseAccountMode(params.mode);
  const redirectUrl = String(modeSetupHref(mode));
  const loginUrl = mode ? String(signInHref(mode)) : '/auth/account';
  const title = mode === 'trader' ? '🔨 Create Tradesperson Account' : mode === 'customer' ? '🏠 Create Homeowner Account' : 'Create your BuildPair account';

  return (
    <View style={{ flex: 1, backgroundColor: '#FAFAFA', paddingTop: 16 }}>
      <Text variant="headlineSmall" style={{ textAlign: 'center', fontWeight: '800' }}>{title}</Text>
      <SignUp
        routing="path"
        path="/auth/sign-up"
        signInUrl={loginUrl}
        forceRedirectUrl={redirectUrl}
        signInForceRedirectUrl={redirectUrl}
        appearance={appearance}
      />
    </View>
  );
}
