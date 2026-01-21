import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import type { User } from '@shared/schema';
import { apiClient } from '@/lib/api';
import { queryClient } from '@/lib/queryClient';
import { ENV_CONFIG } from '@/lib/environment';
import { performTossLogin, checkExistingTossSession } from '@/lib/toss-login';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  showAuthModal: boolean;
  authModalMode: 'login' | 'signup';
  login: (user: User, token: string) => void;
  logout: () => void;
  refreshUser: () => Promise<boolean>;
  openAuthModal: (mode: 'login' | 'signup') => void | Promise<void>;
  closeAuthModal: () => void;
  loginWithToss: () => Promise<boolean>; // 앱인토스 토스 로그인
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  // In SSR environment, skip loading state to render content immediately
  const [isLoading, setIsLoading] = useState(typeof window === 'undefined' ? false : true);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authModalMode, setAuthModalMode] = useState<'login' | 'signup'>('login');

  // Load auth from localStorage on mount
  useEffect(() => {
    const initAuth = async () => {
      console.log('[AUTH] 🚀 Initializing authentication...');

      // 토스 토큰이 있으면 세션 검증 (앱인토스/웹 모두 동일)
      const hasTossToken = !!localStorage.getItem('toss_access_token');

      if (hasTossToken) {
        console.log('[AUTH] 🔑 Existing token found, validating...');

        try {
          const tossUser = await checkExistingTossSession();

          if (tossUser) {
            console.log('[AUTH] ✅ Valid session, restoring user');
            const userObj = {
              id: tossUser.id,
              email: tossUser.email || `${tossUser.id}@toss.user`,
              password: '',
              role: 'user' as const,
              emailVerified: true,
              subscriptionTier: 'free' as const,
              subscriptionStatus: 'active' as const,
              hasUsedTrial: false,
              createdAt: new Date(),
            };
            setUser(userObj);
            setToken(`toss_verified_${tossUser.id}`);
            localStorage.setItem('authUser', JSON.stringify(userObj));
            setIsLoading(false);
            return;
          }

          console.log('[AUTH] ⚠️ Session invalid, clearing token');
          localStorage.removeItem('toss_access_token');
          localStorage.removeItem('toss_refresh_token');
          localStorage.removeItem('toss_user_key');
          localStorage.removeItem('authUser');
        } catch (error) {
          console.log('[AUTH] ⚠️ Session check failed:', error);
          localStorage.removeItem('toss_access_token');
          localStorage.removeItem('toss_refresh_token');
          localStorage.removeItem('toss_user_key');
          localStorage.removeItem('authUser');
        }
      }

      // 웹 환경: 이메일 로그인 세션 확인
      if (!ENV_CONFIG.isAppintos) {
        const savedUser = localStorage.getItem('authUser');
        if (savedUser) {
          try {
            const parsedUser = JSON.parse(savedUser);
            setUser(parsedUser);
          } catch (e) {
            console.error('Failed to parse saved user:', e);
            localStorage.removeItem('authUser');
          }
        }
      }

      // 기존 세션 없으면 로그인 안 함 (사용자가 버튼 클릭할 때까지 대기)
      console.log('[AUTH] ℹ️ No existing session, waiting for user action');
      setIsLoading(false);
    };

    initAuth();
  }, []);

  const login = (newUser: User, newToken: string) => {
    console.log('🔐 [AUTH CONTEXT] Login called with user:', {
      email: newUser.email,
      tier: newUser.subscriptionTier,
      status: newUser.subscriptionStatus,
      hasUsedTrial: newUser.hasUsedTrial
    });

    setUser(newUser);
    setToken(newToken);
    localStorage.setItem('authToken', newToken);
    localStorage.setItem('authUser', JSON.stringify(newUser));
    apiClient.setToken(newToken);

    queryClient.invalidateQueries({ queryKey: ['trades'] });
    console.log('🔄 [AUTH CONTEXT] Invalidated trades cache to refetch with new access level');

    console.log('✅ [AUTH CONTEXT] User logged in and state updated');
    console.log('   💾 Token saved to localStorage');
    console.log('   🔑 Token set in API client:', newToken.substring(0, 20) + '...');
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('authToken');
    localStorage.removeItem('authUser');
    apiClient.setToken(null);

    // 토스 로그인 데이터도 정리
    if (ENV_CONFIG.isAppintos) {
      localStorage.removeItem('toss_access_token');
      localStorage.removeItem('toss_refresh_token');
      localStorage.removeItem('appintos_user_id');
    }

    queryClient.invalidateQueries({ queryKey: ['trades'] });
    console.log('🔄 [AUTH CONTEXT] Logged out - invalidated trades cache');
  };

  // Manual refresh user data from server
  const refreshUser = async (): Promise<boolean> => {
    // 앱인토스 환경에서는 서버 API로 토스 세션 확인
    if (ENV_CONFIG.isAppintos) {
      try {
        console.log('🔄 [AUTH] Refreshing Toss user session via server...');
        const tossUser = await checkExistingTossSession();
        if (tossUser) {
          console.log('✅ [AUTH] Toss session verified:', tossUser.id);
          return true;
        } else {
          console.log('❌ [AUTH] Toss session invalid or expired');
          // 세션이 만료되면 로그아웃 처리
          setUser(null);
          setToken(null);
          localStorage.removeItem('authUser');
          localStorage.removeItem('appintos_user_id');
          return false;
        }
      } catch (error) {
        console.log('⚠️ [AUTH] Toss session refresh failed:', error);
        return false;
      }
    }

    const savedToken = localStorage.getItem('authToken');

    if (!savedToken) {
      console.log('⚠️ No token found, cannot refresh user');
      return false;
    }

    // 일반 사용자는 기존 JWT 검증 로직
    try {
      console.log('🔄 Manually refreshing user data from server...');
      apiClient.setToken(savedToken);
      const verifyResponse = await apiClient.verifyToken();

      if (verifyResponse.success && verifyResponse.user) {
        console.log('✅ User data refreshed successfully:', verifyResponse.user);
        console.log('   📊 Subscription tier:', verifyResponse.user.subscriptionTier);
        console.log('   📊 Subscription status:', verifyResponse.user.subscriptionStatus);

        setUser(verifyResponse.user as User);
        setToken(savedToken);
        localStorage.setItem('authUser', JSON.stringify(verifyResponse.user));
        return true;
      } else {
        console.log('❌ Failed to refresh user data');
        return false;
      }
    } catch (error) {
      console.error('❌ Error refreshing user data:', error);
      return false;
    }
  };

  // 앱인토스 토스 로그인 (서버 검증 기반)
  const loginWithToss = async (): Promise<boolean> => {
    try {
      console.log('[AUTH] 🔐 Toss login triggered...');

      // Step 1: 이미 로그인되어 있는지 확인
      if (user) {
        console.log('[AUTH] ✅ Already logged in');
        return true;
      }

      // Step 2: 기존 세션 확인
      const existingSession = await checkExistingTossSession();
      if (existingSession) {
        console.log('[AUTH] ✅ Existing session found, restoring');
        const userObj = {
          id: existingSession.id,
          email: existingSession.email || `${existingSession.id}@toss.user`,
          password: '',
          role: 'user' as const,
          emailVerified: true,
          subscriptionTier: 'free' as const,
          subscriptionStatus: 'active' as const,
          hasUsedTrial: false,
          createdAt: new Date(),
        };
        setUser(userObj);
        setToken(`toss_verified_${existingSession.id}`);
        localStorage.setItem('authUser', JSON.stringify(userObj));
        queryClient.invalidateQueries();
        return true;
      }

      // Step 3: 새 로그인 시도 (performTossLogin은 1번만 호출)
      console.log('[AUTH] 🔐 No existing session, starting new login...');
      const result = await performTossLogin();

      if (result.success && result.user) {
        console.log('[AUTH] ✅ Toss login successful:', result.user);

        const userObj = {
          id: result.user.id,
          email: result.user.email || `${result.user.id}@toss.user`,
          password: '',
          role: 'user' as const,
          emailVerified: true,
          subscriptionTier: 'free' as const,
          subscriptionStatus: 'active' as const,
          hasUsedTrial: false,
          createdAt: new Date(),
        };

        setUser(userObj);
        setToken(`toss_verified_${result.user.id}`);
        localStorage.setItem('authUser', JSON.stringify(userObj));

        // React Query 캐시 무효화
        queryClient.invalidateQueries();

        return true;
      }

      console.log('[AUTH] ⚠️ Toss login failed:', result.error);
      return false;

    } catch (error) {
      console.error('[AUTH] ❌ Toss login error:', error);
      return false;
    }
  };

  // Listen for 401 unauthorized events from API client
  useEffect(() => {
    const handleAuthLogout = () => {
      console.log('🔓 Received auth:logout event, logging out...');
      logout();
    };

    window.addEventListener('auth:logout', handleAuthLogout);

    return () => {
      window.removeEventListener('auth:logout', handleAuthLogout);
    };
  }, []);

  // Auto-refresh user data when tab becomes visible (to sync localStorage with server)
  useEffect(() => {
    const handleVisibilityChange = async () => {
      if (document.visibilityState === 'visible' && user && token) {
        console.log('👁️ Tab became visible, refreshing user data...');
        await refreshUser();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [user, token]);

  const openAuthModal = async (mode: 'login' | 'signup') => {
    // 앱인토스 환경에서는 토스 로그인 사용
    if (ENV_CONFIG.isAppintos) {
      console.log('[AUTH] Appintos detected, using Toss login instead of modal');
      await loginWithToss();
      return;
    }

    // 웹 환경에서는 기존 이메일 로그인 모달 표시
    setAuthModalMode(mode);
    setShowAuthModal(true);
  };

  const closeAuthModal = () => {
    setShowAuthModal(false);
  };

  // 비블로킹 렌더링: 인증 중에도 앱 UI 표시
  // isLoading 상태는 children에 전달되어 필요한 컴포넌트에서 처리
  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!user && !!token,
        isLoading,
        showAuthModal,
        authModalMode,
        login,
        logout,
        refreshUser,
        openAuthModal,
        closeAuthModal,
        loginWithToss,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
