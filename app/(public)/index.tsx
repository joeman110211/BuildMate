import type { Href } from 'expo-router';
import { Link, useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { Animated, ImageBackground, Pressable, ScrollView, StyleSheet, useWindowDimensions, View } from 'react-native';
import { Button, Chip, Icon, Text, TextInput } from 'react-native-paper';
import { PublicFooter } from '@/components/PublicFooter';
import { TRADE_CATEGORIES } from '@/constants/options';
import { colors } from '@/constants/theme';
import { apiFetch } from '@/lib/api';
import type { Job, TraderProfile } from '@/types';

const POPULAR_TRADES = [
  ['Tiling', 'grid'],
  ['Plumbing', 'water-pump'],
  ['Electrical', 'lightning-bolt-outline'],
  ['General Building', 'home-city-outline'],
  ['Roofing', 'home-roof'],
  ['Painting & Decorating', 'format-paint'],
  ['Kitchen Fitting', 'countertop-outline'],
  ['Bathroom Fitting', 'shower'],
] as const;

const SWIPE_CARDS = [
  { icon: 'magnify', title: 'Search the job, not just the trade', text: 'Type “bathroom”, “roof leak”, “sink” or “driveway” and BuildPair connects the problem to related trades.', background: colors.primarySoft },
  { icon: 'account-hard-hat-outline', title: 'See the person behind the quote', text: 'Compare trade profiles, service areas, work galleries, reviews and experience before choosing who to contact.', background: colors.accentSoft },
  { icon: 'file-document-edit-outline', title: 'Keep jobs organised', text: 'Homeowners can post clear jobs while tradespeople manage leads, quotes, messages and invoices in one place.', background: colors.blueSoft },
  { icon: 'star-circle-outline', title: 'Build reputation over time', text: 'Completed work and customer feedback help good local tradespeople stand out for the right reasons.', background: colors.secondarySoft },
];

const FAQS = [
  ['Is BuildPair only for homeowners?', 'No. BuildPair has separate homeowner and tradesperson modes under one login identity, so each side gets tools designed for what they actually need.'],
  ['Do I need to know which trade I need?', 'No. Search by the job or problem and BuildPair will surface related trades rather than demanding one exact category name.'],
  ['Can tradespeople join before subscriptions launch?', 'Yes. New tradespeople can use the current trial period while the full paid subscription flow is prepared for launch.'],
  ['Will there be a mobile app?', 'Yes. Android and iOS download links are being prepared. The web app remains available as well.'],
] as const;

function Stat({ value, label }: { value: string; label: string }) {
  return <View style={styles.stat}><Text variant="headlineMedium" style={styles.statValue}>{value}</Text><Text style={styles.statLabel}>{label}</Text></View>;
}

function SectionHeading({ eyebrow, title, body }: { eyebrow?: string; title: string; body?: string }) {
  return <View style={styles.sectionHeading}>
    {eyebrow ? <Text style={styles.eyebrow}>{eyebrow}</Text> : null}
    <Text variant="headlineMedium" style={styles.sectionTitle}>{title}</Text>
    {body ? <Text style={styles.sectionBody}>{body}</Text> : null}
  </View>;
}

export default function LandingPage() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const isWide = width >= 920;
  const [search, setSearch] = useState('');
  const [problem, setProblem] = useState('');
  const [traderCount, setTraderCount] = useState<number | null>(null);
  const [jobs, setJobs] = useState<Job[]>([]);
  const floatAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(Animated.sequence([
      Animated.timing(floatAnim, { toValue: -9, duration: 1600, useNativeDriver: false }),
      Animated.timing(floatAnim, { toValue: 0, duration: 1600, useNativeDriver: false }),
    ])).start();
  }, [floatAnim]);

  useEffect(() => {
    let active = true;
    Promise.allSettled([
      apiFetch<TraderProfile[]>('/api/traders'),
      apiFetch<Job[]>('/api/public/jobs'),
    ]).then((results) => {
      if (!active) return;
      if (results[0].status === 'fulfilled') setTraderCount(results[0].value.length);
      if (results[1].status === 'fulfilled') setJobs(results[1].value);
    });
    return () => { active = false; };
  }, []);

  const goSearch = (value: string) => {
    const q = value.trim();
    router.push((q ? `/(public)/directory?q=${encodeURIComponent(q)}` : '/(public)/directory') as Href);
  };

  const goTrade = (trade: string) => router.push(`/(public)/directory?trade=${encodeURIComponent(trade)}` as Href);

  return <ScrollView style={styles.page} contentContainerStyle={styles.pageContent}>
    <View style={[styles.hero, isWide && styles.heroWide]}>
      <View style={[styles.heroCopy, isWide && styles.heroCopyWide]}>
        <View style={styles.heroBadge}><Text style={styles.heroBadgeText}>Built for real UK home projects</Text></View>
        <Text style={styles.heroTitle}>Find the right trade for the job, without the guesswork.</Text>
        <Text variant="titleMedium" style={styles.heroSubtitle}>Search local tradespeople, post jobs, compare profiles and manage the work in one simple place.</Text>

        <View style={styles.heroSearch}>
          <TextInput
            mode="outlined"
            value={search}
            onChangeText={setSearch}
            onSubmitEditing={() => goSearch(search)}
            placeholder="What do you need? e.g. bathroom tiling"
            left={<TextInput.Icon icon="magnify" />}
            style={styles.heroSearchInput}
            outlineStyle={styles.inputOutline}
          />
          <Button mode="contained" icon="magnify" contentStyle={styles.searchButtonContent} onPress={() => goSearch(search)}>Find Trades</Button>
        </View>

        <View style={styles.heroActions}>
          <Link href="/auth/account" asChild><Button mode="contained-tonal" icon="plus-circle-outline">Post a Job</Button></Link>
          <Link href="/auth/account" asChild><Button mode="text" icon="account-hard-hat-outline">Join as a Trade</Button></Link>
        </View>
        <View style={styles.microTrust}>
          <Text style={styles.microTrustText}>✓ Search by job or trade</Text>
          <Text style={styles.microTrustText}>✓ Compare profiles</Text>
          <Text style={styles.microTrustText}>✓ One login, two modes</Text>
        </View>
      </View>

      <View style={[styles.heroVisualWrap, isWide && styles.heroVisualWide]}>
        <ImageBackground
          source={{ uri: 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?auto=format&fit=crop&w=1200&q=82' }}
          style={styles.heroImage}
          imageStyle={styles.heroImageRadius}
          resizeMode="cover"
          accessibilityLabel="Tradesperson working on a construction project"
        >
          <View style={styles.heroImageShade} />
          <View style={styles.imageCaption}><Text style={styles.imageCaptionSmall}>One place for</Text><Text style={styles.imageCaptionBig}>Jobs · Trades · Quotes · Reviews</Text></View>
          <Animated.View style={[styles.floatingCard, { transform: [{ translateY: floatAnim }] }]}>
            <View style={styles.floatingIcon}><Icon source="shield-check-outline" size={23} color={colors.accent} /></View>
            <View><Text style={styles.floatingTitle}>Compare with context</Text><Text style={styles.floatingText}>Work, reviews, skills & service area</Text></View>
          </Animated.View>
        </ImageBackground>
      </View>
    </View>

    <View style={styles.statsWrap}>
      <View style={styles.statsInner}>
        <Stat value={traderCount === null ? '—' : traderCount.toLocaleString()} label="tradespeople listed" />
        <Stat value={jobs.length ? jobs.length.toLocaleString() : '—'} label="open jobs visible" />
        <Stat value={TRADE_CATEGORIES.length.toString()} label="trade categories" />
        <Stat value="2" label="account modes, one login" />
      </View>
    </View>

    <View style={styles.section}>
      <SectionHeading eyebrow="Popular trades" title="Start with what you need done" body="Choose a category or just type the problem. The search now understands related jobs and trade terms." />
      <View style={styles.tradeGrid}>
        {POPULAR_TRADES.map(([trade, icon]) => <Pressable key={trade} style={styles.tradeCard} onPress={() => goTrade(trade)}>
          <View style={styles.tradeIcon}><Icon source={icon} size={26} color={colors.primary} /></View>
          <Text style={styles.tradeName}>{trade}</Text>
          <Icon source="arrow-right" size={19} color={colors.muted} />
        </Pressable>)}
      </View>
      <Button mode="text" icon="format-list-bulleted" onPress={() => router.push('/(public)/directory')}>Browse all {TRADE_CATEGORIES.length} trade categories</Button>
    </View>

    <View style={[styles.section, styles.problemSection]}>
      <View style={[styles.problemCopy, isWide && styles.problemCopyWide]}>
        <SectionHeading eyebrow="Not sure who you need?" title="Describe the problem in normal English." body="You should not need a construction vocabulary lesson just to find someone who can fix your house." />
        <View style={styles.problemExamples}>
          <Chip onPress={() => setProblem('Water is coming through the kitchen ceiling when the shower is used')}>Ceiling leak after shower</Chip>
          <Chip onPress={() => setProblem('I want my bathroom ripped out and completely refitted')}>Full bathroom refit</Chip>
          <Chip onPress={() => setProblem('Cracked tiles and grout around the bath')}>Cracked bathroom tiles</Chip>
        </View>
      </View>
      <View style={[styles.problemBox, isWide && styles.problemBoxWide]}>
        <TextInput mode="outlined" multiline numberOfLines={4} value={problem} onChangeText={setProblem} placeholder="Example: Water comes through my kitchen ceiling when someone showers upstairs…" outlineStyle={styles.inputOutline} />
        <Button mode="contained" icon="auto-fix" disabled={!problem.trim()} onPress={() => goSearch(problem)}>Find likely trades</Button>
        <Text style={styles.problemHint}>BuildPair searches across related services, skills and trade terms, then ranks the closest matches first.</Text>
      </View>
    </View>

    <View style={styles.section}>
      <SectionHeading eyebrow="Swipe through" title="More than a directory" body="A marketplace should help with the whole job, not just dump a list of names on the screen and wander off." />
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.swipeRow} decelerationRate="fast">
        {SWIPE_CARDS.map((card) => <View key={card.title} style={[styles.swipeCard, { backgroundColor: card.background }]}>
          <View style={styles.swipeIcon}><Icon source={card.icon} size={28} color={colors.charcoal} /></View>
          <Text variant="titleLarge" style={styles.swipeTitle}>{card.title}</Text>
          <Text style={styles.swipeText}>{card.text}</Text>
        </View>)}
      </ScrollView>
      <Text style={styles.swipeHint}>← Swipe sideways to explore →</Text>
    </View>

    <View style={styles.howWrap}>
      <View style={styles.section}>
        <SectionHeading eyebrow="How it works" title="From problem to project in a few clear steps" />
        <View style={styles.steps}>
          {[
            ['1', 'Tell BuildPair what you need', 'Search directly or post a job with the details, photos, budget and timing.'],
            ['2', 'Find and compare the right people', 'Browse related trades, profiles, work galleries, service areas and customer feedback.'],
            ['3', 'Talk, quote and organise', 'Keep messages, quotes, jobs and business paperwork together instead of scattered across apps.'],
          ].map(([number, title, text]) => <View key={number} style={styles.stepCard}><View style={styles.stepNumber}><Text style={styles.stepNumberText}>{number}</Text></View><Text variant="titleMedium" style={styles.stepTitle}>{title}</Text><Text style={styles.stepText}>{text}</Text></View>)}
        </View>
      </View>
    </View>

    <View style={[styles.section, styles.audienceGrid]}>
      <View style={[styles.audienceCard, styles.homeownerCard]}>
        <View style={styles.audienceIcon}><Icon source="home-heart" size={30} color={colors.primary} /></View>
        <Text style={styles.eyebrow}>For homeowners</Text>
        <Text variant="headlineSmall" style={styles.audienceTitle}>Less chasing. Better choices.</Text>
        {['Search by job or problem', 'Post jobs with photos and details', 'Compare trade profiles and reviews', 'Receive and compare quotes', 'Keep messages and job progress together'].map((item) => <Text key={item} style={styles.benefit}>✓ {item}</Text>)}
        <Link href="/auth/account" asChild><Button mode="contained">Create Homeowner Account</Button></Link>
      </View>
      <View style={[styles.audienceCard, styles.traderCard]}>
        <View style={styles.audienceIcon}><Icon source="account-hard-hat" size={30} color={colors.accent} /></View>
        <Text style={[styles.eyebrow, { color: colors.accent }]}>For tradespeople</Text>
        <Text variant="headlineSmall" style={styles.audienceTitle}>More useful work. Less admin chaos.</Text>
        {['Public business profile and work gallery', 'Find local jobs', 'Manage leads, quotes and messages', 'Build reputation through reviews', 'Create quotes and invoices in one place'].map((item) => <Text key={item} style={styles.benefit}>✓ {item}</Text>)}
        <Link href="/auth/account" asChild><Button mode="contained" buttonColor={colors.accent}>Start Trade Account</Button></Link>
      </View>
    </View>

    {jobs.length ? <View style={styles.section}>
      <SectionHeading eyebrow="Live marketplace" title="Recent jobs on BuildPair" body="A quick look at work currently appearing in the marketplace." />
      <View style={styles.jobGrid}>
        {jobs.slice(0, 3).map((job) => <Link key={job.id} href={`/(public)/jobs/${job.id}` as Href} asChild><Pressable style={styles.jobCard}>
          <View style={styles.jobTop}><Chip compact>{job.category}</Chip><Text style={styles.jobLocation}>{job.locationLabel || job.postcode || 'UK'}</Text></View>
          <Text variant="titleMedium" style={styles.jobTitle}>{job.title}</Text>
          <Text numberOfLines={3} style={styles.jobDescription}>{job.description}</Text>
          <Text style={styles.jobLink}>View job →</Text>
        </Pressable></Link>)}
      </View>
      <Link href="/(public)/jobs" asChild><Button mode="outlined">See all public jobs</Button></Link>
    </View> : null}

    <View style={styles.downloadBand}>
      <View style={[styles.downloadInner, isWide && styles.downloadInnerWide]}>
        <View style={styles.downloadCopy}>
          <Text style={styles.downloadEyebrow}>BuildPair in your pocket</Text>
          <Text variant="headlineMedium" style={styles.downloadTitle}>The mobile apps are coming.</Text>
          <Text style={styles.downloadText}>The website works now. Android and iOS store links are already reserved in the site structure so they can go live cleanly at launch.</Text>
          <View style={styles.storeButtons}>
            <Button mode="contained-tonal" icon="google-play" disabled>Google Play · Coming soon</Button>
            <Button mode="contained-tonal" icon="apple" disabled>App Store · Coming soon</Button>
          </View>
          <Link href="/(public)/download" asChild><Button mode="text">App launch information</Button></Link>
        </View>
        <View style={styles.phoneMock}>
          <View style={styles.phoneNotch} />
          <Text style={styles.phoneLogo}>BuildPair</Text>
          <View style={styles.phoneSearch}><Icon source="magnify" size={18} color={colors.muted} /><Text style={styles.phoneSearchText}>What do you need done?</Text></View>
          <View style={styles.phoneMiniCard}><Text style={styles.phoneMiniTitle}>Bathroom tiling</Text><Text style={styles.phoneMiniText}>12 related local trades</Text></View>
          <View style={[styles.phoneMiniCard, { backgroundColor: colors.accentSoft }]}><Text style={styles.phoneMiniTitle}>New job match</Text><Text style={styles.phoneMiniText}>Kitchen renovation · 4.2 miles</Text></View>
        </View>
      </View>
    </View>

    <View style={styles.section}>
      <SectionHeading eyebrow="Questions" title="The useful bits before you sign up" />
      <View style={styles.faqGrid}>{FAQS.map(([question, answer]) => <View key={question} style={styles.faqCard}><Text variant="titleMedium" style={styles.faqQuestion}>{question}</Text><Text style={styles.faqAnswer}>{answer}</Text></View>)}</View>
      <View style={styles.finalCta}>
        <Text variant="headlineSmall" style={styles.finalTitle}>Ready to find the right person or the right job?</Text>
        <View style={styles.finalButtons}>
          <Button mode="contained" onPress={() => router.push('/(public)/directory')}>Find Trades</Button>
          <Link href="/auth/account" asChild><Button mode="outlined">Join BuildPair</Button></Link>
        </View>
      </View>
    </View>

    <PublicFooter />
  </ScrollView>;
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: colors.background },
  pageContent: { flexGrow: 1 },
  hero: { width: '100%', maxWidth: 1240, alignSelf: 'center', paddingHorizontal: 18, paddingTop: 34, paddingBottom: 28, gap: 24 },
  heroWide: { flexDirection: 'row', alignItems: 'stretch', paddingTop: 54, paddingBottom: 46 },
  heroCopy: { gap: 17 },
  heroCopyWide: { flex: 1.05, justifyContent: 'center', paddingRight: 16 },
  heroBadge: { alignSelf: 'flex-start', backgroundColor: colors.secondarySoft, borderRadius: 999, paddingHorizontal: 13, paddingVertical: 7 },
  heroBadgeText: { color: colors.warning, fontWeight: '900', fontSize: 12 },
  heroTitle: { color: colors.charcoal, fontSize: 46, lineHeight: 51, fontWeight: '900', letterSpacing: -1.6, maxWidth: 680 },
  heroSubtitle: { color: colors.muted, lineHeight: 27, maxWidth: 680 },
  heroSearch: { backgroundColor: colors.surfaceRaised, padding: 10, borderRadius: 24, borderWidth: 1, borderColor: colors.border, flexDirection: 'row', gap: 9, flexWrap: 'wrap', alignItems: 'center' },
  heroSearchInput: { flex: 1, minWidth: 230, backgroundColor: colors.surfaceRaised },
  inputOutline: { borderRadius: 16 },
  searchButtonContent: { minHeight: 50, paddingHorizontal: 9 },
  heroActions: { flexDirection: 'row', flexWrap: 'wrap', gap: 7, alignItems: 'center' },
  microTrust: { flexDirection: 'row', flexWrap: 'wrap', gap: 13 },
  microTrustText: { color: colors.muted, fontSize: 12, fontWeight: '700' },
  heroVisualWrap: { minHeight: 390 },
  heroVisualWide: { flex: 0.95, minHeight: 560 },
  heroImage: { flex: 1, minHeight: 390, justifyContent: 'flex-end', overflow: 'hidden', borderRadius: 34 },
  heroImageRadius: { borderRadius: 34 },
  heroImageShade: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(22,25,28,0.23)' },
  imageCaption: { margin: 22, marginBottom: 28, gap: 3 },
  imageCaptionSmall: { color: '#FFFFFF', fontWeight: '700', opacity: 0.9 },
  imageCaptionBig: { color: '#FFFFFF', fontSize: 21, lineHeight: 27, fontWeight: '900', maxWidth: 420 },
  floatingCard: { position: 'absolute', top: 24, right: 20, left: 20, maxWidth: 330, alignSelf: 'flex-end', backgroundColor: 'rgba(255,255,255,0.95)', borderRadius: 22, padding: 14, flexDirection: 'row', gap: 11, alignItems: 'center' },
  floatingIcon: { width: 42, height: 42, borderRadius: 15, backgroundColor: colors.accentSoft, alignItems: 'center', justifyContent: 'center' },
  floatingTitle: { color: colors.charcoal, fontWeight: '900' },
  floatingText: { color: colors.muted, fontSize: 12, marginTop: 2 },
  statsWrap: { backgroundColor: colors.charcoal, paddingHorizontal: 18, paddingVertical: 24 },
  statsInner: { width: '100%', maxWidth: 1180, alignSelf: 'center', flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-around', gap: 14 },
  stat: { minWidth: 150, alignItems: 'center', padding: 8 },
  statValue: { color: colors.secondary, fontWeight: '900' },
  statLabel: { color: '#D9DDE0', marginTop: 2, textAlign: 'center' },
  section: { width: '100%', maxWidth: 1180, alignSelf: 'center', paddingHorizontal: 18, paddingVertical: 42, gap: 23 },
  sectionHeading: { gap: 8, maxWidth: 760 },
  eyebrow: { color: colors.primary, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 1.1, fontSize: 12 },
  sectionTitle: { color: colors.charcoal, fontWeight: '900', letterSpacing: -0.7 },
  sectionBody: { color: colors.muted, lineHeight: 24, maxWidth: 720 },
  tradeGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  tradeCard: { flexGrow: 1, flexBasis: 250, minWidth: 230, backgroundColor: colors.surfaceRaised, borderWidth: 1, borderColor: colors.border, borderRadius: 22, padding: 15, flexDirection: 'row', alignItems: 'center', gap: 12 },
  tradeIcon: { width: 46, height: 46, borderRadius: 16, backgroundColor: colors.primarySoft, alignItems: 'center', justifyContent: 'center' },
  tradeName: { flex: 1, color: colors.charcoal, fontWeight: '800' },
  problemSection: { backgroundColor: colors.surfaceRaised, maxWidth: 1180, borderRadius: 32, marginVertical: 14, flexDirection: 'column' },
  problemCopy: { gap: 16 },
  problemCopyWide: { flex: 1 },
  problemBox: { backgroundColor: colors.surfaceSoft, borderRadius: 24, padding: 16, gap: 12 },
  problemBoxWide: { flex: 1 },
  problemExamples: { flexDirection: 'row', flexWrap: 'wrap', gap: 7 },
  problemHint: { color: colors.muted, fontSize: 12, lineHeight: 18 },
  swipeRow: { gap: 14, paddingRight: 18 },
  swipeCard: { width: 300, minHeight: 235, borderRadius: 28, padding: 22, gap: 12 },
  swipeIcon: { width: 50, height: 50, borderRadius: 17, backgroundColor: 'rgba(255,255,255,0.7)', alignItems: 'center', justifyContent: 'center' },
  swipeTitle: { color: colors.charcoal, fontWeight: '900' },
  swipeText: { color: colors.charcoalSoft, lineHeight: 23 },
  swipeHint: { color: colors.muted, fontSize: 12, textAlign: 'center' },
  howWrap: { backgroundColor: colors.surfaceSoft },
  steps: { flexDirection: 'row', flexWrap: 'wrap', gap: 14 },
  stepCard: { flexGrow: 1, flexBasis: 280, backgroundColor: colors.surfaceRaised, borderRadius: 26, padding: 21, borderWidth: 1, borderColor: colors.border, gap: 10 },
  stepNumber: { width: 38, height: 38, borderRadius: 14, backgroundColor: colors.charcoal, alignItems: 'center', justifyContent: 'center' },
  stepNumberText: { color: colors.secondary, fontWeight: '900' },
  stepTitle: { color: colors.charcoal, fontWeight: '900' },
  stepText: { color: colors.muted, lineHeight: 22 },
  audienceGrid: { flexDirection: 'row', flexWrap: 'wrap' },
  audienceCard: { flexGrow: 1, flexBasis: 360, borderRadius: 30, padding: 26, gap: 11 },
  homeownerCard: { backgroundColor: colors.primarySoft },
  traderCard: { backgroundColor: colors.accentSoft },
  audienceIcon: { width: 52, height: 52, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.72)', alignItems: 'center', justifyContent: 'center', marginBottom: 4 },
  audienceTitle: { color: colors.charcoal, fontWeight: '900', marginBottom: 3 },
  benefit: { color: colors.charcoalSoft, lineHeight: 21 },
  jobGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 14 },
  jobCard: { flexGrow: 1, flexBasis: 300, backgroundColor: colors.surfaceRaised, borderRadius: 24, borderWidth: 1, borderColor: colors.border, padding: 18, gap: 11 },
  jobTop: { flexDirection: 'row', justifyContent: 'space-between', gap: 8, alignItems: 'center' },
  jobLocation: { color: colors.muted, fontSize: 12 },
  jobTitle: { color: colors.charcoal, fontWeight: '900' },
  jobDescription: { color: colors.muted, lineHeight: 21 },
  jobLink: { color: colors.primary, fontWeight: '800' },
  downloadBand: { backgroundColor: colors.primary, paddingHorizontal: 18, paddingVertical: 46 },
  downloadInner: { width: '100%', maxWidth: 1100, alignSelf: 'center', gap: 28, alignItems: 'center' },
  downloadInnerWide: { flexDirection: 'row', justifyContent: 'space-between' },
  downloadCopy: { flex: 1, maxWidth: 650, gap: 12 },
  downloadEyebrow: { color: '#FFD7BA', fontWeight: '900', textTransform: 'uppercase', letterSpacing: 1.1 },
  downloadTitle: { color: '#FFFFFF', fontWeight: '900' },
  downloadText: { color: '#FFF1E7', lineHeight: 24 },
  storeButtons: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  phoneMock: { width: 230, height: 385, backgroundColor: '#FFFFFF', borderRadius: 34, borderWidth: 7, borderColor: colors.charcoal, padding: 18, gap: 14 },
  phoneNotch: { width: 70, height: 7, borderRadius: 99, backgroundColor: colors.charcoal, alignSelf: 'center' },
  phoneLogo: { color: colors.primary, fontWeight: '900', fontSize: 20, textAlign: 'center' },
  phoneSearch: { flexDirection: 'row', gap: 6, padding: 10, borderRadius: 14, backgroundColor: colors.surfaceSoft, alignItems: 'center' },
  phoneSearchText: { color: colors.muted, fontSize: 11 },
  phoneMiniCard: { backgroundColor: colors.primarySoft, borderRadius: 16, padding: 13, gap: 4 },
  phoneMiniTitle: { color: colors.charcoal, fontWeight: '900' },
  phoneMiniText: { color: colors.muted, fontSize: 11 },
  faqGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  faqCard: { flexGrow: 1, flexBasis: 350, borderRadius: 22, backgroundColor: colors.surfaceRaised, borderWidth: 1, borderColor: colors.border, padding: 19, gap: 8 },
  faqQuestion: { color: colors.charcoal, fontWeight: '900' },
  faqAnswer: { color: colors.muted, lineHeight: 22 },
  finalCta: { marginTop: 10, backgroundColor: colors.charcoal, borderRadius: 30, padding: 28, gap: 17, alignItems: 'center' },
  finalTitle: { color: '#FFFFFF', textAlign: 'center', fontWeight: '900' },
  finalButtons: { flexDirection: 'row', flexWrap: 'wrap', gap: 9, justifyContent: 'center' },
});
