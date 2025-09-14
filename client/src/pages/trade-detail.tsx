import { useQuery } from "@tanstack/react-query";
import { useParams, Link } from "wouter";
import { useLanguage } from "@/contexts/language-context";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft, TrendingUp, TrendingDown, DollarSign, Calendar, User, Building2 } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import PriceComparisonChart from "@/components/price-comparison-chart";
import type { InsiderTrade, StockPrice } from "@shared/schema";

interface TradeDetailProps {
  tradeId?: string;
}

export default function TradeDetail({ tradeId }: TradeDetailProps) {
  const params = useParams<{ tradeId: string }>();
  const { t } = useLanguage();
  const id = tradeId || params.tradeId;

  // Fetch trade details
  const { data: trades = [], isLoading } = useQuery<InsiderTrade[]>({
    queryKey: ['/api/trades'],
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  const trade = trades.find(t => t.id === id);

  // Fetch stock price if we have a ticker
  const { data: stockPrice } = useQuery<StockPrice>({
    queryKey: ['/api/stocks', trade?.ticker || trade?.companyName],
    enabled: !!(trade?.ticker || trade?.companyName),
    staleTime: 5 * 60 * 1000,
    queryFn: async () => {
      if (trade?.ticker) {
        const response = await fetch(`/api/stocks/${trade.ticker}`);
        if (!response.ok) throw new Error('Failed to fetch stock price');
        return response.json();
      } else if (trade?.companyName) {
        const response = await fetch(`/api/stocks/search/${encodeURIComponent(trade.companyName)}`);
        if (!response.ok) throw new Error('Failed to fetch stock price');
        return response.json();
      }
      throw new Error('No ticker or company name available');
    }
  });

  if (isLoading) {
    return (
      <div className="container mx-auto p-6 max-w-4xl">
        <Skeleton className="h-8 w-48 mb-6" />
        <div className="grid gap-6">
          <Skeleton className="h-48 w-full" />
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
      </div>
    );
  }

  if (!trade) {
    return (
      <div className="container mx-auto p-6 max-w-4xl">
        <div className="text-center py-12">
          <h1 className="text-2xl font-bold text-foreground mb-4">
            Trade Not Found
          </h1>
          <p className="text-muted-foreground mb-6">
            The requested trade could not be found.
          </p>
          <Link href="/">
            <Button data-testid="button-back-dashboard">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Dashboard
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  const getCompanyInitials = (name: string) => {
    const words = name.split(' ').filter(w => w.length > 1);
    return words.slice(0, 2).map(w => w[0]).join('').toUpperCase();
  };

  const getSignalColor = (signal: string) => {
    switch (signal?.toLowerCase()) {
      case 'buy':
        return 'bg-green-500/10 text-green-700 dark:text-green-300';
      case 'sell':
        return 'bg-red-500/10 text-red-700 dark:text-red-300';
      case 'hold':
        return 'bg-yellow-500/10 text-yellow-700 dark:text-yellow-300';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount);
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const calculateProfitLoss = () => {
    if (!stockPrice || !trade.pricePerShare) return null;
    const currentPrice = typeof stockPrice.currentPrice === 'string' 
      ? parseFloat(stockPrice.currentPrice) 
      : stockPrice.currentPrice;
    const tradePrice = trade.pricePerShare;
    const difference = currentPrice - tradePrice;
    const percentChange = ((difference / tradePrice) * 100);
    
    return {
      difference,
      percentChange,
      isProfit: difference > 0
    };
  };

  const profitLoss = calculateProfitLoss();

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      {/* Header */}
      <div className="mb-6">
        <Link href="/">
          <Button variant="ghost" size="sm" className="mb-4" data-testid="button-back">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
        </Link>
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold text-foreground">
            Trade Details
          </h1>
          <Badge className={getSignalColor(trade.signalType)} data-testid="badge-signal">
            {trade.signalType?.toUpperCase() || 'N/A'}
          </Badge>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left Column - Trade Info */}
        <div className="lg:col-span-2 space-y-6">
          {/* Company & Insider Info */}
          <Card data-testid="card-trade-info">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="w-5 h-5" />
                Company Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-4">
                <Avatar className="h-12 w-12" data-testid="avatar-company">
                  <AvatarFallback>{getCompanyInitials(trade.companyName)}</AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="font-semibold text-lg" data-testid="text-company-name">
                    {trade.companyName}
                  </h3>
                  <p className="text-muted-foreground" data-testid="text-filing-info">
                    SEC Filing #{trade.accessionNumber.slice(-6)}
                  </p>
                </div>
              </div>
              
              <Separator />
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h4 className="font-medium text-sm text-muted-foreground">
                    Company
                  </h4>
                  <p className="font-semibold" data-testid="text-company-display">
                    {trade.companyName}
                  </p>
                </div>
                <div>
                  <h4 className="font-medium text-sm text-muted-foreground">
                    Ticker Symbol
                  </h4>
                  <p className="font-semibold" data-testid="text-ticker">
                    {trade.ticker || stockPrice?.ticker || 'N/A'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Trade Details */}
          <Card data-testid="card-transaction-details">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="w-5 h-5" />
                Transaction Details
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div>
                  <h4 className="font-medium text-sm text-muted-foreground mb-1">
                    Signal Type
                  </h4>
                  <Badge className={getSignalColor(trade.signalType)} data-testid="badge-signal-type">
                    {trade.signalType}
                  </Badge>
                </div>
                
                <div>
                  <h4 className="font-medium text-sm text-muted-foreground mb-1">
                    Shares Traded
                  </h4>
                  <p className="text-xl font-bold" data-testid="text-shares">
                    {trade.shares?.toLocaleString() || 'N/A'}
                  </p>
                </div>
                
                <div>
                  <h4 className="font-medium text-sm text-muted-foreground mb-1">
                    Price per Share
                  </h4>
                  <p className="text-xl font-bold" data-testid="text-price-per-share">
                    {trade.pricePerShare ? formatCurrency(trade.pricePerShare) : 'N/A'}
                  </p>
                </div>
                
                <div>
                  <h4 className="font-medium text-sm text-muted-foreground mb-1">
                    Total Transaction Value
                  </h4>
                  <p className="text-xl font-bold" data-testid="text-total-value">
                    {formatCurrency(trade.totalValue)}
                  </p>
                </div>
                
                <div>
                  <h4 className="font-medium text-sm text-muted-foreground mb-1">
                    Filing Date
                  </h4>
                  <p className="font-semibold flex items-center gap-2" data-testid="text-filing-date">
                    <Calendar className="w-4 h-4" />
                    {formatDate(trade.filedDate.toString())}
                  </p>
                </div>
                
                <div>
                  <h4 className="font-medium text-sm text-muted-foreground mb-1">
                    Significance Score
                  </h4>
                  <p className="font-semibold" data-testid="text-significance-score">
                    {trade.significanceScore}/10
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Current Stock Price & Analysis */}
        <div className="space-y-6">
          {/* Current Stock Price */}
          {stockPrice && (
            <Card data-testid="card-current-price">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5" />
                  Current Stock Price
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-center">
                  <p className="text-3xl font-bold" data-testid="text-current-price">
                    {typeof stockPrice.currentPrice === 'string' 
                      ? formatCurrency(parseFloat(stockPrice.currentPrice))
                      : formatCurrency(stockPrice.currentPrice)
                    }
                  </p>
                  <div className="flex items-center justify-center gap-2 mt-2">
                    {stockPrice.changePercent && (
                      <>
                        {parseFloat(stockPrice.changePercent.toString()) >= 0 ? (
                          <TrendingUp className="w-4 h-4 text-green-500" />
                        ) : (
                          <TrendingDown className="w-4 h-4 text-red-500" />
                        )}
                        <span className={`font-medium ${
                          parseFloat(stockPrice.changePercent.toString()) >= 0 
                            ? 'text-green-600 dark:text-green-400' 
                            : 'text-red-600 dark:text-red-400'
                        }`} data-testid="text-price-change">
                          {typeof stockPrice.change === 'string' 
                            ? stockPrice.change 
                            : stockPrice.change ? Number(stockPrice.change).toFixed(2) : '0.00'
                          } ({typeof stockPrice.changePercent === 'string' ? stockPrice.changePercent : stockPrice.changePercent ? Number(stockPrice.changePercent).toFixed(2) : '0.00'}%)
                        </span>
                      </>
                    )}
                  </div>
                </div>
                
                <Separator />
                
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Volume</span>
                    <span className="font-medium" data-testid="text-volume">
                      {stockPrice.volume?.toLocaleString() || 'N/A'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Last Updated</span>
                    <span className="font-medium text-xs" data-testid="text-last-updated">
                      {stockPrice.lastUpdated 
                        ? new Date(stockPrice.lastUpdated).toLocaleTimeString()
                        : 'N/A'
                      }
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Profit/Loss Analysis */}
          {/* Price Comparison Chart */}
          {trade.pricePerShare && stockPrice && (
            <PriceComparisonChart
              tradePrice={trade.pricePerShare}
              currentPrice={typeof stockPrice?.currentPrice === 'string' 
                ? parseFloat(stockPrice.currentPrice)
                : stockPrice?.currentPrice || 0
              }
              signalType={trade.signalType}
              filedDate={trade.filedDate}
            />
          )}

          {profitLoss && trade.pricePerShare && stockPrice && (
            <Card data-testid="card-profit-loss">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  {profitLoss.isProfit ? (
                    <TrendingUp className="w-5 h-5 text-green-500" />
                  ) : (
                    <TrendingDown className="w-5 h-5 text-red-500" />
                  )}
                  Detailed Analysis
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-center">
                  <p className="text-sm text-muted-foreground mb-1">
                    Price Comparison
                  </p>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Trade Price:</span>
                      <span className="font-medium" data-testid="text-trade-price">
                        {formatCurrency(trade.pricePerShare)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Current Price:</span>
                      <span className="font-medium" data-testid="text-comparison-current-price">
                        {typeof stockPrice?.currentPrice === 'string' 
                          ? formatCurrency(parseFloat(stockPrice.currentPrice))
                          : formatCurrency(stockPrice?.currentPrice || 0)
                        }
                      </span>
                    </div>
                  </div>
                  
                  <Separator className="my-3" />
                  
                  <div className={`p-3 rounded-lg ${
                    profitLoss.isProfit 
                      ? 'bg-green-500/10 border border-green-500/20' 
                      : 'bg-red-500/10 border border-red-500/20'
                  }`}>
                    <p className={`text-lg font-bold ${
                      profitLoss.isProfit 
                        ? 'text-green-600 dark:text-green-400' 
                        : 'text-red-600 dark:text-red-400'
                    }`} data-testid="text-profit-loss-amount">
                      {profitLoss.isProfit ? '+' : ''}{formatCurrency(profitLoss.difference)}
                    </p>
                    <p className={`text-sm ${
                      profitLoss.isProfit 
                        ? 'text-green-600 dark:text-green-400' 
                        : 'text-red-600 dark:text-red-400'
                    }`} data-testid="text-profit-loss-percent">
                      ({profitLoss.isProfit ? '+' : ''}{profitLoss.percentChange.toFixed(2)}%)
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Per share comparison
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

        </div>
      </div>
    </div>
  );
}