import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { TrendingUp, Calendar, BarChart3 } from "lucide-react";
import { useLanguage } from "@/contexts/language-context";
import type { StockPriceHistory } from "@shared/schema";

interface StockHistoryChartProps {
  ticker: string;
  tradeDate: string;
  tradePrice: number;
}

export default function StockHistoryChart({ 
  ticker, 
  tradeDate, 
  tradePrice 
}: StockHistoryChartProps) {
  const { t } = useLanguage();
  const [period, setPeriod] = useState('1y');

  // Calculate date range from trade date to current
  const fromDate = new Date(tradeDate).toISOString().split('T')[0];
  const toDate = new Date().toISOString().split('T')[0];

  // Fetch stock price history - 🚨 임시 비활성화
  const { data: historyData = [], isLoading, error } = useQuery<StockPriceHistory[]>({
    queryKey: ['/api/stocks', ticker, 'history', fromDate, toDate],
    enabled: false, // 🚨 완전히 비활성화해서 무한 루프 방지
    staleTime: 15 * 60 * 1000, // 15분으로 증가
    cacheTime: 30 * 60 * 1000, // 30분 캐시
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    refetchInterval: false, // 자동 리페치 비활성화
    refetchOnReconnect: false, // 재연결시 리페치 비활성화
    queryFn: async () => {
      console.log('🚨 stock-history-chart.tsx fetch called but temporarily disabled to prevent infinite loops');
      return []; // 🚨 임시 비활성화
      
      const response = await fetch(`/api/stocks/${ticker}/history?from=${fromDate}&to=${toDate}`);
      if (!response.ok) throw new Error('Failed to fetch stock price history');
      return response.json();
    }
  });

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      year: 'numeric' 
    });
  };

  // Process data for chart
  const processedData = historyData.map((item) => ({
    date: item.date,
    close: parseFloat(item.close),
    open: parseFloat(item.open),
    high: parseFloat(item.high),
    low: parseFloat(item.low),
    volume: item.volume,
    formattedDate: formatDate(item.date)
  })).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  // Add trade price point
  const tradePoint = {
    date: fromDate,
    close: tradePrice,
    open: tradePrice,
    high: tradePrice,
    low: tradePrice,
    volume: 0,
    formattedDate: formatDate(fromDate),
    isTrade: true
  };

  const chartData = [tradePoint, ...processedData];

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-background/95 backdrop-blur border rounded-lg p-3 shadow-lg">
          <p className="font-medium mb-2">{data.formattedDate}</p>
          {data.isTrade ? (
            <div className="space-y-1">
              <p className="text-sm text-blue-600 font-medium">Trade Price</p>
              <p className="text-lg font-bold text-primary">
                {formatCurrency(data.close)}
              </p>
            </div>
          ) : (
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Close Price</p>
              <p className="text-lg font-bold text-primary">
                {formatCurrency(data.close)}
              </p>
              <div className="text-xs text-muted-foreground space-y-1">
                <div>Open: {formatCurrency(data.open)}</div>
                <div>High: {formatCurrency(data.high)}</div>
                <div>Low: {formatCurrency(data.low)}</div>
                <div>Volume: {data.volume?.toLocaleString() || 'N/A'}</div>
              </div>
            </div>
          )}
        </div>
      );
    }
    return null;
  };

  if (isLoading) {
    return (
      <Card data-testid="stock-history-chart-loading">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5" />
            Stock Price History
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-80 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (error || !historyData.length) {
    return (
      <Card data-testid="stock-history-chart-error">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5" />
            Stock Price History
          </CardTitle>
        </CardHeader>
        <CardContent className="text-center py-8">
          <p className="text-muted-foreground">
            {error ? 'Failed to load price history' : 'No historical data available'}
          </p>
          <p className="text-sm text-muted-foreground mt-2">
            Historical data from {formatDate(fromDate)} to present
          </p>
        </CardContent>
      </Card>
    );
  }

  const currentPrice = processedData[processedData.length - 1]?.close || 0;
  const priceChange = currentPrice - tradePrice;
  const percentChange = (priceChange / tradePrice) * 100;
  const isGain = priceChange > 0;

  return (
    <Card data-testid="stock-history-chart">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BarChart3 className="w-5 h-5" />
          Stock Price History ({ticker})
        </CardTitle>
        <div className="text-sm text-muted-foreground">
          From trade date ({formatDate(fromDate)}) to present
        </div>
        {processedData.length > 0 && (
          <div className="flex items-center gap-4 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-blue-500"></div>
              <span>Trade Price: {formatCurrency(tradePrice)}</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-primary"></div>
              <span>Current: {formatCurrency(currentPrice)}</span>
            </div>
            <div className={`flex items-center gap-2 ${isGain ? 'text-green-600' : 'text-red-600'}`}>
              <TrendingUp className={`w-4 h-4 ${isGain ? '' : 'rotate-180'}`} />
              <span>{isGain ? '+' : ''}{formatCurrency(priceChange)} ({percentChange.toFixed(2)}%)</span>
            </div>
          </div>
        )}
      </CardHeader>
      <CardContent>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
              <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
              <XAxis 
                dataKey="formattedDate" 
                tick={{ fontSize: 12 }}
                className="text-muted-foreground"
                interval="preserveStartEnd"
              />
              <YAxis 
                tick={{ fontSize: 12 }}
                className="text-muted-foreground"
                domain={['dataMin - 5', 'dataMax + 5']}
                tickFormatter={(value) => `$${value.toFixed(2)}`}
              />
              <Tooltip content={<CustomTooltip />} />
              
              {/* Trade price point */}
              <Line 
                dataKey="close" 
                stroke="var(--color-trade, #3b82f6)" 
                strokeWidth={3}
                dot={(props: any) => {
                  if (props.payload?.isTrade) {
                    return (
                      <circle
                        cx={props.cx}
                        cy={props.cy}
                        r={6}
                        fill="#3b82f6"
                        stroke="#ffffff"
                        strokeWidth={2}
                      />
                    );
                  }
                  return <circle {...props} r={0} />;
                }}
                connectNulls={false}
              />
              
              {/* Stock price line */}
              <Line 
                dataKey="close" 
                stroke="hsl(var(--primary))"
                strokeWidth={2}
                dot={false}
                connectNulls={true}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
        
        <div className="mt-4 text-xs text-muted-foreground text-center">
          Showing {processedData.length} trading days of price history
        </div>
      </CardContent>
    </Card>
  );
}