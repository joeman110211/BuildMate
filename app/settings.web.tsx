import { useAuth } from '@clerk/expo';
import { UserProfile } from '@clerk/expo/web';
import { Redirect, Stack, useRouter } from 'expo-router';
import { StyleSheet, View } from 'react-native';
import { Button, Text } from 'react-native-paper';
import { colors } from '@/constants/theme';

export default function SettingsScreen() {
  const router = useRouter();
  const { isLoaded, isSignedIn } = useAuth({ treatPendingAsSignedOut: false });

  if (!isLoaded) return null;
  if (!isSignedIn) return <Redirect href="/auth/account" />;

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={styles.page}>
        <View style={styles.topbar}>
          <Button icon="arrow-left" onPress={() => router.back()}>Back to BuildPair</Button>
          <Text variant="titleLarge" style={styles.title}>Account & security</Text>
        </View>
        <UserProfile />
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  page: {
    flex: 1,
    minHeight: 0,
    padding: 20,
    gap: 16,
    alignItems: 'center',
    backgroundColor: colors.background,
  },
  topbar: {
    width: '100%',
    maxWidth: 980,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  title: { color: colors.charcoal, fontWeight: '900' },
});
