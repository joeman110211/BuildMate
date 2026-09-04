import { useAuth } from '@clerk/expo';
import { type Href, Link, useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Image, Linking, StyleSheet, View } from 'react-native';
import { Button, Chip, Divider, Text } from 'react-native-paper';
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

const PROFILE_COLOURS = {
  burnt_orange: '#D35400',
  navy: '#17324D',
  forest: '#276749',
  charcoal: '#343A40',
  burgundy: '#7A2432',
} as const;

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
  useEffect(() => { void load(); }, [load]);

  if (error) return <Screen><EmptyState title="Profile unavailable" body={error} /></Screen>;
  if (!profile) return <LoadingScreen />;

  const accent = PROFILE_COLOURS[profile.colourTheme ?? 'burnt_orange'];
  const template = profile.template ?? 'classic';
  const area = profile.locationLabel ? ` · ${profile.locationLabel}` : '';
  const memberSince = profile.createdAt ? new Date(profile.createdAt).toLocaleDateString('en-GB', { month: 'short', year: 'numeric' }) : 'Recently';
  const serviceAreas = profile.serviceAreas?.length ? profile.serviceAreas : profile.locationLabel ? [profile.locationLabel] : [];
  const beforeAfter = profile.beforeAfterProjects ?? [];

  const quoteLink = { pathname: '/customer/new-job', params: { traderId: profile.userId, traderName: profile.businessName, tradeCategory: profile.tradeCategory } } as Href;

  const quoteButton = isSignedIn
    ? <Link href={quoteLink} asChild><Button mode="contained" buttonColor={accent} icon="file-document-edit">Request a quote</Button></Link>
    : <Link href="/auth/sign-in" asChild><Button mode="contained" buttonColor={accent}>Sign in to request a quote</Button></Link>;

  const hero = <View style={[styles.hero, !profile.coverPhotoUrl && { backgroundColor: accent }]}>
    {profile.coverPhotoUrl ? <Image source={{ uri: profile.coverPhotoUrl }} style={styles.cover} /> : null}
    <View style={styles.heroBody}>
      <View style={styles.identityRow}>
        {profile.profileImageUrl ? <Image source={{ uri: profile.profileImageUrl }} style={styles.avatar} /> : <View style={[styles.avatarFallback, { backgroundColor: accent }]}><Text style={styles.avatarLetter}>{profile.businessName.slice(0, 1).toUpperCase()}</Text></View>}
        <View style={styles.identityText}>
          <Text variant="headlineMedium" style={styles.businessName}>{profile.businessName}</Text>
          <Text variant="bodyLarge" style={styles.muted}>{profile.tradeCategory}{area} · Works within {profile.radiusMiles} miles</Text>
          <View style={styles.meta}><Chip icon="star">{profile.averageRating.toFixed(1)} · {profile.reviewCount} reviews</Chip>{profile.subscriptionTier === 'featured' ? <Chip icon="check-decagram">Featured</Chip> : null}</View>
        </View>
        {profile.logoUrl ? <Image source={{ uri: profile.logoUrl }} style={styles.logo} /> : null}
      </View>
      <View style={styles.heroActions}>{quoteButton}{profile.contact?.phone ? <Button mode="outlined" icon="phone" textColor={accent} onPress={() => Linking.openURL(`tel:${profile.contact?.phone}`)}>Call</Button> : null}</View>
    </View>
  </View>;

  const stats = <View style={styles.stats}>
    <AppCard><Text variant="headlineSmall" style={{ color: accent }}>{profile.yearsExperience ?? 0}+</Text><Text style={styles.muted}>Years experience</Text></AppCard>
    <AppCard><Text variant="headlineSmall" style={{ color: accent }}>{profile.reviewCount}</Text><Text style={styles.muted}>BuildMate reviews</Text></AppCard>
    <AppCard><Text variant="headlineSmall" style={{ color: accent }}>{profile.yearEstablished ?? '—'}</Text><Text style={styles.muted}>Established</Text></AppCard>
    <AppCard><Text variant="headlineSmall" style={{ color: accent }}>{memberSince}</Text><Text style={styles.muted}>On BuildMate</Text></AppCard>
  </View>;

  const about = <>
    <Text variant="titleLarge">About {profile.businessName}</Text>
    <AppCard><Text variant="bodyLarge" style={styles.bio}>{profile.bio}</Text></AppCard>
    <Text variant="titleMedium">Skills & services</Text>
    <View style={styles.meta}>{profile.subSkills.map((skill) => <Chip key={skill}>{skill}</Chip>)}</View>
    {serviceAreas.length ? <><Text variant="titleMedium">Areas covered</Text><View style={styles.meta}>{serviceAreas.map((place) => <Chip key={place} icon="map-marker">{place}</Chip>)}</View></> : null}
  </>;

  const qualifications = <>
    <Text variant="titleLarge">Qualifications & trust</Text>
    <AppCard>
      {profile.qualifications.length ? profile.qualifications.map((item) => <Text key={item}>• {item}</Text>) : <Text>No qualifications listed.</Text>}
      {Object.entries(profile.externalLinks ?? {}).filter(([, url]) => url).map(([name, url]) => <Button key={name} icon="open-in-new" textColor={accent} onPress={() => Linking.openURL(url)}>{name}</Button>)}
      <Text variant="bodySmall" style={styles.muted}>Qualifications and register links are declared by the tradesperson. Customers should verify anything relevant to regulated work.</Text>
    </AppCard>
  </>;

  const gallery = profile.photos.length ? <>
    <Text variant="titleLarge">Work gallery</Text>
    <View style={[styles.gallery, template === 'portfolio' && styles.portfolioGallery]}>{profile.photos.map((uri, index) => <Image key={`${uri}-${index}`} source={{ uri }} style={template === 'portfolio' ? styles.portfolioPhoto : styles.photo} />)}</View>
  </> : null;

  const transformations = beforeAfter.length ? <>
    <Text variant="titleLarge">Before & after</Text>
    {beforeAfter.map((project, index) => <AppCard key={`${project.before}-${index}`}>
      {project.caption ? <Text variant="titleMedium">{project.caption}</Text> : null}
      <View style={styles.beforeAfterRow}>
        <View style={styles.beforeAfterItem}><Text style={styles.imageLabel}>Before</Text><Image source={{ uri: project.before }} style={styles.beforeAfterPhoto} /></View>
        <View style={styles.beforeAfterItem}><Text style={styles.imageLabel}>After</Text><Image source={{ uri: project.after }} style={styles.beforeAfterPhoto} /></View>
      </View>
    </AppCard>)}
  </> : null;

  const reviews = <>
    <Text variant="titleLarge">Verified customer reviews</Text>
    {profile.reviews.length ? profile.reviews.map((review) => <AppCard key={review.id}><Text style={[styles.stars, { color: accent }]}>{'★'.repeat(review.rating)}</Text><Text>{review.comment}</Text><Text variant="bodySmall" style={styles.muted}>{new Date(review.createdAt).toLocaleDateString('en-GB')} · Verified BuildMate job</Text></AppCard>) : <AppCard><Text>No verified BuildMate reviews yet.</Text></AppCard>}
  </>;

  const contact = <>
    <Divider />
    <AppCard>
      <Text variant="titleLarge">Ready to discuss your job?</Text>
      <Text style={styles.muted}>Send {profile.businessName} the job details once and keep the quote, messages and work record together in BuildMate.</Text>
      <View style={styles.heroActions}>{quoteButton}{profile.contact?.phone ? <Button icon="phone" mode="outlined" textColor={accent} onPress={() => Linking.openURL(`tel:${profile.contact?.phone}`)}>Call</Button> : null}{profile.contact?.email ? <Button icon="email" mode="outlined" textColor={accent} onPress={() => Linking.openURL(`mailto:${profile.contact?.email}`)}>Email</Button> : null}</View>
      {profile.contactLocked ? <Text variant="bodySmall" style={styles.muted}>Direct contact details are hidden until available through the trader’s BuildMate listing.</Text> : null}
    </AppCard>
  </>;

  return <Screen>
    {hero}
    {template === 'modern' ? <>{stats}{about}{gallery}{transformations}{qualifications}{reviews}</> : null}
    {template === 'portfolio' ? <>{gallery}{transformations}{stats}{about}{qualifications}{reviews}</> : null}
    {template === 'classic' ? <>{about}{stats}{qualifications}{gallery}{transformations}{reviews}</> : null}
    {contact}
  </Screen>;
}

