import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLanguage } from "@/contexts/language-context";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Search, Filter, TrendingUp, TrendingDown, Calendar, Building2, User, DollarSign, Sliders } from "lucide-react";
import TradeCard from "@/components/trade-card";
import type { InsiderTrade } from "@shared/schema";
import { useLocation } from "wouter";

export default function SearchPage() {
  const { t } = useLanguage();
  const [, setLocation] = useLocation();
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'date' | 'value' | 'company'>('date');
  const [filterType, setFilterType] = useState<'all' | 'BUY' | 'SELL'>('all');
  const [dateRange, setDateRange] = useState<'all' | '7d' | '30d' | '90d'>('all');
  const [minValue, setMinValue] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  // Fetch trades data
  const { data: trades = [], isLoading } = useQuery<InsiderTrade[]>({
    queryKey: ['/api/trades'],
    staleTime: 5 * 60 * 1000,
  });

  // Filter and sort trades
  const filteredTrades = trades
    .filter(trade => {
      // Text search
      const matchesSearch = !searchTerm || 
        trade.companyName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (trade.ticker && trade.ticker.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (trade.traderName && trade.traderName.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (trade.traderTitle && trade.traderTitle.toLowerCase().includes(searchTerm.toLowerCase()));

      // Trade type filter
      const matchesType = filterType === 'all' || trade.tradeType === filterType;

      // Date range filter
      let matchesDate = true;
      if (dateRange !== 'all') {
        const now = new Date();
        const tradeDate = new Date(trade.filedDate);
        const daysAgo = parseInt(dateRange.replace('d', ''));
        const cutoffDate = new Date(now.getTime() - (daysAgo * 24 * 60 * 60 * 1000));
        matchesDate = tradeDate >= cutoffDate;
      }

      // Minimum value filter
      const matchesValue = !minValue || trade.totalValue >= parseFloat(minValue);

      return matchesSearch && matchesType && matchesDate && matchesValue;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'value':
          return b.totalValue - a.totalValue;
        case 'company':
          return a.companyName.localeCompare(b.companyName);
        default: // date
          return new Date(b.filedDate).getTime() - new Date(a.filedDate).getTime();
      }
    });

  // Search statistics
  const searchStats = {
    totalResults: filteredTrades.length,
    buyTrades: filteredTrades.filter(t => t.tradeType === 'BUY').length,
    sellTrades: filteredTrades.filter(t => t.tradeType === 'SELL').length,
    totalVolume: filteredTrades.reduce((sum, t) => sum + t.totalValue, 0),
    uniqueCompanies: new Set(filteredTrades.map(t => t.companyName)).size,
    uniqueTraders: new Set(filteredTrades.map(t => t.traderName)).size
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      notation: 'compact',
      maximumFractionDigits: 1
    }).format(amount);
  };

  const handleViewDetails = (trade: InsiderTrade) => {
    setLocation(`/trade/${trade.id}`);
  };

  const clearFilters = () => {
    setSearchTerm('');
    setFilterType('all');
    setDateRange('all');
    setMinValue('');
    setSortBy('date');
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight" data-testid="text-search-title">
          {t('nav.search')}
        </h1>
        <p className="text-muted-foreground">
          Search and filter insider trading data with advanced criteria
        </p>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            Search & Filter
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Main search */}
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search companies, tickers, traders, or titles..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
                data-testid="input-main-search"
              />
            </div>
            <Button
              variant="outline"
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-2"
              data-testid="button-toggle-filters"
            >
              <Sliders className="h-4 w-4" />
              Filters
            </Button>
            {(searchTerm || filterType !== 'all' || dateRange !== 'all' || minValue) && (
              <Button variant="ghost" onClick={clearFilters}>
                Clear
              </Button>
            )}
          </div>

          {/* Advanced filters */}
          {showFilters && (
            <>
              <Separator />
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Trade Type</label>
                  <Select value={filterType} onValueChange={(value: any) => setFilterType(value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Types</SelectItem>
                      <SelectItem value="BUY">Buy Only</SelectItem>
                      <SelectItem value="SELL">Sell Only</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Date Range</label>
                  <Select value={dateRange} onValueChange={(value: any) => setDateRange(value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Time</SelectItem>
                      <SelectItem value="7d">Last 7 Days</SelectItem>
                      <SelectItem value="30d">Last 30 Days</SelectItem>
                      <SelectItem value="90d">Last 90 Days</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Sort By</label>
                  <Select value={sortBy} onValueChange={(value: any) => setSortBy(value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="date">Date (Newest)</SelectItem>
                      <SelectItem value="value">Value (Highest)</SelectItem>
                      <SelectItem value="company">Company (A-Z)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Min Value ($)</label>
                  <Input
                    type="number"
                    placeholder="1000000"
                    value={minValue}
                    onChange={(e) => setMinValue(e.target.value)}
                    data-testid="input-min-value"
                  />
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Search Statistics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Results</CardTitle>
            <Search className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="stat-total-results">
              {searchStats.totalResults}
            </div>
            <p className="text-xs text-muted-foreground">Total trades found</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Buy Trades</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {searchStats.buyTrades}
            </div>
            <p className="text-xs text-muted-foreground">
              {searchStats.totalResults > 0 
                ? `${((searchStats.buyTrades / searchStats.totalResults) * 100).toFixed(1)}%`
                : '0%'
              } of results
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Sell Trades</CardTitle>
            <TrendingDown className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {searchStats.sellTrades}
            </div>
            <p className="text-xs text-muted-foreground">
              {searchStats.totalResults > 0 
                ? `${((searchStats.sellTrades / searchStats.totalResults) * 100).toFixed(1)}%`
                : '0%'
              } of results
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Volume</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(searchStats.totalVolume)}
            </div>
            <p className="text-xs text-muted-foreground">Combined value</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Companies</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {searchStats.uniqueCompanies}
            </div>
            <p className="text-xs text-muted-foreground">Unique entities</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Traders</CardTitle>
            <User className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {searchStats.uniqueTraders}
            </div>
            <p className="text-xs text-muted-foreground">Unique insiders</p>
          </CardContent>
        </Card>
      </div>

      {/* Search Results */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Search Results</span>
            <Badge variant="outline">
              {searchStats.totalResults} results
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-48" />
              ))}
            </div>
          ) : filteredTrades.length === 0 ? (
            <div className="text-center py-12">
              <Search className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
              <h3 className="text-lg font-semibold mb-2">No trades found</h3>
              <p className="text-muted-foreground mb-4">
                Try adjusting your search criteria or filters
              </p>
              <Button variant="outline" onClick={clearFilters}>
                Clear all filters
              </Button>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {filteredTrades.map((trade) => (
                <TradeCard
                  key={trade.id}
                  trade={trade}
                  onViewDetails={handleViewDetails}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}