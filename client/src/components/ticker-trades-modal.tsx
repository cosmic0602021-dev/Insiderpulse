import { useState, useEffect } from 'react';
import { X, ExternalLink, TrendingUp, TrendingDown, Building2, User, Calendar, DollarSign, Percent, Bell, BellOff } from 'lucide-react';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { VisuallyHidden } from '@radix-ui/react-visually-hidden';
import { useLanguage } from '@/contexts/language-context';
import { useCurrency } from '@/contexts/currency-context';
import { useAuth } from '@/contexts/auth-context';
import { useToast } from '@/hooks/use-toast';
import { resolveApiUrl } from '@/lib/queryClient';
import { ENV_CONFIG } from '@/lib/environment';
import { formatNumber } from '@/lib/translations';

interface Trade {
  name: string;
  title: string;
  shares: number;
  pricePerShare: number;
  totalValue: number;
  date: string;
  tradeType: string;
  secFilingUrl?: string;
  accessionNumber?: string;
  isInstitution?: boolean;
}

interface TickerTradesModalProps {
  isOpen: boolean;
  onClose: () => void;
  ticker: string;
  companyName: string;
  trades: Trade[];
  currentPrice?: number;
  marketCap: number | null;
  totalNetBuying: number;
}

export function TickerTradesModal({
  isOpen,
  onClose,
  ticker,
  companyName,
  trades,
  currentPrice,
  marketCap,
  totalNetBuying
}: TickerTradesModalProps) {
  const { language } = useLanguage();
  const { formatCurrency } = useCurrency();
  const { isAuthenticated } = useAuth();
  const { toast } = useToast();

  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isSubscribing, setIsSubscribing] = useState(false);

  // 구독 상태 확인
  useEffect(() => {
    if (isOpen && ticker && isAuthenticated) {
      checkSubscription();
    }
  }, [isOpen, ticker, isAuthenticated]);

  const checkSubscription = async () => {
    try {
      const token = localStorage.getItem('authToken');
      const res = await fetch(resolveApiUrl('/api/notifications/subscriptions'), {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        const sub = data.subscriptions?.find((s: any) => s.ticker === ticker);
        setIsSubscribed(!!sub?.isActive);
      }
    } catch (error) {
      console.error('Failed to check subscription:', error);
    }
  };

  // Check if PWA is installed
  const isPWAInstalled = () => {
    if (typeof window === 'undefined') return false;
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
    const isIOSStandalone = (window.navigator as any).standalone === true;
    return isStandalone || isIOSStandalone;
  };

  const isMobileDevice = () => {
    if (typeof window === 'undefined') return false;
    return /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini|mobile|tablet/i.test(navigator.userAgent);
  };

  const isIOSDevice = () => /iphone|ipad|ipod/i.test(navigator.userAgent);

  // 알림 토글
  const handleNotificationToggle = async () => {
    if (!isAuthenticated) {
      toast({
        title: '로그인 필요',
        description: '알림을 받으려면 로그인하세요.',
        variant: 'destructive'
      });
      return;
    }

    // Check if mobile and PWA not installed (only for subscribe)
    if (!isSubscribed && !ENV_CONFIG.isAppintos && isMobileDevice() && !isPWAInstalled()) {
      const installGuide = isIOSDevice()
        ? 'Safari 하단의 공유 버튼 → "홈 화면에 추가"를 선택하세요.'
        : 'Chrome 메뉴(⋮) → "홈 화면에 추가" 또는 "앱 설치"를 선택하세요.';

      toast({
        title: '앱 설치 필요',
        description: `푸시 알림을 받으려면 홈 화면에 앱을 설치해주세요. ${installGuide}`,
        variant: 'destructive',
        duration: 8000,
      });
      return;
    }

    setIsSubscribing(true);
    try {
      const token = localStorage.getItem('authToken');
      const res = await fetch(resolveApiUrl('/api/notifications/subscribe'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          ...(ENV_CONFIG.isAppintos && { 'x-appintos-env': 'true' }),
        },
        body: JSON.stringify({
          ticker,
          companyName,
          action: isSubscribed ? 'unsubscribe' : 'subscribe'
        })
      });

      if (res.ok) {
        setIsSubscribed(!isSubscribed);
        toast({
          title: isSubscribed ? '알림 해제' : '알림 구독',
          description: `${ticker} 알림이 ${isSubscribed ? '해제' : '등록'}되었습니다.`
        });
      }
    } catch (error) {
      toast({ title: '오류 발생', variant: 'destructive' });
    }
    setIsSubscribing(false);
  };

  if (!ticker || !companyName) return null;

  // Calculate aggregate percentage
  const aggregatePercent = marketCap && marketCap > 0
    ? (totalNetBuying / marketCap) * 100
    : 0;

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString(language === 'ko' ? 'ko-KR' : 'en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const formatShares = (shares: number) => {
    if (shares >= 1000000) {
      return `${(shares / 1000000).toFixed(2)}M`;
    } else if (shares >= 1000) {
      return `${(shares / 1000).toFixed(1)}K`;
    }
    return shares.toLocaleString();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-[95vw] max-w-[95vw] md:w-auto md:max-w-[900px] lg:max-w-[1000px] xl:max-w-[1200px] max-h-[90vh] overflow-hidden bg-[#0a0a0a] border border-neutral-800 p-0">
        <VisuallyHidden>
          <DialogTitle>{companyName} - All Insider Trades</DialogTitle>
        </VisuallyHidden>

        {/* Header */}
        <div className="sticky top-0 z-10 bg-[#0a0a0a] border-b border-neutral-800 p-6">
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
              <h2 className="text-2xl font-bold text-neutral-100 mb-1">{companyName}</h2>
              <div className="flex items-center gap-2">
                <span className="text-lg font-mono text-neutral-400">{ticker}</span>
                {currentPrice && (
                  <span className="text-sm text-neutral-500">
                    @ {formatCurrency(currentPrice)}
                  </span>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2">
              {/* 알림 버튼 */}
              <button
                onClick={handleNotificationToggle}
                disabled={isSubscribing}
                className="p-2 hover:bg-neutral-900 rounded-lg transition-colors disabled:opacity-50"
                title={isSubscribed ? '알림 해제' : '알림 받기'}
              >
                {isSubscribing ? (
                  <Bell size={20} className="text-neutral-500 animate-pulse" />
                ) : isSubscribed ? (
                  <BellOff size={20} className="text-amber-500" />
                ) : (
                  <Bell size={20} className="text-neutral-400" />
                )}
              </button>
              <button
                onClick={onClose}
                className="p-2 hover:bg-neutral-900 rounded-lg transition-colors"
              >
                <X size={20} className="text-neutral-400" />
              </button>
            </div>
          </div>

          {/* 소셜 프루프 - 실시간 조회수 */}
          <div className="mb-4 px-3 py-2.5 bg-amber-950/20 border border-amber-500/30 flex items-center gap-2.5 rounded-lg shadow-lg">
            <div className="relative flex items-center">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-amber-500"></span>
              </span>
            </div>
            <span className="text-[11px] text-amber-300 font-mono font-bold">
              🔥 {(() => {
                // ticker 기반으로 일관성 있는 랜덤 숫자 생성
                const seed = ticker.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
                const base = 500 + (seed % 1500);
                const viewers = base + Math.floor(Math.random() * 100);
                return `${viewers.toLocaleString()}명이 지금 보는 중`;
              })()}
            </span>
          </div>

          {/* Aggregate Summary */}
          <div className="grid grid-cols-3 gap-4 p-4 bg-neutral-900/50 rounded-lg border border-neutral-800">
            <div>
              <div className="text-xs text-neutral-500 mb-1">Total Trades</div>
              <div className="text-xl font-bold text-neutral-200">{trades.length}</div>
            </div>
            <div>
              <div className="text-xs text-neutral-500 mb-1">Net Buying</div>
              <div className="text-xl font-bold text-emerald-500">
                {formatCurrency(totalNetBuying)}
              </div>
            </div>
            <div>
              <div className="text-xs text-neutral-500 mb-1">% of Market Cap</div>
              <div className="text-xl font-bold text-amber-500">
                {aggregatePercent.toFixed(2)}%
              </div>
            </div>
          </div>
        </div>

        {/* Trades List */}
        <div className="overflow-y-auto p-6 space-y-3" style={{ maxHeight: 'calc(90vh - 220px)' }}>
          {trades.length === 0 ? (
            <div className="text-center py-12 text-neutral-500">
              <Building2 size={48} className="mx-auto mb-4 opacity-50" />
              <p>No trades found for this ticker</p>
            </div>
          ) : (
            trades.map((trade, index) => {
              const tradePercent = marketCap && marketCap > 0
                ? (trade.totalValue / marketCap) * 100
                : 0;

              return (
                <div
                  key={`${trade.name}-${trade.date}-${index}`}
                  className="p-4 bg-neutral-900/30 border border-neutral-800 rounded-lg hover:bg-neutral-900/50 transition-colors"
                >
                  {/* Trader Info */}
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        {trade.isInstitution ? (
                          <Building2 size={16} className="text-neutral-500" />
                        ) : (
                          <User size={16} className="text-neutral-500" />
                        )}
                        <h3 className="font-semibold text-neutral-200">{trade.name}</h3>
                      </div>
                      <p className="text-sm text-neutral-500">{trade.title}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      {trade.tradeType === 'BUY' || trade.tradeType === 'PURCHASE' ? (
                        <TrendingUp size={16} className="text-emerald-500" />
                      ) : (
                        <TrendingDown size={16} className="text-rose-500" />
                      )}
                      <span className={`text-xs font-bold px-2 py-1 rounded ${
                        trade.tradeType === 'BUY' || trade.tradeType === 'PURCHASE'
                          ? 'bg-emerald-900/30 text-emerald-500'
                          : 'bg-rose-900/30 text-rose-500'
                      }`}>
                        {trade.tradeType}
                      </span>
                    </div>
                  </div>

                  {/* Trade Stats */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-3">
                    <div>
                      <div className="flex items-center gap-1 text-xs text-neutral-500 mb-1">
                        <Calendar size={12} />
                        <span>Date</span>
                      </div>
                      <div className="text-sm font-medium text-neutral-300">
                        {formatDate(trade.date)}
                      </div>
                    </div>
                    <div>
                      <div className="flex items-center gap-1 text-xs text-neutral-500 mb-1">
                        <DollarSign size={12} />
                        <span>Shares</span>
                      </div>
                      <div className="text-sm font-medium text-neutral-300">
                        {formatShares(trade.shares)}
                      </div>
                    </div>
                    <div>
                      <div className="flex items-center gap-1 text-xs text-neutral-500 mb-1">
                        <DollarSign size={12} />
                        <span>Value</span>
                      </div>
                      <div className="text-sm font-bold text-emerald-500">
                        {formatCurrency(trade.totalValue)}
                      </div>
                    </div>
                    <div>
                      <div className="flex items-center gap-1 text-xs text-neutral-500 mb-1">
                        <Percent size={12} />
                        <span>of Market Cap</span>
                      </div>
                      <div className="text-sm font-bold text-amber-500">
                        {tradePercent.toFixed(2)}%
                      </div>
                    </div>
                  </div>

                  {/* SEC Filing Link - 강화된 디자인 */}
                  {trade.secFilingUrl && (
                    <a
                      href={trade.secFilingUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-3 inline-flex items-center gap-2 px-3 py-2 bg-emerald-950/30 border border-emerald-900/50 rounded text-xs text-emerald-400 hover:bg-emerald-950/40 hover:border-emerald-900/70 transition-all font-mono"
                    >
                      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span className="font-bold">SEC 공식 검증</span>
                      <ExternalLink size={12} className="ml-auto" />
                      {trade.accessionNumber && (
                        <span className="text-neutral-600 text-[10px]">({trade.accessionNumber.slice(0, 10)}...)</span>
                      )}
                    </a>
                  )}
                </div>
              );
            })
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
