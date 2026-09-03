import { MD3LightTheme } from 'react-native-paper';

export const colors = {
  primary: '#D35400',
  secondary: '#E67E22',
  background: '#FAFAFA',
  surface: '#FFFFFF',
  border: '#E5E7EB',
  text: '#1F2937',
  muted: '#6B7280',
  success: '#15803D',
  danger: '#B91C1C',
  warning: '#B45309',
} as const;

export const paperTheme = {
  ...MD3LightTheme,
  roundness: 3,
  colors: {
    ...MD3LightTheme.colors,
    primary: colors.primary,
    secondary: colors.secondary,
    background: colors.background,
    surface: colors.surface,
    surfaceVariant: '#FFF7ED',
    outline: colors.border,
    onSurface: colors.text,
    onSurfaceVariant: colors.muted,
    error: colors.danger,
  },
};
