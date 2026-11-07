import { useState, useEffect, createContext, useContext, ReactNode, useCallback } from 'react';
import { Profile, RoleType } from '@/types';
import { mockStorage } from '@/lib/mockStorage';
import { isLiveSupabaseConfigured, supabase } from '@/lib/supabase';
import { startLiveSession, stopLiveSession, pullSnapshot } from '@/lib/liveSync';

interface AuthContextType {
  user: Profile | null;
  role: RoleType;
  availableProfiles: Profile[];
  /** Roles the signed-in user actually has (live mode). Demo mode: all four. */
  availableRoles: RoleType[];
  switchUser: (profileId: string, role: RoleType) => void;
  isOrganizer: boolean;
  isVolunteer: boolean;
  isSponsor: boolean;
  isParticipant: boolean;
  isLiveSupabase: boolean;
  /** Live mode: email/password sign-in. Resolves with the role to land on. */
  signIn: (email: string, password: string, preferredRole?: RoleType) => Promise<RoleType>;
  signOut: () => Promise<void>;
  resetData: () => void;
}

const ALL_ROLES: RoleType[] = ['organizer', 'participant', 'volunteer', 'sponsor'];

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<Profile | null>(mockStorage.getCurrentUser());
  const [role, setRole] = useState<RoleType>(mockStorage.getCurrentRole());
  const [availableProfiles, setAvailableProfiles] = useState<Profile[]>(mockStorage.getProfiles());
  const [availableRoles, setAvailableRoles] = useState<RoleType[]>(ALL_ROLES);
  // Live mode: no user until a Supabase session is confirmed (so RoleGuard sends people to /login).
  const [hasLiveSession, setHasLiveSession] = useState(false);
  const [authChecked, setAuthChecked] = useState(!isLiveSupabaseConfigured);

  useEffect(() => {
    const unsubscribe = mockStorage.subscribe(() => {
      setUser(mockStorage.getCurrentUser());
      setRole(mockStorage.getCurrentRole());
      setAvailableProfiles(mockStorage.getProfiles());
    });
    return () => {
      unsubscribe();
    };
  }, []);

  // Restore a stored Supabase session on page load.
  useEffect(() => {
    if (!supabase) return;
    let cancelled = false;
    supabase.auth.getSession().then(async ({ data }) => {
      try {
        if (data.session && !cancelled) {
          const roles = await startLiveSession(data.session.user, mockStorage.getCurrentRole());
          setAvailableRoles(roles);
          setHasLiveSession(true);
        }
      } catch (err) {
        console.error('Could not restore session', err);
      } finally {
        if (!cancelled) setAuthChecked(true);
      }
    });
    const { data: sub } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_OUT') {
        stopLiveSession();
        setHasLiveSession(false);
      }
    });
    return () => {
      cancelled = true;
      sub.subscription.unsubscribe();
    };
  }, []);

  const signIn = useCallback(async (email: string, password: string, preferredRole?: RoleType) => {
    if (!supabase) throw new Error('Supabase is not configured');
    const { data, error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
    if (error || !data.user) throw new Error(error?.message ?? 'Sign-in failed');
    const roles = await startLiveSession(data.user, preferredRole);
    setAvailableRoles(roles);
    setHasLiveSession(true);
    return mockStorage.getCurrentRole();
  }, []);

  const signOut = useCallback(async () => {
    stopLiveSession();
    await supabase?.auth.signOut();
    setHasLiveSession(false);
  }, []);

  const switchUser = (profileId: string, newRole: RoleType) => {
    if (isLiveSupabaseConfigured) {
      // Real accounts: switch between your own roles only.
      const me = mockStorage.getCurrentUser();
      if (availableRoles.includes(newRole)) mockStorage.setLiveUser(me, newRole);
      return;
    }
    mockStorage.switchUser(profileId, newRole);
  };

  const resetData = () => {
    if (isLiveSupabaseConfigured) {
      pullSnapshot().catch((err) => console.error('Refresh failed', err)); // re-pull server data
      return;
    }
    mockStorage.resetToDefaults();
  };

  if (!authChecked) return null; // avoid a flash redirect to /login while the session restores

  const effectiveUser = isLiveSupabaseConfigured && !hasLiveSession ? null : user;

  return (
    <AuthContext.Provider
      value={{
        user: effectiveUser,
        role,
        availableProfiles,
        availableRoles,
        switchUser,
        isOrganizer: role === 'organizer',
        isVolunteer: role === 'volunteer',
        isSponsor: role === 'sponsor',
        isParticipant: role === 'participant',
        isLiveSupabase: isLiveSupabaseConfigured,
        signIn,
        signOut,
        resetData,
      }}
    >
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
