import { db } from "./db-storage";
import { insiderTrades, stockPriceHistory } from "@shared/schema";
import { eq, and, gte, lte, desc, sql, inArray } from "drizzle-orm";

interface TraderHistory {
  totalTrades: number;
  successfulTrades: number;
  successRate: number;
  avgReturn: number;
  trades: {
    id: string;
    ticker: string;
    tradeType: string;
    filedDate: Date;
    priceAtTrade: number;
    return1Week: number | null;
    return2Week: number | null;
    return1Month: number | null;
  }[];
}

interface HistoricalPriceTargets {
  conservative: number;  // 25th percentile
  realistic: number;     // 50th percentile (median)
  optimistic: number;    // 75th percentile
  sampleSize: number;
  avgReturn: number;
}

interface HistoricalTimeHorizon {
  recommended: string;
  avgDaysToPeak: number;
  sampleSize: number;
}

interface ClusterActivity {
  isCluster: boolean;
  count: number;
  traders: string[];
  totalValue: number;
}

interface HistoricalRiskFactors {
  traderSuccessRate: number | null;
  clusterActivity: ClusterActivity;
  priceVarianceRisk: boolean;
  sectorTrend: 'BULLISH' | 'BEARISH' | 'NEUTRAL';
  calculatedRiskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
  riskScore: number;
}

interface DataDrivenInsights {
  insights: string[];
  traderTrackRecord: string | null;
  clusterInfo: string | null;
  sizeComparison: string | null;
  historicalPerformance: string | null;
}

export class HistoricalAnalyticsService {

  /**
   * Get a trader's historical success rate based on past trades
   */
  async getTraderHistory(traderName: string, ticker?: string): Promise<TraderHistory> {
    // Get all past trades by this trader
    const conditions = [eq(insiderTrades.traderName, traderName)];
    if (ticker) {
      conditions.push(eq(insiderTrades.ticker, ticker));
    }

    const pastTrades = await db
      .select()
      .from(insiderTrades)
      .where(and(...conditions))
      .orderBy(desc(insiderTrades.filedDate))
      .limit(50);

    if (pastTrades.length === 0) {
      return {
        totalTrades: 0,
        successfulTrades: 0,
        successRate: 50, // Default to neutral
        avgReturn: 0,
        trades: []
      };
    }

    // Calculate returns for each trade
    const tradesWithReturns = await Promise.all(
      pastTrades.map(async (trade) => {
        if (!trade.ticker) {
          return {
            id: trade.id,
            ticker: trade.ticker || 'N/A',
            tradeType: trade.tradeType,
            filedDate: trade.filedDate,
            priceAtTrade: trade.pricePerShare,
            return1Week: null,
            return2Week: null,
            return1Month: null
          };
        }

        const returns = await this.calculateReturnsAfterTrade(
          trade.ticker,
          trade.filedDate,
          trade.pricePerShare
        );

        return {
          id: trade.id,
          ticker: trade.ticker,
          tradeType: trade.tradeType,
          filedDate: trade.filedDate,
          priceAtTrade: trade.pricePerShare,
          ...returns
        };
      })
    );

    // Count successful trades (positive return for BUY, negative return for SELL)
    const tradesWithValidReturns = tradesWithReturns.filter(t => t.return1Month !== null);
    const successfulTrades = tradesWithValidReturns.filter(trade => {
      const isBuy = trade.tradeType.toUpperCase().includes('BUY');
      const return1M = trade.return1Month || 0;
      return isBuy ? return1M > 0 : return1M < 0;
    });

    const avgReturn = tradesWithValidReturns.length > 0
      ? tradesWithValidReturns.reduce((sum, t) => sum + (t.return1Month || 0), 0) / tradesWithValidReturns.length
      : 0;

    const successRate = tradesWithValidReturns.length > 0
      ? (successfulTrades.length / tradesWithValidReturns.length) * 100
      : 50;

    return {
      totalTrades: pastTrades.length,
      successfulTrades: successfulTrades.length,
      successRate: Math.round(successRate),
      avgReturn: Math.round(avgReturn * 100) / 100,
      trades: tradesWithReturns
    };
  }

