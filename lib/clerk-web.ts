export const clerkWebAppearance = {
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

export const clerkWebLocalization = {
  locale: 'en-GB',
  signIn: {
    start: {
      title: 'Sign in to BuildPair',
      subtitle: 'Welcome back. Use your email or a social account.',
    },
  },
  signUp: {
    start: {
      title: 'Create your BuildPair account',
      subtitle: 'Welcome. Fill in the details to get started.',
    },
  },
} as const;
