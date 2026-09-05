import { MD3LightTheme } from 'react-native-paper';

export const colors = {
  primary: '#D35400',
  primaryDark: '#A84300',
  secondary: '#E4A15F',
  background: '#ECEFF1',
  surface: '#F8F9FA',
  surfaceRaised: '#FFFFFF',
  surfaceSoft: '#F1F3F5',
  surfaceStrong: '#E2E6EA',
  charcoal: '#252A31',
  charcoalSoft: '#343A42',
  border: '#D4D9DE',
  text: '#20252B',
  muted: '#66707C',
  success: '#2E7D32',
  danger: '#B42318',
  warning: '#C76A00',
  info: '#2563EB',
} as const;

export const paperTheme = {
  ...MD3LightTheme,
  roundness: 5,
  colors: {
    ...MD3LightTheme.colors,
    primary: colors.primary,
    onPrimary: '#FFFFFF',
    primaryContainer: '#FBE5D7',
    onPrimaryContainer: colors.primaryDark,
    secondary: colors.secondary,
    secondaryContainer: colors.surfaceStrong,
    onSecondaryContainer: colors.charcoal,
    background: colors.background,
    surface: colors.surfaceRaised,
    surfaceVariant: colors.surfaceSoft,
    outline: colors.border,
    outlineVariant: '#E3E6E9',
    onSurface: colors.text,
    onSurfaceVariant: colors.muted,
    error: colors.danger,
  },
};