  /**
   * Calculate price returns after a trade at different time intervals
   */
  private async calculateReturnsAfterTrade(
    ticker: string,
    tradeDate: Date,
    tradePrice: number
  ): Promise<{ return1Week: number | null; return2Week: number | null; return1Month: number | null }> {
    const date1Week = new Date(tradeDate);
    date1Week.setDate(date1Week.getDate() + 7);

    const date2Week = new Date(tradeDate);
    date2Week.setDate(date2Week.getDate() + 14);

    const date1Month = new Date(tradeDate);
    date1Month.setMonth(date1Month.getMonth() + 1);

    // Get price history for the period after the trade
    const priceHistory = await db
      .select()
      .from(stockPriceHistory)
      .where(
        and(
          eq(stockPriceHistory.ticker, ticker.toUpperCase()),
          gte(stockPriceHistory.date, tradeDate.toISOString().split('T')[0]),
          lte(stockPriceHistory.date, date1Month.toISOString().split('T')[0])
        )
      )
      .orderBy(stockPriceHistory.date);

    if (priceHistory.length === 0) {
      return { return1Week: null, return2Week: null, return1Month: null };
    }

    // Find closest prices to each time interval
    const getClosestPrice = (targetDate: Date): number | null => {
      const targetStr = targetDate.toISOString().split('T')[0];
      // Find the closest date in history
      let closest = priceHistory.find(p => p.date >= targetStr);
      if (!closest && priceHistory.length > 0) {
        closest = priceHistory[priceHistory.length - 1];
      }
      return closest ? parseFloat(closest.close as string) : null;
    };

    const price1Week = getClosestPrice(date1Week);
    const price2Week = getClosestPrice(date2Week);
    const price1Month = getClosestPrice(date1Month);

    const calculateReturn = (futurePrice: number | null): number | null => {
      if (futurePrice === null || tradePrice === 0) return null;
      return ((futurePrice - tradePrice) / tradePrice) * 100;
    };

    return {
      return1Week: calculateReturn(price1Week),
      return2Week: calculateReturn(price2Week),
      return1Month: calculateReturn(price1Month)
    };
  }

  /**
   * Calculate price targets based on historical performance of similar trades
   */
  async calculateHistoricalPriceTargets(
    ticker: string,
    tradeType: string,
    totalValue: number,
    traderTitle: string
  ): Promise<HistoricalPriceTargets> {
    const isExecutive = ['CEO', 'CFO', 'President', 'Chairman', 'Director'].some(title =>
      traderTitle.toLowerCase().includes(title.toLowerCase())
    );
    const isBuy = tradeType.toUpperCase().includes('BUY');

    // Get similar past trades
    // Similar means: same ticker OR same trade characteristics (size, exec level)
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    // First try to get trades for same ticker
    let similarTrades = await db
      .select()
      .from(insiderTrades)
      .where(
        and(
          eq(insiderTrades.ticker, ticker),
          lte(insiderTrades.filedDate, sixMonthsAgo) // Only past trades that have had time to mature
        )
      )
      .orderBy(desc(insiderTrades.filedDate))
      .limit(30);

    // If not enough trades for same ticker, expand to similar characteristics
    if (similarTrades.length < 10) {
      // Get trades with similar value range (+/- 50%)
      const minValue = totalValue * 0.5;
      const maxValue = totalValue * 1.5;

      const expandedTrades = await db
        .select()
        .from(insiderTrades)
        .where(
          and(
            gte(insiderTrades.totalValue, minValue),
            lte(insiderTrades.totalValue, maxValue),
            lte(insiderTrades.filedDate, sixMonthsAgo)
          )
        )
        .orderBy(desc(insiderTrades.filedDate))
        .limit(50);

      // Combine and dedupe
      const existingIds = new Set(similarTrades.map(t => t.id));
      for (const trade of expandedTrades) {
        if (!existingIds.has(trade.id)) {
          similarTrades.push(trade);
          existingIds.add(trade.id);
        }
        if (similarTrades.length >= 30) break;
      }
    }

    if (similarTrades.length === 0) {
      // Return default targets if no historical data
      if (isBuy) {
        return {
          conservative: isExecutive ? 5 : 3,
          realistic: isExecutive ? 12 : 7,
          optimistic: isExecutive ? 25 : 15,
          sampleSize: 0,
          avgReturn: 0
        };
      } else {
        return {
          conservative: -3,
          realistic: -7,
          optimistic: -15,
          sampleSize: 0,
          avgReturn: 0
        };
      }
    }

    // Calculate actual 1-month returns for similar trades
    const returns: number[] = [];

    for (const trade of similarTrades) {
      if (!trade.ticker) continue;

      const result = await this.calculateReturnsAfterTrade(
        trade.ticker,
        trade.filedDate,
        trade.pricePerShare
      );

      if (result.return1Month !== null) {
        // Adjust return based on trade type alignment
        const tradeIsBuy = trade.tradeType.toUpperCase().includes('BUY');
        if (tradeIsBuy === isBuy) {
          returns.push(result.return1Month);
        }
      }
    }

    if (returns.length === 0) {
      // Return default targets
      if (isBuy) {
        return {
          conservative: isExecutive ? 5 : 3,
          realistic: isExecutive ? 12 : 7,
          optimistic: isExecutive ? 25 : 15,
          sampleSize: 0,
          avgReturn: 0
        };
      } else {
        return {
          conservative: -3,
          realistic: -7,
          optimistic: -15,
          sampleSize: 0,
          avgReturn: 0
        };
      }
    }

    // Sort returns and calculate percentiles
    returns.sort((a, b) => a - b);

    const percentile = (arr: number[], p: number): number => {
      const index = (p / 100) * (arr.length - 1);
      const lower = Math.floor(index);
      const upper = Math.ceil(index);
      if (lower === upper) return arr[lower];
      return arr[lower] * (upper - index) + arr[upper] * (index - lower);
    };

    const avgReturn = returns.reduce((sum, r) => sum + r, 0) / returns.length;

    return {
      conservative: Math.round(percentile(returns, 25) * 100) / 100,
      realistic: Math.round(percentile(returns, 50) * 100) / 100,
      optimistic: Math.round(percentile(returns, 75) * 100) / 100,
      sampleSize: returns.length,
      avgReturn: Math.round(avgReturn * 100) / 100
    };
  }

