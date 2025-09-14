import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { TrendingUp, TrendingDown } from "lucide-react";

interface PriceComparisonChartProps {
  tradePrice: number;
  currentPrice: number;
  signalType: string;
  filedDate: Date;
}

export default function PriceComparisonChart({ 
  tradePrice, 
  currentPrice, 
  signalType, 
  filedDate 
}: PriceComparisonChartProps) {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  };

  const difference = currentPrice - tradePrice;
  const percentChange = ((currentPrice - tradePrice) / tradePrice) * 100;
  const isProfit = difference > 0;
  
  // For BUY trades, profit means current > trade price
  // For SELL trades, profit means trade > current price  
  const actualProfit = signalType === 'SELL' ? -difference : difference;
  const isActualProfit = actualProfit > 0;
  
  // Display percentage based on actual trade outcome
  const displayPercent = signalType === 'SELL' ? -percentChange : percentChange;

  const data = [
    {
      name: 'Trade Price',
      price: tradePrice,
      type: 'trade',
      date: new Date(filedDate).toLocaleDateString()
    },
    {
      name: 'Current Price',
      price: currentPrice,
      type: 'current',
      date: 'Today'
    }
  ];

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-background/95 backdrop-blur border rounded-lg p-3 shadow-lg">
          <p className="font-medium">{label}</p>
          <p className="text-sm text-muted-foreground">{data.date}</p>
          <p className="text-lg font-bold text-primary">
            {formatCurrency(data.price)}
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <Card data-testid="price-comparison-chart">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {isActualProfit ? (
            <TrendingUp className="w-5 h-5 text-green-500" />
          ) : (
            <TrendingDown className="w-5 h-5 text-red-500" />
          )}
          Price Comparison Chart
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Chart */}
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
              <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
              <XAxis 
                dataKey="name" 
                tick={{ fontSize: 12 }}
                className="text-muted-foreground"
              />
              <YAxis 
                tickFormatter={(value) => `$${value.toFixed(2)}`}
                tick={{ fontSize: 12 }}
                className="text-muted-foreground"
              />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="price" radius={[4, 4, 0, 0]}>
                <Cell fill="hsl(var(--chart-1))" />
                <Cell fill={isActualProfit ? "hsl(var(--chart-2))" : "hsl(var(--chart-5))"} />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-2 gap-4">
          <div className="text-center">
            <p className="text-sm text-muted-foreground mb-1">Trade Price</p>
            <p className="text-lg font-bold" data-testid="chart-trade-price">
              {formatCurrency(tradePrice)}
            </p>
            <Badge variant="outline" className="mt-1">
              {signalType}
            </Badge>
          </div>
          <div className="text-center">
            <p className="text-sm text-muted-foreground mb-1">Current Price</p>
            <p className="text-lg font-bold" data-testid="chart-current-price">
              {formatCurrency(currentPrice)}
            </p>
            <Badge 
              variant={isActualProfit ? "default" : "destructive"}
              className={isActualProfit ? "bg-green-500/10 text-green-600 border-green-500/20" : ""}
            >
              {isActualProfit ? '+' : ''}{Math.abs(displayPercent).toFixed(2)}% since trade
            </Badge>
          </div>
        </div>

        {/* Trade Outcome */}
        <div className={`p-4 rounded-lg border ${
          isActualProfit 
            ? 'bg-green-500/10 border-green-500/20' 
            : 'bg-red-500/10 border-red-500/20'
        }`}>
          <div className="text-center">
            <p className="text-sm text-muted-foreground mb-2">
              {signalType === 'SELL' ? 'Insider Sold Before' : 'Insider Bought Before'} Price Change
            </p>
            <p className={`text-xl font-bold ${
              isActualProfit 
                ? 'text-green-600 dark:text-green-400' 
                : 'text-red-600 dark:text-red-400'
            }`} data-testid="chart-outcome">
              {isActualProfit ? 'Good Timing' : 'Poor Timing'}
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              {signalType === 'SELL' 
                ? `Sold at ${formatCurrency(tradePrice)}, now ${formatCurrency(currentPrice)}`
                : `Bought at ${formatCurrency(tradePrice)}, now ${formatCurrency(currentPrice)}`
              }
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}