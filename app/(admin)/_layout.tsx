import { Stack } from 'expo-router';

export default function AdminLayout() {
  return <Stack screenOptions={{ headerTintColor: '#D35400', headerShadowVisible: false }}><Stack.Screen name="moderation" options={{ title: 'Moderation' }} /></Stack>;
}
