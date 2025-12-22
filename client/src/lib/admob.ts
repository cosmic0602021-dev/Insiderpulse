/**
 * AdMob 광고 관리 모듈
 * 앱인토스 환경에서 전면형 광고(Interstitial Ads)를 로드하고 표시합니다.
 */

import { ENV_CONFIG } from './environment';

// 앱인토스 광고 API 타입 (타입 정의는 admob.d.ts에서 확장)
interface LoadAdMobInterstitialAdParams {
  adUnitId: string;
}

interface ShowAdMobInterstitialAdParams {
  ad: InterstitialAd;
}

interface InterstitialAd {
  id: string;
  [key: string]: any;
}

interface LoadAdMobInterstitialAdEvent {
  ad?: InterstitialAd;
  error?: {
    code: string;
    message: string;
  };
}

interface ShowAdMobInterstitialAdEvent {
  ad?: InterstitialAd;
  error?: {
    code: string;
    message: string;
  };
}

// 앱인토스 프레임워크 API 동적 import
let loadAdMobInterstitialAdApi: ((params: LoadAdMobInterstitialAdParams) => Promise<{ ad: InterstitialAd }>) | undefined;
let showAdMobInterstitialAdApi: ((params: ShowAdMobInterstitialAdParams) => Promise<void>) | undefined;

/**
 * 앱인토스 API를 lazy load합니다 (첫 사용 시에만 로드)
 */
async function ensureAdMobAPIs() {
  if (!ENV_CONFIG.isAppintos) {
    throw new Error('[AdMob] Not in Appintos environment');
  }

  if (loadAdMobInterstitialAdApi && showAdMobInterstitialAdApi) {
    return; // 이미 로드됨
  }

  try {
    const framework = await import('@apps-in-toss/web-framework');
    loadAdMobInterstitialAdApi = framework.loadAdMobInterstitialAd;
    showAdMobInterstitialAdApi = framework.showAdMobInterstitialAd;
    console.log('[AdMob] APIs loaded successfully');
  } catch (error) {
    console.error('[AdMob] Failed to load APIs:', error);
    throw error;
  }
}

/**
 * AdMob 광고 단위 ID
 * 프로덕션: 실제 광고 단위 ID (토스 콘솔에서 발급)
 * 테스트: Google 제공 테스트 광고 ID
 */
export const ADMOB_AD_UNIT_ID = import.meta.env.PROD
  ? import.meta.env.VITE_ADMOB_AD_UNIT_ID || 'ca-app-pub-XXXXXXXXXXXXX/YYYYYYYYYY' // 실제 ID로 교체 필요
  : 'ca-app-pub-3940256099942544/1033173712'; // Google 테스트 전면형 광고 ID

/**
 * AdMob 광고 관리 클래스
 * 싱글톤 패턴으로 전역에서 하나의 인스턴스만 사용
 */
class AdMobManager {
  private loadedAd: InterstitialAd | null = null;
  private isLoading: boolean = false;
  private isShowing: boolean = false;
  private loadPromise: Promise<void> | null = null;

  /**
   * 전면형 광고 로드
   * @param adUnitId - AdMob 광고 단위 ID
   */
  async loadInterstitialAd(adUnitId: string = ADMOB_AD_UNIT_ID): Promise<void> {
    // 웹 환경에서는 광고 로드 안 함
    if (!ENV_CONFIG.isAppintos) {
      console.log('[AdMob] Skipping ad load (not in Appintos environment)');
      return;
    }

    // API 로드 확인
    await ensureAdMobAPIs();

    // 이미 로드 중이면 기존 Promise 반환
    if (this.isLoading && this.loadPromise) {
      console.log('[AdMob] Ad is already loading, returning existing promise');
      return this.loadPromise;
    }

    // 이미 로드된 광고가 있으면 스킵
    if (this.loadedAd) {
      console.log('[AdMob] Ad already loaded');
      return;
    }

    this.isLoading = true;
    this.loadPromise = this._performLoad(adUnitId);

    try {
      await this.loadPromise;
    } finally {
      this.isLoading = false;
      this.loadPromise = null;
    }
  }

  /**
   * 실제 광고 로드 수행
   */
  private async _performLoad(adUnitId: string): Promise<void> {
    try {
      console.log('[AdMob] Loading interstitial ad...', adUnitId);

      if (!loadAdMobInterstitialAdApi) {
        throw new Error('loadAdMobInterstitialAd API not available');
      }

      const result = await loadAdMobInterstitialAdApi({ adUnitId });

      if (result.ad) {
        this.loadedAd = result.ad;
        console.log('[AdMob] Ad loaded successfully:', result.ad.id);
      } else {
        throw new Error('Ad load returned no ad object');
      }
    } catch (error) {
      console.error('[AdMob] Failed to load ad:', error);
      this.loadedAd = null;
      throw error;
    }
  }

  /**
   * 전면형 광고 표시
   * @returns Promise<void> - 광고가 닫힐 때까지 대기
   */
  async showInterstitialAd(): Promise<void> {
    // 웹 환경에서는 광고 표시 안 함
    if (!ENV_CONFIG.isAppintos) {
      console.log('[AdMob] Skipping ad show (not in Appintos environment)');
      return;
    }

    // API 로드 확인
    await ensureAdMobAPIs();

    // 광고가 로드되지 않았으면 에러
    if (!this.loadedAd) {
      throw new Error('[AdMob] No ad loaded. Call loadInterstitialAd() first.');
    }

    // 이미 광고가 표시 중이면 스킵
    if (this.isShowing) {
      console.warn('[AdMob] Ad is already showing');
      return;
    }

    this.isShowing = true;
    const adToShow = this.loadedAd;

    try {
      console.log('[AdMob] Showing interstitial ad...');

      if (!showAdMobInterstitialAdApi) {
        throw new Error('showAdMobInterstitialAd API not available');
      }

      await showAdMobInterstitialAdApi({ ad: adToShow });

      console.log('[AdMob] Ad dismissed successfully');

      // 광고 표시 후 로드된 광고 초기화
      this.loadedAd = null;

      // 다음 광고 사전 로드 (1초 후)
      setTimeout(() => {
        this.loadInterstitialAd(ADMOB_AD_UNIT_ID).catch((error) => {
          console.error('[AdMob] Failed to preload next ad:', error);
        });
      }, 1000);
    } catch (error) {
      console.error('[AdMob] Failed to show ad:', error);
      this.loadedAd = null; // 실패한 광고 제거
      throw error;
    } finally {
      this.isShowing = false;
    }
  }

  /**
   * 광고 로드 상태 확인
   */
  get isAdLoaded(): boolean {
    return this.loadedAd !== null;
  }

  /**
   * 광고 표시 상태 확인
   */
  get isAdShowing(): boolean {
    return this.isShowing;
  }

  /**
   * 광고 로딩 상태 확인
   */
  get isAdLoading(): boolean {
    return this.isLoading;
  }
}

/**
 * 전역 AdMob 관리자 인스턴스 (싱글톤)
 */
export const adMobManager = new AdMobManager();

/**
 * 앱 시작 시 첫 광고 로드 (앱인토스 환경에서만)
 * main.tsx나 App.tsx에서 호출
 */
export function initializeAdMob(): Promise<void> {
  if (!ENV_CONFIG.isAppintos) {
    console.log('[AdMob] Skipping initialization (not in Appintos environment)');
    return Promise.resolve();
  }

  console.log('[AdMob] Initializing AdMob...');
  return adMobManager.loadInterstitialAd(ADMOB_AD_UNIT_ID);
}
