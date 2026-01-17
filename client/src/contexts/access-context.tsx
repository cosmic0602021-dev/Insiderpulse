import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import type { AccessLevel } from '@/lib/api';
import { apiClient } from '@/lib/api';
import { useAuth } from './auth-context';

interface AccessContextType {
  accessLevel: AccessLevel; // 항상 기본값 존재 (guest mode)
  setAccessLevel: (accessLevel: AccessLevel) => void;
  isLoading: boolean;
  refreshAccessLevel: () => Promise<void>;
}

const AccessContext = createContext<AccessContextType | undefined>(undefined);

export function AccessProvider({ children }: { children: ReactNode }) {
  // 기본값: guest mode로 즉시 시작 (비블로킹)
  const [accessLevel, setAccessLevel] = useState<AccessLevel>({
    hasRealtimeAccess: false,
    isDelayed: true,
    delayHours: 48,
  });
  const [isLoading, setIsLoading] = useState(false); // 비블로킹: 즉시 false
  const { isAuthenticated, token, user, refreshUser, isLoading: authLoading } = useAuth();

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
        isTrialing: trialStatus.isTrialing,
        hasUsedTrial: trialStatus.hasUsedTrial,
        trialExpiresAt: trialStatus.trialExpiresAt
      });

      setAccessLevel({
        hasRealtimeAccess: trialStatus.canAccessRealtime,
        isDelayed: !trialStatus.canAccessRealtime,
        delayHours: trialStatus.canAccessRealtime ? 0 : 48,
        isTrialing: trialStatus.isTrialing,
        trialExpiresAt: trialStatus.trialExpiresAt,
        hasUsedTrial: trialStatus.hasUsedTrial,
        tier: trialStatus.tier,
        status: trialStatus.status,
      });

      console.log('✅ [ACCESS CONTEXT] Access level updated:',{
        hasRealtimeAccess: trialStatus.canAccessRealtime,
        isTrialing: trialStatus.isTrialing,
        hasUsedTrial: trialStatus.hasUsedTrial
      });

      // CRITICAL FIX: Check if user data in auth context is stale
      // If API says user has premium but user object says otherwise, refresh user data
      const userDataIsStale =
        user &&
        (user.subscriptionTier !== trialStatus.tier ||
         user.subscriptionStatus !== trialStatus.status);

      if (userDataIsStale && refreshUser) {
        console.log('⚠️ [ACCESS CONTEXT] User data appears stale, refreshing from server...');
        console.log('   Current user:', { tier: user.subscriptionTier, status: user.subscriptionStatus });
        console.log('   API says:', { tier: trialStatus.tier, status: trialStatus.status });
        await refreshUser();
      }
    } catch (error) {
      console.error('❌ [ACCESS CONTEXT] Failed to fetch access level:', error);
      console.error('   Error details:', error instanceof Error ? error.message : String(error));

      // CRITICAL FIX: Don't default to free access on API error!
      // Instead, use the user's subscription data from auth context as fallback
      let hasPremiumFromUser = false;

      if (user && user.subscriptionTier === 'insider_pro') {
        // For active/trialing status: no endDate check needed
        if (user.subscriptionStatus === 'active' || user.subscriptionStatus === 'trialing') {
          hasPremiumFromUser = true;
        }
        // For canceled status: must have future endDate
        else if (user.subscriptionStatus === 'canceled' && user.subscriptionEndDate) {
          const endDate = new Date(user.subscriptionEndDate);
          const now = new Date();
          hasPremiumFromUser = endDate > now;
        }
      }

      console.log('⚠️ [ACCESS CONTEXT] API error - using fallback logic');
      console.log('   User data:', {
        tier: user?.subscriptionTier,
        status: user?.subscriptionStatus,
        endDate: user?.subscriptionEndDate,
        hasPremium: hasPremiumFromUser
      });

      if (hasPremiumFromUser) {
        console.log('✅ [ACCESS CONTEXT] Fallback: User has valid premium subscription');
        setAccessLevel({
          hasRealtimeAccess: true,
          isDelayed: false,
          delayHours: 0,
          tier: user.subscriptionTier,
          status: user.subscriptionStatus,
        });
      } else {
        console.log('🔒 [ACCESS CONTEXT] Fallback: Defaulting to free access');
        setAccessLevel({
          hasRealtimeAccess: false,
          isDelayed: true,
          delayHours: 48,
        });
      }
    }
  };

  useEffect(() => {
    // 인증 로딩 중에는 API 호출 건너뛰기 (비블로킹)
    if (authLoading) {
      console.log('🔄 [ACCESS CONTEXT] Waiting for auth to complete...');
      return;
    }

    console.log('🔄 [ACCESS CONTEXT] useEffect triggered - isAuthenticated:', isAuthenticated, ', token:', !!token);

    // 백그라운드에서 access level 새로고침 (비블로킹)
    const loadAccessLevel = async () => {
      // 인증되지 않은 경우 API 호출 없이 기본값 유지
      if (!isAuthenticated) {
        console.log('🔒 [ACCESS CONTEXT] Not authenticated, using default guest access');
        return;
      }

      setIsLoading(true);
      await refreshAccessLevel();
      setIsLoading(false);
    };

    loadAccessLevel();
  }, [authLoading, isAuthenticated, token, user?.subscriptionTier, user?.subscriptionStatus]); // Re-check when subscription changes

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
