import { useAuth } from '@clerk/expo';
import type { Href } from 'expo-router';
import { Link, useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Button, Chip, Text } from 'react-native-paper';
import { AppCard } from '@/components/AppCard';
import { EmptyState, LoadingScreen, Screen } from '@/components/Screen';
import { colors } from '@/constants/theme';
import { apiFetch, errorMessage } from '@/lib/api';
import type { Job } from '@/types';

export default function CustomerDashboard() {
  const { getToken } = useAuth();
  const router = useRouter();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const load = useCallback(async () => { try { setJobs(await apiFetch('/api/jobs', {}, getToken)); setError(''); } catch (e) { setError(errorMessage(e)); } finally { setLoading(false); } }, [getToken]);
  useEffect(() => { const timer = setTimeout(() => void load(), 0); return () => clearTimeout(timer); }, [load]);
  if (loading) return <LoadingScreen />;
  return <Screen title="Your jobs" subtitle="Post the work once, then compare proper itemised quotes.">
    <Link href="/customer/new-job" asChild><Button mode="contained" icon="plus">Post a new job</Button></Link>
    {error ? <EmptyState title="Couldn’t load jobs" body={error} action={<Button onPress={load}>Try again</Button>} /> : null}
    {!error && !jobs.length ? <EmptyState title="No jobs yet" body="Describe what you need and BuildMate will keep the quotes organised." action={<Link href="/customer/new-job" asChild><Button mode="contained">Post your first job</Button></Link>} /> : jobs.map((job) => <AppCard key={job.id}>
      <View style={styles.row}><Text variant="titleMedium" style={styles.title}>{job.title}</Text><Chip>{job.status.replace('_', ' ')}</Chip></View>
      <Text style={styles.muted}>{job.category}{job.locationLabel ? ` · ${job.locationLabel}` : ''}{job.postcode ? ` · ${job.postcode}` : ''} · {job.budgetRange} · {job.urgency}</Text><Text numberOfLines={3}>{job.description}</Text>
      <View style={styles.row}><Button onPress={() => router.push(`/customer/jobs/${job.id}` as Href)}>View job</Button><Button mode="outlined" disabled={!['open','quoted'].includes(job.status)} onPress={() => router.push(`/customer/compare/${job.id}` as Href)}>Compare quotes</Button></View>
    </AppCard>)}
  </Screen>;
}

const styles = StyleSheet.create({ row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }, title: { fontWeight: '800' }, muted: { color: colors.muted } });
