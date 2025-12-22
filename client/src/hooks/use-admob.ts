/**
 * useAdOnNavigation Hook
 * 페이지 전환 시 광고를 표시하는 Custom Hook
 */

import { useAdMob } from '@/contexts/admob-context';
import { ENV_CONFIG } from '@/lib/environment';

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
  const { showAd, isAdLoaded, isAdShowing } = useAdMob();

  /**
   * 광고를 표시한 후 네비게이션 콜백을 실행합니다
   *
   * @param navigationCallback - 광고 표시 후 실행할 함수 (페이지 이동, 모달 열기 등)
   * @returns Promise<void>
   *
   * 동작 방식:
   * 1. 웹 환경: 광고 없이 즉시 콜백 실행
   * 2. 앱인토스 + 광고 로드됨: 광고 표시 → 광고 닫힘 → 콜백 실행
   * 3. 앱인토스 + 광고 없음/실패: 에러 로깅 후 콜백 실행 (앱 차단 안 함)
   */
  const showAdBeforeNavigation = async (navigationCallback: () => void): Promise<void> => {
    // 웹 환경: 광고 없이 즉시 이동
    if (!ENV_CONFIG.isAppintos) {
      console.log('[useAdOnNavigation] Web environment, skipping ad');
      navigationCallback();
      return;
    }

    // 앱인토스 환경: 광고 시도
    try {
      // 광고가 이미 표시 중이면 대기
      if (isAdShowing) {
        console.log('[useAdOnNavigation] Ad is already showing, waiting...');
        await new Promise(resolve => setTimeout(resolve, 500));
      }

      // 광고 표시
      if (isAdLoaded) {
        console.log('[useAdOnNavigation] Showing ad before navigation...');
        await showAd();
        console.log('[useAdOnNavigation] Ad dismissed, executing callback');
      } else {
        console.warn('[useAdOnNavigation] Ad not loaded, proceeding without ad');
      }
    } catch (error) {
      // 광고 실패해도 앱 차단하지 않음
      console.error('[useAdOnNavigation] Ad failed, but continuing:', error);
    }

    // 광고 성공/실패 여부와 관계없이 콜백 실행
    navigationCallback();
  };

  return {
    showAdBeforeNavigation,
    isAdLoaded,
    isAdShowing,
  };
}

/**
 * 광고 표시 상태를 확인하는 간단한 Hook
 */
export function useAdStatus() {
  const { isAdLoaded, isAdShowing, isAdLoading, error } = useAdMob();

  return {
    isAdLoaded,
    isAdShowing,
    isAdLoading,
    hasError: error !== null,
    error,
  };
}
