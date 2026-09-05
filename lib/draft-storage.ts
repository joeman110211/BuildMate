import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

const prefix = 'buildpair:draft:';

export async function saveDraft<T>(key: string, value: T) {
  const serialized = JSON.stringify(value);
  if (Platform.OS === 'web') {
    if (typeof window !== 'undefined') window.localStorage.setItem(`${prefix}${key}`, serialized);
    return;
  }
  await SecureStore.setItemAsync(`${prefix}${key}`, serialized);
}

export async function loadDraft<T>(key: string): Promise<T | null> {
  try {
    const serialized = Platform.OS === 'web'
      ? (typeof window !== 'undefined' ? window.localStorage.getItem(`${prefix}${key}`) : null)
      : await SecureStore.getItemAsync(`${prefix}${key}`);
    return serialized ? JSON.parse(serialized) as T : null;
  } catch {
    return null;
  }
}

export async function clearDraft(key: string) {
  if (Platform.OS === 'web') {
    if (typeof window !== 'undefined') window.localStorage.removeItem(`${prefix}${key}`);
    return;
  }
  await SecureStore.deleteItemAsync(`${prefix}${key}`);
}
