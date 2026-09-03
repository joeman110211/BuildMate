import { useAuth } from '@clerk/expo';
import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Button, Checkbox, HelperText, ProgressBar, Text, TextInput } from 'react-native-paper';
import { AppCard } from '@/components/AppCard';
import { FormSelect } from '@/components/FormSelect';
import { PillSelector } from '@/components/PillSelector';
import { Screen } from '@/components/Screen';
import { RADIUS_OPTIONS, SUB_SKILLS, TRADE_CATEGORIES } from '@/constants/options';
import { colors } from '@/constants/theme';
import { apiFetch, errorMessage } from '@/lib/api';

export default function TraderOnboarding() {
  const { getToken } = useAuth();
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [businessName, setBusinessName] = useState('');
  const [tradeCategory, setTradeCategory] = useState<(typeof TRADE_CATEGORIES)[number]>();
  const [subSkills, setSubSkills] = useState<string[]>([]);
  const [radius, setRadius] = useState('15');
  const [bio, setBio] = useState('');
  const [qualificationsText, setQualificationsText] = useState('');
  const [gasSafe, setGasSafe] = useState('');
  const [trustMark, setTrustMark] = useState('');
  const [facebook, setFacebook] = useState('');
  const [instagram, setInstagram] = useState('');
  const [tiktok, setTiktok] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [photosText, setPhotosText] = useState('');
  const [certified, setCertified] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const valid = useMemo(() => [Boolean(businessName.trim().length >= 2 && tradeCategory && subSkills.length), bio.trim().length >= 30, certified][step], [bio, businessName, certified, step, subSkills, tradeCategory]);

  async function save() {
    if (!tradeCategory) return;
    try {
      setBusy(true); setError('');
      const links = { gasSafe, trustMark, facebook, instagram, tiktok, whatsapp };
      await apiFetch('/api/me', { method: 'PUT', body: JSON.stringify({ businessName, tradeCategory, subSkills, bio, radiusMiles: Number(radius), qualifications: qualificationsText.split('\n').map((x) => x.trim()).filter(Boolean), externalLinks: links, photos: photosText.split('\n').map((x) => x.trim()).filter(Boolean), selfCertified: certified }) }, getToken);
      router.replace('/(trader)/dashboard');
    } catch (e) { setError(errorMessage(e)); } finally { setBusy(false); }
  }

  return <Screen title="Set up your trade profile" subtitle="A clear profile wins better work. Empty waffle does not.">
    <ProgressBar progress={(step + 1) / 3} color={colors.primary} /><Text variant="labelLarge">Step {step + 1} of 3</Text>
    {step === 0 ? <AppCard><TextInput label="Business or trading name" value={businessName} onChangeText={setBusinessName} mode="outlined" /><FormSelect label="Primary trade" value={tradeCategory} options={TRADE_CATEGORIES} onChange={(value) => { setTradeCategory(value); setSubSkills([]); }} />{tradeCategory ? <><Text variant="labelLarge">Specialist skills</Text><PillSelector options={SUB_SKILLS[tradeCategory]} values={subSkills} onChange={setSubSkills} /></> : null}<FormSelect label="Working radius (miles)" value={radius} options={RADIUS_OPTIONS} onChange={setRadius} /></AppCard> : null}
    {step === 1 ? <AppCard><TextInput label="Business bio" value={bio} onChangeText={setBio} mode="outlined" multiline numberOfLines={6} /><HelperText type="info">Minimum 30 characters. Say what you do, where and what makes you dependable.</HelperText><TextInput label="Qualifications (one per line)" value={qualificationsText} onChangeText={setQualificationsText} mode="outlined" multiline /><Text variant="titleMedium">Public register and social links</Text>{([['Gas Safe register URL', gasSafe, setGasSafe], ['TrustMark URL', trustMark, setTrustMark], ['Facebook URL', facebook, setFacebook], ['Instagram URL', instagram, setInstagram], ['TikTok URL', tiktok, setTiktok], ['WhatsApp click-to-chat URL', whatsapp, setWhatsapp]] as const).map(([label, value, setter]) => <TextInput key={label} label={label} value={value} onChangeText={setter} mode="outlined" autoCapitalize="none" />)}<TextInput label="Gallery photo URLs (one per line)" value={photosText} onChangeText={setPhotosText} mode="outlined" multiline /><HelperText type="info">Use permanent HTTPS image URLs. Up to 20.</HelperText></AppCard> : null}
    {step === 2 ? <AppCard><Text variant="titleLarge">Self-certification</Text><Text>BuildMate lists what you declare; it does not pretend to be an accreditation body. Customers are clearly told to verify your documents and register links.</Text><View style={styles.check}><Checkbox status={certified ? 'checked' : 'unchecked'} onPress={() => setCertified((x) => !x)} /><Text style={styles.checkText} onPress={() => setCertified((x) => !x)}>I self-certify that I hold valid public liability insurance and required trade accreditations.</Text></View></AppCard> : null}
    <HelperText type="error" visible={Boolean(error)}>{error}</HelperText>
    <View style={styles.actions}>{step > 0 ? <Button onPress={() => setStep((x) => x - 1)}>Back</Button> : <View />}{step < 2 ? <Button mode="contained" disabled={!valid} onPress={() => setStep((x) => x + 1)}>Continue</Button> : <Button mode="contained" loading={busy} disabled={!valid || busy} onPress={save}>Publish profile</Button>}</View>
  </Screen>;
}

const styles = StyleSheet.create({ check: { flexDirection: 'row', alignItems: 'flex-start', gap: 6 }, checkText: { flex: 1, lineHeight: 22, paddingTop: 8 }, actions: { flexDirection: 'row', justifyContent: 'space-between' } });
