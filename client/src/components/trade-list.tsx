import { useState } from 'react';
import { useLocation } from 'wouter';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Search, SortDesc } from "lucide-react";
import { useLanguage } from "@/contexts/language-context";
import TradeCard from './trade-card';
import type { InsiderTrade } from "@shared/schema";

interface TradeListProps {
  trades: InsiderTrade[];
  loading?: boolean;
  onLoadMore?: () => void;
}

export default function TradeList({ trades, loading, onLoadMore }: TradeListProps) {
  const { t } = useLanguage();
  const [, setLocation] = useLocation();
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'date' | 'value'>('date');

  const filteredTrades = trades
    .filter(trade => {
      const matchesSearch = trade.companyName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           (trade.ticker && trade.ticker.toLowerCase().includes(searchTerm.toLowerCase()));
      return matchesSearch;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'value':
          return b.totalValue - a.totalValue;
        default:
          return new Date(b.filedDate).getTime() - new Date(a.filedDate).getTime();
      }
    });

  const handleSearch = (value: string) => {
    console.log('Search term changed:', value);
    setSearchTerm(value);
  };

  const handleSort = (sort: 'date' | 'value') => {
    console.log('Sort changed:', sort);
    setSortBy(sort);
  };

  const handleLoadMore = () => {
    console.log('Load more clicked');
    onLoadMore?.();
  };

  const handleViewDetails = (trade: InsiderTrade) => {
    console.log('Navigating to trade details:', trade.id);
    setLocation(`/trade/${trade.id}`);
  };

  return (
    <Card data-testid="trade-list">
      <CardHeader>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <CardTitle className="text-lg font-semibold">{t('tradeList.recentTrades')}</CardTitle>
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder={t('tradeList.searchCompanies')}
                value={searchTerm}
                onChange={(e) => handleSearch(e.target.value)}
                className="pl-9 w-48"
                data-testid="input-search"
              />
            </div>
          </div>
        </div>
        
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1">
            <SortDesc className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">{t('tradeList.sort')}</span>
            {[
              { key: 'date', label: t('tradeList.date') },
              { key: 'value', label: t('tradeList.value') }
            ].map((sort) => (
              <Badge
                key={sort.key}
                variant={sortBy === sort.key ? 'default' : 'outline'}
                className="cursor-pointer text-xs hover-elevate"
                onClick={() => handleSort(sort.key as any)}
                data-testid={`sort-${sort.key}`}
              >
                {sort.label}
              </Badge>
            ))}
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        {loading && filteredTrades.length === 0 ? (
          <div className="flex items-center justify-center py-8" data-testid="loading-state">
            <div className="animate-pulse flex space-x-4">
              <div className="rounded-md bg-muted h-4 w-4"></div>
              <div className="flex-1 space-y-2 py-1">
                <div className="h-4 bg-muted rounded w-3/4"></div>
                <div className="h-4 bg-muted rounded w-1/2"></div>
              </div>
            </div>
          </div>
        ) : filteredTrades.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground" data-testid="empty-state">
            <p>{t('tradeList.noTradesFound')}</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredTrades.map((trade) => (
              <TradeCard
                key={trade.id}
                trade={trade}
                onViewDetails={handleViewDetails}
              />
            ))}
            
            {onLoadMore && (
              <div className="flex justify-center pt-4">
                <Button 
                  variant="outline" 
                  onClick={handleLoadMore}
                  disabled={loading}
                  data-testid="button-load-more"
                >
                  {loading ? t('tradeList.loading') : t('tradeList.loadMore')}
                </Button>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}