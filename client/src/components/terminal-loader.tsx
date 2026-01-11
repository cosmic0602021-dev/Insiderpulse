import React from 'react';

interface TerminalLoaderProps {
  text?: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

/**
 * 전문적인 펄스 도트 로딩 컴포넌트
 * 3개 점이 순차적으로 펄스되는 미니멀한 디자인
 */
export function TerminalLoader({ text, size = 'md', className = '' }: TerminalLoaderProps) {
  const dotSizes = {
    sm: 'w-1.5 h-1.5',
    md: 'w-2 h-2',
    lg: 'w-3 h-3',
  };

  const gaps = {
    sm: 'gap-1.5',
    md: 'gap-2',
    lg: 'gap-3',
  };

  const textSizes = {
    sm: 'text-[10px]',
    md: 'text-xs',
    lg: 'text-sm',
  };

  return (
    <div className={`flex flex-col items-center justify-center ${className}`}>
      <div className={`flex items-center ${gaps[size]}`}>
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className={`${dotSizes[size]} rounded-full bg-emerald-500 pulse-dot`}
            style={{ animationDelay: `${i * 0.2}s` }}
          />
        ))}
      </div>
      {text && (
        <div className={`mt-3 ${textSizes[size]} text-neutral-500 tracking-widest uppercase`}>
          {text}
        </div>
      )}
    </div>
  );
}

/**
 * 전체 화면 로딩 (페이지 전환용)
 */
export function FullPageLoader({ text }: { text?: string }) {
  return (
    <div className="flex h-screen w-screen items-center justify-center bg-[#050505]">
      <TerminalLoader size="lg" text={text} />
    </div>
  );
}

/**
 * 인라인 로딩 (버튼, 카드 내부용)
 */
export function InlineLoader({ className = '' }: { className?: string }) {
  return (
    <div className={`flex items-center gap-1 ${className}`}>
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          className="w-1 h-1 rounded-full bg-current pulse-dot"
          style={{ animationDelay: `${i * 0.15}s` }}
        />
      ))}
    </div>
  );
}

export default TerminalLoader;
