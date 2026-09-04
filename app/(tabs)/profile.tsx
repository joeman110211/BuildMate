import { router } from 'expo-router';
import { StyleSheet } from 'react-native';
import { Button, Card, Text } from 'react-native-paper';
import { Screen } from '@/native/components/Screen';
import { useAuth } from '@/native/auth';
import { colours } from '@/native/theme';

export default function ProfileScreen() {
  const { profile, session, signOut } = useAuth();
  return <Screen>
    <Text variant="headlineSmall" style={styles.title}>Profile</Text>
    <Card style={styles.card}><Card.Title title={profile?.full_name ?? 'Demo account'} subtitle={profile?.role === 'trader' ? 'Tradesperson' : 'Customer'} /><Card.Content><Text>{profile?.email ?? session?.user.email ?? 'No live account connected in demo mode'}</Text></Card.Content></Card>
    {profile?.role === 'trader' && <Card style={styles.card}><Card.Title title="Business subscription" subtitle="Standard / Premium controls will live here" /></Card>}
    {session ? <Button mode="outlined" onPress={async () => { await signOut(); router.replace('/'); }}>Sign out</Button> : <Button mode="contained" onPress={() => router.replace('/(auth)/sign-in')}>Sign in to a real account</Button>}
  </Screen>;
}
const styles = StyleSheet.create({ title: { color: colours.ink, fontWeight: '800', marginBottom: 16 }, card: { backgroundColor: colours.surface, marginBottom: 12 } });
