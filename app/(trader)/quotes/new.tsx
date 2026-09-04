import { useAuth } from '@clerk/expo';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { Button, HelperText, SegmentedButtons, Text, TextInput } from 'react-native-paper';
import { AppCard } from '@/components/AppCard';
import { Screen } from '@/components/Screen';
import { apiFetch, errorMessage } from '@/lib/api';
import { calculateQuote, formatMoney, poundsToPence } from '@/lib/money';

export default function NewQuoteScreen() {
  const { jobId, title } = useLocalSearchParams<{ jobId: string; title?: string }>();
  const { getToken } = useAuth();
  const router = useRouter();
  const [labor, setLabor] = useState('');
  const [materials, setMaterials] = useState('');
  const [vat, setVat] = useState('no');
  const [deposit, setDeposit] = useState('');
  const [terms, setTerms] = useState('Deposit due on acceptance. Balance due after completed work and customer approval.');
  const [notes, setNotes] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const totals = useMemo(() => calculateQuote(poundsToPence(labor), poundsToPence(materials), vat === 'yes' ? 0.2 : 0), [labor, materials, vat]);
  async function submit() {
    try { setBusy(true); setError(''); await apiFetch('/api/quotes', { method: 'POST', body: JSON.stringify({ jobId, laborCost: poundsToPence(labor), materialsCost: poundsToPence(materials), vatAmount: totals.vatAmount, depositAmount: poundsToPence(deposit), paymentTerms: terms, notes }) }, getToken); router.replace('/(trader)/dashboard'); }
    catch (e) { setError(errorMessage(e)); } finally { setBusy(false); }
  }
  return <Screen title="Create an itemised quote" subtitle={title ?? 'Customer job'}>
    <TextInput label="Labour (£)" value={labor} onChangeText={setLabor} keyboardType="decimal-pad" mode="outlined" /><TextInput label="Materials (£)" value={materials} onChangeText={setMaterials} keyboardType="decimal-pad" mode="outlined" />
    <Text variant="labelLarge">Add 20% VAT?</Text><SegmentedButtons value={vat} onValueChange={setVat} buttons={[{ value: 'no', label: 'No' }, { value: 'yes', label: 'Yes' }]} />
    <TextInput label="Deposit requested (£)" value={deposit} onChangeText={setDeposit} keyboardType="decimal-pad" mode="outlined" />
    <TextInput label="Payment terms" value={terms} onChangeText={setTerms} mode="outlined" multiline /><TextInput label="Notes / exclusions" value={notes} onChangeText={setNotes} mode="outlined" multiline />
    <AppCard><Text>Net: {formatMoney(totals.net)}</Text><Text>VAT: {formatMoney(totals.vatAmount)}</Text><Text variant="headlineSmall">Total: {formatMoney(totals.totalAmount)}</Text></AppCard>
    <HelperText type="error" visible={Boolean(error)}>{error}</HelperText><Button mode="contained" loading={busy} disabled={busy || totals.totalAmount <= 0 || poundsToPence(deposit) > totals.totalAmount || terms.length < 5} onPress={submit}>Send quote</Button>
  </Screen>;
}
