import { SignIn } from '@clerk/expo/web';
import { View } from 'react-native';

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
  return (
    <View style={{ flex: 1, backgroundColor: '#FAFAFA' }}>
      <SignIn
        routing="path"
        path="/auth/sign-in"
        withSignUp
        signUpUrl="/auth/sign-up"
        forceRedirectUrl="/auth/choose-role"
        signUpForceRedirectUrl="/auth/choose-role"
        appearance={appearance}
      />
    </View>
  );
}
