import { Link } from 'expo-router';
import { StyleSheet, View } from 'react-native';
import { Button, Divider, Text } from 'react-native-paper';
import { AppCard } from '@/components/AppCard';
import { Screen } from '@/components/Screen';
import { colors } from '@/constants/theme';

export type LegalSection = {
  heading: string;
  paragraphs?: string[];
  bullets?: string[];
};

export function LegalPage({ title, intro, updated = '5 September 2026', sections }: {
  title: string;
  intro: string;
  updated?: string;
  sections: LegalSection[];
}) {
  return (
    <Screen title={title} subtitle={intro}>
      <Text style={styles.updated}>Last updated: {updated}</Text>
      {sections.map((section) => (
        <AppCard key={section.heading}>
          <Text variant="titleLarge" style={styles.heading}>{section.heading}</Text>
          {section.paragraphs?.map((paragraph) => <Text key={paragraph} style={styles.paragraph}>{paragraph}</Text>)}
          {section.bullets?.map((bullet) => (
            <View key={bullet} style={styles.bulletRow}>
              <Text style={styles.bullet}>•</Text>
              <Text style={styles.bulletText}>{bullet}</Text>
            </View>
          ))}
        </AppCard>
      ))}
      <Divider />
      <View style={styles.links}>
        <Link href="/privacy" asChild><Button compact>Privacy</Button></Link>
        <Link href="/terms" asChild><Button compact>Terms</Button></Link>
        <Link href="/cookies" asChild><Button compact>Cookies</Button></Link>
        <Link href="/safety" asChild><Button compact>Safety & reviews</Button></Link>
        <Link href="/account-deletion" asChild><Button compact>Delete account</Button></Link>
      </View>
      <Text style={styles.contact}>BuildPair support: info@buildpair.co.uk</Text>
    </Screen>
  );
}

const styles = StyleSheet.create({
  updated: { color: colors.muted, marginTop: -8 },
  heading: { color: colors.charcoal, fontWeight: '900', marginBottom: 4 },
  paragraph: { color: colors.charcoal, lineHeight: 22 },
  bulletRow: { flexDirection: 'row', gap: 10, alignItems: 'flex-start' },
  bullet: { color: colors.primary, fontWeight: '900', lineHeight: 22 },
  bulletText: { color: colors.charcoal, lineHeight: 22, flex: 1 },
  links: { flexDirection: 'row', flexWrap: 'wrap', gap: 4, justifyContent: 'center' },
  contact: { color: colors.muted, textAlign: 'center', marginBottom: 8 },
});
