import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import type { Session } from '@supabase/supabase-js';
import { supabase } from '@/services/supabase';

export type ProfileRole = 'user' | 'club_moderator' | 'admin';

export interface DelegateProfile {
  id: string;
  role: ProfileRole;
  moderatedClubId: string | null;
}

interface AuthContextType {
  session: Session | null;
  profile: DelegateProfile | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
  /** Admin pode tudo; club_moderator só o seu próprio clube. */
  canModerateClub: (clubId: string) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<DelegateProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const loadProfile = useCallback(async (userId: string) => {
    const { data, error } = await supabase
      .from('profiles')
      .select('id, role, moderated_club_id')
      .eq('id', userId)
      .single();

    if (!error && data) {
      setProfile({
        id: data.id,
        role: data.role,
        moderatedClubId: data.moderated_club_id,
      });
    } else {
      setProfile(null);
    }
  }, []);

  useEffect(() => {
    let isMounted = true;

    supabase.auth.getSession().then(({ data }) => {
      if (!isMounted) return;
      setSession(data.session);
      if (data.session) {
        loadProfile(data.session.user.id).finally(() => isMounted && setLoading(false));
      } else {
        setLoading(false);
      }
    });

    const { data: sub } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
      if (newSession) {
        loadProfile(newSession.user.id);
      } else {
        setProfile(null);
      }
    });

    return () => {
      isMounted = false;
      sub.subscription.unsubscribe();
    };
  }, [loadProfile]);

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error: error ? error.message : null };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  const canModerateClub = (clubId: string) => {
    if (!profile) return false;
    if (profile.role === 'admin') return true;
    return profile.role === 'club_moderator' && profile.moderatedClubId === clubId;
  };

  return (
    <AuthContext.Provider value={{ session, profile, loading, signIn, signOut, canModerateClub }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
