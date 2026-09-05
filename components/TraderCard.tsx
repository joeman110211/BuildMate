import type { Href } from 'expo-router';
import { useRouter } from 'expo-router';
import { Image, StyleSheet, View } from 'react-native';
import { Button, Chip, Text } from 'react-native-paper';
import { AppCard } from '@/components/AppCard';
import { colors } from '@/constants/theme';
import type { TraderProfile } from '@/types';

export function TraderCard({ trader }: { trader: TraderProfile }) {
  const router = useRouter();
  return <AppCard style={styles.card}>
    {trader.photos[0] ? <Image source={{ uri: trader.photos[0] }} style={styles.image} accessibilityLabel={`${trader.businessName} work example`} /> : <View style={styles.placeholder}><Text style={styles.placeholderLetter}>{trader.businessName.slice(0, 1).toUpperCase()}</Text></View>}
    <View style={styles.content}>
      <View style={styles.row}>
        <View style={styles.flex}><Text variant="titleLarge" style={styles.title}>{trader.businessName}</Text><Text style={styles.muted}>{trader.tradeCategory}{trader.locationLabel ? ` · ${trader.locationLabel}` : ''}</Text></View>
        {trader.isPreview ? <Chip compact icon="flask-outline">Preview</Chip> : trader.subscriptionTier === 'featured' ? <Chip compact icon="star-circle">Featured</Chip> : null}
      </View>
      <View style={styles.chips}>
        {trader.isPreview ? <Chip compact icon="information-outline">Example profile</Chip> : <Chip compact icon="star">{Number(trader.averageRating || 0).toFixed(1)} ({trader.reviewCount})</Chip>}
        <Chip compact icon="map-marker-radius">{trader.radiusMiles} miles</Chip>
      </View>
      <Text numberOfLines={3} style={styles.bio}>{trader.bio}</Text>
      <View style={styles.skills}>{trader.subSkills.slice(0, 4).map((skill) => <Chip key={skill} compact>{skill}</Chip>)}</View>
      <Button mode="contained" icon="account-search-outline" contentStyle={styles.button} onPress={() => router.push(`/(public)/traders/${trader.id}` as Href)}>View Profile</Button>
    </View>
  </AppCard>;
}

const styles = StyleSheet.create({
  card: { padding: 0, overflow: 'hidden', flexGrow: 1, flexBasis: 300, minWidth: 270, maxWidth: 520 },
  image: { width: '100%', height: 190, backgroundColor: colors.border },
  placeholder: { height: 150, backgroundColor: colors.surfaceSoft, justifyContent: 'center', alignItems: 'center' },
  placeholderLetter: { color: colors.primary, fontSize: 40, fontWeight: '900' },
  content: { padding: 16, gap: 10 },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: 10, flexWrap: 'wrap' },
  flex: { flex: 1, minWidth: 180, gap: 3 },
  title: { fontWeight: '900', color: colors.text },
  muted: { color: colors.muted, lineHeight: 21 },
  bio: { color: colors.text, lineHeight: 22 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  skills: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  button: { minHeight: 48 },
});
