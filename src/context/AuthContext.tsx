import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import type { Session } from '@supabase/supabase-js';
import { supabase } from '@/services/supabase';
import { track, flush } from '@/services/analytics';

export type ProfileRole = 'user' | 'collaborator' | 'admin';

export interface CollaboratorProfile {
  id: string;
  role: ProfileRole;
  collaboratorClubId: string | null;
}

interface AuthContextType {
  session: Session | null;
  profile: CollaboratorProfile | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
  /** Admin pode tudo; collaborator só o seu próprio clube. */
  canManageClub: (clubId: string) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<CollaboratorProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const loadProfile = useCallback(async (userId: string) => {
    const { data, error } = await supabase
      .from('profiles')
      .select('id, role, collaborator_club_id')
      .eq('id', userId)
      .single();

    if (!error && data) {
      setProfile({
        id: data.id,
        role: data.role,
        collaboratorClubId: data.collaborator_club_id,
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
    track('login.attempt');
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    // Em falhas guarda-se o email tentado (nunca a palavra-passe) para detetar tentativas de intrusão.
    if (error) track('login.failure', { email: email.trim().toLowerCase().slice(0, 80), reason: error.message.slice(0, 80) });
    else track('login.success');
    flush();
    return { error: error ? error.message : null };
  };

  const signOut = async () => {
    track('login.logout');
    await flush();
    await supabase.auth.signOut();
  };

  const canManageClub = (clubId: string) => {
    if (!profile) return false;
    if (profile.role === 'admin') return true;
    return profile.role === 'collaborator' && profile.collaboratorClubId === clubId;
  };

  return (
    <AuthContext.Provider value={{ session, profile, loading, signIn, signOut, canManageClub }}>
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
