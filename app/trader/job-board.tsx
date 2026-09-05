import { useAuth } from '@clerk/expo';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Image, StyleSheet, View } from 'react-native';
import { Button, Chip, Searchbar, Text } from 'react-native-paper';
import { AppCard } from '@/components/AppCard';
import { EmptyState, LoadingScreen, Screen } from '@/components/Screen';
import { colors } from '@/constants/theme';
import { apiFetch, errorMessage } from '@/lib/api';
import type { Job, Quote, TraderProfile } from '@/types';

export default function TraderJobBoard() {
  const { getToken } = useAuth();
  const getTokenRef = useRef(getToken);
  const router = useRouter();
  const [profile, setProfile] = useState<TraderProfile>();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [search, setSearch] = useState('');
  const [directOnly, setDirectOnly] = useState(false);
  const [urgentOnly, setUrgentOnly] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => { getTokenRef.current = getToken; }, [getToken]);
  const load = useCallback(async () => {
    try {
      setLoading(true); setError('');
      const tokenGetter = () => getTokenRef.current();
      const [ownProfile, jobRows, quoteRows] = await Promise.all([
        apiFetch<TraderProfile>('/api/me/profile', {}, tokenGetter),
        apiFetch<Job[]>('/api/jobs', {}, tokenGetter),
        apiFetch<Quote[]>('/api/quotes', {}, tokenGetter),
      ]);
      setProfile(ownProfile); setJobs(jobRows); setQuotes(quoteRows);
    } catch (e) { setError(errorMessage(e)); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => {
    const timer = setTimeout(() => void load(), 0);
    return () => clearTimeout(timer);
  }, [load]);

  const opportunities = useMemo(() => jobs.filter((job) => {
    if (!['open', 'quoted'].includes(job.status)) return false;
    if (directOnly && job.targetTraderId !== profile?.userId) return false;
    if (urgentOnly && !job.urgency.toLowerCase().includes('urgent') && !job.urgency.toLowerCase().includes('asap')) return false;
    const haystack = `${job.title} ${job.category} ${job.description} ${job.postcode ?? ''} ${job.locationLabel ?? ''}`.toLowerCase();
    return haystack.includes(search.trim().toLowerCase());
  }), [directOnly, jobs, profile?.userId, search, urgentOnly]);

  if (loading) return <LoadingScreen label="Finding suitable jobs…" />;
  return <Screen title="Job Board" subtitle="New work matching your trade, service area and BuildMate plan.">
    <Searchbar placeholder="Search jobs or locations" value={search} onChangeText={setSearch} style={styles.search} />
    <View style={styles.filters}>
      <Chip selected={!directOnly && !urgentOnly} showSelectedCheck onPress={() => { setDirectOnly(false); setUrgentOnly(false); }}>All</Chip>
      <Chip selected={directOnly} showSelectedCheck onPress={() => setDirectOnly((value) => !value)}>Direct Leads</Chip>
      <Chip selected={urgentOnly} showSelectedCheck onPress={() => setUrgentOnly((value) => !value)}>Urgent</Chip>
      {profile?.tradeCategory ? <Chip icon="tools">{profile.tradeCategory}</Chip> : null}
      {profile?.radiusMiles ? <Chip icon="map-marker-radius">Within {profile.radiusMiles} miles</Chip> : null}
    </View>

    {error ? <EmptyState title="Couldn’t load the job board" body={error} action={<Button onPress={load}>Try again</Button>} /> : null}
    {!error && !opportunities.length ? <EmptyState title="No matching jobs right now" body="Try clearing the filters. New jobs matching your trade and area will appear here automatically." /> : opportunities.map((job) => {
      const direct = job.targetTraderId === profile?.userId;
      const ownQuote = quotes.find((quote) => quote.jobId === job.id && quote.status === 'pending');
      const canQuote = Boolean(profile?.isSubscriptionActive && (direct || profile.subscriptionTier === 'featured'));
      return <AppCard key={job.id}>
        <View style={styles.cardTop}><View style={styles.titleBlock}><Text variant="titleLarge" style={styles.title}>{job.title}</Text><Text style={styles.muted}>📍 {job.postcode || job.locationLabel || 'Location available'} · {job.budgetRange}</Text></View><View style={styles.badges}>{direct ? <Chip compact icon="account-arrow-left">Direct request</Chip> : null}{ownQuote ? <Chip compact icon="check">Quoted</Chip> : <Chip compact>New</Chip>}</View></View>
        {job.photos?.[0] ? <Image source={{ uri: job.photos[0] }} style={styles.photo} /> : null}
        <View style={styles.meta}><Chip compact icon="home-outline">{job.propertyType}</Chip><Chip compact icon="clock-outline">{job.urgency}</Chip></View>
        <Text numberOfLines={4} style={styles.description}>{job.description}</Text>
        <View style={styles.actions}>
          {ownQuote ? <Button mode="contained" icon="file-edit-outline" onPress={() => router.push({ pathname: '/trader/quotes/new', params: { jobId: job.id, title: job.title } })}>Update Quote</Button> : <Button mode="contained" icon="file-document-edit-outline" disabled={!canQuote} onPress={() => router.push({ pathname: '/trader/quotes/new', params: { jobId: job.id, title: job.title } })}>{direct ? 'Quote Direct Lead' : 'Send Quote'}</Button>}
          {!canQuote && !ownQuote ? <Button mode="text" onPress={() => router.push('/trader/subscription')}>Check plan access</Button> : null}
        </View>
      </AppCard>;
    })}
  </Screen>;
}

const styles = StyleSheet.create({
  search: { backgroundColor: colors.surfaceRaised, borderWidth: 1, borderColor: colors.border },
  filters: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: 10, flexWrap: 'wrap' },
  titleBlock: { flex: 1, minWidth: 220, gap: 4 },
  title: { fontWeight: '900', color: colors.charcoal },
  muted: { color: colors.muted, lineHeight: 21 },
  badges: { flexDirection: 'row', gap: 6, flexWrap: 'wrap' },
  photo: { width: '100%', height: 210, borderRadius: 14, backgroundColor: colors.border },
  meta: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  description: { color: colors.text, lineHeight: 22 },
  actions: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
});
