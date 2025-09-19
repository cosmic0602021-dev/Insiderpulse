import React, { useEffect, useState } from 'react';
import { Wifi, WifiOff } from 'lucide-react';
import '../professional-micro-interactions.css';

interface LiveStatusIndicatorProps {
  isConnected: boolean;
  className?: string;
}

export function LiveStatusIndicator({ isConnected, className = '' }: LiveStatusIndicatorProps) {
  const [pulseKey, setPulseKey] = useState(0);

  // 연결 상태 변경 시 펄스 애니메이션 트리거
  useEffect(() => {
    setPulseKey(prev => prev + 1);
  }, [isConnected]);

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <div
        key={pulseKey}
        className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium transition-all duration-300 ${
          isConnected
            ? 'bg-green-50 text-green-700 border border-green-200 feedback-success'
            : 'bg-red-50 text-red-700 border border-red-200 feedback-error'
        }`}
      >
        {isConnected ? (
          <Wifi className="h-3 w-3 status-live" />
        ) : (
          <WifiOff className="h-3 w-3" />
        )}
        <span className="whitespace-nowrap">
          {isConnected ? '실시간 연결됨' : '연결 끊어짐'}
        </span>
      </div>
    </div>
  );
}

export default LiveStatusIndicator;