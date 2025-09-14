import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ExternalLink, TrendingUp, TrendingDown, Minus } from "lucide-react";
import type { InsiderTrade } from "@shared/schema";

interface TradeCardProps {
  trade: InsiderTrade;
  onViewDetails?: (trade: InsiderTrade) => void;
}

export default function TradeCard({ trade, onViewDetails }: TradeCardProps) {

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

  const getTradeIcon = (tradeType: string) => {
    switch (tradeType) {
      case 'BUY':
        return <TrendingUp className="h-4 w-4 text-green-600" />;
      case 'SELL':
        return <TrendingDown className="h-4 w-4 text-red-600" />;
      default:
        return <Minus className="h-4 w-4 text-gray-500" />;
    }
  };

  const getTradeColor = (tradeType: string) => {
    switch (tradeType) {
      case 'BUY':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'SELL':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
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
            {trade.traderName && (
              <div className="flex items-center gap-2 mb-1">
                <span className="text-sm font-medium text-foreground" data-testid="trader-name">
                  {trade.traderName}
                </span>
                {trade.traderTitle && (
                  <span className="text-xs text-muted-foreground" data-testid="trader-title">
                    • {trade.traderTitle}
                  </span>
                )}
              </div>
            )}
            <p className="text-xs text-muted-foreground">
              Filed {formatDate(trade.filedDate)}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {trade.tradeType && (
              <Badge className={`flex items-center gap-1 text-xs ${getTradeColor(trade.tradeType)}`} data-testid="trade-type">
                {getTradeIcon(trade.tradeType)}
                {trade.tradeType}
              </Badge>
            )}
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
            <div className="text-xs text-muted-foreground">Avg Price</div>
            <div className="text-sm font-mono" data-testid="price-per-share">
              ${trade.pricePerShare.toFixed(2)}
            </div>
          </div>
          <div className="col-span-2">
            <div className="text-xs text-muted-foreground">Total Value</div>
            <div className="text-lg font-bold" data-testid="total-value">
              {formatCurrency(trade.totalValue)}
            </div>
            {trade.ownershipPercentage && trade.ownershipPercentage > 0 && (
              <div className="text-xs text-muted-foreground mt-1">
                {trade.ownershipPercentage}% ownership
              </div>
            )}
          </div>
        </div>


        <div className="flex justify-end">
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