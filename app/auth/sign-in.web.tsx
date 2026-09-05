import { SignIn } from '@clerk/expo/web';
import { useLocalSearchParams } from 'expo-router';
import { View } from 'react-native';
import { Text } from 'react-native-paper';
import { colors } from '@/constants/theme';
import { modeSetupHref, parseAccountMode, signUpHref } from '@/lib/account-mode';

const appearance = {
  variables: {
    colorPrimary: '#D35400',
    colorBackground: '#FFFFFF',
    colorText: '#20252B',
    colorTextSecondary: '#66707C',
    colorInputBackground: '#F8F9FA',
    colorInputText: '#20252B',
    borderRadius: '16px',
  },
  elements: {
    rootBox: { width: '100%', alignItems: 'flex-start', justifyContent: 'flex-start' },
    cardBox: { width: '100%', boxShadow: 'none' },
    card: { width: '100%', maxWidth: '480px', margin: '10px auto 28px', boxShadow: '0 8px 28px rgba(37,42,49,0.08)', border: '1px solid #D4D9DE' },
    formButtonPrimary: { minHeight: '48px', fontWeight: '800' },
    socialButtonsBlockButton: { minHeight: '46px', borderColor: '#D4D9DE', backgroundColor: '#F8F9FA' },
  },
} as const;

export default function SignInWebScreen() {
  const params = useLocalSearchParams<{ mode?: string | string[] }>();
  const mode = parseAccountMode(params.mode);
  const redirectUrl = String(modeSetupHref(mode));
  const createUrl = mode ? String(signUpHref(mode)) : '/auth/account';
  const title = mode === 'trader' ? '🔨 Tradesperson Sign In' : mode === 'customer' ? '🏠 Homeowner Sign In' : 'Sign in to BuildPair';

  return (
    <View style={{ flex: 1, backgroundColor: colors.background, paddingTop: 18, paddingHorizontal: 12 }}>
      <Text variant="headlineSmall" style={{ textAlign: 'center', fontWeight: '900', color: colors.charcoal }}>{title}</Text>
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
