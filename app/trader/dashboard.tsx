import { useAuth } from '@clerk/expo';
import type { Href } from 'expo-router';
import { Link, useRouter } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Image, StyleSheet, View } from 'react-native';
import { Button, Chip, Text } from 'react-native-paper';
import { AppCard } from '@/components/AppCard';
import { EmptyState, LoadingScreen, Screen } from '@/components/Screen';
import { colors } from '@/constants/theme';
import { apiFetch, ApiError, errorMessage } from '@/lib/api';
import type { Job, Quote, TraderProfile } from '@/types';

export default function TraderDashboard() {
  const { getToken } = useAuth();
  const getTokenRef = useRef(getToken);
  const router = useRouter();
  const [profile, setProfile] = useState<TraderProfile>();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [ownQuotes, setOwnQuotes] = useState<Quote[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyQuote, setBusyQuote] = useState<string>();
  const [error, setError] = useState('');

  useEffect(() => {
    getTokenRef.current = getToken;
  }, [getToken]);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const tokenGetter = () => getTokenRef.current();
      const ownProfile = await apiFetch<TraderProfile>('/api/me/profile', {}, tokenGetter);
      setProfile(ownProfile);
      const [jobRows, quoteRows] = await Promise.all([
        apiFetch<Job[]>('/api/jobs', {}, tokenGetter),
        apiFetch<Quote[]>('/api/quotes', {}, tokenGetter),
      ]);
      setJobs(jobRows);
      setOwnQuotes(quoteRows);
    } catch (e) {
      if (e instanceof ApiError && e.status === 404) {
        setProfile(undefined);
      } else {
        setError(errorMessage(e));
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function complete(jobId: string) {
    try {
      await apiFetch(`/api/jobs/${jobId}`, { method: 'PATCH', body: JSON.stringify({ action: 'complete' }) }, () => getTokenRef.current());
      await load();
    } catch (e) {
      setError(errorMessage(e));
    }
  }

  async function withdraw(quoteId: string) {
    try {
      setBusyQuote(quoteId);
      setError('');
      await apiFetch(`/api/quotes/${quoteId}`, { method: 'PATCH', body: JSON.stringify({ action: 'withdraw' }) }, () => getTokenRef.current());
      await load();
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setBusyQuote(undefined);
    }
  }

  if (loading) return <LoadingScreen />;
  if (!profile) return <Screen title="Build your public profile" subtitle="Customers cannot find or trust a blank page."><EmptyState title="Profile setup required" body="Add your trade, skills, business details and self-certification before quoting." action={<Link href="/trader/onboarding" asChild><Button mode="contained">Start setup</Button></Link>} /></Screen>;

  const trialEnds = profile.trialEndsAt ? new Date(profile.trialEndsAt) : null;
  return <Screen title={`Hello, ${profile.businessName}`} subtitle={`${profile.tradeCategory} · ${profile.subscriptionTier} plan`}>
    <View style={styles.actions}><Link href="/trader/subscription" asChild><Button mode="contained" icon="credit-card">Plans & payouts</Button></Link><Link href="/trader/invoices" asChild><Button mode="outlined" icon="file-document">Invoices</Button></Link><Button mode="outlined" onPress={() => router.push(`/(public)/traders/${profile.id}` as Href)}>View public profile</Button></View>
    {profile.isSubscriptionActive && trialEnds ? <AppCard><Text variant="titleMedium">14-day free trial active</Text><Text style={styles.muted}>Your Basic listing is live until {trialEnds.toLocaleDateString('en-GB')}. Stripe subscriptions can be enabled before then.</Text></AppCard> : null}
    {!profile.isSubscriptionActive ? <AppCard><Text variant="titleMedium">Your profile is shareable but not listed</Text><Text style={styles.muted}>Choose Basic to receive and quote direct customer leads, or Featured to also quote open marketplace jobs.</Text><Link href="/trader/subscription" asChild><Button>Compare plans</Button></Link></AppCard> : null}
    {error ? <EmptyState title="Something needs attention" body={error} action={<Button onPress={load}>Try again</Button>} /> : null}
    <Text variant="titleLarge">Relevant jobs</Text>
    {!jobs.length ? <EmptyState title="No jobs available" body={profile.subscriptionTier === 'basic' ? 'Direct customer requests will appear here.' : `New ${profile.tradeCategory.toLowerCase()} jobs inside your working radius will appear here.`} /> : jobs.map((job) => {
      const directLead = job.targetTraderId === profile.userId;
      const canQuote = profile.isSubscriptionActive && (directLead || profile.subscriptionTier === 'featured');
      const location = job.postcode || job.locationLabel;
      const ownQuote = ownQuotes.find((quote) => quote.jobId === job.id);
      const pendingQuote = ownQuote?.status === 'pending' ? ownQuote : undefined;
      return <AppCard key={job.id}><View style={styles.row}><Text variant="titleMedium" style={styles.title}>{job.title}</Text><View style={styles.row}>{directLead && ['open','quoted'].includes(job.status) ? <Chip icon="account-arrow-left">Direct lead</Chip> : null}{pendingQuote ? <Chip icon="file-document-check">Quoted</Chip> : null}<Chip>{job.status.replace('_', ' ')}</Chip></View></View><Text style={styles.muted}>{job.propertyType}{location ? ` · ${location}` : ''} · {job.budgetRange} · {job.urgency}</Text>{job.photos?.[0] ? <Image source={{ uri: job.photos[0] }} style={styles.jobPhoto} /> : null}<Text numberOfLines={4}>{job.description}</Text>{['open','quoted'].includes(job.status) && pendingQuote ? <View style={styles.actions}><Button mode="contained" onPress={() => router.push({ pathname: '/trader/quotes/new', params: { jobId: job.id, title: job.title } })}>Update quote</Button><Button mode="outlined" loading={busyQuote === pendingQuote.id} disabled={Boolean(busyQuote)} onPress={() => withdraw(pendingQuote.id)}>Withdraw quote</Button></View> : null}{['open','quoted'].includes(job.status) && !pendingQuote ? <Button mode="contained" disabled={!canQuote} onPress={() => router.push({ pathname: '/trader/quotes/new', params: { jobId: job.id, title: job.title } })}>{directLead ? 'Quote direct lead' : ownQuote ? 'Send updated quote' : 'Quote this job'}</Button> : null}{job.status === 'in_progress' ? <Button mode="contained" onPress={() => complete(job.id)}>Mark work complete</Button> : null}</AppCard>;
    })}
  </Screen>;
}

const styles = StyleSheet.create({ actions: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' }, row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 8, flexWrap: 'wrap' }, title: { fontWeight: '800' }, muted: { color: colors.muted }, jobPhoto: { width: '100%', height: 220, borderRadius: 10, backgroundColor: colors.border } });
