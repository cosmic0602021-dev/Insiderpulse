import { useState } from 'react';
import { useLocation } from 'wouter';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar as CalendarIcon, Search, SortDesc, Filter } from "lucide-react";
import { useLanguage } from "@/contexts/language-context";
import TradeCard from './trade-card';
import type { InsiderTrade } from "@shared/schema";

interface TradeListProps {
  trades: InsiderTrade[];
  loading?: boolean;
  loadingMore?: boolean;
  hasMoreData?: boolean;
  onLoadMore?: () => void;
  onDateRangeChange?: (fromDate?: Date, toDate?: Date) => void;
  onSortChange?: (sortBy: string) => void;
}

export default function TradeList({ trades, loading, loadingMore = false, hasMoreData = true, onLoadMore, onDateRangeChange, onSortChange }: TradeListProps) {
  const { t } = useLanguage();
  const [, setLocation] = useLocation();
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'date' | 'value'>('date');
  const [dateFilter, setDateFilter] = useState<string>('all');
  const [showFilters, setShowFilters] = useState(false);

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
    // Only pass filedDate for now, as backend doesn't support totalValue sorting yet
    onSortChange?.(sort === 'date' ? 'filedDate' : 'filedDate');
  };

  const handleDateFilterChange = (value: string) => {
    setDateFilter(value);
    const now = new Date();
    let fromDate: Date | undefined;
    let toDate: Date | undefined;

    switch (value) {
      case 'today':
        fromDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        toDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
        break;
      case 'week':
        fromDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        toDate = now;
        break;
      case 'month':
        fromDate = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
        toDate = now;
        break;
      case '3months':
        fromDate = new Date(now.getFullYear(), now.getMonth() - 3, now.getDate());
        toDate = now;
        break;
      case '6months':
        fromDate = new Date(now.getFullYear(), now.getMonth() - 6, now.getDate());
        toDate = now;
        break;
      case 'all':
      default:
        fromDate = undefined;
        toDate = undefined;
        break;
    }

    onDateRangeChange?.(fromDate, toDate);
  };

  const handleLoadMore = () => {
    console.log('Load more clicked');
    if (!loadingMore && hasMoreData) {
      onLoadMore?.();
    }
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
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowFilters(!showFilters)}
              data-testid="button-toggle-filters"
            >
              <Filter className="h-4 w-4 mr-2" />
              Filters
            </Button>
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
        
        {showFilters && (
          <div className="flex flex-wrap items-center gap-4 p-4 bg-muted/50 rounded-md">
            <div className="flex items-center gap-2">
              <CalendarIcon className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Date Range:</span>
              <Select value={dateFilter} onValueChange={handleDateFilterChange}>
                <SelectTrigger className="w-[140px]" data-testid="select-date-filter">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Time</SelectItem>
                  <SelectItem value="today">Today</SelectItem>
                  <SelectItem value="week">Last Week</SelectItem>
                  <SelectItem value="month">Last Month</SelectItem>
                  <SelectItem value="3months">Last 3 Months</SelectItem>
                  <SelectItem value="6months">Last 6 Months</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="text-sm text-muted-foreground">
              Showing {filteredTrades.length} trade{filteredTrades.length !== 1 ? 's' : ''}
            </div>
          </div>
        )}
        
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
                {!hasMoreData ? (
                  <div className="text-center text-muted-foreground py-2">
                    <p className="text-sm">{t('tradeList.noMoreData')}</p>
                  </div>
                ) : (
                  <Button 
                    variant="outline" 
                    onClick={handleLoadMore}
                    disabled={loadingMore}
                    data-testid="button-load-more"
                  >
                    {loadingMore ? t('tradeList.loading') : t('tradeList.loadMore')}
                  </Button>
                )}
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}