import { useAuth } from '@clerk/expo';
import { useCallback, useEffect, useState } from 'react';
import { Alert, StyleSheet, View } from 'react-native';
import { Button, Chip, Divider, Text, TextInput } from 'react-native-paper';
import { AppCard } from '@/components/AppCard';
import { EmptyState, LoadingScreen, Screen } from '@/components/Screen';
import { colors } from '@/constants/theme';
import { apiFetch, errorMessage } from '@/lib/api';

type Report = {
  id: string;
  reporterEmail: string | null;
  subjectUserId: string | null;
  subjectEmail: string | null;
  subjectSuspended: boolean | null;
  messageBody: string | null;
  reviewComment: string | null;
  jobTitle: string | null;
  reason: string;
  details: string;
  status: string;
  adminNotes: string;
  createdAt: string;
  resolvedAt: string | null;
};

export default function ModerationScreen() {
  const { getToken } = useAuth();
  const [reports, setReports] = useState<Report[]>([]);
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    try {
      const rows = await apiFetch<Report[]>('/api/admin/reports', {}, getToken);
      setReports(rows);
      setNotes(Object.fromEntries(rows.map((report) => [report.id, report.adminNotes ?? ''])));
      setError('');
    } catch (e) { setError(errorMessage(e)); }
    finally { setLoading(false); }
  }, [getToken]);

  useEffect(() => { const timer = setTimeout(() => void load(), 0); return () => clearTimeout(timer); }, [load]);

  async function update(report: Report, status: 'reviewed' | 'actioned' | 'dismissed', accountAction: 'none' | 'suspend' | 'unsuspend' = 'none') {
    setBusyId(report.id);
    try {
      await apiFetch('/api/admin/reports', { method: 'PATCH', body: JSON.stringify({ id: report.id, status, adminNotes: notes[report.id] ?? '', accountAction }) }, getToken);
      await load();
    } catch (e) { Alert.alert('Moderation action failed', errorMessage(e)); }
    finally { setBusyId(null); }
  }

  function confirmSuspend(report: Report) {
    Alert.alert('Suspend account?', `This blocks ${report.subjectEmail ?? 'the reported account'} from authenticated BuildPair activity and removes trader profiles from public discovery.`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Suspend', style: 'destructive', onPress: () => void update(report, 'actioned', 'suspend') },
    ]);
  }

  if (loading) return <LoadingScreen label="Loading moderation queue…" />;
  return <Screen title="Moderation queue" subtitle="Review reports, record an outcome and suspend abusive accounts without editing the database by hand.">
    {error ? <EmptyState title="Moderation unavailable" body={error} action={<Button onPress={load}>Try again</Button>} /> : null}
    {!error && !reports.length ? <EmptyState title="No reports" body="There are currently no moderation reports to review." /> : reports.map((report) => <AppCard key={report.id}>
      <View style={styles.row}><Chip>{report.status}</Chip><Text style={styles.muted}>{new Date(report.createdAt).toLocaleString()}</Text></View>
      <Text variant="titleMedium" style={styles.title}>{report.reason.replaceAll('_', ' ')}</Text>
      <Text>Reporter: {report.reporterEmail ?? 'Unknown account'}</Text>
      <Text>Reported account: {report.subjectEmail ?? report.subjectUserId ?? 'No account target'}</Text>
      {report.subjectSuspended ? <Chip icon="cancel">Account suspended</Chip> : null}
      {report.jobTitle ? <Text>Job: {report.jobTitle}</Text> : null}
      {report.messageBody ? <><Divider /><Text variant="labelLarge">Reported message</Text><Text>{report.messageBody}</Text></> : null}
      {report.reviewComment ? <><Divider /><Text variant="labelLarge">Reported review</Text><Text>{report.reviewComment}</Text></> : null}
      {report.details ? <Text style={styles.muted}>Report details: {report.details}</Text> : null}
      <TextInput mode="outlined" label="Admin notes" multiline maxLength={4000} value={notes[report.id] ?? ''} onChangeText={(value) => setNotes((current) => ({ ...current, [report.id]: value }))} />
      <View style={styles.actions}>
        <Button disabled={busyId === report.id} onPress={() => void update(report, 'reviewed')}>Mark reviewed</Button>
        <Button disabled={busyId === report.id} onPress={() => void update(report, 'dismissed')}>Dismiss</Button>
        {report.subjectUserId && !report.subjectSuspended ? <Button mode="contained" buttonColor={colors.danger} disabled={busyId === report.id} onPress={() => confirmSuspend(report)}>Suspend & action</Button> : null}
        {report.subjectUserId && report.subjectSuspended ? <Button mode="outlined" disabled={busyId === report.id} onPress={() => void update(report, 'reviewed', 'unsuspend')}>Restore account</Button> : null}
      </View>
    </AppCard>)}
  </Screen>;
}

const styles = StyleSheet.create({ row: { flexDirection: 'row', justifyContent: 'space-between', gap: 8, flexWrap: 'wrap', alignItems: 'center' }, actions: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' }, title: { fontWeight: '800', textTransform: 'capitalize' }, muted: { color: colors.muted } });
