import { useAuth } from '@clerk/expo';
import { type Href, Link, useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Image, Linking, StyleSheet, View } from 'react-native';
import { Button, Chip, Divider, ProgressBar, Text } from 'react-native-paper';
import { AppCard } from '@/components/AppCard';
import { ProfileShareButtons } from '@/components/ProfileShareButtons';
import { EmptyState, LoadingScreen, Screen } from '@/components/Screen';
import { colors } from '@/constants/theme';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { apiFetch, errorMessage } from '@/lib/api';
import type { AvailabilitySlot, ProjectStory, TraderCredential, TraderProfile } from '@/types';

type ProfileResult = Omit<TraderProfile, 'qualifications'> & {
  qualifications: string[];
  reviews: { id: string; rating: number; comment: string; createdAt: string }[];
  credentials: TraderCredential[];
  availability: AvailabilitySlot[];
  stories: ProjectStory[];
  savedByViewer: boolean;
  contact: { email: string | null; phone: string | null } | null;
  contactLocked: boolean;
};

export default function TraderProfileScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { getToken, isSignedIn } = useAuth();
  const { user } = useCurrentUser();
  const getTokenRef = useRef(getToken);
  const [profile, setProfile] = useState<ProfileResult>();
  const [saving, setSaving] = useState(false);
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

  async function toggleSaved() {
    if (!profile || profile.shareOnly || !user?.customerEnabled) return;
    try {
      setSaving(true); setError('');
      const next = !profile.savedByViewer;
      await apiFetch('/api/saved-traders', { method: 'POST', body: JSON.stringify({ traderId: profile.userId, saved: next }) }, () => getTokenRef.current());
      setProfile({ ...profile, savedByViewer: next });
    } catch (e) { setError(errorMessage(e)); }
    finally { setSaving(false); }
  }

  if (error && !profile) return <Screen><EmptyState title="Profile unavailable" body={error} /></Screen>;
  if (!profile) return <LoadingScreen />;

  const memberSince = profile.createdAt ? new Date(profile.createdAt).toLocaleDateString('en-GB', { month: 'short', year: 'numeric' }) : 'Recently';
  const serviceAreas = profile.serviceAreas?.length ? profile.serviceAreas : profile.locationLabel ? [profile.locationLabel] : [];
  const beforeAfter = profile.beforeAfterProjects ?? [];
  const categories = profile.tradeCategories?.length ? profile.tradeCategories : [profile.tradeCategory];
  const quoteLink = { pathname: '/customer/new-job', params: { traderId: profile.userId, traderName: profile.businessName, tradeCategory: categories[0] } } as Href;
  const paidProfile = !profile.shareOnly && !profile.isPreview && profile.canRequestQuote !== false;
  const quoteButton = profile.isPreview
    ? <Button mode="outlined" icon="flask-outline" disabled contentStyle={styles.ctaContent}>Preview profile only</Button>
    : !paidProfile
      ? <Button mode="outlined" icon="lock-outline" disabled contentStyle={styles.ctaContent}>Not currently accepting BuildPair quote requests</Button>
      : isSignedIn && user?.customerEnabled
        ? <Link href={quoteLink} asChild><Button mode="contained" icon="file-document-edit-outline" contentStyle={styles.ctaContent}>Request a Quote</Button></Link>
        : <Link href="/auth/account" asChild><Button mode="contained" contentStyle={styles.ctaContent}>{isSignedIn ? 'Add Homeowner Mode to Request a Quote' : 'Sign in to Request a Quote'}</Button></Link>;

  const ratingCounts = [5, 4, 3, 2, 1].map((rating) => ({ rating, count: profile.reviews.filter((review) => review.rating === rating).length }));
  const maxRatingCount = Math.max(1, ...ratingCounts.map((item) => item.count));

  return <Screen>
    {profile.shareOnly ? <AppCard style={styles.shareBanner}>
      <View style={styles.shareBannerTop}><View style={styles.flex}><Text variant="headlineSmall" style={styles.sectionTitle}>Find me on BuildPair</Text><Text style={styles.muted}>This Starter Free profile has been shared directly by {profile.businessName}. Starter profiles are not listed in BuildPair search and cannot receive BuildPair quote requests.</Text></View><Chip icon="share-variant">Shared profile</Chip></View>
      <ProfileShareButtons profileId={profile.id} businessName={profile.businessName} />
    </AppCard> : !profile.isPreview ? <ProfileShareButtons profileId={profile.id} businessName={profile.businessName} /> : null}

    <View style={styles.hero}>
      {profile.coverPhotoUrl ? <Image source={{ uri: profile.coverPhotoUrl }} style={styles.cover} /> : <View style={styles.coverFallback}><Text style={styles.coverFallbackText}>BuildPair</Text></View>}
      <View style={styles.heroBody}>
        <View style={styles.identityRow}>
          {profile.profileImageUrl ? <Image source={{ uri: profile.profileImageUrl }} style={styles.avatar} /> : <View style={styles.avatarFallback}><Text style={styles.avatarLetter}>{profile.businessName.slice(0, 1).toUpperCase()}</Text></View>}
          <View style={styles.identityText}>
            <Text variant="headlineMedium" style={styles.businessName}>{profile.businessName}</Text>
            <Text variant="bodyLarge" style={styles.muted}>{categories.join(' · ')}{profile.locationLabel ? ` · ${profile.locationLabel}` : ''}</Text>
            <View style={styles.meta}>
              {profile.isPreview ? <Chip icon="flask-outline">BuildPair beta preview</Chip> : paidProfile ? <Chip icon="star">{profile.averageRating.toFixed(1)} ({profile.reviewCount} reviews)</Chip> : <Chip icon="account-outline">Starter Free shared profile</Chip>}
              <Chip icon="map-marker-radius">{profile.radiusMiles} mile radius</Chip>
              {!profile.isPreview && profile.verifiedCredentialCount ? <Chip icon="shield-check">{profile.verifiedCredentialCount} verified</Chip> : null}
              {!profile.isPreview && profile.availability?.length ? <Chip icon="calendar-check">Availability listed</Chip> : null}
            </View>
          </View>
          {profile.logoUrl ? <Image source={{ uri: profile.logoUrl }} style={styles.logo} /> : null}
        </View>
        <View style={styles.heroActions}>
          {quoteButton}
          {paidProfile && user?.customerEnabled ? <Button mode="outlined" icon={profile.savedByViewer ? 'heart' : 'heart-outline'} loading={saving} disabled={saving} onPress={() => void toggleSaved()}>{profile.savedByViewer ? 'Saved' : 'Save to Shortlist'}</Button> : null}
          {paidProfile && profile.contact?.phone ? <Button mode="outlined" icon="phone" contentStyle={styles.ctaContent} onPress={() => Linking.openURL(`tel:${profile.contact?.phone}`)}>Call</Button> : null}
          {paidProfile && profile.contact?.email ? <Button mode="outlined" icon="email-outline" contentStyle={styles.ctaContent} onPress={() => Linking.openURL(`mailto:${profile.contact?.email}`)}>Email</Button> : null}
        </View>
        {error ? <Text style={styles.error}>{error}</Text> : null}
        {profile.isPreview ? <Text variant="bodySmall" style={styles.muted}>This is example marketplace content used during the BuildPair beta. It is not a verified live tradesperson listing and cannot receive real job requests.</Text> : null}
      </View>
    </View>

    <View style={styles.stats}>
      <AppCard style={styles.stat}><Text variant="headlineSmall" style={styles.statNumber}>{profile.yearsExperience ?? 0}+</Text><Text style={styles.statLabel}>Years Experience</Text></AppCard>
      {paidProfile ? <AppCard style={styles.stat}><Text variant="headlineSmall" style={styles.statNumber}>{profile.reviewCount}</Text><Text style={styles.statLabel}>Verified Reviews</Text></AppCard> : null}
      <AppCard style={styles.stat}><Text variant="headlineSmall" style={styles.statNumber}>{profile.verifiedCredentialCount ?? 0}</Text><Text style={styles.statLabel}>Verified Credentials</Text></AppCard>
      <AppCard style={styles.stat}><Text variant="headlineSmall" style={styles.statNumber}>{profile.radiusMiles}</Text><Text style={styles.statLabel}>Mile Service Radius</Text></AppCard>
    </View>

    <View style={styles.sectionHeader}><Text variant="titleLarge" style={styles.sectionTitle}>About {profile.businessName}</Text></View>
    <AppCard><Text variant="bodyLarge" style={styles.bio}>{profile.bio}</Text></AppCard>

    <View style={styles.sectionHeader}><Text variant="titleLarge" style={styles.sectionTitle}>Trades & services</Text></View>
    {categories.map((category) => <AppCard key={category}>
      <Text variant="titleMedium" style={styles.sectionTitle}>{category}</Text>
      <View style={styles.meta}>{(profile.serviceSelections?.[category] ?? []).length
        ? (profile.serviceSelections?.[category] ?? []).map((service) => <Chip key={`${category}-${service}`}>{service}</Chip>)
        : profile.subSkills.map((skill) => <Chip key={`${category}-${skill}`}>{skill}</Chip>)}</View>
    </AppCard>)}
    {serviceAreas.length ? <><Text variant="titleMedium" style={styles.sectionTitle}>Areas covered</Text><View style={styles.meta}>{serviceAreas.map((place) => <Chip key={place} icon="map-marker-outline">{place}</Chip>)}</View></> : null}

    {profile.availability?.length ? <>
      <View style={styles.sectionHeader}><Text variant="titleLarge" style={styles.sectionTitle}>Upcoming Availability</Text></View>
      <AppCard>
        <View style={styles.meta}>{profile.availability.slice(0, 6).map((slot) => <Chip key={slot.id} icon="calendar-check">{new Date(slot.startsAt).toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' })}</Chip>)}</View>
        <Text style={styles.muted}>Availability is published by the tradesperson and should be confirmed when arranging the job.</Text>
      </AppCard>
    </> : null}

    {profile.photos.length ? <>
      <View style={styles.sectionHeader}><Text variant="titleLarge" style={styles.sectionTitle}>Recent Work Gallery</Text><Text style={styles.muted}>{profile.photos.length} photo{profile.photos.length === 1 ? '' : 's'}</Text></View>
      <View style={styles.gallery}>{profile.photos.map((uri, index) => <Image key={`${uri}-${index}`} source={{ uri }} style={[styles.photo, index === 0 && styles.featurePhoto]} />)}</View>
    </> : null}

    {profile.stories?.length ? <>
      <View style={styles.sectionHeader}><Text variant="titleLarge" style={styles.sectionTitle}>Project Stories</Text></View>
      {profile.stories.map((story) => <AppCard key={story.id}>
        <View style={styles.sectionHeader}><View style={styles.flex}><Text variant="titleMedium" style={styles.sectionTitle}>{story.title}</Text><Text style={styles.muted}>{[story.locationLabel, story.durationDays ? `${story.durationDays} days` : null].filter(Boolean).join(' · ')}</Text></View></View>
        <Text style={styles.reviewText}>{story.summary}</Text>
        <View style={styles.beforeAfterRow}>{story.beforePhotos[0] ? <View style={styles.beforeAfterItem}><Text style={styles.imageLabel}>Before</Text><Image source={{ uri: story.beforePhotos[0] }} style={styles.beforeAfterPhoto} /></View> : null}{story.afterPhotos[0] ? <View style={styles.beforeAfterItem}><Text style={styles.imageLabel}>After</Text><Image source={{ uri: story.afterPhotos[0] }} style={styles.beforeAfterPhoto} /></View> : null}</View>
      </AppCard>)}
    </> : null}

    {beforeAfter.length ? <>
      <View style={styles.sectionHeader}><Text variant="titleLarge" style={styles.sectionTitle}>Before & After Gallery</Text></View>
      {beforeAfter.map((project, index) => <AppCard key={`${project.before}-${index}`}>
        {project.caption ? <Text variant="titleMedium" style={styles.sectionTitle}>{project.caption}</Text> : null}
        <View style={styles.beforeAfterRow}><View style={styles.beforeAfterItem}><Text style={styles.imageLabel}>Before</Text><Image source={{ uri: project.before }} style={styles.beforeAfterPhoto} /></View><View style={styles.beforeAfterItem}><Text style={styles.imageLabel}>After</Text><Image source={{ uri: project.after }} style={styles.beforeAfterPhoto} /></View></View>
      </AppCard>)}
    </> : null}

    <View style={styles.sectionHeader}><Text variant="titleLarge" style={styles.sectionTitle}>Trust & Credentials</Text></View>
    <AppCard>
      {profile.credentials?.length ? profile.credentials.map((credential) => <View key={credential.id} style={styles.verifiedCredential}>
        <View style={styles.verifiedIcon}><Text style={styles.verifiedTick}>✓</Text></View>
        <View style={styles.flex}><Text variant="titleMedium" style={styles.sectionTitle}>{credential.name}</Text><Text style={styles.muted}>{credential.issuer || credential.credentialType.replaceAll('_', ' ')}{credential.referenceNumber ? ` · ${credential.referenceNumber}` : ''}</Text>{credential.expiresAt ? <Text variant="bodySmall" style={styles.muted}>Current until {new Date(credential.expiresAt).toLocaleDateString('en-GB')}</Text> : null}</View><Chip compact icon="shield-check">Verified</Chip>
      </View>) : <Text style={styles.muted}>No BuildPair-verified credentials have been published yet.</Text>}
      {profile.qualifications.length ? <><Divider /><Text variant="titleMedium" style={styles.sectionTitle}>Other declared qualifications</Text>{profile.qualifications.map((item) => <View key={item} style={styles.credential}><Text style={styles.credentialTick}>•</Text><Text style={styles.credentialText}>{item}</Text></View>)}</> : null}
      {paidProfile ? Object.entries(profile.externalLinks ?? {}).filter(([, url]) => url).map(([name, url]) => <Button key={name} icon="open-in-new" onPress={() => Linking.openURL(url)}>{name}</Button>) : null}
      <Text variant="bodySmall" style={styles.muted}>{profile.isPreview ? 'Preview-profile details are illustrative only.' : 'Only items explicitly marked “Verified” above have been reviewed by BuildPair. Other qualifications remain tradesperson-declared.'}</Text>
    </AppCard>

    {paidProfile ? <>
      <View style={styles.sectionHeader}><Text variant="titleLarge" style={styles.sectionTitle}>Customer Reviews</Text></View>
      <AppCard>
        <View style={styles.ratingSummary}><View><Text style={styles.bigRating}>{profile.averageRating.toFixed(1)}</Text><Text style={styles.stars}>★★★★★</Text><Text style={styles.muted}>{profile.reviewCount} verified review{profile.reviewCount === 1 ? '' : 's'}</Text></View><View style={styles.ratingBars}>{ratingCounts.map((item) => <View key={item.rating} style={styles.ratingRow}><Text style={styles.ratingLabel}>{item.rating} ★</Text><ProgressBar progress={item.count / maxRatingCount} color={colors.primary} style={styles.ratingBar} /><Text style={styles.ratingCount}>{item.count}</Text></View>)}</View></View>
      </AppCard>
      {profile.reviews.length ? profile.reviews.map((review) => <AppCard key={review.id}><View style={styles.reviewTop}><View><Text variant="titleMedium" style={styles.sectionTitle}>Verified customer</Text><Text style={styles.stars}>{'★'.repeat(review.rating)}</Text></View><Chip compact icon="check-circle">Verified BuildPair job</Chip></View><Text style={styles.reviewText}>{review.comment}</Text><Text variant="bodySmall" style={styles.muted}>{new Date(review.createdAt).toLocaleDateString('en-GB')}</Text></AppCard>) : <AppCard><Text style={styles.muted}>No verified BuildPair reviews yet.</Text></AppCard>}
    </> : null}

    <Divider />
    <AppCard style={styles.finalCta}>
      <Text variant="headlineSmall" style={styles.sectionTitle}>{profile.isPreview ? 'Example profile' : profile.shareOnly ? `Like ${profile.businessName}'s work?` : 'Ready to discuss your job?'}</Text>
      <Text style={styles.muted}>{profile.isPreview ? 'Browse this layout as an example of how a live tradesperson profile can look on BuildPair.' : profile.shareOnly ? 'This tradesperson is not currently accepting BuildPair quote requests. You can still use BuildPair to search public Plus and Pro profiles, compare tradespeople and post your own job.' : `Send ${profile.businessName} your job details through BuildPair and keep the quote, messages, approved changes and work record together.`}</Text>
      <View style={styles.heroActions}>{quoteButton}{paidProfile && user?.customerEnabled ? <Button icon={profile.savedByViewer ? 'heart' : 'heart-outline'} mode="outlined" onPress={() => void toggleSaved()}>{profile.savedByViewer ? 'Saved to Shortlist' : 'Save to Shortlist'}</Button> : null}{profile.shareOnly ? <Link href="/directory" asChild><Button mode="contained" icon="magnify">Find trades on BuildPair</Button></Link> : null}</View>
      <Text variant="bodySmall" style={styles.muted}>{profile.isPreview ? 'Beta preview content. Not a live listing.' : `BuildPair member since ${memberSince}.${profile.shareOnly ? ' Starter shared profile: reviews, website/social links and contact details are not published.' : profile.contactLocked ? ' Direct contact details are kept private until available through the trader’s listing or an accepted job.' : ''}`}</Text>
    </AppCard>
  </Screen>;
}

const styles = StyleSheet.create({
  shareBanner: { backgroundColor: '#FFF8F3', borderColor: colors.primary },
  shareBannerTop: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10, flexWrap: 'wrap' },
  hero: { borderRadius: 22, overflow: 'hidden', backgroundColor: colors.surfaceRaised, borderWidth: 1, borderColor: colors.border, shadowColor: colors.charcoal, shadowOpacity: 0.08, shadowRadius: 16, shadowOffset: { width: 0, height: 6 }, elevation: 4 },
  cover: { width: '100%', height: 250, backgroundColor: colors.border },
  coverFallback: { width: '100%', height: 180, backgroundColor: colors.charcoal, alignItems: 'center', justifyContent: 'center' },
  coverFallbackText: { color: '#FFFFFF', fontSize: 30, fontWeight: '900', opacity: 0.92 },
  heroBody: { padding: 18, gap: 16 },
  identityRow: { flexDirection: 'row', alignItems: 'center', gap: 14, flexWrap: 'wrap' },
  identityText: { flex: 1, minWidth: 220, gap: 6 },
  businessName: { fontWeight: '900', color: colors.charcoal, letterSpacing: -0.5 },
  avatar: { width: 92, height: 92, borderRadius: 46, backgroundColor: colors.border, borderWidth: 4, borderColor: '#FFFFFF' },
  avatarFallback: { width: 92, height: 92, borderRadius: 46, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center', borderWidth: 4, borderColor: '#FFFFFF' },
  avatarLetter: { color: '#FFFFFF', fontSize: 34, fontWeight: '900' },
  logo: { width: 82, height: 82, borderRadius: 16, resizeMode: 'contain', backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: colors.border },
  heroActions: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  ctaContent: { minHeight: 48 },
  meta: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  muted: { color: colors.muted, lineHeight: 22 },
  error: { color: colors.danger },
  stats: { flexDirection: 'row', gap: 10, flexWrap: 'wrap' },
  stat: { flexGrow: 1, flexBasis: 160, minWidth: 145, alignItems: 'center' },
  statNumber: { color: colors.primary, fontWeight: '900' },
  statLabel: { color: colors.muted, fontWeight: '700', textAlign: 'center' },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginTop: 4 },
  sectionTitle: { fontWeight: '900', color: colors.charcoal },
  flex: { flex: 1, minWidth: 220, gap: 4 },
  bio: { lineHeight: 25, color: colors.text },
  gallery: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  photo: { flexGrow: 1, flexBasis: 170, height: 170, borderRadius: 14, backgroundColor: colors.border },
  featurePhoto: { flexBasis: 350, height: 230 },
  beforeAfterRow: { flexDirection: 'row', gap: 10, flexWrap: 'wrap' },
  beforeAfterItem: { flex: 1, minWidth: 240, gap: 6 },
  beforeAfterPhoto: { width: '100%', height: 220, borderRadius: 14, backgroundColor: colors.border },
  imageLabel: { fontWeight: '900', color: colors.muted },
  credential: { flexDirection: 'row', gap: 10, alignItems: 'flex-start' },
  credentialTick: { color: colors.muted, fontWeight: '900' },
  credentialText: { flex: 1, color: colors.text, lineHeight: 22 },
  verifiedCredential: { flexDirection: 'row', alignItems: 'center', gap: 10, flexWrap: 'wrap', paddingVertical: 4 },
  verifiedIcon: { width: 34, height: 34, borderRadius: 17, backgroundColor: colors.accentSoft, alignItems: 'center', justifyContent: 'center' },
  verifiedTick: { color: colors.accent, fontWeight: '900' },
  ratingSummary: { flexDirection: 'row', gap: 22, flexWrap: 'wrap', alignItems: 'center' },
  bigRating: { fontSize: 42, fontWeight: '900', color: colors.charcoal },
  stars: { color: '#E0A400', fontWeight: '900', fontSize: 18, letterSpacing: 1 },
  ratingBars: { flex: 1, minWidth: 240, gap: 5 },
  ratingRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  ratingLabel: { width: 34, color: colors.muted, fontWeight: '700' },
  ratingBar: { flex: 1, height: 7, borderRadius: 4, backgroundColor: colors.surfaceStrong },
  ratingCount: { width: 22, textAlign: 'right', color: colors.muted },
  reviewTop: { flexDirection: 'row', justifyContent: 'space-between', gap: 8, flexWrap: 'wrap' },
  reviewText: { color: colors.text, lineHeight: 23 },
  finalCta: { backgroundColor: '#FFF8F3' },
});
