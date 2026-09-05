import { MD3LightTheme } from 'react-native-paper';

export const colors = {
  primary: '#D35400',
  primaryDark: '#A84300',
  secondary: '#F4A261',
  background: '#F7F7F5',
  surface: '#FFFFFF',
  surfaceSoft: '#FFF7ED',
  border: '#E5E7EB',
  text: '#1F2933',
  muted: '#6B7280',
  success: '#2E7D32',
  danger: '#B42318',
  warning: '#D97706',
  info: '#2563EB',
} as const;

export const paperTheme = {
  ...MD3LightTheme,
  roundness: 4,
  colors: {
    ...MD3LightTheme.colors,
    primary: colors.primary,
    primaryContainer: '#FDE8D8',
    onPrimaryContainer: colors.primaryDark,
    secondary: colors.secondary,
    secondaryContainer: '#FFF0DF',
    background: colors.background,
    surface: colors.surface,
    surfaceVariant: colors.surfaceSoft,
    outline: colors.border,
    outlineVariant: '#EFEFEA',
    onSurface: colors.text,
    onSurfaceVariant: colors.muted,
    error: colors.danger,
  },
};
