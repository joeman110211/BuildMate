import { useAuth } from '@clerk/expo';
import { useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Button, Chip, HelperText, Text, TextInput } from 'react-native-paper';
import { AppCard } from '@/components/AppCard';
// Metro and TypeScript resolve the .native/.web implementation; ESLint's generic resolver does not.
// eslint-disable-next-line import/no-unresolved
import { PayMilestoneButton } from '@/components/PayMilestoneButton';
import { EmptyState, LoadingScreen, Screen } from '@/components/Screen';
import { colors } from '@/constants/theme';
import { apiFetch, errorMessage } from '@/lib/api';
import { formatMoney } from '@/lib/money';
import type { Job, Quote, TraderProfile } from '@/types';

type Milestone = { id: string; title: string; amount: number; status: 'pending' | 'completed' | 'paid' };
type Detail = { job: Job; acceptedQuote: Quote | null; milestones: Milestone[]; trader: TraderProfile | null; existingReview: unknown };

export default function JobDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { getToken } = useAuth();
  const [data, setData] = useState<Detail>();
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const load = useCallback(async () => { try { setData(await apiFetch(`/api/jobs/${id}`, {}, getToken)); setError(''); } catch (e) { setError(errorMessage(e)); } }, [getToken, id]);
  useEffect(() => { const timer = setTimeout(() => void load(), 0); return () => clearTimeout(timer); }, [load]);
  async function review() {
    if (!data?.acceptedQuote) return;
    try { setBusy(true); await apiFetch('/api/reviews', { method: 'POST', body: JSON.stringify({ jobId: id, traderId: data.acceptedQuote.traderId, rating, comment }) }, getToken); await load(); }
    catch (e) { setError(errorMessage(e)); } finally { setBusy(false); }
  }
  if (error && !data) return <Screen><EmptyState title="Job unavailable" body={error} /></Screen>;
  if (!data) return <LoadingScreen />;
  const reviewAllowed = data.job.status === 'completed' && data.milestones.some((m) => m.title !== 'Deposit' && m.status === 'paid') && !data.existingReview;
  return <Screen title={data.job.title} subtitle={`${data.job.category} · ${data.job.status.replace('_', ' ')}`}>
    <AppCard><View style={styles.row}><Chip>{data.job.propertyType}</Chip><Chip>{data.job.urgency}</Chip><Chip>{data.job.budgetRange}</Chip></View><Text>{data.job.description}</Text>{data.job.aiGeneratedSpec ? <Text variant="bodySmall" style={styles.muted}>Drafted with AI and approved by the customer.</Text> : null}</AppCard>
    {data.acceptedQuote ? <><Text variant="titleLarge">Awarded to {data.trader?.businessName ?? 'tradesperson'}</Text><AppCard><Text>Total: {formatMoney(data.acceptedQuote.totalAmount)}</Text><Text>{data.acceptedQuote.paymentTerms}</Text></AppCard>
      <Text variant="titleLarge">Payments</Text>{data.milestones.map((milestone) => <AppCard key={milestone.id}><View style={styles.row}><View><Text variant="titleMedium">{milestone.title}</Text><Text style={styles.muted}>{formatMoney(milestone.amount)}</Text></View><Chip>{milestone.status}</Chip></View>{milestone.status !== 'paid' && (milestone.title === 'Deposit' || milestone.status === 'completed') ? <PayMilestoneButton milestoneId={milestone.id} onPaid={() => setTimeout(load, 1500)} /> : null}</AppCard>)}
    </> : <EmptyState title="No quote accepted" body="Compare quotes when they arrive, then accept the best fit—not just the cheapest number." />}
    {data.existingReview ? <AppCard><Text variant="titleMedium">Review submitted ✓</Text><Text style={styles.muted}>Your verified review is now on the trader’s public profile.</Text></AppCard> : null}
    {reviewAllowed ? <AppCard><Text variant="titleMedium">Leave a verified review</Text><View style={styles.stars}>{[1,2,3,4,5].map((star) => <Button key={star} compact mode={rating === star ? 'contained' : 'outlined'} onPress={() => setRating(star)}>{star}★</Button>)}</View><TextInput label="What was the work and how did it go?" value={comment} onChangeText={setComment} mode="outlined" multiline /><HelperText type="error" visible={Boolean(error)}>{error}</HelperText><Button mode="contained" loading={busy} disabled={comment.trim().length < 10 || busy} onPress={review}>Publish verified review</Button></AppCard> : null}
  </Screen>;
}

const styles = StyleSheet.create({ row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }, muted: { color: colors.muted }, stars: { flexDirection: 'row', gap: 6, flexWrap: 'wrap' } });
