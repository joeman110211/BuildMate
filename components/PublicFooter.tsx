import { Link } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';
import { Text } from 'react-native-paper';
import { colors } from '@/constants/theme';

const linkGroups = [
  {
    title: 'Explore',
    links: [
      ['Find Trades', '/(public)/directory'],
      ['Browse Jobs', '/(public)/jobs'],
      ['How It Works', '/(public)/how-it-works'],
      ['For Homeowners', '/(public)/for-homeowners'],
      ['For Tradespeople', '/(public)/for-tradespeople'],
    ],
  },
  {
    title: 'BuildPair',
    links: [
      ['About Us', '/(public)/about'],
      ['Contact Us', '/(public)/contact'],
      ['Download App', '/(public)/download'],
    ],
  },
  {
    title: 'Legal',
    links: [
      ['Terms', '/(public)/terms'],
      ['Privacy Policy', '/(public)/privacy'],
      ['Cookie Policy', '/(public)/cookies'],
      ['Disclaimer', '/(public)/disclaimer'],
    ],
  },
] as const;

export function PublicFooter() {
  return <View style={styles.footer}>
    <View style={styles.inner}>
      <View style={styles.brandBlock}>
        <Text variant="headlineSmall" style={styles.brand}>BuildPair</Text>
        <Text style={styles.tagline}>Better matches. Better jobs. Better local trade connections.</Text>
        <Text style={styles.small}>Built for UK homeowners and tradespeople.</Text>
      </View>
      {linkGroups.map((group) => <View key={group.title} style={styles.group}>
        <Text style={styles.groupTitle}>{group.title}</Text>
        {group.links.map(([label, href]) => <Link key={label} href={href} asChild><Pressable><Text style={styles.link}>{label}</Text></Pressable></Link>)}
      </View>)}
    </View>
    <View style={styles.bottom}>
      <Text style={styles.small}>© {new Date().getFullYear()} BuildPair. All rights reserved.</Text>
      <Text style={styles.small}>BuildPair is a marketplace platform and does not itself carry out building work.</Text>
    </View>
  </View>;
}

const styles = StyleSheet.create({
  footer: { marginTop: 28, backgroundColor: colors.charcoal, paddingHorizontal: 20, paddingTop: 34, paddingBottom: 24 },
  inner: { width: '100%', maxWidth: 1200, alignSelf: 'center', flexDirection: 'row', flexWrap: 'wrap', gap: 34, justifyContent: 'space-between' },
  brandBlock: { flex: 2, minWidth: 240, maxWidth: 420, gap: 8 },
  brand: { color: '#FFFFFF', fontWeight: '900' },
  tagline: { color: '#F5E9DE', lineHeight: 22, fontWeight: '600' },
  small: { color: '#BFC4C8', lineHeight: 20, fontSize: 12 },
  group: { minWidth: 150, gap: 9 },
  groupTitle: { color: colors.secondary, fontWeight: '800', marginBottom: 2 },
  link: { color: '#FFFFFF', opacity: 0.92 },
  bottom: { width: '100%', maxWidth: 1200, alignSelf: 'center', borderTopWidth: 1, borderTopColor: '#454A50', marginTop: 28, paddingTop: 18, gap: 5 },
});
