import { useAuth } from '@clerk/expo';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { Button, HelperText, SegmentedButtons, Text, TextInput } from 'react-native-paper';
import { AIJobSpecModal } from '@/components/AIJobSpecModal';
import { FormSelect } from '@/components/FormSelect';
import { Screen } from '@/components/Screen';
import { BUDGET_OPTIONS, PROPERTY_TYPES, TRADE_CATEGORIES, URGENCY_OPTIONS } from '@/constants/options';
import { apiFetch, errorMessage } from '@/lib/api';

export default function NewJobScreen() {
  const { getToken } = useAuth();
  const router = useRouter();
  const { traderId, traderName } = useLocalSearchParams<{ traderId?: string; traderName?: string }>();
  const [category, setCategory] = useState<(typeof TRADE_CATEGORIES)[number]>();
  const [propertyType, setPropertyType] = useState<(typeof PROPERTY_TYPES)[number]>();
  const [urgency, setUrgency] = useState<(typeof URGENCY_OPTIONS)[number]>();
  const [budgetRange, setBudgetRange] = useState<(typeof BUDGET_OPTIONS)[number]>();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [aiGeneratedSpec, setAiGeneratedSpec] = useState<string | null>(null);
  const [mode, setMode] = useState('manual');
  const [showAi, setShowAi] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  async function submit() {
    if (!category || !propertyType || !urgency || !budgetRange) return;
    try { setBusy(true); setError(''); await apiFetch('/api/jobs', { method: 'POST', body: JSON.stringify({ targetTraderId: traderId ?? null, title, category, propertyType, urgency, budgetRange, description, aiGeneratedSpec }) }, getToken); router.replace('/(customer)/dashboard'); }
    catch (e) { setError(errorMessage(e)); } finally { setBusy(false); }
  }
  const readyForAi = Boolean(category && propertyType);
  const complete = Boolean(category && propertyType && urgency && budgetRange && title.trim().length >= 5 && description.trim().length >= 30);
  return <Screen title="Tell us about the job" subtitle="Clear details get better quotes and fewer awkward surprises.">
    {traderName ? <Text variant="titleMedium">Direct quote request for {traderName}</Text> : null}
    <FormSelect label="Trade category" value={category} options={TRADE_CATEGORIES} onChange={setCategory} />
    <FormSelect label="Property type" value={propertyType} options={PROPERTY_TYPES} onChange={setPropertyType} />
    <FormSelect label="Urgency" value={urgency} options={URGENCY_OPTIONS} onChange={setUrgency} />
    <FormSelect label="Budget bracket" value={budgetRange} options={BUDGET_OPTIONS} onChange={setBudgetRange} />
    <TextInput label="Short job title" value={title} onChangeText={setTitle} mode="outlined" maxLength={120} />
    <Text variant="titleMedium">Write the description</Text>
    <SegmentedButtons value={mode} onValueChange={setMode} buttons={[{ value: 'manual', label: 'Write it myself' }, { value: 'ai', label: 'AI helper' }]} />
    {mode === 'ai' ? <Button mode="outlined" icon="creation" disabled={!readyForAi} onPress={() => setShowAi(true)}>{aiGeneratedSpec ? 'Improve with AI again' : 'Answer 4 simple questions'}</Button> : null}
    {mode === 'ai' && !readyForAi ? <HelperText type="info">Choose a category and property type first.</HelperText> : null}
    <TextInput label="Detailed job description" value={description} onChangeText={(value) => { setDescription(value); if (value !== aiGeneratedSpec) setAiGeneratedSpec(null); }} mode="outlined" multiline numberOfLines={10} maxLength={5000} />
    <HelperText type="info">{description.length}/5000 characters {aiGeneratedSpec ? '· AI draft—checked by you' : ''}</HelperText>
    <HelperText type="error" visible={Boolean(error)}>{error}</HelperText>
    <Button mode="contained" loading={busy} disabled={!complete || busy} onPress={submit}>Publish job</Button>
    {category && propertyType ? <AIJobSpecModal visible={showAi} category={category} propertyType={propertyType} onDismiss={() => setShowAi(false)} onGenerated={(spec) => { setDescription(spec); setAiGeneratedSpec(spec); }} /> : null}
  </Screen>;
}
