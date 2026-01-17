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
      // 앱인토스 환경: 비블로킹 인증 (로딩 최적화)
      if (ENV_CONFIG.isAppintos) {
        console.log('🔐 [AUTH] Appintos environment detected, starting non-blocking auth...');
        const startTime = performance.now();

        // 1. localStorage에서 즉시 복원 (동기 - 블로킹 없음)
        const savedUser = localStorage.getItem('authUser');
        const savedUserId = localStorage.getItem('appintos_user_id');

        if (savedUser) {
          try {
            const parsedUser = JSON.parse(savedUser);
            console.log('⚡ [AUTH] Restored user from localStorage:', parsedUser.id);
            setUser(parsedUser);
            setToken(savedUserId ? `toss_verified_${savedUserId}` : null);
          } catch (e) {
            console.log('⚠️ [AUTH] Failed to parse saved user:', e);
          }
        }

        // 2. UI 즉시 표시 (서버 검증 대기 없이)
        setIsLoading(false);
        console.log(`⚡ [AUTH] UI ready in ${(performance.now() - startTime).toFixed(0)}ms`);

        // 3. 백그라운드에서 서버 세션 검증 (비블로킹)
        checkExistingTossSession()
          .then((tossUser) => {
            if (tossUser) {
              console.log('✅ [AUTH] Server verified Toss session:', tossUser.id);
              // 서버 검증 성공 - 상태 업데이트
              const userObj = {
                id: tossUser.id,
                email: tossUser.email || `${tossUser.id}@toss.user`,
                password: '',
                role: 'user',
                emailVerified: true,
                subscriptionTier: 'free',
                subscriptionStatus: 'active',
                hasUsedTrial: false,
                createdAt: new Date(),
              } as User;

              setUser(userObj);
              setToken(`toss_verified_${tossUser.id}`);
              localStorage.setItem('authUser', JSON.stringify(userObj));
              localStorage.setItem('appintos_user_id', tossUser.id);
            } else if (savedUser) {
              // 서버 세션 만료 - 로그아웃 처리
              console.log('ℹ️ [AUTH] Server session expired, clearing local state');
              setUser(null);
              setToken(null);
              localStorage.removeItem('authUser');
              localStorage.removeItem('appintos_user_id');
            } else {
              // 세션 없음 - 비로그인 상태 유지 (자동 로그인 시도 안함)
              console.log('ℹ️ [AUTH] No session - user needs to login manually');
            }
            console.log(`⚡ [AUTH] Background verification completed in ${(performance.now() - startTime).toFixed(0)}ms`);
          })
          .catch((error) => {
            console.log('⚠️ [AUTH] Background session check failed:', error);
            // 네트워크 오류 시 로컬 상태 유지 (오프라인 지원)
          });

        return;
      }

      // 웹 환경: 기존 이메일 로그인 세션 확인
      const savedToken = localStorage.getItem('authToken');
      const savedUser = localStorage.getItem('authUser');

      if (savedToken && savedUser) {
        try {
          const parsedUser = JSON.parse(savedUser);

          // Set token in API client first for verification request
          apiClient.setToken(savedToken);

          // Verify token with server
          console.log('🔐 Verifying saved token...');
          const verifyResponse = await apiClient.verifyToken();

          if (verifyResponse.success && verifyResponse.user) {
            console.log('✅ Token is valid, restoring session');
            console.log('   📊 User tier:', verifyResponse.user.subscriptionTier);
            console.log('   📊 User status:', verifyResponse.user.subscriptionStatus);
            setUser(verifyResponse.user as User);
            setToken(savedToken);
            // Update stored user info in case it changed
            localStorage.setItem('authUser', JSON.stringify(verifyResponse.user));
          } else {
            console.log('❌ Token is invalid, clearing session');
            // Token is invalid, clear everything
            localStorage.removeItem('authToken');
            localStorage.removeItem('authUser');
            apiClient.setToken(null);
          }
        } catch (error) {
          console.error('❌ Failed to verify token:', error);
          console.error('   Error details:', error instanceof Error ? error.message : String(error));
          console.log('   🧹 Clearing invalid session data');
          // Token verification failed, clear everything
          localStorage.removeItem('authToken');
          localStorage.removeItem('authUser');
          apiClient.setToken(null);
        }
      } else {
        console.log('ℹ️ No saved session found in localStorage');
      }

      console.log('✅ Auth initialization complete. Authenticated:', !!savedToken && !!savedUser);
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
    if (!ENV_CONFIG.isAppintos) {
      console.log('[AUTH] Not in Appintos, skipping Toss login');
      return false;
    }

    try {
      console.log('🔐 [AUTH] Starting Toss login (server-verified)...');
      const result = await performTossLogin();

      if (result.success && result.user) {
        console.log('✅ [AUTH] Toss login successful (server verified):', result.user.id);

        // 토스 유저를 일반 User 객체로 변환 (free tier로 설정)
        const tossUser = {
          id: result.user.id,
          email: result.user.email || `${result.user.id}@toss.user`,
          password: '', // 토스 로그인은 패스워드 없음
          role: 'user',
          emailVerified: true,
          subscriptionTier: 'free',
          subscriptionStatus: 'active',
          hasUsedTrial: false,
          createdAt: new Date(),
        } as User;

        setUser(tossUser);
        setToken(`toss_verified_${result.user.id}`);
        localStorage.setItem('authUser', JSON.stringify(tossUser));
        localStorage.setItem('appintos_user_id', result.user.id);
        // toss_access_token은 toss-login.ts의 exchangeTossToken에서 이미 저장됨

        queryClient.invalidateQueries({ queryKey: ['trades'] });
        console.log('✅ [AUTH] Toss user logged in (server session active)');
        return true;
      } else {
        console.log('❌ [AUTH] Toss login failed:', result.error);
        return false;
      }
    } catch (error) {
      console.error('❌ [AUTH] Toss login error:', error);
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
