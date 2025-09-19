import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { TrendingUp, TrendingDown } from "lucide-react";
import { useLanguage } from "@/contexts/language-context";

interface PriceComparisonChartProps {
  tradePrice: number;
  currentPrice: number;
  filedDate: Date;
}

export default function PriceComparisonChart({ 
  tradePrice, 
  currentPrice, 
  filedDate 
}: PriceComparisonChartProps) {
  const { t } = useLanguage();
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

  const data = [
    {
      category: t('priceChart.tradePrice'),
      price: tradePrice,
      type: 'trade',
      date: new Date(filedDate).toLocaleDateString()
    },
    {
      category: t('priceChart.currentPrice'),
      price: currentPrice,
      type: 'current',
      date: t('priceChart.today')
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
          {isProfit ? (
            <TrendingUp className="w-5 h-5 text-green-500" />
          ) : (
            <TrendingDown className="w-5 h-5 text-red-500" />
          )}
          {t('priceChart.title')}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Chart */}
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
              <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
              <XAxis
                dataKey="category"
                tick={{ fontSize: 12 }}
                className="text-muted-foreground"
              />
              <YAxis
                tickFormatter={(value) => `$${value.toFixed(2)}`}
                tick={{ fontSize: 12 }}
                className="text-muted-foreground"
              />
              <Tooltip content={<CustomTooltip />} />
              <Line
                type="monotone"
                dataKey="price"
                stroke={isProfit ? "hsl(var(--chart-2))" : "hsl(var(--chart-5))"}
                strokeWidth={3}
                dot={{
                  fill: "hsl(var(--chart-1))",
                  strokeWidth: 2,
                  r: 6
                }}
                activeDot={{
                  r: 8,
                  stroke: isProfit ? "hsl(var(--chart-2))" : "hsl(var(--chart-5))",
                  strokeWidth: 2,
                  fill: '#fff'
                }}
                animationDuration={2000}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-2 gap-4">
          <div className="text-center">
            <p className="text-sm text-muted-foreground mb-1">{t('priceChart.tradePrice')}</p>
            <p className="text-lg font-bold" data-testid="chart-trade-price">
              {formatCurrency(tradePrice)}
            </p>
            <Badge variant="outline" className="mt-1">
              {t('priceChart.insiderTrade')}
            </Badge>
          </div>
          <div className="text-center">
            <p className="text-sm text-muted-foreground mb-1">{t('priceChart.currentPrice')}</p>
            <p className="text-lg font-bold" data-testid="chart-current-price">
              {formatCurrency(currentPrice)}
            </p>
            <Badge 
              variant={isProfit ? "default" : "destructive"}
              className={isProfit ? "bg-green-500/10 text-green-600 border-green-500/20" : ""}
            >
              {isProfit ? '+' : ''}{percentChange.toFixed(2)}%
            </Badge>
          </div>
        </div>

        {/* Price Change Summary */}
        <div className={`p-4 rounded-lg border ${
          isProfit 
            ? 'bg-green-500/10 border-green-500/20' 
            : 'bg-red-500/10 border-red-500/20'
        }`}>
          <div className="text-center">
            <p className="text-sm text-muted-foreground mb-2">
              {t('priceChart.movement')}
            </p>
            <p className={`text-xl font-bold ${
              isProfit 
                ? 'text-green-600 dark:text-green-400' 
                : 'text-red-600 dark:text-red-400'
            }`} data-testid="chart-outcome">
              {isProfit ? t('priceChart.increased') : t('priceChart.decreased')}
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              {t('priceChart.tradePriceLabel')} {formatCurrency(tradePrice)} → {t('priceChart.currentLabel')} {formatCurrency(currentPrice)}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}