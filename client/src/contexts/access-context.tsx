import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import type { AccessLevel } from '@/lib/api';

interface AccessContextType {
  accessLevel: AccessLevel | null;
  setAccessLevel: (accessLevel: AccessLevel) => void;
  isLoading: boolean;
}

const AccessContext = createContext<AccessContextType | undefined>(undefined);

export function AccessProvider({ children }: { children: ReactNode }) {
  const [accessLevel, setAccessLevel] = useState<AccessLevel | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Initialize with free tier by default
    // Will be updated when API calls are made
    setAccessLevel({
      hasRealtimeAccess: false,
      isDelayed: true,
      delayHours: 48,
    });
    setIsLoading(false);
  }, []);

  return (
    <AccessContext.Provider value={{ accessLevel, setAccessLevel, isLoading }}>
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
