import { useAuth } from '@clerk/expo';
import type { Href } from 'expo-router';
import { Link, useRouter } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Button, Chip, ProgressBar, Text } from 'react-native-paper';
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
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [now] = useState(() => Date.now());

  useEffect(() => { getTokenRef.current = getToken; }, [getToken]);
  const load = useCallback(async () => {
    try {
      setLoading(true); setError('');
      const tokenGetter = () => getTokenRef.current();
      const ownProfile = await apiFetch<TraderProfile>('/api/me/profile', {}, tokenGetter);
      setProfile(ownProfile);
      const [jobRows, quoteRows] = await Promise.all([apiFetch<Job[]>('/api/jobs', {}, tokenGetter), apiFetch<Quote[]>('/api/quotes', {}, tokenGetter)]);
      setJobs(jobRows); setQuotes(quoteRows);
    } catch (e) {
      if (e instanceof ApiError && e.status === 404) setProfile(undefined);
      else setError(errorMessage(e));
    } finally { setLoading(false); }
  }, []);
  useEffect(() => { const timer = setTimeout(() => void load(), 0); return () => clearTimeout(timer); }, [load]);

  if (loading) return <LoadingScreen />;
  if (!profile) return <Screen title="Build your tradesperson profile" subtitle="A strong profile is your shop window on BuildMate."><EmptyState title="Your profile is waiting" body="Add your trade, service area, skills and business details before customers can find you." action={<Link href="/trader/onboarding" asChild><Button mode="contained">Build my profile</Button></Link>} /></Screen>;

  const pendingQuoteJobIds = new Set(quotes.filter((quote) => quote.status === 'pending').map((quote) => quote.jobId));
  const newLeads = jobs.filter((job) => ['open', 'quoted'].includes(job.status) && !pendingQuoteJobIds.has(job.id));
  const activeJobs = jobs.filter((job) => job.status === 'in_progress');
  const completedJobs = jobs.filter((job) => job.status === 'completed');
  const pendingQuotes = quotes.filter((quote) => quote.status === 'pending');
  const trialEnds = profile.trialEndsAt ? new Date(profile.trialEndsAt) : null;
  const trialDays = trialEnds ? Math.max(0, Math.ceil((trialEnds.getTime() - now) / 86400000)) : 0;

  return <Screen title={`Hello, ${profile.businessName}`} subtitle={`${profile.tradeCategory}${profile.locationLabel ? ` · ${profile.locationLabel}` : ''}`}>
    {profile.isSubscriptionActive && trialEnds ? <AppCard style={styles.trialCard}>
      <View style={styles.row}><View style={styles.flex}><Text variant="titleLarge" style={styles.cardTitle}>14-day free trial</Text><Text style={styles.muted}>{trialDays} day{trialDays === 1 ? '' : 's'} remaining · Your BuildMate listing is live.</Text></View><Chip icon="gift-outline">Trial active</Chip></View>
      <ProgressBar progress={Math.max(0, Math.min(1, trialDays / 14))} color={colors.primary} style={styles.progress} />
    </AppCard> : null}

    <View style={styles.stats}>
      <AppCard style={styles.stat}><Text variant="headlineMedium" style={styles.statNumber}>{newLeads.length}</Text><Text style={styles.statLabel}>New leads</Text></AppCard>
      <AppCard style={styles.stat}><Text variant="headlineMedium" style={styles.statNumber}>{pendingQuotes.length}</Text><Text style={styles.statLabel}>Quotes awaiting reply</Text></AppCard>
      <AppCard style={styles.stat}><Text variant="headlineMedium" style={styles.statNumber}>{activeJobs.length}</Text><Text style={styles.statLabel}>Active jobs</Text></AppCard>
      <AppCard style={styles.stat}><Text variant="headlineMedium" style={styles.statNumber}>{completedJobs.length}</Text><Text style={styles.statLabel}>Completed</Text></AppCard>
    </View>

    <View style={styles.sectionHeading}><Text variant="titleLarge" style={styles.cardTitle}>Quick actions</Text></View>
    <View style={styles.quickActions}>
      <Link href="/trader/job-board" asChild><Button mode="contained" icon="briefcase-search-outline" contentStyle={styles.actionButton}>Find Jobs</Button></Link>
      <Link href="/trader/invoices/new" asChild><Button mode="contained-tonal" icon="file-document-edit-outline" contentStyle={styles.actionButton}>Create Invoice</Button></Link>
      <Link href="/trader/onboarding" asChild><Button mode="outlined" icon="account-edit-outline" contentStyle={styles.actionButton}>Edit Profile</Button></Link>
      <Button mode="outlined" icon="eye-outline" contentStyle={styles.actionButton} onPress={() => router.push(`/(public)/traders/${profile.id}` as Href)}>View Public Profile</Button>
    </View>

    {error ? <EmptyState title="Something needs attention" body={error} action={<Button onPress={load}>Try again</Button>} /> : null}

    <View style={styles.sectionHeading}><Text variant="titleLarge" style={styles.cardTitle}>Recent opportunities</Text><Link href="/trader/job-board" asChild><Button compact>View all</Button></Link></View>
    {!newLeads.length ? <EmptyState title="No new leads right now" body={`New ${profile.tradeCategory.toLowerCase()} jobs matching your account will appear here.`} /> : newLeads.slice(0, 3).map((job) => <AppCard key={job.id}>
      <View style={styles.row}><Text variant="titleMedium" style={styles.cardTitle}>{job.title}</Text>{job.targetTraderId === profile.userId ? <Chip compact icon="account-arrow-left">Direct request</Chip> : <Chip compact>New</Chip>}</View>
      <Text style={styles.muted}>📍 {job.postcode || job.locationLabel || 'Location available in job'} · {job.budgetRange}</Text>
      <Text numberOfLines={2} style={styles.description}>{job.description}</Text>
      <Button mode="outlined" onPress={() => router.push('/trader/job-board')}>View opportunity</Button>
    </AppCard>)}
  </Screen>;
}

const styles = StyleSheet.create({
  trialCard: { backgroundColor: colors.surfaceSoft },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 10, flexWrap: 'wrap' },
  flex: { flex: 1, minWidth: 220 },
  cardTitle: { fontWeight: '900', color: colors.charcoal },
  muted: { color: colors.muted, lineHeight: 21 },
  progress: { height: 7, borderRadius: 4, backgroundColor: colors.surfaceStrong },
  stats: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  stat: { flexGrow: 1, flexBasis: 145, minWidth: 135, paddingVertical: 16 },
  statNumber: { color: colors.primary, fontWeight: '900' },
  statLabel: { color: colors.muted, fontWeight: '700' },
  sectionHeading: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8, flexWrap: 'wrap', marginTop: 2 },
  quickActions: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  actionButton: { minHeight: 48 },
  description: { color: colors.text, lineHeight: 21 },
});
