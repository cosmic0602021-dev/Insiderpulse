import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { apiClient, queryKeys } from '@/lib/api';
import { useLanguage } from '@/contexts/language-context';
import type { InsiderTrade } from '@shared/schema';

export default function LiveTradingSimple() {
  const { t } = useLanguage();
  const [trades, setTrades] = useState<InsiderTrade[]>([]);

  // 단순한 데이터 가져오기 (임시 테스트 데이터 사용)
  const { data: initialTrades, isLoading, error } = useQuery({
    queryKey: ['test-trades'],
    queryFn: () => Promise.resolve([
      {
        id: 'test-1',
        companyName: 'Apple Inc',
        ticker: 'AAPL',
        traderName: 'Tim Cook',
        traderTitle: 'CEO',
        tradeType: 'SALE',
        shares: 223000,
        pricePerShare: 190.5,
        totalValue: 42481500,
        filedDate: new Date('2024-09-25'),
        tradeDate: new Date('2024-09-24'),
        sharesAfter: 3280000,
        ownershipPercentage: 0.021,
        significanceScore: 92,
        createdAt: new Date('2024-09-25')
      },
      {
        id: 'test-2',
        companyName: 'Tesla Inc',
        ticker: 'TSLA',
        traderName: 'Elon Musk',
        traderTitle: 'CEO',
        tradeType: 'BUY',
        shares: 50000,
        pricePerShare: 245.8,
        totalValue: 12290000,
        filedDate: new Date('2024-09-26'),
        tradeDate: new Date('2024-09-25'),
        sharesAfter: 411000000,
        ownershipPercentage: 13.2,
        significanceScore: 88,
        createdAt: new Date('2024-09-26')
      },
      {
        id: 'test-3',
        companyName: 'Microsoft Corporation',
        ticker: 'MSFT',
        traderName: 'Satya Nadella',
        traderTitle: 'CEO',
        tradeType: 'SALE',
        shares: 328596,
        pricePerShare: 420.15,
        totalValue: 138100000,
        filedDate: new Date('2024-09-27'),
        tradeDate: new Date('2024-09-26'),
        sharesAfter: 1750000,
        ownershipPercentage: 0.023,
        significanceScore: 95,
        createdAt: new Date('2024-09-27')
      }
    ]),
    staleTime: 30000,
  });

  // 데이터가 로드되면 상태 업데이트
  useEffect(() => {
    if (initialTrades && initialTrades.length > 0) {
      console.log(`✅ Loaded ${initialTrades.length} trades`);
      setTrades(initialTrades);
    }
  }, [initialTrades]);

  if (error) {
    return (
      <div className="p-6">
        <Card>
          <CardContent className="p-6">
            <div className="text-center">
              <h3 className="text-lg font-semibold text-red-600 mb-2">Error Loading Data</h3>
              <p className="text-muted-foreground">
                {error instanceof Error ? error.message : 'Unknown error occurred'}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="p-6">
        <Card>
          <CardContent className="p-6">
            <div className="text-center">
              <div className="animate-pulse">
                <h3 className="text-lg font-semibold mb-2">Loading trades...</h3>
                <p className="text-muted-foreground">Please wait while we fetch the latest data</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6">
      <Card>
        <CardHeader>
          <CardTitle>Live Trading - Simple Version</CardTitle>
          <p className="text-sm text-muted-foreground">
            Total trades: {trades.length}
          </p>
        </CardHeader>
        <CardContent>
          {trades.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">No trades found</p>
            </div>
          ) : (
            <div className="space-y-4">
              {trades.map((trade) => (
                <div key={trade.id} className="border rounded-lg p-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-semibold">{trade.companyName}</h3>
                      <p className="text-sm text-muted-foreground">
                        {trade.ticker} - {trade.traderName}
                      </p>
                      <p className="text-sm">
                        {trade.tradeType} - {trade.shares} shares
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold">
                        ${trade.totalValue.toLocaleString()}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        ${trade.pricePerShare?.toFixed(2) || '0.00'}/share
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}