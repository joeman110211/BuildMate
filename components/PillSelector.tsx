import { useAuth } from '@clerk/expo';
import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Text } from 'react-native-paper';
import { colors } from '@/constants/theme';
import { apiFetch } from '@/lib/api';
import { traderWorkTypeLimit } from '@/lib/subscription';

type PlanSnapshot = {
  subscriptionTier?: 'free' | 'basic' | 'featured' | null;
  stripeSubscriptionId?: string | null;
  isSubscriptionActive?: boolean | null;
};

export function PillSelector({
  options,
  values,
  onChange,
  maxSelections,
}: {
  options: readonly string[];
  values: string[];
  onChange: (values: string[]) => void;
  maxSelections?: number;
}) {
  const { getToken } = useAuth();
  const [planLimit, setPlanLimit] = useState(maxSelections ?? 3);

  useEffect(() => {
    if (maxSelections != null) {
      setPlanLimit(maxSelections);
      return;
    }

    let active = true;
    void apiFetch<PlanSnapshot>('/api/me/profile', {}, getToken)
      .then((profile) => {
        if (active) setPlanLimit(traderWorkTypeLimit(profile));
      })
      .catch(() => {
        // A new trader has no profile yet, so the onboarding allowance stays at three.
      });
    return () => { active = false; };
  }, [getToken, maxSelections]);

  const limitReached = values.length >= planLimit;

  return <View style={styles.block}>
    <View style={styles.row}>{options.map((option) => {
      const active = values.includes(option);
      const disabled = !active && limitReached;
      return <Pressable
        key={option}
        accessibilityRole="checkbox"
        accessibilityState={{ checked: active, disabled }}
        accessibilityLabel={option}
        disabled={disabled}
        onPress={() => onChange(active ? values.filter((x) => x !== option) : [...values, option])}
        style={[styles.pill, active && styles.active, disabled && styles.disabled]}
      >
        {active ? <Text style={styles.check}>✓</Text> : null}
        <Text style={active ? styles.activeText : disabled ? styles.disabledText : undefined}>{option}</Text>
      </Pressable>;
    })}</View>
    <Text style={styles.limitText}>Selected {values.length} of {planLimit} work types · New/trial 3 · Basic paid 6 · Featured paid 9</Text>
    {limitReached ? <Text style={styles.limitReached}>Maximum reached for your current plan. Remove one to choose another.</Text> : null}
  </View>;
}

const styles = StyleSheet.create({
  block: { gap: 8 },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  pill: { borderWidth: 1, borderColor: colors.border, borderRadius: 999, paddingHorizontal: 14, paddingVertical: 8, backgroundColor: colors.surface, flexDirection: 'row', alignItems: 'center', gap: 6 },
  active: { backgroundColor: colors.primary, borderColor: colors.primary },
  disabled: { opacity: 0.45 },
  activeText: { color: '#fff', fontWeight: '700' },
  disabledText: { color: colors.muted },
  check: { color: '#fff', fontWeight: '900' },
  limitText: { color: colors.muted, lineHeight: 20 },
  limitReached: { color: colors.warning, fontWeight: '700', lineHeight: 20 },
});
