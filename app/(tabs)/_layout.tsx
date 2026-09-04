import { Tabs } from 'expo-router';
import { colours } from '@/native/theme';

export default function TabsLayout() {
  return <Tabs screenOptions={{ headerStyle: { backgroundColor: colours.surface }, headerTintColor: colours.ink, tabBarActiveTintColor: colours.burnt, tabBarInactiveTintColor: colours.muted }}>
    <Tabs.Screen name="index" options={{ title: 'Home', headerTitle: 'BuildMate' }} />
    <Tabs.Screen name="jobs" options={{ title: 'Jobs', headerTitle: 'Jobs & Leads' }} />
    <Tabs.Screen name="messages" options={{ title: 'Messages' }} />
    <Tabs.Screen name="profile" options={{ title: 'Profile' }} />
  </Tabs>;
}
