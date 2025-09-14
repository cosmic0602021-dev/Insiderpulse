import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, DollarSign } from "lucide-react";
import type { TradingStats } from "@shared/schema";

interface DashboardStatsProps {
  stats: TradingStats;
}

export default function DashboardStats({ stats }: DashboardStatsProps) {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      notation: 'compact',
      maximumFractionDigits: 1
    }).format(value);
  };

  const statCards = [
    {
      title: "Today's Trades",
      value: stats.todayTrades.toLocaleString(),
      icon: TrendingUp,
      change: "+12%",
      positive: true
    },
    {
      title: "Total Volume", 
      value: formatCurrency(stats.totalVolume),
      icon: DollarSign,
      change: "+8.2%",
      positive: true
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {statCards.map((stat, index) => {
        const Icon = stat.icon;
        return (
          <Card key={index} className="hover-elevate" data-testid={`stat-card-${index}`}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {stat.title}
              </CardTitle>
              <Icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold" data-testid={`stat-value-${index}`}>
                {stat.value}
              </div>
              <p className={`text-xs ${
                stat.positive ? 'text-chart-2' : 'text-destructive'
              }`}>
                {stat.change} from last week
              </p>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}