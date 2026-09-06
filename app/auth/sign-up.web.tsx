import { SignUp } from '@clerk/expo/web';
import { useLocalSearchParams } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { Text } from 'react-native-paper';
import { AppCard } from '@/components/AppCard';
import { TRADE_CATEGORIES } from '@/constants/options';
import { colors } from '@/constants/theme';
import { modeSetupHref, parseAccountMode, signInHref } from '@/lib/account-mode';
import { clerkWebAppearance, clerkWebLocalization } from '@/lib/clerk-web';
import type { UserRole } from '@/types';

const PENDING_JOB_KEY = 'buildpair:pending-quote-job';
const PRIMARY_TRADE_KEY = 'buildpair:signup-primary-trade';

type SignupFields = {
  firstName?: string;
  lastName?: string;
  emailAddress?: string;
};

type PendingJob = {
  id: string;
  title: string;
  category?: string;
  location?: string;
};

function scalar(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function signupFieldsKey(mode: UserRole | null) {
  return `buildpair:signup-fields:${mode ?? 'general'}`;
}

function readJson<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') return fallback;
  try {
    const raw = window.sessionStorage.getItem(key);
    return raw ? JSON.parse(raw) as T : fallback;
  } catch {
    return fallback;
  }
}

function storeJson(key: string, value: unknown) {
  if (typeof window === 'undefined') return;
  try { window.sessionStorage.setItem(key, JSON.stringify(value)); } catch { /* storage can be unavailable in locked-down browsers */ }
}

function readPrimaryTrade() {
  if (typeof window === 'undefined') return '';
  try { return window.sessionStorage.getItem(PRIMARY_TRADE_KEY) ?? ''; } catch { return ''; }
}

