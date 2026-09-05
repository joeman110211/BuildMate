import { Link } from 'expo-router';
import { StyleSheet, View } from 'react-native';
import { Button, Text } from 'react-native-paper';
import { AppCard } from '@/components/AppCard';
import { Screen } from '@/components/Screen';
import { colors } from '@/constants/theme';

export default function LegalHub() {
  return <Screen title="BuildPair legal & safety" subtitle="Plain-English documents for the current UK private beta.">
    <AppCard>
      <Text variant="titleLarge" style={styles.title}>Before you use the marketplace</Text>
      <Text style={styles.body}>BuildPair helps homeowners and independent tradespeople connect, quote, message and keep job records. A BuildPair profile is not a guarantee of workmanship or a substitute for checking the qualifications, insurance and registrations relevant to your job.</Text>
    </AppCard>
    <View style={styles.grid}>
      <Link href="/(public)/terms" asChild><Button mode="contained" contentStyle={styles.button}>Terms of use</Button></Link>
      <Link href="/(public)/privacy" asChild><Button mode="outlined" contentStyle={styles.button}>Privacy notice</Button></Link>
      <Link href="/(public)/cookies" asChild><Button mode="outlined" contentStyle={styles.button}>Cookie notice</Button></Link>
    </View>
    <AppCard>
      <Text variant="titleMedium" style={styles.title}>Contact</Text>
      <Text style={styles.body}>Questions, privacy requests and beta support: info@buildpair.co.uk</Text>
    </AppCard>
  </Screen>;
}

const styles = StyleSheet.create({
  title: { color: colors.charcoal, fontWeight: '900' },
  body: { color: colors.text, lineHeight: 23 },
  grid: { flexDirection: 'row', gap: 10, flexWrap: 'wrap' },
  button: { minHeight: 48 },
});
