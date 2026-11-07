import { useState, useEffect, createContext, useContext, ReactNode } from 'react';
import { Profile, RoleType } from '@/types';
import { mockStorage } from '@/lib/mockStorage';
import { isLiveSupabaseConfigured } from '@/lib/supabase';

interface AuthContextType {
  user: Profile | null;
  role: RoleType;
  availableProfiles: Profile[];
  switchUser: (profileId: string, role: RoleType) => void;
  isOrganizer: boolean;
  isVolunteer: boolean;
  isSponsor: boolean;
  isParticipant: boolean;
  isLiveSupabase: boolean;
  resetData: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<Profile | null>(mockStorage.getCurrentUser());
  const [role, setRole] = useState<RoleType>(mockStorage.getCurrentRole());
  const [availableProfiles, setAvailableProfiles] = useState<Profile[]>(mockStorage.getProfiles());

  useEffect(() => {
    const unsubscribe = mockStorage.subscribe(() => {
      setUser(mockStorage.getCurrentUser());
      setRole(mockStorage.getCurrentRole());
      setAvailableProfiles(mockStorage.getProfiles());
    });
    return () => unsubscribe();
  }, []);

  const switchUser = (profileId: string, newRole: RoleType) => {
    mockStorage.switchUser(profileId, newRole);
  };

  const resetData = () => {
    mockStorage.resetToDefaults();
  };

  const isOrganizer = role === 'organizer';
  const isVolunteer = role === 'volunteer';
  const isSponsor = role === 'sponsor';
  const isParticipant = role === 'participant';

  return (
    <AuthContext.Provider
      value={{
        user,
        role,
        availableProfiles,
        switchUser,
        isOrganizer,
        isVolunteer,
        isSponsor,
        isParticipant,
        isLiveSupabase: isLiveSupabaseConfigured,
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
