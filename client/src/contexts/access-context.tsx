import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import type { AccessLevel } from '@/lib/api';
import { apiClient } from '@/lib/api';
import { useAuth } from './auth-context';

interface AccessContextType {
  accessLevel: AccessLevel | null;
  setAccessLevel: (accessLevel: AccessLevel) => void;
  isLoading: boolean;
  refreshAccessLevel: () => Promise<void>;
}

const AccessContext = createContext<AccessContextType | undefined>(undefined);

export function AccessProvider({ children }: { children: ReactNode }) {
  const [accessLevel, setAccessLevel] = useState<AccessLevel | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { isAuthenticated, token } = useAuth();

  const refreshAccessLevel = async () => {
    if (!isAuthenticated || !token) {
      setAccessLevel({
        hasRealtimeAccess: false,
        isDelayed: true,
        delayHours: 48,
      });
      return;
    }

    try {
      const trialStatus = await apiClient.getTrialStatus();
      setAccessLevel({
        hasRealtimeAccess: trialStatus.canAccessRealtime,
        isDelayed: !trialStatus.canAccessRealtime,
        delayHours: trialStatus.canAccessRealtime ? 0 : 48,
      });
    } catch (error) {
      console.error('Failed to fetch access level:', error);
      setAccessLevel({
        hasRealtimeAccess: false,
        isDelayed: true,
        delayHours: 48,
      });
    }
  };

  useEffect(() => {
    const loadAccessLevel = async () => {
      setIsLoading(true);
      await refreshAccessLevel();
      setIsLoading(false);
    };

    loadAccessLevel();
  }, [isAuthenticated, token]);

  return (
    <AccessContext.Provider value={{ accessLevel, setAccessLevel, isLoading, refreshAccessLevel }}>
      {children}
    </AccessContext.Provider>
  );
}

export function useAccess() {
  const context = useContext(AccessContext);
  if (context === undefined) {
    throw new Error('useAccess must be used within an AccessProvider');
  }
  return context;
}
