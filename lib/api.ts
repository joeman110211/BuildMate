import { Platform } from 'react-native';

type TokenGetter = () => Promise<string | null>;

function baseUrl() {
  if (Platform.OS === 'web') return process.env.EXPO_PUBLIC_API_URL ?? '';
  const url = process.env.EXPO_PUBLIC_API_URL;
  if (!url) throw new Error('EXPO_PUBLIC_API_URL is required for native builds');
  return url.replace(/\/$/, '');
}

export class ApiError extends Error {
  constructor(public status: number, message: string, public details?: unknown) {
    super(message);
  }
}

export async function apiFetch<T>(path: string, options: RequestInit = {}, getToken?: TokenGetter): Promise<T> {
  const token = getToken ? await getToken() : null;
  const response = await fetch(`${baseUrl()}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });

  const body = await response.json().catch(() => null);
  if (!response.ok) {
    throw new ApiError(response.status, body?.error ?? 'Request failed', body?.details);
  }
  return body as T;
}

type ClerkLikeError = {
  errors?: Array<{ longMessage?: string; message?: string; code?: string }>;
  message?: string;
};

export function errorMessage(error: unknown) {
  if (error instanceof ApiError) return error.message;

  if (error && typeof error === 'object') {
    const clerkError = error as ClerkLikeError;
    const first = clerkError.errors?.[0];
    if (first?.longMessage) return first.longMessage;
    if (first?.message) return first.message;
    if (typeof clerkError.message === 'string' && clerkError.message) return clerkError.message;
  }

  if (error instanceof Error) return error.message;
  return 'Something went wrong. Please try again.';
}
