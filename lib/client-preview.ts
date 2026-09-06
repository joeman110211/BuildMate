import { Platform } from 'react-native';

export function clientPreviewDataEnabled() {
  if (Platform.OS !== 'web') return false;
  const location = (globalThis as { location?: { hostname?: string } }).location;
  return location?.hostname === 'staging.buildpair.co.uk';
}
