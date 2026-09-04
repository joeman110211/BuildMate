import { Pressable, StyleSheet, View } from 'react-native';
import { Text } from 'react-native-paper';
import { colors } from '@/constants/theme';

export function PillSelector({ options, values, onChange }: { options: readonly string[]; values: string[]; onChange: (values: string[]) => void }) {
  return <View style={styles.row}>{options.map((option) => {
    const active = values.includes(option);
    return <Pressable
      key={option}
      accessibilityRole="checkbox"
      accessibilityState={{ checked: active }}
      accessibilityLabel={option}
      onPress={() => onChange(active ? values.filter((x) => x !== option) : [...values, option])}
      style={[styles.pill, active && styles.active]}
    >
      {active ? <Text style={styles.check}>✓</Text> : null}
      <Text style={active ? styles.activeText : undefined}>{option}</Text>
    </Pressable>;
  })}</View>;
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  pill: { borderWidth: 1, borderColor: colors.border, borderRadius: 999, paddingHorizontal: 14, paddingVertical: 8, backgroundColor: colors.surface, flexDirection: 'row', alignItems: 'center', gap: 6 },
  active: { backgroundColor: colors.primary, borderColor: colors.primary },
  activeText: { color: '#fff', fontWeight: '700' },
  check: { color: '#fff', fontWeight: '900' },
});
