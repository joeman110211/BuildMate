import { StyleSheet, View } from 'react-native';
import { Button, Icon, Text } from 'react-native-paper';
import { PublicFooter } from '@/components/PublicFooter';
import { colors } from '@/constants/theme';

export default function DownloadPage() {
  return <View style={styles.page}>
    <View style={styles.hero}>
      <Text style={styles.eyebrow}>Download BuildPair</Text>
      <Text variant="displaySmall" style={styles.title}>Web now. Mobile apps next.</Text>
      <Text variant="bodyLarge" style={styles.intro}>BuildPair is being prepared for Android and iOS distribution. The public website already includes the download area so store links can be switched on cleanly at launch.</Text>
    </View>
    <View style={styles.content}>
      <View style={styles.card}>
        <View style={styles.icon}><Icon source="google-play" size={34} color={colors.primary} /></View>
        <Text variant="headlineSmall" style={styles.cardTitle}>Android</Text>
        <Text style={styles.body}>The Android app will be distributed through Google Play once the release build and store listing are approved.</Text>
        <Button mode="contained" disabled>Google Play · Coming soon</Button>
      </View>
      <View style={styles.card}>
        <View style={[styles.icon, { backgroundColor: colors.accentSoft }]}><Icon source="apple" size={34} color={colors.accent} /></View>
        <Text variant="headlineSmall" style={styles.cardTitle}>iPhone & iPad</Text>
        <Text style={styles.body}>The iOS app will be linked here when the App Store release is available.</Text>
        <Button mode="contained" buttonColor={colors.accent} disabled>App Store · Coming soon</Button>
      </View>
      <View style={styles.webCard}>
        <Text variant="headlineSmall" style={styles.cardTitle}>Use BuildPair on the web</Text>
        <Text style={styles.body}>The web version remains the quickest way to use BuildPair before the store releases and will continue to work after the apps launch.</Text>
        <Button mode="outlined" onPress={() => { if (typeof window !== 'undefined') window.location.href = '/'; }}>Open BuildPair</Button>
      </View>
    </View>
    <PublicFooter />
  </View>;
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: colors.background },
  hero: { backgroundColor: colors.charcoal, paddingHorizontal: 20, paddingVertical: 56, gap: 12 },
  eyebrow: { width: '100%', maxWidth: 1000, alignSelf: 'center', color: colors.secondary, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 1.2 },
  title: { width: '100%', maxWidth: 1000, alignSelf: 'center', color: '#FFFFFF', fontWeight: '900' },
  intro: { width: '100%', maxWidth: 1000, alignSelf: 'center', color: '#DDE1E3', lineHeight: 27 },
  content: { width: '100%', maxWidth: 1000, alignSelf: 'center', padding: 20, flexDirection: 'row', flexWrap: 'wrap', gap: 16 },
  card: { flexGrow: 1, flexBasis: 300, backgroundColor: colors.surfaceRaised, borderRadius: 28, padding: 24, borderWidth: 1, borderColor: colors.border, gap: 12 },
  webCard: { width: '100%', backgroundColor: colors.primarySoft, borderRadius: 28, padding: 24, gap: 12 },
  icon: { width: 58, height: 58, borderRadius: 20, backgroundColor: colors.primarySoft, alignItems: 'center', justifyContent: 'center' },
  cardTitle: { color: colors.charcoal, fontWeight: '900' },
  body: { color: colors.muted, lineHeight: 23 },
});
