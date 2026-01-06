/**
 * AdMob 광고 관리 모듈 (완전 재작성)
 * 앱인토스 환경에서 GoogleAdMob API를 사용하여 광고를 표시합니다.
 *
 * API 시그니처:
 * - GoogleAdMob.loadAppsInTossAdMob({ options: { adGroupId }, onEvent, onError })
 * - GoogleAdMob.showAppsInTossAdMob({ options: { adGroupId }, onEvent, onError })
 * - 반환값: cleanup 함수 (Promise 아님!)
 */

import { ENV_CONFIG } from './environment';

// GoogleAdMob API 캐시
let GoogleAdMobApi: any;
let isAdLoaded = false;

/**
 * 광고 그룹 ID
 * 앱인토스 콘솔에서 발급받은 ID 사용
 */
export const AD_GROUP_ID = import.meta.env.PROD
  ? import.meta.env.VITE_INTERSTITIAL_AD_GROUP_ID || 'ait.v2.live.39610dea1b124846'
  : 'ait-ad-test-interstitial-id';

export const REWARDED_AD_GROUP_ID = import.meta.env.PROD
  ? import.meta.env.VITE_REWARDED_AD_GROUP_ID || 'ait.v2.live.e07da976ac954c4a'
  : 'ait-ad-test-rewarded-id';

/**
 * GoogleAdMob API 동적 로드
 */
async function ensureGoogleAdMobAPI(): Promise<boolean> {
  if (GoogleAdMobApi) return true;

  if (!ENV_CONFIG.isAppintos) {
    console.log('[AdMob] Not in Appintos environment, skipping');
    return false;
  }

  try {
    console.log('[AdMob] Loading GoogleAdMob API...');
    const framework = await import('@apps-in-toss/web-framework') as any;

    console.log('[AdMob] Framework exports:', Object.keys(framework));

    GoogleAdMobApi = framework.GoogleAdMob;

    if (!GoogleAdMobApi) {
      console.error('[AdMob] GoogleAdMob not found in framework!');
      return false;
    }

    console.log('[AdMob] GoogleAdMob methods:', Object.keys(GoogleAdMobApi));

    if (!GoogleAdMobApi.loadAppsInTossAdMob) {
      console.error('[AdMob] loadAppsInTossAdMob not found!');
      return false;
    }

    if (!GoogleAdMobApi.showAppsInTossAdMob) {
      console.error('[AdMob] showAppsInTossAdMob not found!');
      return false;
    }

    // isSupported 체크
    if (GoogleAdMobApi.loadAppsInTossAdMob.isSupported && !GoogleAdMobApi.loadAppsInTossAdMob.isSupported()) {
      console.error('[AdMob] loadAppsInTossAdMob is not supported in this environment');
      return false;
    }

    console.log('[AdMob] GoogleAdMob API loaded successfully');
    return true;
  } catch (error) {
    console.error('[AdMob] Failed to load GoogleAdMob API:', error);
    return false;
  }
}

/**
 * 전면형 광고 로드 (Promise로 래핑)
 */
export async function loadInterstitialAd(adGroupId: string = AD_GROUP_ID): Promise<void> {
  if (!ENV_CONFIG.isAppintos) {
    console.log('[AdMob] Skipping ad load (not in Appintos)');
    return;
  }

  const apiReady = await ensureGoogleAdMobAPI();
  if (!apiReady) {
    console.warn('[AdMob] API not ready, skipping load');
    return;
  }

  console.log('[AdMob] Loading ad with adGroupId:', adGroupId);

  return new Promise((resolve, reject) => {
    const cleanup = GoogleAdMobApi.loadAppsInTossAdMob({
      options: { adGroupId },
      onEvent: (event: any) => {
        console.log('[AdMob] Load event:', event.type, event);
        if (event.type === 'loaded') {
          isAdLoaded = true;
          console.log('[AdMob] Ad loaded successfully');
          resolve();
        }
      },
      onError: (error: any) => {
        console.error('[AdMob] Load error:', error);
        isAdLoaded = false;
        reject(error);
      }
    });

    // cleanup 함수는 언마운트 시 호출 (여기서는 사용 안 함)
    console.log('[AdMob] Load initiated, cleanup function:', typeof cleanup);
  });
}

/**
 * 전면형 광고 표시 (Promise로 래핑)
 * dismissed 이벤트가 발생하면 resolve
 */
export async function showInterstitialAd(adGroupId: string = AD_GROUP_ID): Promise<void> {
  if (!ENV_CONFIG.isAppintos) {
    console.log('[AdMob] Skipping ad show (not in Appintos)');
    return;
  }

  const apiReady = await ensureGoogleAdMobAPI();
  if (!apiReady) {
    console.warn('[AdMob] API not ready, skipping show');
    return;
  }

  console.log('[AdMob] Showing ad with adGroupId:', adGroupId);

  return new Promise((resolve, reject) => {
    const cleanup = GoogleAdMobApi.showAppsInTossAdMob({
      options: { adGroupId },
      onEvent: (event: any) => {
        console.log('[AdMob] Show event:', event.type, event);

        switch (event.type) {
          case 'requested':
            console.log('[AdMob] Ad show requested');
            break;
          case 'show':
            console.log('[AdMob] Ad is now showing');
            break;
          case 'impression':
            console.log('[AdMob] Ad impression recorded');
            break;
          case 'clicked':
            console.log('[AdMob] Ad was clicked');
            break;
          case 'dismissed':
            console.log('[AdMob] Ad dismissed, resolving promise');
            isAdLoaded = false;
            resolve();
            break;
          case 'failedToShow':
            console.error('[AdMob] Ad failed to show');
            reject(new Error('Ad failed to show'));
            break;
          case 'userEarnedReward':
            console.log('[AdMob] User earned reward:', event.data);
            break;
        }
      },
      onError: (error: any) => {
        console.error('[AdMob] Show error:', error);
        reject(error);
      }
    });

    console.log('[AdMob] Show initiated, cleanup function:', typeof cleanup);
  });
}

/**
 * 광고 로드 상태 확인
 */
export function isAdReady(): boolean {
  return isAdLoaded;
}

/**
 * 앱 초기화 시 광고 프리로드
 */
export async function initializeAdMob(): Promise<void> {
  if (!ENV_CONFIG.isAppintos) {
    console.log('[AdMob] Skipping initialization (not in Appintos)');
    return;
  }

  console.log('[AdMob] Initializing...');

  try {
    await loadInterstitialAd(AD_GROUP_ID);
    console.log('[AdMob] Initialization complete');
  } catch (e) {
    console.error('[AdMob] Initialization failed:', e);
    // 초기화 실패해도 앱은 계속 실행
  }
}

/**
 * 레거시 호환성을 위한 AdMobManager 클래스
 * 기존 코드와 호환을 위해 유지하지만 내부적으로 새 API 사용
 */
class AdMobManager {
  async loadInterstitialAd(adGroupId: string = AD_GROUP_ID): Promise<void> {
    return loadInterstitialAd(adGroupId);
  }

  async showInterstitialAd(): Promise<void> {
    return showInterstitialAd(AD_GROUP_ID);
  }

  get isAdLoaded(): boolean {
    return isAdLoaded;
  }

  get isAdShowing(): boolean {
    return false; // 상태 추적이 필요하면 추가
  }

  get isAdLoading(): boolean {
    return false; // 상태 추적이 필요하면 추가
  }
}

export const adMobManager = new AdMobManager();

// 레거시 export 유지
export const ADMOB_AD_UNIT_ID = AD_GROUP_ID;
export const REWARDED_AD_UNIT_ID = REWARDED_AD_GROUP_ID;
