import { Stack } from 'expo-router';
import { BuildMateLogo } from '@/components/BuildMateLogo';
import { colors } from '@/constants/theme';

export default function AuthLayout() {
  return <Stack screenOptions={{
    headerTintColor: colors.primary,
    headerShadowVisible: false,
    headerTitleAlign: 'center',
    headerStyle: { backgroundColor: colors.surfaceRaised },
    headerTitle: () => <BuildMateLogo compact />,
    contentStyle: { backgroundColor: colors.background },
  }}>
    <Stack.Screen name="account" options={{ headerBackVisible: false }} />
    <Stack.Screen name="sign-in" />
    <Stack.Screen name="sign-up" />
    <Stack.Screen name="social-continue" />
    <Stack.Screen name="choose-role" options={{ headerBackVisible: false }} />
  </Stack>;
}