  /**
   * Calculate optimal time horizon based on historical peak analysis
   */
  async calculateOptimalTimeHorizon(
    ticker: string,
    tradeType: string,
    totalValue: number
  ): Promise<HistoricalTimeHorizon> {
    const isBuy = tradeType.toUpperCase().includes('BUY');

    // Get past trades for this ticker
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const pastTrades = await db
      .select()
      .from(insiderTrades)
      .where(
        and(
          eq(insiderTrades.ticker, ticker),
          lte(insiderTrades.filedDate, sixMonthsAgo)
        )
      )
      .orderBy(desc(insiderTrades.filedDate))
      .limit(20);

    if (pastTrades.length === 0) {
      // Return default based on trade size
      const isLargeTrade = totalValue > 1000000;
      return {
        recommended: isLargeTrade ? '1-2 weeks' : '2-4 weeks',
        avgDaysToPeak: isLargeTrade ? 10 : 21,
        sampleSize: 0
      };
    }

    // Calculate days to peak for each trade
    const daysToPeaks: number[] = [];

    for (const trade of pastTrades) {
      if (!trade.ticker) continue;

      const daysResult = await this.findDaysToPeak(
        trade.ticker,
        trade.filedDate,
        trade.pricePerShare,
        isBuy
      );

      if (daysResult !== null) {
        daysToPeaks.push(daysResult);
      }
    }

    if (daysToPeaks.length === 0) {
      const isLargeTrade = totalValue > 1000000;
      return {
        recommended: isLargeTrade ? '1-2 weeks' : '2-4 weeks',
        avgDaysToPeak: isLargeTrade ? 10 : 21,
        sampleSize: 0
      };
    }

    const avgDays = daysToPeaks.reduce((sum, d) => sum + d, 0) / daysToPeaks.length;

    let recommended: string;
    if (avgDays <= 5) {
      recommended = '3-5 days';
    } else if (avgDays <= 7) {
      recommended = '5-7 days';
    } else if (avgDays <= 14) {
      recommended = '1-2 weeks';
    } else if (avgDays <= 21) {
      recommended = '2-3 weeks';
    } else if (avgDays <= 30) {
      recommended = '3-4 weeks';
    } else {
      recommended = '4-6 weeks';
    }

    return {
      recommended,
      avgDaysToPeak: Math.round(avgDays),
      sampleSize: daysToPeaks.length
    };
  }

