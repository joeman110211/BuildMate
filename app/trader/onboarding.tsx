import { useAuth } from '@clerk/expo';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Button, Chip, HelperText, ProgressBar, Text, TextInput } from 'react-native-paper';
import { AppCard } from '@/components/AppCard';
import { FormSelect } from '@/components/FormSelect';
import { PhotoUploader } from '@/components/PhotoUploader';
import { PillSelector } from '@/components/PillSelector';
import { Screen } from '@/components/Screen';
import { RADIUS_OPTIONS, SUB_SKILLS, TRADE_CATEGORIES, TRADER_BIO_MIN_LENGTH } from '@/constants/options';
import { colors } from '@/constants/theme';
import { apiFetch, ApiError, errorMessage } from '@/lib/api';
import type { BeforeAfterProject, TraderProfile, TraderProfileColour, TraderProfileTemplate } from '@/types';

const TEMPLATES: { id: TraderProfileTemplate; title: string; body: string }[] = [
  { id: 'classic', title: 'Classic', body: 'Traditional business profile with trust, services and reviews front and centre.' },
  { id: 'portfolio', title: 'Portfolio', body: 'Image-led layout that puts finished work and before/after projects first.' },
  { id: 'modern', title: 'Modern', body: 'Bold branded header with quick stats, strong calls to action and clean sections.' },
];

const COLOURS: { id: TraderProfileColour; label: string; hex: string }[] = [
  { id: 'burnt_orange', label: 'Orange', hex: '#D35400' },
  { id: 'navy', label: 'Navy', hex: '#17324D' },
  { id: 'forest', label: 'Forest', hex: '#276749' },
  { id: 'charcoal', label: 'Charcoal', hex: '#343A40' },
  { id: 'burgundy', label: 'Burgundy', hex: '#7A2432' },
];

