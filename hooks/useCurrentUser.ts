import { useAuth } from '@clerk/expo';
import { useCallback, useEffect, useRef, useState } from 'react';
import { apiFetch } from '@/lib/api';
import type { CurrentUser } from '@/types';

export function useCurrentUser() {
  const { isLoaded, isSignedIn, getToken } = useAuth();
  const getTokenRef = useRef(getToken);
  const [user, setUser] = useState<CurrentUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getTokenRef.current = getToken;
  }, [getToken]);

  const refresh = useCallback(async () => {
    if (!isLoaded || !isSignedIn) {
      setUser(null);
      setError(null);
      setLoading(!isLoaded);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const currentUser = await apiFetch<CurrentUser>('/api/me', {}, () => getTokenRef.current());
      setUser(currentUser);
    } catch (e) {
      setUser(null);
      setError(e instanceof Error ? e.message : 'Unable to load account');
    } finally {
      setLoading(false);
    }
  }, [isLoaded, isSignedIn]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return { user, loading, error, refresh, isSignedIn: Boolean(isSignedIn), getToken };
}