  /**
   * Find the number of days until peak return after a trade
   */
  private async findDaysToPeak(
    ticker: string,
    tradeDate: Date,
    tradePrice: number,
    isBuy: boolean
  ): Promise<number | null> {
    const endDate = new Date(tradeDate);
    endDate.setMonth(endDate.getMonth() + 2); // Look 2 months ahead

    const priceHistory = await db
      .select()
      .from(stockPriceHistory)
      .where(
        and(
          eq(stockPriceHistory.ticker, ticker.toUpperCase()),
          gte(stockPriceHistory.date, tradeDate.toISOString().split('T')[0]),
          lte(stockPriceHistory.date, endDate.toISOString().split('T')[0])
        )
      )
      .orderBy(stockPriceHistory.date);

    if (priceHistory.length === 0) return null;

    let peakIndex = 0;
    let peakReturn = 0;

    for (let i = 0; i < priceHistory.length; i++) {
      const price = parseFloat(priceHistory[i].close as string);
      const returnPct = ((price - tradePrice) / tradePrice) * 100;

      // For BUY, we want highest return; for SELL, we want lowest (most negative)
      if (isBuy) {
        if (returnPct > peakReturn) {
          peakReturn = returnPct;
          peakIndex = i;
        }
      } else {
        if (returnPct < peakReturn) {
          peakReturn = returnPct;
          peakIndex = i;
        }
      }
    }

    // Calculate days from trade to peak
    const peakDate = new Date(priceHistory[peakIndex].date);
    const daysToPeak = Math.ceil((peakDate.getTime() - tradeDate.getTime()) / (1000 * 60 * 60 * 24));

    return Math.max(1, daysToPeak);
  }

  /**
   * Detect cluster buying/selling activity
   */
  async detectClusterActivity(
    ticker: string,
    tradeDate: Date,
    tradeType: string
  ): Promise<ClusterActivity> {
    const sevenDaysAgo = new Date(tradeDate);
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const isBuy = tradeType.toUpperCase().includes('BUY');

    // Get trades for same ticker in last 7 days
    const recentTrades = await db
      .select()
      .from(insiderTrades)
      .where(
        and(
          eq(insiderTrades.ticker, ticker),
          gte(insiderTrades.filedDate, sevenDaysAgo),
          lte(insiderTrades.filedDate, tradeDate)
        )
      );

    // Filter for same direction trades
    const sameDirectionTrades = recentTrades.filter(t => {
      const tIsBuy = t.tradeType.toUpperCase().includes('BUY');
      return tIsBuy === isBuy;
    });

    const uniqueTraders = [...new Set(sameDirectionTrades.map(t => t.traderName))];
    const totalValue = sameDirectionTrades.reduce((sum, t) => sum + t.totalValue, 0);

    return {
      isCluster: uniqueTraders.length >= 2,
      count: uniqueTraders.length,
      traders: uniqueTraders,
      totalValue
    };
  }

  /**
   * Calculate enhanced risk assessment using historical data
   */
  async calculateHistoricalRisk(
    ticker: string,
    tradeType: string,
    totalValue: number,
    traderName: string,
    priceVariance: number | null,
    filedDate: Date
  ): Promise<HistoricalRiskFactors> {
    let riskScore = 50;

    // 1. Trader history analysis
    const traderHistory = await this.getTraderHistory(traderName);
    let traderSuccessRate: number | null = null;

    if (traderHistory.totalTrades >= 3) {
      traderSuccessRate = traderHistory.successRate;
      if (traderSuccessRate > 70) riskScore -= 15;
      else if (traderSuccessRate < 40) riskScore += 15;
    }

    // 2. Cluster pattern detection
    const clusterActivity = await this.detectClusterActivity(ticker, filedDate, tradeType);
    if (clusterActivity.isCluster) {
      riskScore -= 10; // Cluster buying/selling = lower risk
    }

    // 3. Price variance check
    let priceVarianceRisk = false;
    if (priceVariance && Math.abs(priceVariance) > 10) {
      priceVarianceRisk = true;
      riskScore += 20;
    }

    // 4. Analyze recent sector trend (based on recent trades for same ticker)
    const sectorTrend = await this.analyzeSectorTrend(ticker);
    const isBuy = tradeType.toUpperCase().includes('BUY');

    // Contrarian signals = higher risk
    if (isBuy && sectorTrend === 'BEARISH') riskScore += 10;
    if (!isBuy && sectorTrend === 'BULLISH') riskScore += 10;

    // 5. Trade size risk adjustment
    const isLargeTrade = totalValue > 1000000;
    if (isLargeTrade && !isBuy) riskScore += 10; // Large sells = higher risk

    // Determine risk level
    let calculatedRiskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
    if (riskScore > 70) {
      calculatedRiskLevel = 'HIGH';
    } else if (riskScore < 40) {
      calculatedRiskLevel = 'LOW';
    } else {
      calculatedRiskLevel = 'MEDIUM';
    }

    return {
      traderSuccessRate,
      clusterActivity,
      priceVarianceRisk,
      sectorTrend,
      calculatedRiskLevel,
      riskScore
    };
  }

