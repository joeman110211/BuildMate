import { Link } from 'expo-router';
import { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Button, Chip, Text } from 'react-native-paper';
import { AppCard } from '@/components/AppCard';
import { EmptyState, LoadingScreen, Screen } from '@/components/Screen';
import { colors } from '@/constants/theme';
import { apiFetch, errorMessage } from '@/lib/api';
import type { Job } from '@/types';

export default function PublicJobsScreen() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  async function load() {
    try {
      setLoading(true);
      setError('');
      setJobs(await apiFetch('/api/public/jobs'));
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { const timer = setTimeout(() => void load(), 0); return () => clearTimeout(timer); }, []);

  if (loading) return <LoadingScreen label="Loading local job requests..." />;
  return <Screen title="Latest job requests" subtitle="Live open jobs customers are posting through BuildMate.">
    {error ? <EmptyState title="Jobs unavailable" body={error} action={<Button onPress={load}>Try again</Button>} /> : null}
    {!error && !jobs.length ? <EmptyState title="No job requests yet" body="New customer requests will appear here." /> : null}
    {!error ? jobs.map((job) => <AppCard key={job.id}>
      <View style={styles.row}>
        <Text variant="titleLarge" style={styles.title}>{job.title}</Text>
        <Chip>{job.status.replace('_', ' ')}</Chip>
      </View>
      <Text style={styles.muted}>{job.category} · {job.propertyType} · {job.locationLabel ?? job.postcode} · {job.budgetRange}</Text>
      <Text>{job.description}</Text>
      <View style={styles.row}>
        <Chip icon="calendar-clock">{job.urgency}</Chip>
        <Link href="/auth/sign-up" asChild><Button mode="contained">Join to quote</Button></Link>
      </View>
    </AppCard>) : null}
  </Screen>;
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 10, flexWrap: 'wrap' },
  title: { flex: 1, minWidth: 220, fontWeight: '900', color: colors.charcoal },
  muted: { color: colors.muted },
});
