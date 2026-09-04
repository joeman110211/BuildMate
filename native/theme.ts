import { MD3LightTheme } from 'react-native-paper';

export const colours = {
  burnt: '#D35400',
  burntDark: '#A84100',
  amber: '#F4A340',
  cream: '#FFF8F0',
  surface: '#FFFFFF',
  ink: '#172033',
  muted: '#6F7787',
  border: '#E9DED3',
  success: '#18794E',
};

export const buildMateTheme = {
  ...MD3LightTheme,
  roundness: 3,
  colors: {
    ...MD3LightTheme.colors,
    primary: colours.burnt,
    onPrimary: '#FFFFFF',
    secondary: colours.amber,
    background: colours.cream,
    surface: colours.surface,
    onSurface: colours.ink,
    outline: colours.border,
  },
};
