import { useEffect, useState } from 'react';
import { StyleSheet } from 'react-native';
import { Button, Card, Chip, Text } from 'react-native-paper';
import { Screen } from '@/native/components/Screen';
import { useAuth } from '@/native/auth';
import { demoJobs } from '@/native/data/demo';
import { supabase } from '@/native/supabase';
import type { Job } from '@/native/types';
import { colours } from '@/native/theme';

export default function Jobs() {
  const { session, profile } = useAuth();
  const [jobs, setJobs] = useState<Job[]>(demoJobs);
  useEffect(() => {
    if (!supabase || !session) return;
    const load = async () => {
      let query = supabase.from('jobs').select('*').order('created_at', { ascending: false });
      if (profile?.role === 'customer') query = query.eq('customer_id', session.user.id);
      const { data } = await query;
      if (data) setJobs(data as Job[]);
    };
    load();
  }, [session, profile]);
  return <Screen>
    <Text variant="headlineSmall" style={styles.title}>{profile?.role === 'trader' ? 'Local leads' : 'Your jobs'}</Text>
    <Text style={styles.copy}>{profile?.role === 'trader' ? 'Jobs available to quote will appear here.' : 'Create jobs, compare quotes and follow progress.'}</Text>
    {jobs.map((job) => <Card key={job.id} style={styles.card}><Card.Title title={job.title} subtitle={`${job.category} • ${job.budget_range ?? 'Budget not set'}`} right={() => <Chip compact style={styles.chip}>{job.status.replace('_', ' ')}</Chip>} /><Card.Content><Text>{job.description}</Text></Card.Content><Card.Actions><Button>Open</Button>{profile?.role === 'trader' && <Button mode="contained">Quote</Button>}</Card.Actions></Card>)}
  </Screen>;
}
const styles = StyleSheet.create({ title: { color: colours.ink, fontWeight: '800' }, copy: { color: colours.muted, marginVertical: 8, marginBottom: 18 }, card: { backgroundColor: colours.surface, marginBottom: 12 }, chip: { marginRight: 10 } });