const styles = StyleSheet.create({
  hero: { borderRadius: 20, overflow: 'hidden', backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border },
  cover: { width: '100%', height: 230, backgroundColor: colors.border },
  heroBody: { padding: 18, backgroundColor: colors.surface, gap: 14 },
  identityRow: { flexDirection: 'row', alignItems: 'center', gap: 14, flexWrap: 'wrap' },
  identityText: { flex: 1, minWidth: 220, gap: 6 },
  businessName: { fontWeight: '900' },
  avatar: { width: 92, height: 92, borderRadius: 46, backgroundColor: colors.border },
  avatarFallback: { width: 92, height: 92, borderRadius: 46, alignItems: 'center', justifyContent: 'center' },
  avatarLetter: { color: '#FFFFFF', fontSize: 34, fontWeight: '900' },
  logo: { width: 88, height: 88, borderRadius: 12, resizeMode: 'contain', backgroundColor: '#FFFFFF' },
  heroActions: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  meta: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  muted: { color: colors.muted },
  bio: { lineHeight: 25 },
  stats: { flexDirection: 'row', gap: 10, flexWrap: 'wrap' },
  gallery: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  portfolioGallery: { gap: 12 },
  photo: { width: 180, height: 145, borderRadius: 12, backgroundColor: colors.border },
  portfolioPhoto: { width: 280, height: 220, borderRadius: 16, backgroundColor: colors.border },
  beforeAfterRow: { flexDirection: 'row', gap: 10, flexWrap: 'wrap' },
  beforeAfterItem: { flex: 1, minWidth: 240, gap: 6 },
  beforeAfterPhoto: { width: '100%', height: 220, borderRadius: 12, backgroundColor: colors.border },
  imageLabel: { fontWeight: '800', color: colors.muted },
  stars: { fontWeight: '900', fontSize: 20, letterSpacing: 2 },
});
