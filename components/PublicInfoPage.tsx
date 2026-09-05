import type { ReactNode } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { Text } from 'react-native-paper';
import { PublicFooter } from '@/components/PublicFooter';
import { colors } from '@/constants/theme';

export type InfoSection = {
  title: string;
  body: ReactNode;
};

export function PublicInfoPage({ eyebrow, title, intro, sections, updated }: { eyebrow?: string; title: string; intro: string; sections: InfoSection[]; updated?: string }) {
  return <ScrollView style={styles.page} contentContainerStyle={styles.scroll}>
    <View style={styles.hero}>
      <View style={styles.heroInner}>
        {eyebrow ? <Text style={styles.eyebrow}>{eyebrow}</Text> : null}
        <Text variant="displaySmall" style={styles.title}>{title}</Text>
        <Text variant="bodyLarge" style={styles.intro}>{intro}</Text>
        {updated ? <Text style={styles.updated}>Last updated: {updated}</Text> : null}
      </View>
    </View>
    <View style={styles.content}>
      {sections.map((section) => <View key={section.title} style={styles.card}>
        <Text variant="headlineSmall" style={styles.sectionTitle}>{section.title}</Text>
        {typeof section.body === 'string' ? <Text style={styles.body}>{section.body}</Text> : section.body}
      </View>)}
    </View>
    <PublicFooter />
  </ScrollView>;
}

export const infoStyles = StyleSheet.create({
  body: { color: colors.muted, lineHeight: 24 },
  list: { gap: 8 },
  item: { color: colors.muted, lineHeight: 23 },
  strong: { color: colors.charcoal, fontWeight: '800' },
  callout: { backgroundColor: colors.primarySoft, borderRadius: 20, padding: 16, gap: 6 },
  calloutText: { color: colors.primaryDark, lineHeight: 22 },
});

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: colors.background },
  scroll: { flexGrow: 1 },
  hero: { backgroundColor: colors.charcoal, paddingHorizontal: 20, paddingVertical: 58 },
  heroInner: { width: '100%', maxWidth: 980, alignSelf: 'center', gap: 13 },
  eyebrow: { color: colors.secondary, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 1.3 },
  title: { color: '#FFFFFF', fontWeight: '900', letterSpacing: -1.1 },
  intro: { color: '#E4E7E9', maxWidth: 780, lineHeight: 27 },
  updated: { color: '#AEB4B8', marginTop: 4 },
  content: { width: '100%', maxWidth: 980, alignSelf: 'center', paddingHorizontal: 18, paddingVertical: 30, gap: 16 },
  card: { backgroundColor: colors.surfaceRaised, borderRadius: 26, padding: 24, borderWidth: 1, borderColor: colors.border, gap: 12 },
  sectionTitle: { color: colors.charcoal, fontWeight: '900' },
  body: { color: colors.muted, lineHeight: 24 },
});
