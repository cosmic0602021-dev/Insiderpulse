import { useState, useEffect } from 'react';
import DashboardStats from '@/components/dashboard-stats';
import TradeList from '@/components/trade-list';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, Wifi, WifiOff } from 'lucide-react';
import type { TradingStats, InsiderTrade, AIAnalysis } from '@shared/schema';

export default function Dashboard() {
  // Mock data for prototype - todo: replace with real API calls
  const [stats, setStats] = useState<TradingStats>({
    todayTrades: 127,
    totalVolume: 45600000,
    hotBuys: 8,
    avgSignificance: 82
  });

  const [trades, setTrades] = useState<(InsiderTrade & { aiAnalysis: AIAnalysis })[]>([
    {
      id: 'trade-1',
      accessionNumber: '0001234567-24-000123',
      companyName: 'Apple Inc',
      ticker: 'AAPL',
      shares: 25000,
      pricePerShare: 182.50,
      totalValue: 4562500,
      filedDate: new Date('2024-01-15T10:30:00Z'),
      significanceScore: 87,
      signalType: 'BUY',
      createdAt: new Date(),
      aiAnalysis: {
        significance_score: 87,
        signal_type: 'BUY',
        key_insights: ['Large institutional purchase indicates strong confidence', 'Timing aligns with positive earnings outlook'],
        risk_level: 'LOW',
        recommendation: 'Strong buy signal based on insider confidence and market conditions'
      }
    },
    {
      id: 'trade-2',
      accessionNumber: '0001234567-24-000124',
      companyName: 'Microsoft Corporation',
      ticker: 'MSFT',
      shares: 15000,
      pricePerShare: 420.75,
      totalValue: 6311250,
      filedDate: new Date('2024-01-14T14:20:00Z'),
      significanceScore: 92,
      signalType: 'BUY',
      createdAt: new Date(),
      aiAnalysis: {
        significance_score: 92,
        signal_type: 'BUY',
        key_insights: ['Executive confidence signal', 'Cloud growth momentum'],
        risk_level: 'LOW',
        recommendation: 'Very strong buy signal'
      }
    },
    {
      id: 'trade-3',
      accessionNumber: '0001234567-24-000125',
      companyName: 'Tesla Inc',
      ticker: 'TSLA',
      shares: 5000,
      pricePerShare: 248.30,
      totalValue: 1241500,
      filedDate: new Date('2024-01-13T09:15:00Z'),
      significanceScore: 65,
      signalType: 'HOLD',
      createdAt: new Date(),
      aiAnalysis: {
        significance_score: 65,
        signal_type: 'HOLD',
        key_insights: ['Mixed market signals', 'Regulatory uncertainty'],
        risk_level: 'MEDIUM',
        recommendation: 'Wait and see approach'
      }
    },
    {
      id: 'trade-4',
      accessionNumber: '0001234567-24-000126',
      companyName: 'NVIDIA Corporation',
      ticker: 'NVDA',
      shares: 8000,
      pricePerShare: 875.20,
      totalValue: 7001600,
      filedDate: new Date('2024-01-12T16:45:00Z'),
      significanceScore: 94,
      signalType: 'BUY',
      createdAt: new Date(),
      aiAnalysis: {
        significance_score: 94,
        signal_type: 'BUY',
        key_insights: ['AI sector momentum building', 'Strategic insider positioning'],
        risk_level: 'LOW',
        recommendation: 'Exceptional buy signal - AI sector leader'
      }
    }
  ]);

  const [loading, setLoading] = useState(false);
  const [isConnected, setIsConnected] = useState(true);

  // Simulate live updates for prototype
  useEffect(() => {
    const interval = setInterval(() => {
      // Simulate new trade updates
      if (Math.random() > 0.7) {
        console.log('Simulated live trade update');
        setStats(prev => ({
          ...prev,
          todayTrades: prev.todayTrades + 1,
          totalVolume: prev.totalVolume + Math.floor(Math.random() * 1000000)
        }));
      }
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  const handleLoadMore = () => {
    console.log('Loading more trades...');
    setLoading(true);
    
    // Simulate API call delay
    setTimeout(() => {
      setLoading(false);
      console.log('More trades loaded');
    }, 1500);
  };

  return (
    <div className="space-y-6 p-6" data-testid="dashboard">
      {/* Connection Status */}
      <Alert className={isConnected ? 'border-chart-2/50 bg-chart-2/10' : 'border-destructive/50 bg-destructive/10'}>
        <div className="flex items-center gap-2">
          {isConnected ? (
            <Wifi className="h-4 w-4 text-chart-2" />
          ) : (
            <WifiOff className="h-4 w-4 text-destructive" />
          )}
          <AlertDescription className={isConnected ? 'text-chart-2' : 'text-destructive'}>
            {isConnected ? 'Live data feed active - Real-time SEC filing monitoring' : 'Connection lost - Attempting to reconnect...'}
          </AlertDescription>
        </div>
      </Alert>

      {/* Header */}
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold" data-testid="page-title">Dashboard</h1>
        <p className="text-muted-foreground">
          AI-powered insider trading analysis and real-time market intelligence
        </p>
      </div>

      {/* Stats Cards */}
      <DashboardStats stats={stats} />

      {/* Recent Activity Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <TradeList 
            trades={trades}
            loading={loading}
            onLoadMore={handleLoadMore}
          />
        </Card>
        
        <div className="space-y-4">
          {/* AI Insights */}
          <Card data-testid="ai-insights">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-primary" />
                AI Market Insights
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="p-3 bg-chart-2/10 rounded-md border border-chart-2/20">
                <div className="text-sm font-medium text-chart-2 mb-1">Strong Buy Signals</div>
                <div className="text-xs text-muted-foreground">
                  Tech sector showing exceptional insider confidence with 87% average significance score
                </div>
              </div>
              <div className="p-3 bg-chart-3/10 rounded-md border border-chart-3/20">
                <div className="text-sm font-medium text-chart-3 mb-1">Market Momentum</div>
                <div className="text-xs text-muted-foreground">
                  AI and cloud computing companies experiencing increased insider buying activity
                </div>
              </div>
              <div className="p-3 bg-muted/50 rounded-md">
                <div className="text-sm font-medium mb-1">Risk Assessment</div>
                <div className="text-xs text-muted-foreground">
                  Current market conditions favor technology sector investments with low to medium risk profiles
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Top Movers */}
          <Card data-testid="top-movers">
            <CardHeader>
              <CardTitle className="text-base">Top Movers Today</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {[
                  { symbol: 'NVDA', name: 'NVIDIA Corp', change: '+3.2%', volume: '$7.0M', positive: true },
                  { symbol: 'MSFT', name: 'Microsoft Corp', change: '+1.8%', volume: '$6.3M', positive: true },
                  { symbol: 'AAPL', name: 'Apple Inc', change: '+2.1%', volume: '$4.6M', positive: true }
                ].map((stock, index) => (
                  <div key={stock.symbol} className="flex items-center justify-between p-2 rounded hover-elevate cursor-pointer"
                       onClick={() => console.log(`Top mover ${stock.symbol} clicked`)}
                       data-testid={`top-mover-${stock.symbol.toLowerCase()}`}>
                    <div>
                      <div className="font-mono text-sm font-medium">{stock.symbol}</div>
                      <div className="text-xs text-muted-foreground">{stock.name}</div>
                    </div>
                    <div className="text-right">
                      <div className={`text-sm font-medium ${
                        stock.positive ? 'text-chart-2' : 'text-destructive'
                      }`}>
                        {stock.change}
                      </div>
                      <div className="text-xs text-muted-foreground">{stock.volume}</div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}