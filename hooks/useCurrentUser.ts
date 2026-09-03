import { useAuth } from '@clerk/expo';
import { useCallback, useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api';
import type { CurrentUser } from '@/types';

export function useCurrentUser() {
  const { isLoaded, isSignedIn, getToken } = useAuth();
  const [user, setUser] = useState<CurrentUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!isLoaded || !isSignedIn) {
      setUser(null);
      setLoading(!isLoaded);
      return;
    }
    try {
      setLoading(true);
      setUser(await apiFetch<CurrentUser>('/api/me', {}, getToken));
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unable to load account');
    } finally {
      setLoading(false);
    }
  }, [getToken, isLoaded, isSignedIn]);

  useEffect(() => { void refresh(); }, [refresh]);
  return { user, loading, error, refresh, isSignedIn: Boolean(isSignedIn), getToken };
}