  /**
   * Analyze sector/ticker trend based on recent insider activity
   */
  private async analyzeSectorTrend(ticker: string): Promise<'BULLISH' | 'BEARISH' | 'NEUTRAL'> {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const recentTrades = await db
      .select()
      .from(insiderTrades)
      .where(
        and(
          eq(insiderTrades.ticker, ticker),
          gte(insiderTrades.filedDate, thirtyDaysAgo)
        )
      );

    if (recentTrades.length < 2) return 'NEUTRAL';

    const buys = recentTrades.filter(t => t.tradeType.toUpperCase().includes('BUY'));
    const sells = recentTrades.filter(t => t.tradeType.toUpperCase().includes('SELL'));

    const buyValue = buys.reduce((sum, t) => sum + t.totalValue, 0);
    const sellValue = sells.reduce((sum, t) => sum + t.totalValue, 0);

    if (buyValue > sellValue * 1.5) return 'BULLISH';
    if (sellValue > buyValue * 1.5) return 'BEARISH';
    return 'NEUTRAL';
  }

  /**
   * Generate data-driven insights based on historical analysis
   */
  async generateDataDrivenInsights(
    ticker: string,
    tradeType: string,
    totalValue: number,
    traderName: string,
    traderTitle: string,
    filedDate: Date
  ): Promise<DataDrivenInsights> {
    const insights: string[] = [];

    // 1. Trader track record
    const traderHistory = await this.getTraderHistory(traderName);
    let traderTrackRecord: string | null = null;

    if (traderHistory.totalTrades >= 3) {
      const successCount = traderHistory.successfulTrades;
      const totalCount = traderHistory.trades.filter(t => t.return1Month !== null).length;

      if (totalCount > 0) {
        traderTrackRecord = `${traderName} has ${traderHistory.successRate}% success rate on ${totalCount} past trades`;
        insights.push(traderTrackRecord);
      }
    }

    // 2. Cluster activity
    const clusterActivity = await this.detectClusterActivity(ticker, filedDate, tradeType);
    let clusterInfo: string | null = null;

    if (clusterActivity.isCluster) {
      const isBuy = tradeType.toUpperCase().includes('BUY');
      clusterInfo = `${clusterActivity.count} insiders ${isBuy ? 'buying' : 'selling'} ${ticker} in past 7 days`;
      insights.push(clusterInfo);
    }

    // 3. Compare trade size to average
    const avgTradeSize = await this.getAverageTradeSize(ticker);
    let sizeComparison: string | null = null;

    if (avgTradeSize > 0) {
      const sizeRatio = totalValue / avgTradeSize;
      if (sizeRatio > 2) {
        sizeComparison = `Trade ${sizeRatio.toFixed(1)}x larger than average for ${ticker}`;
        insights.push(sizeComparison);
      } else if (sizeRatio < 0.5) {
        sizeComparison = `Trade ${(1/sizeRatio).toFixed(1)}x smaller than average for ${ticker}`;
        insights.push(sizeComparison);
      }
    }

    // 4. Historical performance insight
    const priceTargets = await this.calculateHistoricalPriceTargets(ticker, tradeType, totalValue, traderTitle);
    let historicalPerformance: string | null = null;

    if (priceTargets.sampleSize >= 5) {
      historicalPerformance = `Similar trades averaged ${priceTargets.avgReturn > 0 ? '+' : ''}${priceTargets.avgReturn}% return (${priceTargets.sampleSize} samples)`;
      insights.push(historicalPerformance);
    }

    // If we don't have enough insights, add some basic ones
    if (insights.length < 2) {
      const isExecutive = ['CEO', 'CFO', 'President', 'Chairman', 'Director'].some(title =>
        traderTitle.toLowerCase().includes(title.toLowerCase())
      );

      if (isExecutive) {
        insights.push(`Executive-level ${tradeType.toLowerCase()} transaction from ${traderTitle}`);
      }

      const isLargeTrade = totalValue > 1000000;
      if (isLargeTrade) {
        insights.push(`Trade value of $${(totalValue / 1000000).toFixed(1)}M indicates high conviction`);
      }
    }

    return {
      insights,
      traderTrackRecord,
      clusterInfo,
      sizeComparison,
      historicalPerformance
    };
  }

  /**
   * Get average trade size for a ticker
   */
  private async getAverageTradeSize(ticker: string): Promise<number> {
    const result = await db
      .select({
        avgValue: sql<number>`avg(${insiderTrades.totalValue})`
      })
      .from(insiderTrades)
      .where(eq(insiderTrades.ticker, ticker));

    return result[0]?.avgValue || 0;
  }
}

export const historicalAnalyticsService = new HistoricalAnalyticsService();
