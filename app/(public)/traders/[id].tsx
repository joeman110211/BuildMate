import { useAuth } from '@clerk/expo';
import { type Href, Link, useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Image, Linking, StyleSheet, View } from 'react-native';
import { Button, Chip, Divider, ProgressBar, Text } from 'react-native-paper';
import { AppCard } from '@/components/AppCard';
import { EmptyState, LoadingScreen, Screen } from '@/components/Screen';
import { colors } from '@/constants/theme';
import { apiFetch, errorMessage } from '@/lib/api';
import type { TraderProfile } from '@/types';

type ProfileResult = Omit<TraderProfile, 'qualifications'> & {
  qualifications: string[];
  reviews: { id: string; rating: number; comment: string; createdAt: string }[];
  contact: { email: string | null; phone: string | null } | null;
  contactLocked: boolean;
};

export default function TraderProfileScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { getToken, isSignedIn } = useAuth();
  const getTokenRef = useRef(getToken);
  const [profile, setProfile] = useState<ProfileResult>();
  const [error, setError] = useState('');

  useEffect(() => { getTokenRef.current = getToken; }, [getToken]);
  const load = useCallback(async () => {
    try {
      setError('');
      const tokenGetter = isSignedIn ? () => getTokenRef.current() : undefined;
      setProfile(await apiFetch(`/api/traders/${id}`, {}, tokenGetter));
    } catch (e) { setError(errorMessage(e)); }
  }, [id, isSignedIn]);
  useEffect(() => { const timer = setTimeout(() => void load(), 0); return () => clearTimeout(timer); }, [load]);

  if (error) return <Screen><EmptyState title="Profile unavailable" body={error} /></Screen>;
  if (!profile) return <LoadingScreen />;

  const memberSince = profile.createdAt ? new Date(profile.createdAt).toLocaleDateString('en-GB', { month: 'short', year: 'numeric' }) : 'Recently';
  const serviceAreas = profile.serviceAreas?.length ? profile.serviceAreas : profile.locationLabel ? [profile.locationLabel] : [];
  const beforeAfter = profile.beforeAfterProjects ?? [];
  const quoteLink = { pathname: '/customer/new-job', params: { traderId: profile.userId, traderName: profile.businessName, tradeCategory: profile.tradeCategory } } as Href;
  const quoteButton = isSignedIn
    ? <Link href={quoteLink} asChild><Button mode="contained" icon="file-document-edit-outline" contentStyle={styles.ctaContent}>Request a Quote</Button></Link>
    : <Link href="/auth/sign-in" asChild><Button mode="contained" contentStyle={styles.ctaContent}>Sign in to Request a Quote</Button></Link>;

  const ratingCounts = [5, 4, 3, 2, 1].map((rating) => ({ rating, count: profile.reviews.filter((review) => review.rating === rating).length }));
  const maxRatingCount = Math.max(1, ...ratingCounts.map((item) => item.count));

  return <Screen>
    <View style={styles.hero}>
      {profile.coverPhotoUrl ? <Image source={{ uri: profile.coverPhotoUrl }} style={styles.cover} /> : <View style={styles.coverFallback}><Text style={styles.coverFallbackText}>BuildPair</Text></View>}
      <View style={styles.heroBody}>
        <View style={styles.identityRow}>
          {profile.profileImageUrl ? <Image source={{ uri: profile.profileImageUrl }} style={styles.avatar} /> : <View style={styles.avatarFallback}><Text style={styles.avatarLetter}>{profile.businessName.slice(0, 1).toUpperCase()}</Text></View>}
          <View style={styles.identityText}>
            <Text variant="headlineMedium" style={styles.businessName}>{profile.businessName}</Text>
            <Text variant="bodyLarge" style={styles.muted}>{profile.tradeCategory}{profile.locationLabel ? ` · ${profile.locationLabel}` : ''}</Text>
            <View style={styles.meta}><Chip icon="star">{profile.averageRating.toFixed(1)} ({profile.reviewCount} reviews)</Chip><Chip icon="map-marker-radius">{profile.radiusMiles} mile radius</Chip><Chip icon="check-decagram-outline">BuildPair member</Chip></View>
          </View>
          {profile.logoUrl ? <Image source={{ uri: profile.logoUrl }} style={styles.logo} /> : null}
        </View>
        <View style={styles.heroActions}>{quoteButton}{profile.contact?.phone ? <Button mode="outlined" icon="phone" contentStyle={styles.ctaContent} onPress={() => Linking.openURL(`tel:${profile.contact?.phone}`)}>Call</Button> : null}{profile.contact?.email ? <Button mode="outlined" icon="email-outline" contentStyle={styles.ctaContent} onPress={() => Linking.openURL(`mailto:${profile.contact?.email}`)}>Email</Button> : null}</View>
      </View>
    </View>

    <View style={styles.stats}>
      <AppCard style={styles.stat}><Text variant="headlineSmall" style={styles.statNumber}>{profile.yearsExperience ?? 0}+</Text><Text style={styles.statLabel}>Years Experience</Text></AppCard>
      <AppCard style={styles.stat}><Text variant="headlineSmall" style={styles.statNumber}>{profile.reviewCount}</Text><Text style={styles.statLabel}>Verified Reviews</Text></AppCard>
      <AppCard style={styles.stat}><Text variant="headlineSmall" style={styles.statNumber}>{profile.radiusMiles}</Text><Text style={styles.statLabel}>Mile Service Radius</Text></AppCard>
    </View>

    <View style={styles.sectionHeader}><Text variant="titleLarge" style={styles.sectionTitle}>About {profile.businessName}</Text></View>
    <AppCard><Text variant="bodyLarge" style={styles.bio}>{profile.bio}</Text></AppCard>

    <View style={styles.sectionHeader}><Text variant="titleLarge" style={styles.sectionTitle}>Specialisms</Text></View>
    <View style={styles.meta}>{profile.subSkills.map((skill) => <Chip key={skill}>{skill}</Chip>)}</View>
    {serviceAreas.length ? <><Text variant="titleMedium" style={styles.sectionTitle}>Areas covered</Text><View style={styles.meta}>{serviceAreas.map((place) => <Chip key={place} icon="map-marker-outline">{place}</Chip>)}</View></> : null}

    {profile.photos.length ? <>
      <View style={styles.sectionHeader}><Text variant="titleLarge" style={styles.sectionTitle}>Recent Work Gallery</Text><Text style={styles.muted}>{profile.photos.length} photo{profile.photos.length === 1 ? '' : 's'}</Text></View>
      <View style={styles.gallery}>{profile.photos.map((uri, index) => <Image key={`${uri}-${index}`} source={{ uri }} style={[styles.photo, index === 0 && styles.featurePhoto]} />)}</View>
    </> : null}

    {beforeAfter.length ? <>
      <View style={styles.sectionHeader}><Text variant="titleLarge" style={styles.sectionTitle}>Before & After</Text></View>
      {beforeAfter.map((project, index) => <AppCard key={`${project.before}-${index}`}>
        {project.caption ? <Text variant="titleMedium" style={styles.sectionTitle}>{project.caption}</Text> : null}
        <View style={styles.beforeAfterRow}><View style={styles.beforeAfterItem}><Text style={styles.imageLabel}>Before</Text><Image source={{ uri: project.before }} style={styles.beforeAfterPhoto} /></View><View style={styles.beforeAfterItem}><Text style={styles.imageLabel}>After</Text><Image source={{ uri: project.after }} style={styles.beforeAfterPhoto} /></View></View>
      </AppCard>)}
    </> : null}

    <View style={styles.sectionHeader}><Text variant="titleLarge" style={styles.sectionTitle}>Qualifications & Credentials</Text></View>
    <AppCard>
      {profile.qualifications.length ? profile.qualifications.map((item) => <View key={item} style={styles.credential}><Text style={styles.credentialTick}>✓</Text><Text style={styles.credentialText}>{item}</Text></View>) : <Text style={styles.muted}>No qualifications have been listed yet.</Text>}
      {Object.entries(profile.externalLinks ?? {}).filter(([, url]) => url).map(([name, url]) => <Button key={name} icon="open-in-new" onPress={() => Linking.openURL(url)}>{name}</Button>)}
      <Text variant="bodySmall" style={styles.muted}>Trade qualifications and register links are declared by the tradesperson unless specifically marked as verified by BuildPair.</Text>
    </AppCard>

    <View style={styles.sectionHeader}><Text variant="titleLarge" style={styles.sectionTitle}>Customer Reviews</Text></View>
    <AppCard>
      <View style={styles.ratingSummary}><View><Text style={styles.bigRating}>{profile.averageRating.toFixed(1)}</Text><Text style={styles.stars}>★★★★★</Text><Text style={styles.muted}>{profile.reviewCount} verified review{profile.reviewCount === 1 ? '' : 's'}</Text></View><View style={styles.ratingBars}>{ratingCounts.map((item) => <View key={item.rating} style={styles.ratingRow}><Text style={styles.ratingLabel}>{item.rating} ★</Text><ProgressBar progress={item.count / maxRatingCount} color={colors.primary} style={styles.ratingBar} /><Text style={styles.ratingCount}>{item.count}</Text></View>)}</View></View>
    </AppCard>
    {profile.reviews.length ? profile.reviews.map((review) => <AppCard key={review.id}><View style={styles.reviewTop}><View><Text variant="titleMedium" style={styles.sectionTitle}>Verified customer</Text><Text style={styles.stars}>{'★'.repeat(review.rating)}</Text></View><Chip compact icon="check-circle">Verified BuildPair job</Chip></View><Text style={styles.reviewText}>{review.comment}</Text><Text variant="bodySmall" style={styles.muted}>{new Date(review.createdAt).toLocaleDateString('en-GB')}</Text></AppCard>) : <AppCard><Text style={styles.muted}>No verified BuildPair reviews yet.</Text></AppCard>}

    <Divider />
    <AppCard style={styles.finalCta}>
      <Text variant="headlineSmall" style={styles.sectionTitle}>Ready to discuss your job?</Text>
      <Text style={styles.muted}>Send {profile.businessName} your job details through BuildPair and keep the quote, messages and work record together.</Text>
      <View style={styles.heroActions}>{quoteButton}{profile.contact?.phone ? <Button icon="phone" mode="outlined" onPress={() => Linking.openURL(`tel:${profile.contact?.phone}`)}>Call Direct</Button> : null}</View>
      <Text variant="bodySmall" style={styles.muted}>BuildPair member since {memberSince}.{profile.contactLocked ? ' Direct contact details are hidden until available through the trader’s listing.' : ''}</Text>
    </AppCard>
  </Screen>;
}

