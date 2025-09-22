import React, { useEffect, useState } from 'react';
import { Wifi, WifiOff } from 'lucide-react';
import { useLanguage } from '@/contexts/language-context';
import '../professional-micro-interactions.css';

interface LiveStatusIndicatorProps {
  isConnected: boolean;
  className?: string;
}

export function LiveStatusIndicator({ isConnected, className = '' }: LiveStatusIndicatorProps) {
  const [pulseKey, setPulseKey] = useState(0);
  const { t } = useLanguage();

  // Trigger pulse animation when connection status changes
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
          {isConnected ? t('connection.liveFeed') : t('connection.disconnected')}
        </span>
      </div>
    </div>
  );
}

export default LiveStatusIndicator;