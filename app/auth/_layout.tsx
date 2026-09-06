import { Stack, useRouter } from 'expo-router';
import { Pressable } from 'react-native';
import { BuildPairLogo } from '@/components/BuildPairLogo';
import { colors } from '@/constants/theme';

function AuthHeaderLogo() {
  const router = useRouter();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Go to BuildPair home"
      hitSlop={10}
      onPress={() => router.replace('/')}
    >
      <BuildPairLogo compact />
    </Pressable>
  );
}

export default function AuthLayout() {
  return <Stack screenOptions={{
    headerTintColor: colors.primary,
    headerShadowVisible: false,
    headerTitleAlign: 'center',
    headerStyle: { backgroundColor: colors.surfaceRaised },
    headerTitle: () => <AuthHeaderLogo />,
    contentStyle: { backgroundColor: colors.background },
  }}>
    <Stack.Screen name="account" options={{ headerBackVisible: false }} />
    <Stack.Screen name="sign-in" />
    <Stack.Screen name="sign-up" />
    <Stack.Screen name="sign-up/verify-email-address" />
    <Stack.Screen name="social-continue" />
    <Stack.Screen name="choose-role" options={{ headerBackVisible: false }} />
  </Stack>;
}
