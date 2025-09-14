import { useQuery } from "@tanstack/react-query";
import { useLanguage } from "@/contexts/language-context";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { TrendingUp, TrendingDown, Activity, BarChart3, PieChart, Users } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart as RechartsPieChart, Pie, Cell } from 'recharts';
import type { InsiderTrade } from "@shared/schema";

export default function Analytics() {
  const { t } = useLanguage();

  // Fetch trades data
  const { data: trades = [], isLoading } = useQuery<InsiderTrade[]>({
    queryKey: ['/api/trades'],
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Process analytics data
  const processAnalytics = () => {
    if (!trades.length) return null;

    // Trade type distribution
    const tradeTypes = trades.reduce((acc, trade) => {
      const type = trade.tradeType || 'UNKNOWN';
      acc[type] = (acc[type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // Top companies by volume
    const companyVolumes = trades.reduce((acc, trade) => {
      const company = trade.companyName;
      if (!acc[company]) {
        acc[company] = { name: company, volume: 0, trades: 0 };
      }
      acc[company].volume += trade.totalValue;
      acc[company].trades += 1;
      return acc;
    }, {} as Record<string, { name: string; volume: number; trades: number }>);

    const topCompanies = Object.values(companyVolumes)
      .sort((a, b) => b.volume - a.volume)
      .slice(0, 10);

    // Monthly trends
    const monthlyData = trades.reduce((acc, trade) => {
      const month = new Date(trade.filedDate).toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
      if (!acc[month]) {
        acc[month] = { month, buys: 0, sells: 0, totalVolume: 0 };
      }
      if (trade.tradeType === 'BUY') acc[month].buys += 1;
      if (trade.tradeType === 'SELL') acc[month].sells += 1;
      acc[month].totalVolume += trade.totalValue;
      return acc;
    }, {} as Record<string, { month: string; buys: number; sells: number; totalVolume: number }>);

    const monthlyTrends = Object.values(monthlyData).slice(-6); // Last 6 months

    return {
      tradeTypes,
      topCompanies,
      monthlyTrends,
      totalVolume: trades.reduce((sum, trade) => sum + trade.totalValue, 0),
      totalTrades: trades.length,
      avgTradeSize: trades.reduce((sum, trade) => sum + trade.totalValue, 0) / trades.length
    };
  };

  const analytics = processAnalytics();

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      notation: 'compact',
      maximumFractionDigits: 1
    }).format(amount);
  };

  const COLORS = ['hsl(var(--chart-1))', 'hsl(var(--chart-2))', 'hsl(var(--chart-3))', 'hsl(var(--chart-4))', 'hsl(var(--chart-5))'];

  if (isLoading || !analytics) {
    return (
      <div className="p-6 max-w-7xl mx-auto space-y-6">
        <div className="space-y-2">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-96" />
        </div>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-48" />
          ))}
        </div>
      </div>
    );
  }

  const pieData = Object.entries(analytics.tradeTypes).map(([type, count]) => ({
    name: type,
    value: count,
    percentage: ((count / analytics.totalTrades) * 100).toFixed(1)
  }));

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight" data-testid="text-analytics-title">
          {t('nav.analytics')}
        </h1>
        <p className="text-muted-foreground">
          {t('analytics.subtitle')}
        </p>
      </div>

      {/* Key Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('analytics.totalTrades')}</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="metric-total-trades">
              {analytics.totalTrades.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              {t('analytics.transactionsRecorded')}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('analytics.totalVolume')}</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="metric-total-volume">
              {formatCurrency(analytics.totalVolume)}
            </div>
            <p className="text-xs text-muted-foreground">
              {t('analytics.combinedValue')}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('analytics.avgTradeSize')}</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="metric-avg-trade">
              {formatCurrency(analytics.avgTradeSize)}
            </div>
            <p className="text-xs text-muted-foreground">
              {t('analytics.averageValue')}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('analytics.companies')}</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="metric-companies">
              {analytics.topCompanies.length}
            </div>
            <p className="text-xs text-muted-foreground">
              {t('analytics.uniqueTracked')}
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Trade Type Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PieChart className="h-5 w-5" />
              {t('analytics.tradeDistribution')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <RechartsPieChart>
                  <Pie 
                    data={pieData} 
                    dataKey="value" 
                    nameKey="name"
                    cx="50%" 
                    cy="50%" 
                    outerRadius={80}
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    formatter={(value: any, name: string) => [
                      `${value} trades (${pieData.find(d => d.name === name)?.percentage}%)`,
                      name
                    ]}
                  />
                </RechartsPieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex flex-wrap gap-2 mt-4">
              {pieData.map((entry, index) => (
                <div key={entry.name} className="flex items-center gap-1">
                  <div 
                    className="w-3 h-3 rounded-full" 
                    style={{ backgroundColor: COLORS[index % COLORS.length] }}
                  />
                  <span className="text-sm">
                    {entry.name}: {entry.percentage}%
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Monthly Trends */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              {t('analytics.monthlyActivity')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={analytics.monthlyTrends}>
                  <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                  <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip 
                    formatter={(value: any, name: string) => [
                      `${value} trades`,
                      name === 'buys' ? 'Buys' : 'Sells'
                    ]}
                  />
                  <Bar dataKey="buys" stackId="a" fill="hsl(var(--chart-2))" />
                  <Bar dataKey="sells" stackId="a" fill="hsl(var(--chart-5))" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Top Companies */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            {t('analytics.topCompanies')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {analytics.topCompanies.slice(0, 10).map((company, index) => (
              <div key={company.name} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold">
                    {index + 1}
                  </div>
                  <div>
                    <p className="font-medium">{company.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {company.trades} {t('analytics.trades')}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-bold">{formatCurrency(company.volume)}</p>
                  <div className="flex items-center gap-1">
                    <TrendingUp className="h-3 w-3 text-green-500" />
                    <span className="text-xs text-muted-foreground">
                      {((company.volume / analytics.totalVolume) * 100).toFixed(1)}%
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}