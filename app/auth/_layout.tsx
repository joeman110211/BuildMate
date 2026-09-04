import { Stack } from 'expo-router';

export default function AuthLayout() {
  return <Stack screenOptions={{ headerTintColor: '#D35400', headerShadowVisible: false }}>
    <Stack.Screen name="sign-in" options={{ title: 'Sign in' }} />
    <Stack.Screen name="sign-up" options={{ title: 'Create account' }} />
    <Stack.Screen name="choose-role" options={{ title: 'Choose account type', headerBackVisible: false }} />
  </Stack>;
}
