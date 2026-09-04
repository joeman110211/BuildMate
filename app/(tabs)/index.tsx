import { router } from 'expo-router';
import { StyleSheet, View } from 'react-native';
import { Button, Card, Chip, Text } from 'react-native-paper';
import { Screen } from '@/native/components/Screen';
import { useAuth } from '@/native/auth';
import { colours } from '@/native/theme';

export default function Dashboard() {
  const { profile, session } = useAuth();
  const role = profile?.role ?? 'customer';
  const name = profile?.full_name?.split(' ')[0] ?? 'Joe';
  return <Screen>
    <Text variant="headlineMedium" style={styles.title}>{session ? `Hi ${name}` : 'BuildMate demo'}</Text>
    <Text style={styles.copy}>{role === 'trader' ? 'Your local leads, quotes and business activity.' : 'Keep your projects, quotes and tradespeople organised.'}</Text>
    {!session && <Chip style={styles.demo}>Demo mode • backend connection pending</Chip>}
    <View style={styles.metrics}>
      <Card style={styles.metric}><Card.Content><Text variant="headlineMedium">3</Text><Text>Open jobs</Text></Card.Content></Card>
      <Card style={styles.metric}><Card.Content><Text variant="headlineMedium">8</Text><Text>Quotes</Text></Card.Content></Card>
      <Card style={styles.metric}><Card.Content><Text variant="headlineMedium">5</Text><Text>Messages</Text></Card.Content></Card>
    </View>
    <Card style={styles.card}><Card.Title title="Bathroom re-tile" subtitle="4 quotes received" /><Card.Content><Text>TW18 • £1,500–£2,500</Text></Card.Content><Card.Actions><Button onPress={() => router.push('/(tabs)/jobs')}>View job</Button></Card.Actions></Card>
    <Card style={styles.card}><Card.Title title="What’s next" subtitle="Native BuildMate foundation is live" /><Card.Content><Text style={styles.copy}>Authentication, database-backed jobs, messaging, photo storage, subscriptions and payments are being connected to these screens rather than mocked in separate apps.</Text></Card.Content></Card>
  </Screen>;
}
const styles = StyleSheet.create({ title: { color: colours.ink, fontWeight: '800' }, copy: { color: colours.muted, marginTop: 4, marginBottom: 14, lineHeight: 22 }, demo: { alignSelf: 'flex-start', marginBottom: 16, backgroundColor: '#FFF0E6' }, metrics: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 14 }, metric: { flexGrow: 1, minWidth: 105, backgroundColor: colours.surface }, card: { backgroundColor: colours.surface, marginBottom: 12 } });
