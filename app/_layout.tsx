import { ClerkLoaded, ClerkProvider } from '@clerk/expo';
import { Stack } from 'expo-router';
import { PaperProvider } from 'react-native-paper';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
// Metro and TypeScript resolve the .native/.web implementation; ESLint's generic resolver does not.
// eslint-disable-next-line import/no-unresolved
import { AppStripeProvider } from '@/components/AppStripeProvider';
import { paperTheme } from '@/constants/theme';
import { tokenCache } from '@/lib/token-cache';

const publishableKey = process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY;

export default function RootLayout() {
  if (!publishableKey) throw new Error('EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY is missing. Copy .env.example to .env.');
  return (
    <ClerkProvider publishableKey={publishableKey} tokenCache={tokenCache}>
      <ClerkLoaded>
        <SafeAreaProvider>
          <PaperProvider theme={paperTheme}>
            <AppStripeProvider>
              <StatusBar style="dark" />
              <Stack screenOptions={{ headerTintColor: '#D35400', headerShadowVisible: false, contentStyle: { backgroundColor: '#FAFAFA' } }}>
                <Stack.Screen name="index" options={{ headerShown: false }} />
                <Stack.Screen name="(public)" options={{ headerShown: false }} />
                <Stack.Screen name="(auth)" options={{ headerShown: false }} />
                <Stack.Screen name="(customer)" options={{ headerShown: false }} />
                <Stack.Screen name="(trader)" options={{ headerShown: false }} />
              </Stack>
            </AppStripeProvider>
          </PaperProvider>
        </SafeAreaProvider>
      </ClerkLoaded>
    </ClerkProvider>
  );
}
