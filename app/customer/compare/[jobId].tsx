import { useAuth } from '@clerk/expo';
import type { Href } from 'expo-router';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { Button } from 'react-native-paper';
import { EmptyState, LoadingScreen, Screen } from '@/components/Screen';
import { QuoteComparison } from '@/components/QuoteComparison';
import { apiFetch, errorMessage } from '@/lib/api';
import type { Job, Quote } from '@/types';

export default function CompareQuotesScreen() {
  const { jobId } = useLocalSearchParams<{ jobId: string }>();
  const { getToken } = useAuth();
  const router = useRouter();
  const [data, setData] = useState<{ job: Job; quotes: Quote[] }>();
  const [accepting, setAccepting] = useState<string>();
  const [messaging, setMessaging] = useState<string>();
  const [error, setError] = useState('');
  const load = useCallback(async () => { try { setData(await apiFetch(`/api/jobs/${jobId}/quotes`, {}, getToken)); } catch (e) { setError(errorMessage(e)); } }, [getToken, jobId]);
  useEffect(() => { const timer = setTimeout(() => void load(), 0); return () => clearTimeout(timer); }, [load]);
  async function accept(quote: Quote) {
    try { setAccepting(quote.id); await apiFetch(`/api/quotes/${quote.id}`, { method: 'PATCH', body: JSON.stringify({ action: 'accept' }) }, getToken); router.replace(`/customer/jobs/${jobId}`); }
    catch (e) { setError(errorMessage(e)); } finally { setAccepting(undefined); }
  }
  async function message(quote: Quote) {
    try {
      setMessaging(quote.id);
      setError('');
      const conversation = await apiFetch<{ id: string }>('/api/conversations', { method: 'POST', body: JSON.stringify({ jobId, traderId: quote.traderId }) }, getToken);
      router.push(`/customer/messages/${conversation.id}` as Href);
    } catch (e) { setError(errorMessage(e)); }
    finally { setMessaging(undefined); }
  }
  if (error && !data) return <Screen><EmptyState title="Quotes unavailable" body={error} action={<Button onPress={load}>Try again</Button>} /></Screen>;
  if (!data) return <LoadingScreen />;
  return <Screen title="Compare quotes" subtitle={data.job.title}>
    {error ? <EmptyState title="Something needs attention" body={error} /> : null}
    {!data.quotes.length ? <EmptyState title="No quotes yet" body="We’ll keep them organised here when tradespeople respond." /> : <QuoteComparison quotes={data.quotes} accepting={accepting} messaging={messaging} onAccept={accept} onMessage={message} />}
  </Screen>;
}
