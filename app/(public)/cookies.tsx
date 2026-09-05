import { Link } from 'expo-router';
import { StyleSheet, View } from 'react-native';
import { Button, Text } from 'react-native-paper';
import { AppCard } from '@/components/AppCard';
import { Screen } from '@/components/Screen';
import { colors } from '@/constants/theme';

export default function CookieNotice() {
  return <Screen title="Cookie and local-storage notice" subtitle="BuildPair private beta · Last updated 5 September 2026">
    <Section title="What BuildPair uses" paragraphs={[
      'BuildPair uses cookies, secure browser storage and similar local technologies that are necessary to sign users in, protect sessions, remember essential application state and keep the web app working reliably.',
      'Authentication technology is provided by Clerk. Browser and device storage may also be used by Expo/React Native Web and the BuildPair progressive web app for normal application operation.',
    ]} />

    <Section title="No advertising cookies" paragraphs={[
      'The current BuildPair private beta does not use advertising cookies or behavioural advertising trackers. If non-essential analytics or advertising technology is introduced later, the consent experience and this notice must be updated before that technology is enabled where UK law requires consent.',
    ]} />

    <Section title="Managing cookies" paragraphs={[
      'You can remove or block cookies and site data using your browser settings. Blocking strictly necessary authentication or application storage may prevent sign-in or make parts of BuildPair stop working correctly.',
      'The native Android and iOS apps use secure device storage for authentication tokens and other essential app state rather than ordinary browser cookies.',
    ]} />

    <Section title="Questions" paragraphs={[
      'Questions about cookies, local storage or privacy can be sent to info@buildpair.co.uk.',
    ]} />

    <View style={styles.links}>
      <Link href="/(public)/privacy" asChild><Button mode="outlined">Privacy notice</Button></Link>
      <Link href="/(public)/terms" asChild><Button mode="outlined">Terms of use</Button></Link>
    </View>
  </Screen>;
}

function Section({ title, paragraphs }: { title: string; paragraphs: string[] }) {
  return <AppCard><Text variant="titleLarge" style={styles.title}>{title}</Text>{paragraphs.map((paragraph) => <Text key={paragraph} style={styles.body}>{paragraph}</Text>)}</AppCard>;
}

const styles = StyleSheet.create({
  title: { color: colors.charcoal, fontWeight: '900' },
  body: { color: colors.text, lineHeight: 23 },
  links: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
});
