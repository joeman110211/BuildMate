import type { Href } from 'expo-router';
import type { UserRole } from '@/types';

export function parseAccountMode(value: string | string[] | undefined): UserRole | null {
  const candidate = Array.isArray(value) ? value[0] : value;
  return candidate === 'customer' || candidate === 'trader' ? candidate : null;
}

export function modeSetupHref(mode: UserRole | null): Href {
  return mode ? (`/auth/choose-role?mode=${mode}` as Href) : '/auth/choose-role';
}

export function signInHref(mode: UserRole): Href {
  return `/auth/sign-in?mode=${mode}` as Href;
}

export function signUpHref(mode: UserRole): Href {
  return `/auth/sign-up?mode=${mode}` as Href;
}

export function dashboardHref(mode: UserRole): Href {
  return mode === 'trader' ? '/trader/dashboard' : '/customer/dashboard';
}
