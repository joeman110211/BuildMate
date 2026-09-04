import type { Session, User } from '@supabase/supabase-js';
import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { isSupabaseConfigured, supabase } from '@/native/supabase';
import type { Profile, UserRole } from '@/native/types';

type Result = { error: string | null; needsEmailConfirmation?: boolean };

type AuthValue = {
  session: Session | null;
  user: User | null;
  profile: Profile | null;
  loading: boolean;
  configured: boolean;
  signIn: (email: string, password: string) => Promise<Result>;
  signUp: (fullName: string, email: string, password: string, role: UserRole) => Promise<Result>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  const loadProfile = async (userId: string) => {
    if (!supabase) return setProfile(null);
    const { data } = await supabase.from('profiles').select('*').eq('user_id', userId).maybeSingle();
    setProfile((data as Profile | null) ?? null);
  };

  useEffect(() => {
    if (!supabase) {
      setLoading(false);
      return;
    }
    supabase.auth.getSession().then(async ({ data }) => {
      setSession(data.session);
      if (data.session?.user) await loadProfile(data.session.user.id);
      setLoading(false);
    });
    const { data: listener } = supabase.auth.onAuthStateChange(async (_event, next) => {
      setSession(next);
      if (next?.user) await loadProfile(next.user.id);
      else setProfile(null);
    });
    return () => listener.subscription.unsubscribe();
  }, []);

  const value = useMemo<AuthValue>(() => ({
    session,
    user: session?.user ?? null,
    profile,
    loading,
    configured: isSupabaseConfigured,
    signIn: async (email, password) => {
      if (!supabase) return { error: 'Supabase is not configured yet.' };
      const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
      return { error: error?.message ?? null };
    },
    signUp: async (fullName, email, password, role) => {
      if (!supabase) return { error: 'Supabase is not configured yet.' };
      const { data, error } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: { data: { full_name: fullName.trim(), role } },
      });
      if (error) return { error: error.message };
      return { error: null, needsEmailConfirmation: !data.session };
    },
    signOut: async () => {
      if (supabase) await supabase.auth.signOut();
      setSession(null);
      setProfile(null);
    },
  }), [session, profile, loading]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const value = useContext(AuthContext);
  if (!value) throw new Error('useAuth must be used inside AuthProvider');
  return value;
}
