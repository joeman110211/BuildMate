import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { PaperProvider } from 'react-native-paper';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider } from '@/native/auth';
import { buildMateTheme } from '@/native/theme';

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <PaperProvider theme={buildMateTheme}>
        <AuthProvider>
          <StatusBar style="dark" />
          <Stack screenOptions={{ headerShown: false }} />
        </AuthProvider>
      </PaperProvider>
    </SafeAreaProvider>
  );
}