export default function SignUpWebScreen() {
  const params = useLocalSearchParams<{
    mode?: string | string[];
    jobId?: string | string[];
    jobTitle?: string | string[];
    jobCategory?: string | string[];
    jobLocation?: string | string[];
  }>();
  const mode = parseAccountMode(params.mode);
  const fieldsKey = signupFieldsKey(mode);
  const [initialValues] = useState<SignupFields>(() => readJson<SignupFields>(fieldsKey, {}));
  const [primaryTrade, setPrimaryTrade] = useState(() => readPrimaryTrade());
  const [storedJob] = useState<PendingJob | null>(() => readJson<PendingJob | null>(PENDING_JOB_KEY, null));

  const jobFromRoute = useMemo<PendingJob | null>(() => {
    const id = scalar(params.jobId);
    const title = scalar(params.jobTitle);
    if (!id || !title) return null;
    return {
      id,
      title,
      category: scalar(params.jobCategory),
      location: scalar(params.jobLocation),
    };
  }, [params.jobCategory, params.jobId, params.jobLocation, params.jobTitle]);
  const pendingJob = jobFromRoute ?? storedJob;

  useEffect(() => {
    if (jobFromRoute) storeJson(PENDING_JOB_KEY, jobFromRoute);
  }, [jobFromRoute]);

  useEffect(() => {
    if (typeof document === 'undefined' || typeof window === 'undefined') return undefined;
    const persistClerkField = (event: Event) => {
      const target = event.target;
      if (!(target instanceof HTMLInputElement)) return;
      if (!['firstName', 'lastName', 'emailAddress'].includes(target.name)) return;
      const current = readJson<SignupFields>(fieldsKey, {});
      storeJson(fieldsKey, { ...current, [target.name]: target.value });
    };
    document.addEventListener('input', persistClerkField, true);
    return () => document.removeEventListener('input', persistClerkField, true);
  }, [fieldsKey]);

  const baseRedirectUrl = String(modeSetupHref(mode));
  const redirectUrl = mode === 'trader' && primaryTrade
    ? `${baseRedirectUrl}${baseRedirectUrl.includes('?') ? '&' : '?'}trade=${encodeURIComponent(primaryTrade)}`
    : baseRedirectUrl;
  const loginUrl = mode ? String(signInHref(mode)) : '/auth/account';
  const title = mode === 'trader' ? '🔨 Create Tradesperson Account' : mode === 'customer' ? '🏠 Create Homeowner Account' : 'Create your BuildPair account';

  function togglePrimaryTrade(trade: string) {
    const next = primaryTrade === trade ? '' : trade;
    setPrimaryTrade(next);
    if (typeof window === 'undefined') return;
    try {
      if (next) window.sessionStorage.setItem(PRIMARY_TRADE_KEY, next);
      else window.sessionStorage.removeItem(PRIMARY_TRADE_KEY);
    } catch { /* ignore private-mode storage failures */ }
  }

  return (
    <ScrollView
      style={styles.scroller}
      contentContainerStyle={styles.page}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator
    >
      <View style={styles.intro}>
        <Text variant="headlineSmall" style={styles.heading}>{title}</Text>

        {pendingJob ? <AppCard style={styles.contextCard}>
          <Text variant="labelLarge" style={styles.contextLabel}>Joining this job to quote</Text>
          <Text variant="titleLarge" style={styles.contextTitle}>{pendingJob.title}</Text>
          <Text style={styles.contextMeta}>{[pendingJob.category, pendingJob.location].filter(Boolean).join(' · ')}</Text>
          <Text style={styles.contextHelp}>Your job selection is saved for this browser session while you create your tradesperson account.</Text>
        </AppCard> : null}

        {mode === 'trader' ? <AppCard style={styles.servicesCard}>
          <Text variant="titleMedium" style={styles.contextTitle}>What type of work do you offer?</Text>
          <Text style={styles.contextHelp}>Choose your primary trade now. You’ll confirm the specialist services when you build your profile.</Text>
          <View style={styles.checkboxGrid}>
            {TRADE_CATEGORIES.map((trade) => <label key={trade} style={webStyles.checkboxLabel}>
              <input
                type="checkbox"
                name="serviceSelection"
                aria-label={trade}
                checked={primaryTrade === trade}
                onChange={() => togglePrimaryTrade(trade)}
                style={webStyles.checkbox}
              />
              <span style={webStyles.checkboxText}>{trade}</span>
            </label>)}
          </View>
        </AppCard> : null}
      </View>

      <SignUp
        routing="path"
        path="/auth/sign-up"
        signInUrl={loginUrl}
        forceRedirectUrl={redirectUrl}
        signInForceRedirectUrl={redirectUrl}
        initialValues={initialValues}
        appearance={clerkWebAppearance}
        localization={clerkWebLocalization}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroller: { flex: 1, backgroundColor: colors.background },
  page: { flexGrow: 1, backgroundColor: colors.background, paddingTop: 18, paddingHorizontal: 12, paddingBottom: 56 },
  intro: { width: '100%', maxWidth: 640, alignSelf: 'center', gap: 12 },
  heading: { textAlign: 'center', fontWeight: '900', color: colors.charcoal },
  contextCard: { backgroundColor: '#FFF8F3' },
  servicesCard: { backgroundColor: colors.surfaceSoft },
  contextLabel: { color: colors.primary, fontWeight: '900' },
  contextTitle: { color: colors.charcoal, fontWeight: '900' },
  contextMeta: { color: colors.muted, fontWeight: '700' },
  contextHelp: { color: colors.muted, lineHeight: 21 },
  checkboxGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
});

const webStyles = {
  checkboxLabel: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    minHeight: '42px',
    padding: '8px 11px',
    border: `1px solid ${colors.border}`,
    borderRadius: '12px',
    background: '#FFFFFF',
    cursor: 'pointer',
    fontFamily: 'system-ui, sans-serif',
  },
  checkbox: { width: '18px', height: '18px', accentColor: colors.primary, cursor: 'pointer' },
  checkboxText: { color: colors.charcoal, fontWeight: 700, fontSize: '14px' },
} as const;
