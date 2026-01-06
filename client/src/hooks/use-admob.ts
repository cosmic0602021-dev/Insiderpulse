/**
 * useAdOnNavigation Hook
 * 페이지 전환 시 광고를 표시하는 Custom Hook
 *
 * 주의: AdMobProvider 없이도 작동하도록 직접 API 호출 사용
 */

import { ENV_CONFIG } from '@/lib/environment';
import { showInterstitialAd, loadInterstitialAd } from '@/lib/admob';

/**
 * 페이지 전환 시 광고를 표시하는 Hook
 *
 * 사용 예시:
 * ```tsx
 * const { showAdBeforeNavigation } = useAdOnNavigation();
 *
 * const handleClick = async () => {
 *   await showAdBeforeNavigation(() => {
 *     navigate('/next-page');
 *   });
 * };
 * ```
 */
export function useAdOnNavigation() {
  /**
   * 광고를 표시한 후 네비게이션 콜백을 실행합니다
   *
   * @param navigationCallback - 광고 표시 후 실행할 함수 (페이지 이동, 모달 열기 등)
   * @returns Promise<void>
   *
   * 동작 방식:
   * 1. 웹 환경: 광고 없이 즉시 콜백 실행
   * 2. 앱인토스: 광고 표시 시도 → 광고 닫힘/실패 → 콜백 실행
   */
  const showAdBeforeNavigation = async (navigationCallback: () => void): Promise<void> => {
    // 웹 환경: 광고 없이 즉시 이동
    if (!ENV_CONFIG.isAppintos) {
      console.log('[useAdOnNavigation] Web environment, skipping ad');
      navigationCallback();
      return;
    }

    console.log('[useAdOnNavigation] Appintos environment, attempting to show ad');

    // 앱인토스 환경: 광고 시도
    try {
      // 직접 showInterstitialAd 호출 (새 API 사용)
      console.log('[useAdOnNavigation] Calling showInterstitialAd...');
      await showInterstitialAd();
      console.log('[useAdOnNavigation] Ad dismissed successfully');

      // 다음 광고 프리로드 (백그라운드)
      loadInterstitialAd().catch(err => {
        console.warn('[useAdOnNavigation] Failed to preload next ad:', err);
      });
    } catch (error) {
      // 광고 실패해도 앱 차단하지 않음
      console.error('[useAdOnNavigation] Ad failed, but continuing:', error);
    }

    // 광고 성공/실패 여부와 관계없이 콜백 실행
    navigationCallback();
  };

  return {
    showAdBeforeNavigation,
    isAdLoaded: false, // 직접 API 사용 시 상태 추적 불가
    isAdShowing: false,
  };
}

/**
 * 광고 표시 상태를 확인하는 간단한 Hook
 * 참고: 직접 API 사용 시 상태 추적이 제한적임
 */
export function useAdStatus() {
  return {
    isAdLoaded: false,
    isAdShowing: false,
    isAdLoading: false,
    hasError: false,
    error: null,
  };
}
