import { useAuth } from '@clerk/expo';
import type { Href } from 'expo-router';
import { Link, useRouter } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Image, StyleSheet, View } from 'react-native';
import { Button, Chip, Text } from 'react-native-paper';
import { AppCard } from '@/components/AppCard';
import { DeleteAccountCard } from '@/components/DeleteAccountCard';
import { EmptyState, LoadingScreen, Screen } from '@/components/Screen';
import { colors } from '@/constants/theme';
import { apiFetch, ApiError, errorMessage } from '@/lib/api';
import type { TraderProfile } from '@/types';

export default function TraderProfileHub() {
  const { getToken } = useAuth();
  const getTokenRef = useRef(getToken);
  const router = useRouter();
  const [profile, setProfile] = useState<TraderProfile>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  useEffect(() => { getTokenRef.current = getToken; }, [getToken]);
  const load = useCallback(async () => {
    try { setLoading(true); setError(''); setProfile(await apiFetch<TraderProfile>('/api/me/profile', {}, () => getTokenRef.current())); }
    catch (e) { if (!(e instanceof ApiError && e.status === 404)) setError(errorMessage(e)); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => { const timer = setTimeout(() => void load(), 0); return () => clearTimeout(timer); }, [load]);

  if (loading) return <LoadingScreen />;
  if (!profile) return <Screen title="Your Tradesperson Profile"><EmptyState title="No public profile yet" body="Complete your profile setup so homeowners can see your work and request quotes." action={<Link href="/trader/onboarding" asChild><Button mode="contained">Create Profile</Button></Link>} /></Screen>;

  return <Screen title="Your Profile" subtitle="This is the business identity homeowners see on BuildPair.">
    <AppCard style={styles.profileCard}>
      {profile.coverPhotoUrl ? <Image source={{ uri: profile.coverPhotoUrl }} style={styles.cover} /> : <View style={styles.coverFallback} />}
      <View style={styles.identity}>
        {profile.profileImageUrl ? <Image source={{ uri: profile.profileImageUrl }} style={styles.avatar} /> : <View style={styles.avatarFallback}><Text style={styles.avatarLetter}>{profile.businessName.slice(0, 1).toUpperCase()}</Text></View>}
        <View style={styles.flex}><Text variant="headlineSmall" style={styles.title}>{profile.businessName}</Text><Text style={styles.muted}>{profile.tradeCategory}{profile.locationLabel ? ` · ${profile.locationLabel}` : ''}</Text><View style={styles.chips}><Chip compact icon="star">{profile.averageRating?.toFixed?.(1) ?? '0.0'} · {profile.reviewCount ?? 0} reviews</Chip><Chip compact icon="map-marker-radius">{profile.radiusMiles} miles</Chip></View></View>
      </View>
    </AppCard>

    <View style={styles.actions}>
      <Link href="/trader/onboarding" asChild><Button mode="contained" icon="account-edit-outline">Edit Profile</Button></Link>
      <Button mode="outlined" icon="eye-outline" onPress={() => router.push(`/(public)/traders/${profile.id}` as Href)}>View Public Profile</Button>
      <Link href="/trader/trust" asChild><Button mode="outlined" icon="shield-check-outline">Trust & Availability</Button></Link>
      <Link href="/trader/stories" asChild><Button mode="outlined" icon="image-multiple-outline">Project Stories</Button></Link>
      <Link href="/trader/analytics" asChild><Button mode="outlined" icon="chart-box-outline">Analytics</Button></Link>
      <Link href="/trader/saved-searches" asChild><Button mode="outlined" icon="bell-plus-outline">Job Alerts</Button></Link>
      <Link href="/trader/subscription" asChild><Button mode="outlined" icon="credit-card-outline">Plan & Payouts</Button></Link>
    </View>

    <AppCard>
      <Text variant="titleLarge" style={styles.title}>Profile strength</Text>
      <Text style={styles.muted}>{profile.bio?.length >= 50 ? '✓' : '○'} Business bio</Text>
      <Text style={styles.muted}>{profile.photos?.length ? '✓' : '○'} Work gallery</Text>
      <Text style={styles.muted}>{profile.qualifications?.length ? '✓' : '○'} Qualifications</Text>
      <Text style={styles.muted}>{profile.profileImageUrl ? '✓' : '○'} Profile image</Text>
      <Text style={styles.muted}>{profile.coverPhotoUrl ? '✓' : '○'} Cover image</Text>
      <Text style={styles.muted}>○ BuildPair verification can be added separately in Trust & Availability so declared qualifications are never confused with verified evidence.</Text>
    </AppCard>

    {error ? <EmptyState title="Something needs attention" body={error} action={<Button onPress={load}>Try again</Button>} /> : null}
    <DeleteAccountCard />
  </Screen>;
}

const styles = StyleSheet.create({
  profileCard: { padding: 0, overflow: 'hidden' },
  cover: { width: '100%', height: 190, backgroundColor: colors.border },
  coverFallback: { width: '100%', height: 130, backgroundColor: colors.charcoal },
  identity: { padding: 18, flexDirection: 'row', alignItems: 'center', gap: 14, flexWrap: 'wrap' },
  avatar: { width: 78, height: 78, borderRadius: 24, backgroundColor: colors.border },
  avatarFallback: { width: 78, height: 78, borderRadius: 24, backgroundColor: colors.charcoal, alignItems: 'center', justifyContent: 'center' },
  avatarLetter: { color: colors.primary, fontSize: 28, fontWeight: '900' },
  flex: { flex: 1, minWidth: 220, gap: 5 },
  title: { fontWeight: '900', color: colors.charcoal },
  muted: { color: colors.muted, lineHeight: 22 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 4 },
  actions: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
});
