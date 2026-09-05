import { Stack } from 'expo-router';
import { BuildPairLogo } from '@/components/BuildPairLogo';
import { colors } from '@/constants/theme';

export default function AuthLayout() {
  return <Stack screenOptions={{
    headerTintColor: colors.primary,
    headerShadowVisible: false,
    headerTitleAlign: 'center',
    headerStyle: { backgroundColor: colors.surfaceRaised },
    headerTitle: () => <BuildPairLogo compact />,
    contentStyle: { backgroundColor: colors.background },
  }}>
    <Stack.Screen name="account" options={{ headerBackVisible: false }} />
    <Stack.Screen name="sign-in" />
    <Stack.Screen name="sign-up" />
    <Stack.Screen name="social-continue" />
    <Stack.Screen name="choose-role" options={{ headerBackVisible: false }} />
  </Stack>;
}
