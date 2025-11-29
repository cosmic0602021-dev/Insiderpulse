import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import type { User } from '@shared/schema';
import { apiClient } from '@/lib/api';
import { queryClient } from '@/lib/queryClient';

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
  openAuthModal: (mode: 'login' | 'signup') => void;
  closeAuthModal: () => void;
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

    queryClient.invalidateQueries({ queryKey: ['/api/trades'] });
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

    queryClient.invalidateQueries({ queryKey: ['/api/trades'] });
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

  const openAuthModal = (mode: 'login' | 'signup') => {
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
