import type { PropsWithChildren } from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { colors } from '@/constants/theme';

export function AppCard({ children, style, elevated = true }: PropsWithChildren<{ style?: StyleProp<ViewStyle>; elevated?: boolean }>) {
  return <View style={[styles.card, elevated && styles.elevated, style]}>{children}</View>;
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surfaceRaised,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 26,
    padding: 20,
    gap: 13,
  },
  elevated: {
    shadowColor: colors.charcoal,
    shadowOpacity: 0.08,
    shadowRadius: 22,
    shadowOffset: { width: 0, height: 9 },
    elevation: 4,
  },
});
