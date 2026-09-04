import { useAuth } from '@clerk/expo';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Button, HelperText, Text } from 'react-native-paper';
import { AppCard } from '@/components/AppCard';
import { LoadingScreen, Screen } from '@/components/Screen';
import { colors } from '@/constants/theme';
import { apiFetch, errorMessage } from '@/lib/api';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import type { UserRole } from '@/types';

export default function ChooseRoleScreen() {
  const router = useRouter();
  const { getToken } = useAuth();
  const { user, loading } = useCurrentUser();
  const [role, setRole] = useState<UserRole | null>(user?.role ?? null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!loading && user?.role) router.replace(user.role === 'trader' ? '/trader/dashboard' : '/customer/dashboard');
  }, [loading, router, user?.role]);

  if (loading) return <LoadingScreen label="Setting up your account…" />;

  async function save() {
    if (!role) return;
    try {
      setBusy(true); setError('');
      await apiFetch('/api/me', { method: 'PATCH', body: JSON.stringify({ role }) }, getToken);
      router.replace(role === 'trader' ? '/trader/onboarding' : '/customer/dashboard');
    } catch (e) { setError(errorMessage(e)); } finally { setBusy(false); }
  }

  return <Screen title="How will you use BuildMate?" subtitle="Choose carefully. Role changes are deliberately restricted once trading activity exists.">
    <View style={styles.grid}>
      {([['customer', 'I need work done', 'Post jobs, compare quotes and pay safely.'], ['trader', 'I do the work', 'Build a public profile, quote and invoice customers.']] as const).map(([value, title, body]) => (
        <Pressable key={value} onPress={() => setRole(value)} style={[styles.choice, role === value && styles.selected]}>
          <AppCard><Text variant="titleLarge">{title}</Text><Text style={styles.muted}>{body}</Text>{role === value ? <Text style={styles.tick}>Selected ✓</Text> : null}</AppCard>
        </Pressable>
      ))}
    </View>
    <HelperText type="error" visible={Boolean(error)}>{error}</HelperText>
    <Button mode="contained" disabled={!role || busy} loading={busy} onPress={save}>Continue</Button>
  </Screen>;
}

const styles = StyleSheet.create({ grid: { gap: 12 }, choice: { borderRadius: 14 }, selected: { borderWidth: 2, borderColor: colors.primary }, muted: { color: colors.muted }, tick: { color: colors.primary, fontWeight: '800' } });
