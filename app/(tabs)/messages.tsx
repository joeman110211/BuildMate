import { StyleSheet } from 'react-native';
import { Card, Text } from 'react-native-paper';
import { Screen } from '@/native/components/Screen';
import { colours } from '@/native/theme';

export default function Messages() {
  return <Screen>
    <Text variant="headlineSmall" style={styles.title}>Messages</Text>
    <Text style={styles.copy}>Conversations will be attached to jobs and quotes so customers and tradespeople have one auditable thread per project.</Text>
    <Card style={styles.card}><Card.Title title="Precision Tiling London" subtitle="Bathroom re-tile • 12 min ago" /><Card.Content><Text>Thanks Joe, I can come round Thursday evening to measure up.</Text></Card.Content></Card>
    <Card style={styles.card}><Card.Title title="BrightSpark Electrical" subtitle="Kitchen sockets • Yesterday" /><Card.Content><Text>I’ve sent an updated itemised quote.</Text></Card.Content></Card>
  </Screen>;
}
const styles = StyleSheet.create({ title: { color: colours.ink, fontWeight: '800' }, copy: { color: colours.muted, marginVertical: 8, marginBottom: 18, lineHeight: 22 }, card: { backgroundColor: colours.surface, marginBottom: 12 } });
