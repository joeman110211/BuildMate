import { useAuth } from '@clerk/expo';
import { type Href, Link, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { Image, Linking, StyleSheet, View } from 'react-native';
import { Button, Chip, Divider, Text } from 'react-native-paper';
import { AppCard } from '@/components/AppCard';
import { EmptyState, LoadingScreen, Screen } from '@/components/Screen';
import { colors } from '@/constants/theme';
import { apiFetch, errorMessage } from '@/lib/api';
import type { TraderProfile } from '@/types';

type ProfileResult = TraderProfile & { qualifications: string[]; reviews: { id: string; rating: number; comment: string; createdAt: string }[]; contact: { email: string | null; phone: string | null } | null; contactLocked: boolean };

export default function TraderProfileScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { getToken, isSignedIn } = useAuth();
  const [profile, setProfile] = useState<ProfileResult>();
  const [error, setError] = useState('');
  useEffect(() => { (async () => { try { setProfile(await apiFetch(`/api/traders/${id}`, {}, isSignedIn ? getToken : undefined)); } catch (e) { setError(errorMessage(e)); } })(); }, [getToken, id, isSignedIn]);
  if (error) return <Screen><EmptyState title="Profile unavailable" body={error} /></Screen>;
  if (!profile) return <LoadingScreen />;
  return <Screen title={profile.businessName} subtitle={`${profile.tradeCategory} · Works within ${profile.radiusMiles} miles`}>
    <View style={styles.meta}><Chip icon="star">{profile.averageRating.toFixed(1)} · {profile.reviewCount} reviews</Chip>{profile.subscriptionTier === 'featured' ? <Chip icon="check-decagram">Featured</Chip> : null}</View>
    <Text variant="bodyLarge">{profile.bio}</Text>
    <Text variant="titleMedium">Skills</Text><View style={styles.meta}>{profile.subSkills.map((skill) => <Chip key={skill}>{skill}</Chip>)}</View>
    <Text variant="titleMedium">Qualifications and registers</Text>
    <AppCard>{profile.qualifications.length ? profile.qualifications.map((item) => <Text key={item}>• {item}</Text>) : <Text>No qualifications listed.</Text>}
      {Object.entries(profile.externalLinks).filter(([, url]) => url).map(([name, url]) => <Button key={name} icon="open-in-new" onPress={() => Linking.openURL(url)}>{name}</Button>)}
      <Text variant="bodySmall" style={styles.muted}>Self-certified by the tradesperson. BuildMate does not endorse or independently verify these claims.</Text>
    </AppCard>
    {profile.photos.length ? <><Text variant="titleMedium">Recent work</Text><View style={styles.gallery}>{profile.photos.map((uri) => <Image key={uri} source={{ uri }} style={styles.photo} />)}</View></> : null}
    <Text variant="titleMedium">Verified customer reviews</Text>
    {profile.reviews.length ? profile.reviews.map((review) => <AppCard key={review.id}><Text style={styles.stars}>{'★'.repeat(review.rating)}</Text><Text>{review.comment}</Text><Text variant="bodySmall" style={styles.muted}>Verified paid BuildMate job</Text></AppCard>) : <Text>No verified reviews yet.</Text>}
    <Divider />
    {profile.contact ? <AppCard><Text variant="titleMedium">Contact {profile.businessName}</Text>{profile.contact.phone ? <Button icon="phone" mode="contained" onPress={() => Linking.openURL(`tel:${profile.contact?.phone}`)}>Call</Button> : null}{profile.contact.email ? <Button icon="email" mode="outlined" onPress={() => Linking.openURL(`mailto:${profile.contact?.email}`)}>Email</Button> : null}<Link href={{ pathname: '/(customer)/new-job', params: { traderId: profile.userId, traderName: profile.businessName } } as Href} asChild><Button mode="contained">Request direct quote</Button></Link></AppCard> : <AppCard><Text variant="titleMedium">Contact details locked</Text><Text style={styles.muted}>{isSignedIn ? 'This trader needs an active lead subscription before direct contact can be enabled.' : 'Sign in to request a quote and view contact options from subscribed tradespeople.'}</Text>{!isSignedIn ? <Link href="/(auth)/sign-in" asChild><Button mode="contained">Sign in</Button></Link> : null}</AppCard>}
  </Screen>;
}

const styles = StyleSheet.create({ meta: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' }, muted: { color: colors.muted }, stars: { color: colors.warning, fontWeight: '800' }, gallery: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 }, photo: { width: 160, height: 130, borderRadius: 10, backgroundColor: colors.border } });
