/**
 * AdMob Context
 * 앱인토스 환경에서 AdMob 광고를 전역적으로 관리하는 React Context
 */

import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { adMobManager, ADMOB_AD_UNIT_ID, initializeAdMob } from '@/lib/admob';
import { ENV_CONFIG } from '@/lib/environment';

interface AdMobContextValue {
  /** 광고가 로드되었는지 여부 */
  isAdLoaded: boolean;
  /** 광고가 현재 표시 중인지 여부 */
  isAdShowing: boolean;
  /** 광고 로딩 중인지 여부 */
  isAdLoading: boolean;
  /** 광고 표시 함수 */
  showAd: () => Promise<void>;
  /** 광고 로드 함수 */
  loadAd: () => Promise<void>;
  /** 에러 정보 */
  error: Error | null;
}

const AdMobContext = createContext<AdMobContextValue | null>(null);

interface AdMobProviderProps {
  children: ReactNode;
}

export function AdMobProvider({ children }: AdMobProviderProps) {
  const [isAdLoaded, setIsAdLoaded] = useState(false);
  const [isAdShowing, setIsAdShowing] = useState(false);
  const [isAdLoading, setIsAdLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  // 광고 로드 함수
  const loadAd = useCallback(async () => {
    if (!ENV_CONFIG.isAppintos) {
      console.log('[AdMobProvider] Skipping ad load (not in Appintos)');
      return;
    }

    setIsAdLoading(true);
    setError(null);

    try {
      await adMobManager.loadInterstitialAd(ADMOB_AD_UNIT_ID);
      setIsAdLoaded(true);
      console.log('[AdMobProvider] Ad loaded successfully');
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      console.error('[AdMobProvider] Failed to load ad:', error);
      setError(error);
      setIsAdLoaded(false);
    } finally {
      setIsAdLoading(false);
    }
  }, []);

  // 광고 표시 함수
  const showAd = useCallback(async () => {
    if (!ENV_CONFIG.isAppintos) {
      console.log('[AdMobProvider] Skipping ad show (not in Appintos)');
      return;
    }

    if (!isAdLoaded) {
      console.warn('[AdMobProvider] No ad loaded. Loading now...');
      await loadAd();
      // 광고 로드가 실패하면 여기서 리턴
      if (!adMobManager.isAdLoaded) {
        console.error('[AdMobProvider] Failed to load ad, cannot show');
        return;
      }
    }

    setIsAdShowing(true);
    setError(null);

    try {
      await adMobManager.showInterstitialAd();
      console.log('[AdMobProvider] Ad shown and dismissed successfully');
      setIsAdLoaded(false); // 광고 표시 후 로드 상태 초기화
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      console.error('[AdMobProvider] Failed to show ad:', error);
      setError(error);
      // 에러 발생 시에도 로드 상태 초기화
      setIsAdLoaded(false);
    } finally {
      setIsAdShowing(false);
    }
  }, [isAdLoaded, loadAd]);

  // 앱인토스 환경에서만 초기화
  useEffect(() => {
    if (!ENV_CONFIG.isAppintos) {
      console.log('[AdMobProvider] Not in Appintos environment, skipping initialization');
      return;
    }

    console.log('[AdMobProvider] Initializing AdMob...');

    // 앱 시작 시 첫 광고 로드
    initializeAdMob()
      .then(() => {
        console.log('[AdMobProvider] Initial ad loaded');
        setIsAdLoaded(true);
      })
      .catch((err) => {
        const error = err instanceof Error ? err : new Error(String(err));
        console.error('[AdMobProvider] Initial ad load failed:', error);
        setError(error);
      });
  }, []);

  // 주기적으로 광고 매니저 상태 동기화 (1초마다)
  useEffect(() => {
    if (!ENV_CONFIG.isAppintos) {
      return;
    }

    const interval = setInterval(() => {
      setIsAdLoaded(adMobManager.isAdLoaded);
      setIsAdShowing(adMobManager.isAdShowing);
      setIsAdLoading(adMobManager.isAdLoading);
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const value: AdMobContextValue = {
    isAdLoaded,
    isAdShowing,
    isAdLoading,
    showAd,
    loadAd,
    error,
  };

  return <AdMobContext.Provider value={value}>{children}</AdMobContext.Provider>;
}

/**
 * AdMob Context Hook
 * @throws Error if used outside AdMobProvider
 */
export function useAdMob() {
  const context = useContext(AdMobContext);
  if (!context) {
    throw new Error('useAdMob must be used within AdMobProvider');
  }
  return context;
}
