import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import type { User } from '@shared/schema';
import { apiClient } from '@/lib/api';

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
  const [isLoading, setIsLoading] = useState(true);
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
            setUser(verifyResponse.user);
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
          console.error('Failed to verify token:', error);
          // Token verification failed, clear everything
          localStorage.removeItem('authToken');
          localStorage.removeItem('authUser');
          apiClient.setToken(null);
        }
      }

      setIsLoading(false);
    };

    initAuth();
  }, []);

  const login = (newUser: User, newToken: string) => {
    setUser(newUser);
    setToken(newToken);
    localStorage.setItem('authToken', newToken);
    localStorage.setItem('authUser', JSON.stringify(newUser));
    // Set token in API client
    apiClient.setToken(newToken);
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('authToken');
    localStorage.removeItem('authUser');
    // Remove token from API client
    apiClient.setToken(null);
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

        setUser(verifyResponse.user);
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
