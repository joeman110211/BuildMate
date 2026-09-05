import { Stack } from 'expo-router';

export default function AuthLayout() {
  return <Stack screenOptions={{ headerTintColor: '#D35400', headerShadowVisible: false }}>
    <Stack.Screen name="account" options={{ title: 'Join BuildMate', headerBackVisible: false }} />
    <Stack.Screen name="sign-in" options={{ title: 'Sign in' }} />
    <Stack.Screen name="sign-up" options={{ title: 'Create account' }} />
    <Stack.Screen name="social-continue" options={{ title: 'Continue with BuildMate' }} />
    <Stack.Screen name="choose-role" options={{ title: 'Choose account mode', headerBackVisible: false }} />
  </Stack>;
}
