import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { TrendingUp, TrendingDown, Minus, ExternalLink } from "lucide-react";
import type { InsiderTrade } from "@shared/schema";

interface TradeCardProps {
  trade: InsiderTrade;
  onViewDetails?: (trade: InsiderTrade) => void;
}

export default function TradeCard({ trade, onViewDetails }: TradeCardProps) {
  const getSignalIcon = (signalType: string) => {
    switch (signalType) {
      case 'BUY': return <TrendingUp className="h-3 w-3" />;
      case 'SELL': return <TrendingDown className="h-3 w-3" />;
      default: return <Minus className="h-3 w-3" />;
    }
  };

  const getSignalColor = (signalType: string) => {
    switch (signalType) {
      case 'BUY': return 'bg-chart-2 text-background';
      case 'SELL': return 'bg-destructive text-destructive-foreground';
      default: return 'bg-chart-3 text-background';
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      notation: 'compact',
      maximumFractionDigits: 1
    }).format(value);
  };

  const formatDate = (date: Date | string) => {
    const d = typeof date === 'string' ? new Date(date) : date;
    return d.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleViewDetails = () => {
    console.log('View details clicked for trade:', trade.id);
    onViewDetails?.(trade);
  };

  return (
    <Card className="hover-elevate" data-testid={`trade-card-${trade.id}`}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="font-semibold text-sm" data-testid="company-name">
                {trade.companyName}
              </h3>
              {trade.ticker && (
                <Badge variant="outline" className="text-xs font-mono">
                  {trade.ticker}
                </Badge>
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              Filed {formatDate(trade.filedDate)}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Badge className={`text-xs ${getSignalColor(trade.signalType)}`}>
              {getSignalIcon(trade.signalType)}
              {trade.signalType}
            </Badge>
            <div className="text-right">
              <div className="text-xs text-muted-foreground">Score</div>
              <div className="text-sm font-bold">{trade.significanceScore}%</div>
            </div>
          </div>
        </div>
        
        <div className="grid grid-cols-2 gap-4 mb-3">
          <div>
            <div className="text-xs text-muted-foreground">Shares</div>
            <div className="text-sm font-mono" data-testid="shares">
              {trade.shares.toLocaleString()}
            </div>
          </div>
          <div>
            <div className="text-xs text-muted-foreground">Total Value</div>
            <div className="text-sm font-bold" data-testid="total-value">
              {formatCurrency(trade.totalValue)}
            </div>
          </div>
        </div>


        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">
              Trade Signal: {trade.signalType}
            </span>
          </div>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={handleViewDetails}
            className="text-xs"
            data-testid="button-view-details"
          >
            <ExternalLink className="h-3 w-3 mr-1" />
            Details
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}