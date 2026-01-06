/**
 * LoadingScreen Component
 * 세련된 로딩 UI 컴포넌트
 */

import { Activity } from 'lucide-react';

interface LoadingScreenProps {
  message?: string;
  showProgressBar?: boolean;
}

export function LoadingScreen({
  message = "Loading...",
  showProgressBar = true
}: LoadingScreenProps) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] bg-[#0a0a0f]">
      {/* 브랜드 로고 + 펄스 효과 */}
      <div className="relative mb-6">
        {/* 외곽 핑 효과 */}
        <div className="w-16 h-16 rounded-full bg-emerald-500/20 animate-ping absolute inset-0" />
        {/* 중심 아이콘 */}
        <div className="w-16 h-16 rounded-full bg-emerald-500/10 flex items-center justify-center relative">
          <Activity className="w-8 h-8 text-emerald-500 animate-pulse-slow" />
        </div>
      </div>

      {/* 프로그레스 바 */}
      {showProgressBar && (
        <div className="w-48 h-1 bg-neutral-800 rounded-full overflow-hidden mb-4">
          <div className="h-full bg-emerald-500 rounded-full animate-loading-bar" />
        </div>
      )}

      {/* 로딩 메시지 */}
      <p className="text-neutral-400 text-sm">{message}</p>
    </div>
  );
}

/**
 * 인라인 로딩 스피너 (작은 영역용)
 */
export function InlineLoader({ message }: { message?: string }) {
  return (
    <div className="flex items-center justify-center gap-3 py-4">
      <div className="w-5 h-5 rounded-full border-2 border-emerald-500 border-t-transparent animate-spin" />
      {message && <span className="text-neutral-400 text-sm">{message}</span>}
    </div>
  );
}

/**
 * 스켈레톤 카드 (리스트 아이템용)
 */
export function SkeletonCard() {
  return (
    <div className="bg-neutral-900/50 rounded-lg p-4 animate-pulse">
      <div className="flex items-center gap-4">
        <div className="w-10 h-10 rounded-full bg-neutral-700" />
        <div className="flex-1 space-y-2">
          <div className="h-4 bg-neutral-700 rounded w-3/4" />
          <div className="h-3 bg-neutral-800 rounded w-1/2" />
        </div>
        <div className="w-16 h-6 bg-neutral-700 rounded" />
      </div>
    </div>
  );
}

/**
 * 스켈레톤 리스트 (여러 카드 로딩)
 */
export function SkeletonList({ count = 5 }: { count?: number }) {
  return (
    <div className="space-y-3 p-4">
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonCard key={i} />
      ))}
    </div>
  );
}
