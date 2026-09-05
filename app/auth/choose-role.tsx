import { useAuth } from '@clerk/expo';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Button, HelperText, Text } from 'react-native-paper';
import { AppCard } from '@/components/AppCard';
import { LoadingScreen, Screen } from '@/components/Screen';
import { colors } from '@/constants/theme';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { dashboardHref, parseAccountMode } from '@/lib/account-mode';
import { apiFetch, errorMessage } from '@/lib/api';
import type { UserRole } from '@/types';

export default function ChooseRoleScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ mode?: string | string[] }>();
  const requestedMode = parseAccountMode(params.mode);
  const { getToken } = useAuth();
  const { user, loading, error: loadError } = useCurrentUser();
  const [role, setRole] = useState<UserRole | null>(requestedMode);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const autoStarted = useRef(false);

  async function save(selectedRole = role) {
    if (!selectedRole || !user || busy) return;
    const wasEnabled = selectedRole === 'customer' ? user.customerEnabled : user.traderEnabled;
    try {
      setBusy(true);
      setError('');
      await apiFetch('/api/me', { method: 'PATCH', body: JSON.stringify({ role: selectedRole }) }, getToken);
      if (selectedRole === 'trader' && !wasEnabled) {
        router.replace('/trader/onboarding');
      } else {
        router.replace(dashboardHref(selectedRole));
      }
    } catch (e) {
      autoStarted.current = false;
      setError(errorMessage(e));
    } finally {
      setBusy(false);
    }
  }

  useEffect(() => {
    if (!requestedMode || loading || !user || autoStarted.current) return;
    autoStarted.current = true;
    setRole(requestedMode);
    void save(requestedMode);
    // save intentionally runs once after the requested account mode and DB user are ready.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [requestedMode, loading, user?.id]);

  if (loading || (requestedMode && busy && !error)) {
    return <LoadingScreen label={requestedMode === 'trader' ? 'Opening Tradesperson mode…' : 'Opening Homeowner mode…'} />;
  }

  return (
    <Screen title="How will you use BuildPair?" subtitle="One login can have both profiles. Choose the side you want to open or add.">
      <View style={styles.grid}>
        {([['customer', '🏠 Homeowner', 'Post jobs, compare quotes and pay safely.'], ['trader', '🔨 Tradesperson', 'Build a public profile, find work, quote and invoice customers.']] as const).map(([value, title, body]) => {
          const enabled = value === 'customer' ? user?.customerEnabled : user?.traderEnabled;
          return (
            <Pressable key={value} onPress={() => setRole(value)} style={[styles.choice, role === value && styles.selected]}>
              <AppCard>
                <Text variant="titleLarge">{title}</Text>
                <Text style={styles.muted}>{body}</Text>
                <Text style={enabled ? styles.enabled : styles.add}>{enabled ? '✓ Profile enabled' : '+ Add this profile'}</Text>
              </AppCard>
            </Pressable>
          );
        })}
      </View>
      <HelperText type="error" visible={Boolean(error || loadError)}>{error || loadError || ''}</HelperText>
      <Button mode="contained" disabled={!role || busy || !user} loading={busy} onPress={() => void save()}>
        {role === 'trader' ? (user?.traderEnabled ? 'Continue as Tradesperson' : 'Add Tradesperson Profile') : role === 'customer' ? (user?.customerEnabled ? 'Continue as Homeowner' : 'Add Homeowner Profile') : 'Continue'}
      </Button>
    </Screen>
  );
}

const styles = StyleSheet.create({
  grid: { gap: 12 },
  choice: { borderRadius: 14 },
  selected: { borderWidth: 2, borderColor: colors.primary },
  muted: { color: colors.muted },
  enabled: { color: colors.primary, fontWeight: '800', marginTop: 4 },
  add: { color: colors.muted, fontWeight: '700', marginTop: 4 },
});
