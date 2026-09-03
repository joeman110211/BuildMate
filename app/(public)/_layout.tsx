import { Stack } from 'expo-router';
import { View } from 'react-native';
import { PublicHeader } from '@/components/PublicHeader';

export default function PublicLayout() {
  return <View style={{ flex: 1 }}><PublicHeader /><Stack screenOptions={{ headerShown: false }} /></View>;
}
