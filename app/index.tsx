import { Redirect } from 'expo-router';

const authConfigured = Boolean(process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY);

export default function Index() {
  return <Redirect href={authConfigured ? '/auth/account' : '/(public)/directory'} />;
}
