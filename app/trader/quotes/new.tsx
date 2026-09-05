import { useAuth } from '@clerk/expo';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useMemo, useRef, useState } from 'react';
import { View } from 'react-native';
import { Button, Chip, HelperText, SegmentedButtons, Text, TextInput } from 'react-native-paper';
import { AppCard } from '@/components/AppCard';
import { Screen } from '@/components/Screen';
import { apiFetch, errorMessage } from '@/lib/api';
import { calculateQuote, formatMoney, poundsToPence } from '@/lib/money';
import type { Job } from '@/types';

type AiQuote = {
  laborCost: number;
  materialsCost: number;
  vatAmount: number;
  depositAmount: number;
  scope: string;
  exclusions: string;
  paymentTerms: string;
  durationDays?: number;
  warrantyMonths?: number;
  notes: string;
  source: 'ai' | 'rules';
};

export default function NewQuoteScreen() {
  const { jobId, title } = useLocalSearchParams<{ jobId: string; title?: string }>();
  const { getToken } = useAuth();
  const getTokenRef = useRef(getToken);
  const router = useRouter();
  const [job, setJob] = useState<Job>();
  const [labor, setLabor] = useState('');
  const [materials, setMaterials] = useState('');
  const [vat, setVat] = useState('no');
  const [deposit, setDeposit] = useState('');
  const [validDays, setValidDays] = useState('14');
  const [terms, setTerms] = useState('Deposit due on acceptance. Balance due after completed work and customer approval.');
  const [scope, setScope] = useState('');
  const [exclusions, setExclusions] = useState('');
  const [notes, setNotes] = useState('');
  const [durationDays, setDurationDays] = useState('');
  const [warrantyMonths, setWarrantyMonths] = useState('12');
  const [proposedStartDate, setProposedStartDate] = useState('');
  const [labourDays, setLabourDays] = useState('');
  const [dayRate, setDayRate] = useState('');
  const [aiBusy, setAiBusy] = useState(false);
  const [aiSource, setAiSource] = useState<string>();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => { getTokenRef.current = getToken; }, [getToken]);
  useEffect(() => {
    void apiFetch<Job[]>('/api/jobs', {}, () => getTokenRef.current()).then((rows) => setJob(rows.find((item) => item.id === jobId))).catch(() => undefined);
  }, [jobId]);

  const totals = useMemo(() => calculateQuote(poundsToPence(labor), poundsToPence(materials), vat === 'yes' ? 0.2 : 0), [labor, materials, vat]);
  const depositAmount = poundsToPence(deposit);
  const depositTooHigh = depositAmount > 0 && depositAmount >= totals.totalAmount;

  async function buildWithAi() {
    try {
      setAiBusy(true); setError('');
      const result = await apiFetch<AiQuote>('/api/ai/quote-assistant', {
        method: 'POST',
        body: JSON.stringify({
          jobTitle: job?.title || title || 'BuildPair job',
          jobDescription: job?.description || 'Customer job details are available in BuildPair.',
          tradeCategory: job?.category || 'General Building',
          labourDays: labourDays ? Number(labourDays) : undefined,
          dayRate: dayRate ? poundsToPence(dayRate) : undefined,
          materialsEstimate: materials ? poundsToPence(materials) : undefined,
          vatRegistered: vat === 'yes',
        }),
      }, () => getTokenRef.current());
      if (result.laborCost) setLabor((result.laborCost / 100).toFixed(2));
      if (result.materialsCost) setMaterials((result.materialsCost / 100).toFixed(2));
      if (result.depositAmount) setDeposit((result.depositAmount / 100).toFixed(2));
      setScope(result.scope); setExclusions(result.exclusions); setTerms(result.paymentTerms); setNotes(result.notes);
      if (result.durationDays) setDurationDays(String(result.durationDays));
      if (result.warrantyMonths != null) setWarrantyMonths(String(result.warrantyMonths));
      setAiSource(result.source);
    } catch (e) { setError(errorMessage(e)); }
    finally { setAiBusy(false); }
  }

  async function submit() {
    const validUntil = new Date(Date.now() + Number(validDays) * 24 * 60 * 60 * 1000).toISOString();
    let proposedStartAt: string | undefined;
    if (proposedStartDate.trim()) {
      const date = new Date(`${proposedStartDate.trim()}T08:00:00`);
      if (Number.isNaN(date.getTime())) { setError('Enter the proposed start date as YYYY-MM-DD.'); return; }
      proposedStartAt = date.toISOString();
    }
    try {
      setBusy(true); setError('');
      await apiFetch('/api/quotes', {
        method: 'POST',
        body: JSON.stringify({
          jobId,
          laborCost: poundsToPence(labor),
          materialsCost: poundsToPence(materials),
          vatAmount: totals.vatAmount,
          depositAmount,
          paymentTerms: terms,
          scope: scope || undefined,
          exclusions: exclusions || undefined,
          notes: notes || undefined,
          durationDays: durationDays ? Number(durationDays) : undefined,
          warrantyMonths: warrantyMonths ? Number(warrantyMonths) : undefined,
          proposedStartAt,
          validUntil,
        }),
      }, getToken);
      router.replace('/trader/dashboard');
    } catch (e) { setError(errorMessage(e)); }
    finally { setBusy(false); }
  }

  return <Screen title="Create an itemised quote" subtitle={job?.title ?? title ?? 'Customer job'}>
    {job ? <AppCard><Text variant="titleMedium">{job.title}</Text><Text>{job.description}</Text><View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}><Chip compact>{job.category}</Chip><Chip compact>{job.budgetRange}</Chip>{job.isEmergency ? <Chip compact icon="alert">Emergency</Chip> : null}</View></AppCard> : null}

    <AppCard>
      <Text variant="titleLarge">Build the numbers</Text>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}><TextInput style={{ flex: 1, minWidth: 150 }} label="Labour days" value={labourDays} onChangeText={setLabourDays} keyboardType="decimal-pad" mode="outlined" /><TextInput style={{ flex: 1, minWidth: 150 }} label="Day rate (£)" value={dayRate} onChangeText={setDayRate} keyboardType="decimal-pad" mode="outlined" /></View>
      <TextInput label="Labour total (£)" value={labor} onChangeText={setLabor} keyboardType="decimal-pad" mode="outlined" />
      <TextInput label="Materials (£)" value={materials} onChangeText={setMaterials} keyboardType="decimal-pad" mode="outlined" />
      <Text variant="labelLarge">Add 20% VAT?</Text><SegmentedButtons value={vat} onValueChange={setVat} buttons={[{ value: 'no', label: 'No' }, { value: 'yes', label: 'Yes' }]} />
      <Button mode="contained-tonal" icon="creation" loading={aiBusy} disabled={aiBusy || !job} onPress={() => void buildWithAi()}>Draft quote with BuildPair AI</Button>
      {aiSource ? <HelperText type="info">{aiSource === 'ai' ? 'AI draft created' : 'Smart fallback draft created'} ✓ Review every detail before sending.</HelperText> : null}
    </AppCard>

    <AppCard>
      <Text variant="titleLarge">Scope & programme</Text>
      <TextInput label="Included scope" value={scope} onChangeText={setScope} mode="outlined" multiline numberOfLines={5} />
      <TextInput label="Exclusions / assumptions" value={exclusions} onChangeText={setExclusions} mode="outlined" multiline numberOfLines={4} />
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}><TextInput style={{ flex: 1, minWidth: 160 }} label="Estimated duration (days)" value={durationDays} onChangeText={setDurationDays} keyboardType="number-pad" mode="outlined" /><TextInput style={{ flex: 1, minWidth: 160 }} label="Warranty (months)" value={warrantyMonths} onChangeText={setWarrantyMonths} keyboardType="number-pad" mode="outlined" /></View>
      <TextInput label="Proposed start date (YYYY-MM-DD)" value={proposedStartDate} onChangeText={setProposedStartDate} mode="outlined" />
    </AppCard>

    <AppCard>
      <Text variant="titleLarge">Payment & validity</Text>
      <TextInput label="Deposit requested (£)" value={deposit} onChangeText={setDeposit} keyboardType="decimal-pad" mode="outlined" />
      <HelperText type="error" visible={depositTooHigh}>Deposit must be less than the total so a final balance remains.</HelperText>
      <Text variant="labelLarge">Quote valid for</Text><SegmentedButtons value={validDays} onValueChange={setValidDays} buttons={[{ value: '7', label: '7 days' }, { value: '14', label: '14 days' }, { value: '30', label: '30 days' }]} />
      <TextInput label="Payment terms" value={terms} onChangeText={setTerms} mode="outlined" multiline />
      <TextInput label="Additional notes" value={notes} onChangeText={setNotes} mode="outlined" multiline />
    </AppCard>

    <AppCard><Text>Net: {formatMoney(totals.net)}</Text><Text>VAT: {formatMoney(totals.vatAmount)}</Text><Text variant="headlineSmall">Total: {formatMoney(totals.totalAmount)}</Text></AppCard>
    <HelperText type="error" visible={Boolean(error)}>{error}</HelperText><Button mode="contained" loading={busy} disabled={busy || totals.totalAmount <= 0 || depositTooHigh || terms.length < 5} onPress={() => void submit()}>Send quote</Button>
  </Screen>;
}
