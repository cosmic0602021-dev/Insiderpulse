import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, Sparkles, Target, AlertCircle } from 'lucide-react';
import { useLanguage } from '@/contexts/language-context';
import type { InsiderTrade } from '@shared/schema';

interface AISignal {
  id: string;
  ticker: string;
  companyName: string;
  signal: 'strong_buy' | 'buy' | 'watch' | 'caution';
  confidence: number;
  reason: string;
  insiderCount: number;
  totalValue: number;
  timeframe: string;
}

interface AISignalFeedProps {
  trades: InsiderTrade[];
  limit?: number;
}

export function AISignalFeed({ trades, limit = 3 }: AISignalFeedProps) {
  const { t } = useLanguage();

  // Generate AI signals from recent trades
  const generateSignals = (): AISignal[] => {
    // Group trades by ticker
    const tradesByTicker = trades.reduce((acc, trade) => {
      if (!acc[trade.ticker]) {
        acc[trade.ticker] = [];
      }
      acc[trade.ticker].push(trade);
      return acc;
    }, {} as Record<string, InsiderTrade[]>);

    // Analyze each ticker
    const signals: AISignal[] = Object.entries(tradesByTicker)
      .map(([ticker, tickerTrades]) => {
        const buyTrades = tickerTrades.filter(t =>
          t.tradeType?.toUpperCase().includes('BUY') ||
          t.tradeType?.toUpperCase().includes('PURCHASE')
        );
        const sellTrades = tickerTrades.filter(t =>
          t.tradeType?.toUpperCase().includes('SELL') ||
          t.tradeType?.toUpperCase().includes('SALE')
        );

        const totalBuyValue = buyTrades.reduce((sum, t) => sum + Math.abs(t.totalValue), 0);
        const totalSellValue = sellTrades.reduce((sum, t) => sum + Math.abs(t.totalValue), 0);
        const netValue = totalBuyValue - totalSellValue;

        const executiveTrades = tickerTrades.filter(t =>
          t.traderTitle?.toLowerCase().includes('ceo') ||
          t.traderTitle?.toLowerCase().includes('cfo') ||
          t.traderTitle?.toLowerCase().includes('president')
        );

        // Determine signal strength
        let signal: AISignal['signal'] = 'watch';
        let confidence = 50;
        let reason = '';

        if (buyTrades.length >= 3 && netValue > 1000000) {
          signal = 'strong_buy';
          confidence = 85 + Math.min(executiveTrades.length * 5, 15);
          reason = `${buyTrades.length} insiders buying, ${executiveTrades.length} executives`;
        } else if (buyTrades.length >= 2 && netValue > 500000) {
          signal = 'buy';
          confidence = 70 + Math.min(executiveTrades.length * 5, 15);
          reason = `${buyTrades.length} insiders accumulating`;
        } else if (sellTrades.length >= 3 && netValue < -500000) {
          signal = 'caution';
          confidence = 65;
          reason = `${sellTrades.length} insiders selling`;
        }

        return {
          id: ticker,
          ticker,
          companyName: tickerTrades[0].companyName,
          signal,
          confidence,
          reason,
          insiderCount: new Set(tickerTrades.map(t => t.traderName)).size,
          totalValue: Math.abs(netValue),
          timeframe: '7d',
        };
      })
      .filter(s => s.signal !== 'watch') // Only show actionable signals
      .sort((a, b) => b.confidence - a.confidence)
      .slice(0, limit);

    return signals;
  };

  const signals = generateSignals();

  const getSignalColor = (signal: AISignal['signal']) => {
    switch (signal) {
      case 'strong_buy': return 'bg-green-500 text-white';
      case 'buy': return 'bg-green-400 text-white';
      case 'caution': return 'bg-yellow-500 text-slate-900';
      default: return 'bg-slate-500 text-white';
    }
  };

  const getSignalIcon = (signal: AISignal['signal']) => {
    switch (signal) {
      case 'strong_buy': return <Target className="h-4 w-4" />;
      case 'buy': return <TrendingUp className="h-4 w-4" />;
      case 'caution': return <AlertCircle className="h-4 w-4" />;
      default: return <Sparkles className="h-4 w-4" />;
    }
  };

  const getSignalText = (signal: AISignal['signal']) => {
    switch (signal) {
      case 'strong_buy': return t('aiSignal.strongBuy');
      case 'buy': return t('aiSignal.buy');
      case 'caution': return t('aiSignal.caution');
      default: return t('aiSignal.watch');
    }
  };

  if (signals.length === 0) {
    return null;
  }

  return (
    <Card className="border-amber-500/50 bg-gradient-to-br from-amber-50 to-yellow-50 dark:from-amber-900/10 dark:to-yellow-900/10">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-amber-600 dark:text-amber-500" />
          {t('aiSignal.title')}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {signals.map((signal) => (
          <div
            key={signal.id}
            className="p-4 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 hover:shadow-md transition-shadow cursor-pointer"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <span className="font-bold text-lg">{signal.ticker}</span>
                  <Badge className={getSignalColor(signal.signal)}>
                    {getSignalIcon(signal.signal)}
                    <span className="ml-1">{getSignalText(signal.signal)}</span>
                  </Badge>
                  <Badge variant="outline" className="text-xs">
                    {signal.confidence}% {t('aiSignal.confidence')}
                  </Badge>
                </div>
                <p className="text-sm text-slate-600 dark:text-slate-400 mb-2">
                  {signal.companyName}
                </p>
                <p className="text-sm text-slate-700 dark:text-slate-300">
                  {signal.reason}
                </p>
                <div className="flex items-center gap-3 mt-2 text-xs text-slate-500">
                  <span>{signal.insiderCount} {t('aiSignal.insiders')}</span>
                  <span>•</span>
                  <span>${(signal.totalValue / 1000000).toFixed(1)}M {t('aiSignal.volume')}</span>
                  <span>•</span>
                  <span>{signal.timeframe}</span>
                </div>
              </div>
            </div>
          </div>
        ))}
        <p className="text-xs text-center text-slate-500 dark:text-slate-400 mt-4">
          ✨ {t('aiSignal.disclaimer')}
        </p>
      </CardContent>
    </Card>
  );
}