export default function TraderOnboarding() {
  const { getToken } = useAuth();
  const getTokenRef = useRef(getToken);
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [businessName, setBusinessName] = useState('');
  const [tradeCategory, setTradeCategory] = useState<(typeof TRADE_CATEGORIES)[number]>();
  const [subSkills, setSubSkills] = useState<string[]>([]);
  const [postcode, setPostcode] = useState('');
  const [radius, setRadius] = useState('15');
  const [bio, setBio] = useState('');
  const [qualificationsText, setQualificationsText] = useState('');
  const [yearsExperience, setYearsExperience] = useState('');
  const [yearEstablished, setYearEstablished] = useState('');
  const [serviceAreasText, setServiceAreasText] = useState('');
  const [gasSafe, setGasSafe] = useState('');
  const [trustMark, setTrustMark] = useState('');
  const [facebook, setFacebook] = useState('');
  const [instagram, setInstagram] = useState('');
  const [tiktok, setTiktok] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [photos, setPhotos] = useState<string[]>([]);
  const [coverPhoto, setCoverPhoto] = useState<string[]>([]);
  const [profileImage, setProfileImage] = useState<string[]>([]);
  const [logo, setLogo] = useState<string[]>([]);
  const [template, setTemplate] = useState<TraderProfileTemplate>('classic');
  const [colourTheme, setColourTheme] = useState<TraderProfileColour>('burnt_orange');
  const [beforeAfterProjects, setBeforeAfterProjects] = useState<BeforeAfterProject[]>([]);
  const [beforeDraft, setBeforeDraft] = useState<string[]>([]);
  const [afterDraft, setAfterDraft] = useState<string[]>([]);
  const [projectCaption, setProjectCaption] = useState('');
  const [certified, setCertified] = useState(false);
  const [busy, setBusy] = useState(false);
  const [loadingExisting, setLoadingExisting] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => { getTokenRef.current = getToken; }, [getToken]);

  const loadExisting = useCallback(async () => {
    try {
      const profile = await apiFetch<TraderProfile>('/api/me/profile', {}, () => getTokenRef.current());
      setBusinessName(profile.businessName ?? '');
      if (TRADE_CATEGORIES.includes(profile.tradeCategory as (typeof TRADE_CATEGORIES)[number])) setTradeCategory(profile.tradeCategory as (typeof TRADE_CATEGORIES)[number]);
      setSubSkills(profile.subSkills ?? []);
      setPostcode(profile.postcode ?? '');
      setRadius(String(profile.radiusMiles ?? 15));
      setBio(profile.bio ?? '');
      setQualificationsText((profile.qualifications ?? []).join('\n'));
      setPhotos(profile.photos ?? []);
      setTemplate(profile.template ?? 'classic');
      setColourTheme(profile.colourTheme ?? 'burnt_orange');
      setCoverPhoto(profile.coverPhotoUrl ? [profile.coverPhotoUrl] : []);
      setProfileImage(profile.profileImageUrl ? [profile.profileImageUrl] : []);
      setLogo(profile.logoUrl ? [profile.logoUrl] : []);
      setYearsExperience(profile.yearsExperience ? String(profile.yearsExperience) : '');
      setYearEstablished(profile.yearEstablished ? String(profile.yearEstablished) : '');
      setServiceAreasText((profile.serviceAreas ?? []).join(', '));
      setBeforeAfterProjects(profile.beforeAfterProjects ?? []);
      setGasSafe(profile.externalLinks?.gasSafe ?? '');
      setTrustMark(profile.externalLinks?.trustMark ?? '');
      setFacebook(profile.externalLinks?.facebook ?? '');
      setInstagram(profile.externalLinks?.instagram ?? '');
      setTiktok(profile.externalLinks?.tiktok ?? '');
      setWhatsapp(profile.externalLinks?.whatsapp ?? '');
      setCertified(true);
    } catch (e) {
      if (!(e instanceof ApiError && e.status === 404)) setError(errorMessage(e));
    } finally {
      setLoadingExisting(false);
    }
  }, []);

  useEffect(() => { void loadExisting(); }, [loadExisting]);

  const valid = useMemo(() => [
    Boolean(businessName.trim().length >= 2 && tradeCategory && subSkills.length && postcode.trim().length >= 5),
    true,
    bio.trim().length >= TRADER_BIO_MIN_LENGTH,
    true,
    certified,
  ][step], [bio, businessName, certified, postcode, step, subSkills, tradeCategory]);

  function addBeforeAfter() {
    const before = beforeDraft[0];
    const after = afterDraft[0];
    if (!before || !after || beforeAfterProjects.length >= 12) return;
    setBeforeAfterProjects((current) => [...current, { before, after, caption: projectCaption.trim() || undefined }]);
    setBeforeDraft([]);
    setAfterDraft([]);
    setProjectCaption('');
  }

  async function save() {
    if (!tradeCategory) return;
    try {
      setBusy(true); setError('');
      const links = { gasSafe, trustMark, facebook, instagram, tiktok, whatsapp };
      const serviceAreas = serviceAreasText.split(/[,\n]/).map((x) => x.trim()).filter(Boolean).slice(0, 20);
      await apiFetch('/api/me', {
        method: 'PUT',
        body: JSON.stringify({
          businessName,
          tradeCategory,
          subSkills,
          bio,
          postcode,
          radiusMiles: Number(radius),
          qualifications: qualificationsText.split('\n').map((x) => x.trim()).filter(Boolean),
          externalLinks: links,
          photos,
          selfCertified: certified,
          showcase: {
            template,
            colourTheme,
            coverPhotoUrl: coverPhoto[0] ?? '',
            profileImageUrl: profileImage[0] ?? '',
            logoUrl: logo[0] ?? '',
            yearsExperience: Number(yearsExperience || 0),
            yearEstablished: yearEstablished ? Number(yearEstablished) : null,
            serviceAreas,
            beforeAfterProjects,
          },
        }),
      }, getToken);
      router.replace('/trader/dashboard');
    } catch (e) { setError(errorMessage(e)); } finally { setBusy(false); }
  }

  const bioCharactersRemaining = Math.max(0, TRADER_BIO_MIN_LENGTH - bio.trim().length);

  return <Screen key={step} title="Build your business profile" subtitle="Treat this as your mini website. Customers should be able to understand, trust and hire your business from one page.">
    <ProgressBar progress={(step + 1) / 5} color={colors.primary} /><Text variant="labelLarge">Step {step + 1} of 5</Text>
    {loadingExisting ? <HelperText type="info">Loading any existing profile details…</HelperText> : null}

    {step === 0 ? <AppCard>
      <Text variant="titleLarge">Business basics</Text>
      <TextInput label="Business or trading name" value={businessName} onChangeText={setBusinessName} mode="outlined" />
      <FormSelect label="Primary trade" value={tradeCategory} options={TRADE_CATEGORIES} onChange={(value) => { setTradeCategory(value); setSubSkills([]); }} />
      {tradeCategory ? <><Text variant="labelLarge">Specialist skills</Text><PillSelector options={SUB_SKILLS[tradeCategory]} values={subSkills} onChange={setSubSkills} /></> : null}
      <TextInput label="Base postcode" value={postcode} onChangeText={setPostcode} mode="outlined" autoCapitalize="characters" placeholder="e.g. TW18 4AA" />
      <HelperText type="info">Used for job matching. Your full postcode is never shown publicly.</HelperText>
      <FormSelect label="Working radius (miles)" value={radius} options={RADIUS_OPTIONS} onChange={setRadius} />
      <TextInput label="Other areas you cover" value={serviceAreasText} onChangeText={setServiceAreasText} mode="outlined" multiline placeholder="Staines, Egham, Chertsey, Windsor…" />
    </AppCard> : null}

    {step === 1 ? <AppCard>
      <Text variant="titleLarge">Brand and layout</Text>
      <Text style={styles.muted}>Choose how your public page looks. You can change this later.</Text>
      <View style={styles.templateGrid}>{TEMPLATES.map((item) => <Pressable key={item.id} onPress={() => setTemplate(item.id)} style={[styles.templateCard, template === item.id && styles.selectedTemplate]}><Text variant="titleMedium">{item.title}</Text><Text style={styles.muted}>{item.body}</Text>{template === item.id ? <Text style={styles.tick}>Selected ✓</Text> : null}</Pressable>)}</View>
      <Text variant="titleMedium">Profile colour</Text>
      <View style={styles.colours}>{COLOURS.map((item) => <Chip key={item.id} selected={colourTheme === item.id} showSelectedCheck onPress={() => setColourTheme(item.id)} style={{ borderColor: item.hex }} textStyle={{ color: item.hex }}>{item.label}</Chip>)}</View>
      <PhotoUploader kind="trader" photos={coverPhoto} onChange={setCoverPhoto} max={1} title="Cover photo" buttonLabel="Choose cover" emptyText="A wide image of your best finished work or team." />
      <PhotoUploader kind="trader" photos={profileImage} onChange={setProfileImage} max={1} title="Profile image" buttonLabel="Choose profile image" emptyText="Usually you, your team or a strong business portrait." />
      <PhotoUploader kind="trader" photos={logo} onChange={setLogo} max={1} title="Business logo" buttonLabel="Choose logo" emptyText="Optional. Upload your business logo if you have one." />
    </AppCard> : null}

    {step === 2 ? <AppCard>
      <Text variant="titleLarge">About your business</Text>
      <TextInput label="Business bio" value={bio} onChangeText={setBio} mode="outlined" multiline numberOfLines={7} />
      <HelperText type={bio.length > 0 && bioCharactersRemaining > 0 ? 'error' : 'info'}>
        Minimum {TRADER_BIO_MIN_LENGTH} characters required.{bioCharactersRemaining > 0 ? ` ${bioCharactersRemaining} more to go.` : ' Requirement met ✓'}
      </HelperText>
      <Text style={styles.muted}>Explain what you specialise in, how you work and why a customer should trust you.</Text>
      <View style={styles.twoCol}><TextInput style={styles.flex} label="Years of experience" value={yearsExperience} onChangeText={setYearsExperience} mode="outlined" keyboardType="number-pad" /><TextInput style={styles.flex} label="Year established" value={yearEstablished} onChangeText={setYearEstablished} mode="outlined" keyboardType="number-pad" /></View>
      <TextInput label="Qualifications, cards and certificates (one per line)" value={qualificationsText} onChangeText={setQualificationsText} mode="outlined" multiline />
      <Text variant="titleMedium">Registers and social links</Text>
      {([['Gas Safe register URL', gasSafe, setGasSafe], ['TrustMark URL', trustMark, setTrustMark], ['Facebook URL', facebook, setFacebook], ['Instagram URL', instagram, setInstagram], ['TikTok URL', tiktok, setTiktok], ['WhatsApp click-to-chat URL', whatsapp, setWhatsapp]] as const).map(([label, value, setter]) => <TextInput key={label} label={label} value={value} onChangeText={setter} mode="outlined" autoCapitalize="none" />)}
    </AppCard> : null}

    {step === 3 ? <AppCard>
      <Text variant="titleLarge">Portfolio</Text>
      <PhotoUploader kind="trader" photos={photos} onChange={setPhotos} max={30} title="Work gallery" buttonLabel="Add work photo" emptyText="Upload completed jobs, details and workmanship you are proud to put your name on." />
      <Text variant="titleMedium">Before & after projects</Text>
      <Text style={styles.muted}>Pair photos so customers can see the transformation, not just the polished final shot.</Text>
      <PhotoUploader kind="trader" photos={beforeDraft} onChange={setBeforeDraft} max={1} title="Before" buttonLabel="Add before" />
      <PhotoUploader kind="trader" photos={afterDraft} onChange={setAfterDraft} max={1} title="After" buttonLabel="Add after" />
      <TextInput label="Project caption (optional)" value={projectCaption} onChangeText={setProjectCaption} mode="outlined" placeholder="Full bathroom retile in Staines" />
      <Button mode="outlined" disabled={!beforeDraft[0] || !afterDraft[0] || beforeAfterProjects.length >= 12} onPress={addBeforeAfter}>Add before & after project</Button>
      {beforeAfterProjects.map((project, index) => <View key={`${project.before}-${index}`} style={styles.projectRow}><Text style={styles.flex}>{project.caption || `Project ${index + 1}`} · Before/after pair ready</Text><Button compact onPress={() => setBeforeAfterProjects((current) => current.filter((_, i) => i !== index))}>Remove</Button></View>)}
    </AppCard> : null}

    {step === 4 ? <AppCard>
      <Text variant="titleLarge">Trust and publication</Text>
      <Text>Your page will display your experience, qualifications, customer reviews, service areas, portfolio and BuildMate membership date. BuildMate lists what you declare but does not pretend to be an accreditation body.</Text>
      <Pressable accessibilityRole="checkbox" accessibilityState={{ checked: certified }} onPress={() => setCertified((x) => !x)} style={styles.check}>
        <View style={[styles.checkBox, certified && styles.checkBoxSelected]}>{certified ? <Text style={styles.checkMark}>✓</Text> : null}</View>
        <Text style={styles.checkText}>I self-certify that the information is accurate and that I hold any insurance or trade accreditation required for the work I offer.</Text>
      </Pressable>
    </AppCard> : null}

    <HelperText type="error" visible={Boolean(error)}>{error}</HelperText>
    <View style={styles.actions}>{step > 0 ? <Button onPress={() => setStep((x) => x - 1)}>Back</Button> : <View />}{step < 4 ? <Button mode="contained" disabled={!valid} onPress={() => setStep((x) => x + 1)}>Continue</Button> : <Button mode="contained" loading={busy} disabled={!valid || busy} onPress={() => void save()}>{busy ? 'Publishing profile…' : 'Save & publish profile'}</Button>}</View>
  </Screen>;
}

const styles = StyleSheet.create({
  muted: { color: colors.muted },
  templateGrid: { gap: 10 },
  templateCard: { padding: 14, borderWidth: 1, borderColor: colors.border, borderRadius: 14, gap: 5 },
  selectedTemplate: { borderWidth: 2, borderColor: colors.primary },
  tick: { color: colors.primary, fontWeight: '800' },
  colours: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  twoCol: { flexDirection: 'row', gap: 10, flexWrap: 'wrap' },
  flex: { flex: 1, minWidth: 180 },
  projectRow: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 6 },
  check: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, paddingVertical: 6 },
  checkBox: { width: 26, height: 26, borderWidth: 2, borderColor: colors.muted, borderRadius: 5, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.surface },
  checkBoxSelected: { borderColor: colors.primary, backgroundColor: colors.primary },
  checkMark: { color: '#fff', fontWeight: '900', fontSize: 18, lineHeight: 21 },
  checkText: { flex: 1, lineHeight: 22, paddingTop: 2 },
  actions: { flexDirection: 'row', justifyContent: 'space-between' },
});
