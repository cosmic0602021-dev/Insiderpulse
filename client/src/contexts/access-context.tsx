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
  const { isAuthenticated, token, user } = useAuth();

  const refreshAccessLevel = async () => {
    console.log('🔄 [ACCESS CONTEXT] Refreshing access level...');
    console.log('   isAuthenticated:', isAuthenticated);
    console.log('   user:', user ? {
      email: user.email,
      tier: user.subscriptionTier,
      status: user.subscriptionStatus
    } : 'null');

    if (!isAuthenticated || !token) {
      console.log('🔒 [ACCESS CONTEXT] User not authenticated, setting free access');
      setAccessLevel({
        hasRealtimeAccess: false,
        isDelayed: true,
        delayHours: 48,
      });
      return;
    }

    try {
      const trialStatus = await apiClient.getTrialStatus();
      console.log('✅ [ACCESS CONTEXT] Trial status received:', {
        canAccessRealtime: trialStatus.canAccessRealtime,
        tier: trialStatus.tier,
        status: trialStatus.status,
        isTrialing: trialStatus.isTrialing
      });

      setAccessLevel({
        hasRealtimeAccess: trialStatus.canAccessRealtime,
        isDelayed: !trialStatus.canAccessRealtime,
        delayHours: trialStatus.canAccessRealtime ? 0 : 48,
      });

      console.log('✅ [ACCESS CONTEXT] Access level updated:',{
        hasRealtimeAccess: trialStatus.canAccessRealtime
      });
    } catch (error) {
      console.error('❌ [ACCESS CONTEXT] Failed to fetch access level:', error);
      setAccessLevel({
        hasRealtimeAccess: false,
        isDelayed: true,
        delayHours: 48,
      });
    }
  };

  useEffect(() => {
    console.log('🔄 [ACCESS CONTEXT] useEffect triggered - isAuthenticated:', isAuthenticated, ', token:', !!token);

    const loadAccessLevel = async () => {
      setIsLoading(true);
      await refreshAccessLevel();
      setIsLoading(false);
    };

    loadAccessLevel();
  }, [isAuthenticated, token, user?.subscriptionTier, user?.subscriptionStatus]); // Re-check when subscription changes

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
