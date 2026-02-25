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

      // 토스 토큰이 있으면 세션 검증 (앱인토스 환경에서만)
      const hasTossToken = ENV_CONFIG.isAppintos && !!localStorage.getItem('toss_access_token');

      if (hasTossToken) {
        console.log('[AUTH] 🔑 Toss token found, validating...');

        try {
          const tossUser = await checkExistingTossSession();

          if (tossUser) {
            console.log('[AUTH] ✅ Valid Toss session, restoring user');
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

          console.log('[AUTH] ⚠️ Toss session invalid, clearing token');
          localStorage.removeItem('toss_access_token');
          localStorage.removeItem('toss_refresh_token');
          localStorage.removeItem('toss_user_key');
          localStorage.removeItem('authUser');
        } catch (error) {
          console.log('[AUTH] ⚠️ Toss session check failed:', error);
          localStorage.removeItem('toss_access_token');
          localStorage.removeItem('toss_refresh_token');
          localStorage.removeItem('toss_user_key');
          localStorage.removeItem('authUser');
        }
      } else if (!ENV_CONFIG.isAppintos) {
        // 웹 환경에서는 토스 토큰이 있으면 정리
        if (localStorage.getItem('toss_access_token')) {
          console.log('[AUTH] 🧹 Cleaning up Toss tokens in web environment');
          localStorage.removeItem('toss_access_token');
          localStorage.removeItem('toss_refresh_token');
          localStorage.removeItem('appintos_user_id');
        }
      }

      // 웹 환경: 이메일 로그인 세션 확인 (토큰 검증 포함)
      const savedToken = localStorage.getItem('authToken');
      const savedUser = localStorage.getItem('authUser');

      if (savedToken && savedUser) {
        console.log('[AUTH] 🔑 Email login token found, validating...');

        try {
          // API Client에 토큰 설정
          apiClient.setToken(savedToken);

          // 서버에 토큰 유효성 검증 요청
          const verifyResponse = await apiClient.verifyToken();

          if (verifyResponse.success && verifyResponse.user) {
            console.log('[AUTH] ✅ Valid email login session, restoring user');
            const userObj = {
              id: verifyResponse.user.id,
              email: verifyResponse.user.email,
              password: '',
              role: 'user' as const,
              emailVerified: true,
              subscriptionTier: verifyResponse.user.subscriptionTier as 'free' | 'trial' | 'pro',
              subscriptionStatus: (verifyResponse.user.subscriptionStatus || 'active') as 'active' | 'canceled' | 'past_due',
              hasUsedTrial: verifyResponse.user.hasUsedTrial || false,
              createdAt: new Date(),
            };

            setUser(userObj);
            setToken(savedToken);

            // 최신 사용자 정보로 localStorage 업데이트
            localStorage.setItem('authUser', JSON.stringify(userObj));

            console.log('[AUTH] 📊 User subscription:', {
              tier: userObj.subscriptionTier,
              status: userObj.subscriptionStatus,
              hasUsedTrial: userObj.hasUsedTrial
            });

            setIsLoading(false);
            return;
          } else {
            console.log('[AUTH] ⚠️ Token verification failed, clearing session');
            // 토큰이 유효하지 않으면 로그아웃
            localStorage.removeItem('authToken');
            localStorage.removeItem('authUser');
            apiClient.setToken(null);
          }
        } catch (error) {
          console.log('[AUTH] ⚠️ Token verification error:', error);
          // 검증 실패 시 토큰 제거
          localStorage.removeItem('authToken');
          localStorage.removeItem('authUser');
          apiClient.setToken(null);
        }
      } else if (savedUser && !savedToken) {
        // 사용자 정보만 있고 토큰이 없으면 정리
        console.log('[AUTH] ⚠️ User data without token, clearing');
        localStorage.removeItem('authUser');
      }

      // 앱인토스 환경에서는 자동 토스 로그인 시도
      if (ENV_CONFIG.isAppintos) {
        console.log('[AUTH] 🔐 No session in Appintos, auto-login with Toss...');
        setIsLoading(false); // UI는 먼저 렌더링하고

        // 로그인은 비동기로 처리 (UI 블로킹 방지)
        setTimeout(async () => {
          try {
            const result = await performTossLogin();
            if (result.success && result.user) {
              console.log('[AUTH] ✅ Auto Toss login successful');
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
              queryClient.invalidateQueries();
            } else {
              console.log('[AUTH] ⚠️ Auto Toss login failed:', result.error);
            }
          } catch (error) {
            console.log('[AUTH] ⚠️ Auto Toss login error:', error);
          }
        }, 500); // 500ms 지연 (UI 렌더링 우선)
        return;
      }

      // 웹 환경: 기존 세션 없으면 로그인 안 함 (사용자가 버튼 클릭할 때까지 대기)
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
    console.log('🔓 [AUTH CONTEXT] Logging out user...');

    setUser(null);
    setToken(null);

    // 모든 인증 관련 localStorage 정리
    localStorage.removeItem('authToken');
    localStorage.removeItem('authUser');

    // 토스 로그인 데이터도 정리 (모든 환경에서)
    localStorage.removeItem('toss_access_token');
    localStorage.removeItem('toss_refresh_token');
    localStorage.removeItem('toss_user_key');
    localStorage.removeItem('appintos_user_id');

    // API Client 토큰 제거
    apiClient.setToken(null);

    // React Query 캐시 무효화
    queryClient.invalidateQueries({ queryKey: ['trades'] });

    console.log('✅ [AUTH CONTEXT] Logged out - all auth data cleared');
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
