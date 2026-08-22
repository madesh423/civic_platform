import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import type { Session } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import type { LanguagePref, Profile, UserRole } from '@/lib/types';

interface AuthContextValue {
  session: Session | null;
  profile: Profile | null;
  loading: boolean;
  needsProfile: boolean;
  refreshProfile: () => Promise<void>;
  updateProfile: (patch: Partial<Profile>) => Promise<void>;
  signOut: () => Promise<void>;
  lang: LanguagePref;
  setLang: (l: LanguagePref) => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [lang, setLangState] = useState<LanguagePref>(
    (localStorage.getItem('oorfix-lang') as LanguagePref) || 'EN'
  );

  const loadProfile = useCallback(async () => {
    const {
      data: { session: currentSession },
    } = await supabase.auth.getSession();
    setSession(currentSession);
    if (!currentSession?.user) {
      setProfile(null);
      setLoading(false);
      return;
    }
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', currentSession.user.id)
      .maybeSingle();
    if (error) {
      setProfile(null);
      setLoading(false);
      return;
    }
    setProfile(data as Profile | null);
    if (data?.language) setLangState(data.language as LanguagePref);
    setLoading(false);
  }, []);

  useEffect(() => {
    loadProfile();
    const { data: sub } = supabase.auth.onAuthStateChange((_event, sess) => {
      (async () => {
        setSession(sess);
        if (!sess?.user) {
          setProfile(null);
          setLoading(false);
          return;
        }
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', sess.user.id)
          .maybeSingle();
        if (!error && data) {
          setProfile(data as Profile);
          if (data.language) setLangState(data.language as LanguagePref);
        } else {
          setProfile(null);
        }
        setLoading(false);
      })();
    });
    return () => sub.subscription.unsubscribe();
  }, [loadProfile]);

  const refreshProfile = useCallback(async () => {
    if (!session?.user) return;
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', session.user.id)
      .maybeSingle();
    if (data) {
      setProfile(data as Profile);
      if (data.language) setLangState(data.language as LanguagePref);
    }
  }, [session]);

  const updateProfile = useCallback(
    async (patch: Partial<Profile>) => {
      if (!session?.user) return;
      const { data, error } = await supabase
        .from('profiles')
        .update({
          ...patch,
          updated_at: new Date().toISOString(),
        })
        .eq('id', session.user.id)
        .select('*')
        .maybeSingle();
      if (!error && data) {
        setProfile(data as Profile);
        if (data.language) setLangState(data.language as LanguagePref);
      }
    },
    [session]
  );

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
    setSession(null);
    setProfile(null);
  }, []);

  const setLang = useCallback(
    (l: LanguagePref) => {
      setLangState(l);
      localStorage.setItem('oorfix-lang', l);
    },
    []
  );

  const needsProfile = useMemo(() => {
    if (!session?.user) return false;
    if (!profile) return true;
    return !profile.name || !profile.ward;
  }, [session, profile]);

  const value = useMemo<AuthContextValue>(
    () => ({
      session,
      profile,
      loading,
      needsProfile,
      refreshProfile,
      updateProfile,
      signOut,
      lang,
      setLang,
    }),
    [session, profile, loading, needsProfile, refreshProfile, updateProfile, signOut, lang, setLang]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}

export function useRoleGuard(role: UserRole | UserRole[]): boolean {
  const { profile } = useAuth();
  if (!profile) return false;
  const roles = Array.isArray(role) ? role : [role];
  return roles.includes(profile.role);
}
