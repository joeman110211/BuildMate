import { SignIn } from '@clerk/expo/web';
import { useLocalSearchParams } from 'expo-router';
import { View } from 'react-native';
import { Text } from 'react-native-paper';
import { colors } from '@/constants/theme';
import { modeSetupHref, parseAccountMode, signUpHref } from '@/lib/account-mode';
import { clerkWebAppearance } from '@/lib/clerk-web';

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
        appearance={clerkWebAppearance}
      />
    </View>
  );
}
