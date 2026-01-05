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
      // 앱인토스 환경: 토스 세션 확인 후 자동 로그인
      if (ENV_CONFIG.isAppintos) {
        console.log('🔐 [AUTH] Appintos environment detected, checking Toss session...');

        // 먼저 localStorage에서 기존 토스 유저 확인
        const savedTossUser = localStorage.getItem('authUser');
        const savedTossToken = localStorage.getItem('authToken');

        if (savedTossToken && savedTossUser && savedTossToken.startsWith('toss_')) {
          try {
            const parsedUser = JSON.parse(savedTossUser);
            console.log('✅ [AUTH] Found existing Toss user in localStorage:', parsedUser.id);
            setUser(parsedUser);
            setToken(savedTossToken);
            setIsLoading(false);
            return;
          } catch (e) {
            console.log('❌ [AUTH] Failed to parse saved Toss user');
          }
        }

        // 토스 세션 확인 시도
        try {
          const tossUser = await checkExistingTossSession();
          if (tossUser) {
            console.log('✅ [AUTH] Found existing Toss session:', tossUser.id);
            const userObj: User = {
              id: tossUser.id,
              email: tossUser.email || `${tossUser.id}@toss.user`,
              password: '',
              subscriptionTier: 'free',
              subscriptionStatus: 'active',
              hasUsedTrial: false,
              createdAt: new Date(),
            };
            const tossToken = `toss_${btoa(tossUser.id)}_${Date.now()}`;

            setUser(userObj);
            setToken(tossToken);
            localStorage.setItem('authToken', tossToken);
            localStorage.setItem('authUser', JSON.stringify(userObj));
            localStorage.setItem('appintos_user_id', tossUser.id);
          } else {
            console.log('ℹ️ [AUTH] No Toss session found, user not logged in');
          }
        } catch (error) {
          console.log('⚠️ [AUTH] Toss session check failed:', error);
        }

        setIsLoading(false);
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

    queryClient.invalidateQueries({ queryKey: ['trades'] });
    console.log('🔄 [AUTH CONTEXT] Logged out - invalidated trades cache');
  };

  // Manual refresh user data from server
  const refreshUser = async (): Promise<boolean> => {
    const savedToken = localStorage.getItem('authToken');

    if (!savedToken) {
      console.log('⚠️ No token found, cannot refresh user');
      return false;
    }

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

  // 앱인토스 토스 로그인
  const loginWithToss = async (): Promise<boolean> => {
    if (!ENV_CONFIG.isAppintos) {
      console.log('[AUTH] Not in Appintos, skipping Toss login');
      return false;
    }

    try {
      console.log('🔐 [AUTH] Starting Toss login...');
      const result = await performTossLogin();

      if (result.success && result.user) {
        console.log('✅ [AUTH] Toss login successful:', result.user.id);

        // 토스 유저를 일반 User 객체로 변환 (free tier로 설정)
        const tossUser: User = {
          id: result.user.id,
          email: result.user.email || `${result.user.id}@toss.user`,
          password: '', // 토스 로그인은 패스워드 없음
          subscriptionTier: 'free',
          subscriptionStatus: 'active',
          hasUsedTrial: false,
          createdAt: new Date(),
        };

        // 토큰은 userId를 base64 인코딩한 간단한 토큰 사용 (서버에서 별도 처리 필요 없음)
        const tossToken = `toss_${btoa(result.user.id)}_${Date.now()}`;

        setUser(tossUser);
        setToken(tossToken);
        localStorage.setItem('authToken', tossToken);
        localStorage.setItem('authUser', JSON.stringify(tossUser));
        localStorage.setItem('appintos_user_id', result.user.id);

        queryClient.invalidateQueries({ queryKey: ['trades'] });
        console.log('✅ [AUTH] Toss user logged in');
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
      {isLoading ? (
        <div className="min-h-screen flex items-center justify-center">
          <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
        </div>
      ) : (
        children
      )}
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
