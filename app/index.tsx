import { router } from 'expo-router';
import { StyleSheet, View } from 'react-native';
import { Button, Card, Chip, Text } from 'react-native-paper';
import { Screen } from '@/native/components/Screen';
import { colours } from '@/native/theme';

export default function Welcome() {
  return (
    <Screen contentStyle={styles.page}>
      <View style={styles.hero}>
        <Chip style={styles.chip}>Verified tradespeople • Real reviews</Chip>
        <Text variant="displaySmall" style={styles.title}>Find trusted tradespeople for your next project.</Text>
        <Text variant="bodyLarge" style={styles.copy}>Post a job, compare itemised quotes, message local professionals and manage the whole job from one place.</Text>
        <Button mode="contained" contentStyle={styles.button} onPress={() => router.push('/(auth)/sign-up')}>Get started</Button>
        <Button mode="outlined" contentStyle={styles.button} onPress={() => router.push('/(auth)/sign-in')}>Sign in</Button>
        <Button mode="text" onPress={() => router.push('/(tabs)')}>Explore demo</Button>
      </View>
      <View style={styles.cards}>
        <Card style={styles.card}><Card.Title title="Customers" subtitle="Post jobs and compare trusted quotes" /></Card>
        <Card style={styles.card}><Card.Title title="Tradespeople" subtitle="Find local leads and grow your business" /></Card>
        <Card style={styles.card}><Card.Title title="Built for real work" subtitle="Jobs, messages, payments and verified reviews" /></Card>
      </View>
    </Screen>
  );
}
const styles = StyleSheet.create({ page: { maxWidth: 820, width: '100%', alignSelf: 'center' }, hero: { gap: 14, paddingVertical: 36 }, chip: { alignSelf: 'flex-start', backgroundColor: '#FFF0E6' }, title: { color: colours.ink, fontWeight: '800', lineHeight: 48 }, copy: { color: colours.muted, lineHeight: 27, marginBottom: 8 }, button: { minHeight: 48 }, cards: { gap: 12 }, card: { backgroundColor: colours.surface } });
