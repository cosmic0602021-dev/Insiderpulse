import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ExternalLink, TrendingUp, TrendingDown, Minus } from "lucide-react";
import { useLanguage } from "@/contexts/language-context";
import type { InsiderTrade } from "@shared/schema";

interface TradeCardProps {
  trade: InsiderTrade;
  onViewDetails?: (trade: InsiderTrade) => void;
}

// 회사명에서 이니셜 생성하는 유틸리티 함수
const generateInitials = (name: string): string => {
  const words = name.split(' ').filter(w => w.length > 1);
  return words.slice(0, 2).map(w => w[0]).join('').toUpperCase();
};

// 회사 로고 컴포넌트 (모달과 동일한 Parqet API 사용)
function CompanyLogo({ ticker, companyName, size = 'lg' }: {
  ticker?: string | null,
  companyName: string,
  size?: 'sm' | 'md' | 'lg'
}) {
  const [logoError, setLogoError] = useState(false);

  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-10 h-10',
    lg: 'w-14 h-14'
  };

  if (logoError || !ticker) {
    // 회사명에서 이니셜 생성
    const initials = generateInitials(companyName);

    return (
      <div className={`${sizeClasses[size]} bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center font-bold text-white text-base shadow-md`}>
        {initials}
      </div>
    );
  }

  return (
    <div className={`${sizeClasses[size]} relative overflow-hidden`}>
      <img
        src={`https://assets.parqet.com/logos/resolution/${ticker.toUpperCase()}.png`}
        alt={`${companyName} logo`}
        className="w-full h-full rounded-lg object-contain"
        onError={(e) => {
          const target = e.target as HTMLImageElement;
          if (target.src.includes('parqet.com')) {
            // Fallback to EODHD API
            target.src = `https://eodhd.com/img/logos/US/${ticker.toUpperCase()}.png`;
          } else {
            // Both APIs failed, show initials
            setLogoError(true);
          }
        }}
      />
    </div>
  );
}

export default function TradeCard({ trade, onViewDetails }: TradeCardProps) {
  const { t } = useLanguage();

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
          <div className="flex items-start gap-3 flex-1">
            <CompanyLogo
              ticker={trade.ticker}
              companyName={trade.companyName}
              size="lg"
            />
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="text-sm font-semibold text-foreground" data-testid="company-name">
                  {trade.companyName}
                </h3>
                {trade.ticker && (
                  <Badge variant="outline" className="text-xs font-mono">
                    {trade.ticker}
                  </Badge>
                )}
              </div>
            {trade.traderName && (
              <div className="mb-1">
                <div className="text-sm font-medium text-foreground" data-testid="trader-name">
                  {trade.traderName}
                </div>
                {trade.traderTitle && (
                  <div className="text-xs font-normal text-muted-foreground" data-testid="trader-title">
                    {trade.traderTitle}
                  </div>
                )}
              </div>
            )}
            <p className="text-xs text-muted-foreground">
              {t('tradeCard.filed')} {formatDate(trade.filedDate)}
            </p>
            </div>
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
            <div className="text-xs font-medium text-muted-foreground">{t('tradeCard.shares')}</div>
            <div className="text-sm font-mono text-foreground" data-testid="shares">
              {trade.shares.toLocaleString()}
            </div>
          </div>
          <div>
            <div className="text-xs font-medium text-muted-foreground">{t('tradeCard.avgPrice')}</div>
            <div className="text-sm font-mono text-foreground" data-testid="price-per-share">
              ${trade.pricePerShare.toFixed(2)}
            </div>
          </div>
          <div className="col-span-2">
            <div className="text-xs font-medium text-muted-foreground">{t('tradeCard.totalValue')}</div>
            <div className="text-lg font-bold text-foreground" data-testid="total-value">
              {formatCurrency(trade.totalValue)}
            </div>
            {trade.ownershipPercentage && trade.ownershipPercentage > 0 && (
              <div className="text-xs font-normal text-muted-foreground mt-1">
                {trade.ownershipPercentage}% {t('tradeCard.ownership')}
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
            {t('tradeCard.details')}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}