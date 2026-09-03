import type { Href } from 'expo-router';
import { useRouter } from 'expo-router';
import { Image, StyleSheet, View } from 'react-native';
import { Button, Chip, Text } from 'react-native-paper';
import { AppCard } from '@/components/AppCard';
import { colors } from '@/constants/theme';
import type { TraderProfile } from '@/types';

export function TraderCard({ trader }: { trader: TraderProfile }) {
  const router = useRouter();
  return <AppCard>
    {trader.photos[0] ? <Image source={{ uri: trader.photos[0] }} style={styles.image} accessibilityLabel={`${trader.businessName} work example`} /> : <View style={styles.placeholder}><Text variant="headlineLarge">{trader.businessName.slice(0, 1)}</Text></View>}
    <View style={styles.row}><View style={styles.flex}><Text variant="titleLarge" style={styles.title}>{trader.businessName}</Text><Text style={styles.muted}>{trader.tradeCategory} · Within {trader.radiusMiles} miles</Text></View>{trader.subscriptionTier === 'featured' ? <Chip compact icon="star">Featured</Chip> : null}</View>
    <Text numberOfLines={3}>{trader.bio}</Text>
    <View style={styles.row}><Text style={styles.rating}>★ {Number(trader.averageRating || 0).toFixed(1)} ({trader.reviewCount})</Text><Button mode="outlined" onPress={() => router.push(`/(public)/traders/${trader.id}` as Href)}>View profile</Button></View>
  </AppCard>;
}

const styles = StyleSheet.create({ image: { width: '100%', height: 180, borderRadius: 10, backgroundColor: colors.border }, placeholder: { height: 100, backgroundColor: '#FFF7ED', borderRadius: 10, justifyContent: 'center', alignItems: 'center' }, row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 10, flexWrap: 'wrap' }, flex: { flex: 1, minWidth: 180 }, title: { fontWeight: '800' }, muted: { color: colors.muted }, rating: { color: colors.warning, fontWeight: '700' } });
