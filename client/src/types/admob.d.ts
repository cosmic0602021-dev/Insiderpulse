/**
 * 앱인토스 AdMob API 타입 정의
 * @apps-in-toss/web-framework 패키지에서 제공되는 AdMob 광고 API 타입
 */

declare module '@apps-in-toss/web-framework' {
  // ===== 전면형 광고 (Interstitial Ads) =====

  /**
   * 광고 객체 (로드된 광고)
   */
  export interface InterstitialAd {
    id: string;
    [key: string]: any;
  }

  /**
   * 광고 로드 이벤트
   */
  export interface LoadAdMobInterstitialAdEvent {
    ad?: InterstitialAd;
    error?: {
      code: string;
      message: string;
    };
  }

  /**
   * 광고 표시 이벤트
   */
  export interface ShowAdMobInterstitialAdEvent {
    ad?: InterstitialAd;
    error?: {
      code: string;
      message: string;
    };
  }

  /**
   * 광고 로드 파라미터
   */
  export interface LoadAdMobInterstitialAdParams {
    adUnitId: string;
  }

  /**
   * 광고 표시 파라미터
   */
  export interface ShowAdMobInterstitialAdParams {
    ad: InterstitialAd;
  }

  /**
   * 전면형 광고 로드 함수
   * @param params - 광고 단위 ID를 포함한 파라미터
   * @returns 로드된 광고 객체를 포함한 Promise
   */
  export function loadAdMobInterstitialAd(
    params: LoadAdMobInterstitialAdParams
  ): Promise<{ ad: InterstitialAd }>;

  /**
   * 전면형 광고 표시 함수
   * @param params - 표시할 광고 객체를 포함한 파라미터
   * @returns 광고가 닫힐 때까지 대기하는 Promise
   */
  export function showAdMobInterstitialAd(
    params: ShowAdMobInterstitialAdParams
  ): Promise<void>;

  // ===== 보상형 광고 (Rewarded Ads) - 향후 구현 시 사용 =====

  export interface RewardedAd {
    id: string;
    [key: string]: any;
  }

  export interface LoadAdMobRewardedAdParams {
    adUnitId: string;
  }

  export interface ShowAdMobRewardedAdParams {
    ad: RewardedAd;
  }

  export interface RewardedAdEvent {
    ad?: RewardedAd;
    reward?: {
      type: string;
      amount: number;
    };
    error?: {
      code: string;
      message: string;
    };
  }

  export function loadAdMobRewardedAd(
    params: LoadAdMobRewardedAdParams
  ): Promise<{ ad: RewardedAd }>;

  export function showAdMobRewardedAd(
    params: ShowAdMobRewardedAdParams
  ): Promise<void>;

  // ===== 기존 환경 감지 API (main.tsx에서 이미 사용 중) =====

  export function getPlatformOS(): 'ios' | 'android' | 'web';
  export function getOperationalEnvironment(): 'production' | 'sandbox';
  export function getSchemeUri(): string;
}
