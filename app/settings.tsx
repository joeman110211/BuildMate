import { useAuth } from '@clerk/expo';
import { UserProfileView } from '@clerk/expo/native';
import { Redirect, Stack, useRouter } from 'expo-router';

export default function SettingsScreen() {
  const router = useRouter();
  const { isLoaded, isSignedIn } = useAuth({ treatPendingAsSignedOut: false });

  if (!isLoaded) return null;
  if (!isSignedIn) return <Redirect href="/auth/account" />;

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <UserProfileView
        isDismissible={false}
        onHostBack={() => router.back()}
        style={{ flex: 1 }}
      />
    </>
  );
}