const styles = StyleSheet.create({
  hero: { borderRadius: 22, overflow: 'hidden', backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, shadowColor: '#111827', shadowOpacity: 0.08, shadowRadius: 16, shadowOffset: { width: 0, height: 6 }, elevation: 4 },
  cover: { width: '100%', height: 250, backgroundColor: colors.border },
  coverFallback: { width: '100%', height: 180, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' },
  coverFallbackText: { color: '#FFFFFF', fontSize: 30, fontWeight: '900', opacity: 0.8 },
  heroBody: { padding: 18, gap: 16 },
  identityRow: { flexDirection: 'row', alignItems: 'center', gap: 14, flexWrap: 'wrap' },
  identityText: { flex: 1, minWidth: 220, gap: 6 },
  businessName: { fontWeight: '900', color: colors.text, letterSpacing: -0.5 },
  avatar: { width: 92, height: 92, borderRadius: 46, backgroundColor: colors.border, borderWidth: 4, borderColor: '#FFFFFF' },
  avatarFallback: { width: 92, height: 92, borderRadius: 46, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center', borderWidth: 4, borderColor: '#FFFFFF' },
  avatarLetter: { color: '#FFFFFF', fontSize: 34, fontWeight: '900' },
  logo: { width: 82, height: 82, borderRadius: 16, resizeMode: 'contain', backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: colors.border },
  heroActions: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  ctaContent: { minHeight: 48 },
  meta: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  muted: { color: colors.muted, lineHeight: 22 },
  stats: { flexDirection: 'row', gap: 10, flexWrap: 'wrap' },
  stat: { flexGrow: 1, flexBasis: 180, minWidth: 150, alignItems: 'center' },
  statNumber: { color: colors.primary, fontWeight: '900' },
  statLabel: { color: colors.muted, fontWeight: '700', textAlign: 'center' },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginTop: 4 },
  sectionTitle: { fontWeight: '900', color: colors.text },
  bio: { lineHeight: 25, color: colors.text },
  gallery: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  photo: { flexGrow: 1, flexBasis: 170, height: 170, borderRadius: 14, backgroundColor: colors.border },
  featurePhoto: { flexBasis: 350, height: 230 },
  beforeAfterRow: { flexDirection: 'row', gap: 10, flexWrap: 'wrap' },
  beforeAfterItem: { flex: 1, minWidth: 240, gap: 6 },
  beforeAfterPhoto: { width: '100%', height: 220, borderRadius: 14, backgroundColor: colors.border },
  imageLabel: { fontWeight: '900', color: colors.muted },
  credential: { flexDirection: 'row', gap: 10, alignItems: 'flex-start' },
  credentialTick: { color: colors.success, fontWeight: '900' },
  credentialText: { flex: 1, color: colors.text, lineHeight: 22 },
  ratingSummary: { flexDirection: 'row', gap: 22, flexWrap: 'wrap', alignItems: 'center' },
  bigRating: { fontSize: 42, fontWeight: '900', color: colors.text },
  stars: { color: '#E0A400', fontWeight: '900', fontSize: 18, letterSpacing: 1 },
  ratingBars: { flex: 1, minWidth: 240, gap: 5 },
  ratingRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  ratingLabel: { width: 34, color: colors.muted, fontWeight: '700' },
  ratingBar: { flex: 1, height: 7, borderRadius: 4, backgroundColor: '#F1EEE9' },
  ratingCount: { width: 22, textAlign: 'right', color: colors.muted },
  reviewTop: { flexDirection: 'row', justifyContent: 'space-between', gap: 8, flexWrap: 'wrap' },
  reviewText: { color: colors.text, lineHeight: 23 },
  finalCta: { backgroundColor: '#FFF9F4' },
});
