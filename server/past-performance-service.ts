import { drizzle } from "drizzle-orm/neon-http";
import { eq, sql, and, desc, gte, lte, inArray } from "drizzle-orm";
import * as schema from "@shared/schema";
import { rankingSnapshots, insiderTrades, stockPrices, stockPriceHistory } from "@shared/schema";

// Initialize database
const db = drizzle(process.env.DATABASE_URL!, { schema });

// Response types
interface StockPerformance {
  rank: number;
  ticker: string;
  companyName: string;
  entryPrice: number;
  exitPrice: number;
  returnPercent: number;
  returnDollar: number; // Based on $100 investment (1000/10 stocks)
  hadInsiderSell: boolean;
  sellDate?: string;
  sellIndicator?: string;
  recommendedDate: string; // 추천 날짜
}

interface PerformanceSummary {
  avgReturn: number;
  winRate: number;
  winnersCount: number;
  losersCount: number;
  hypotheticalGain: number; // $1000 invested result
}

interface HistoricalPerformanceResponse {
  period: {
    monthsAgo: number;
    snapshotDate: string;
    evaluationDate: string;
  };
  summary: PerformanceSummary;
  stocks: StockPerformance[];
  dataAvailable: boolean;
  message?: string;
}

class PastPerformanceService {
  private cache: Map<string, { data: HistoricalPerformanceResponse; timestamp: number }> = new Map();
  private CACHE_TTL = 60 * 60 * 1000; // 1 hour

  /**
   * Get historical performance for recommendations from X months ago
   */
  async getHistoricalPerformance(monthsAgo: 1 | 3): Promise<HistoricalPerformanceResponse> {
    const cacheKey = `historical_performance:${monthsAgo}`;
    const cached = this.cache.get(cacheKey);

    if (cached && (Date.now() - cached.timestamp) < this.CACHE_TTL) {
      console.log(`[PastPerformance] Cache hit for ${monthsAgo} months`);
      return cached.data;
    }

    console.log(`[PastPerformance] Computing performance for ${monthsAgo} months ago...`);

    // Calculate target date (X months ago)
    const targetDate = new Date();
    targetDate.setMonth(targetDate.getMonth() - monthsAgo);
    const snapshotDateStr = targetDate.toISOString().split('T')[0];

    // Try to find snapshots within a 7-day window around target date
    const startWindow = new Date(targetDate);
    startWindow.setDate(startWindow.getDate() - 3);
    const endWindow = new Date(targetDate);
    endWindow.setDate(endWindow.getDate() + 3);

    const snapshots = await db.query.rankingSnapshots.findMany({
      where: and(
        gte(rankingSnapshots.snapshotDate, startWindow.toISOString().split('T')[0]),
        lte(rankingSnapshots.snapshotDate, endWindow.toISOString().split('T')[0])
      ),
      orderBy: [desc(rankingSnapshots.snapshotDate), rankingSnapshots.rank],
      limit: 10,
    });

    // If no snapshots found, return unavailable message
    if (!snapshots || snapshots.length === 0) {
      const response: HistoricalPerformanceResponse = {
        period: {
          monthsAgo,
          snapshotDate: snapshotDateStr,
          evaluationDate: new Date().toISOString().split('T')[0],
        },
        summary: {
          avgReturn: 0,
          winRate: 0,
          winnersCount: 0,
          losersCount: 0,
          hypotheticalGain: 1000,
        },
        stocks: [],
        dataAvailable: false,
        message: `Performance data not yet available. Data collection started recently. Please check back in ${monthsAgo} month${monthsAgo > 1 ? 's' : ''}.`,
      };
      return response;
    }

    // Get unique snapshot date (use the most recent one found)
    const actualSnapshotDate = snapshots[0].snapshotDate;
    const uniqueSnapshots = snapshots.filter(s => s.snapshotDate === actualSnapshotDate);

    // Calculate performance for each stock
    const stockPerformances: StockPerformance[] = [];
    const today = new Date().toISOString().split('T')[0];

    for (const snapshot of uniqueSnapshots) {
      const performance = await this.calculateStockPerformance(snapshot, actualSnapshotDate, today);
      if (performance) {
        stockPerformances.push(performance);
      }
    }

    // Sort by original rank
    stockPerformances.sort((a, b) => a.rank - b.rank);

    // Calculate summary
    const validStocks = stockPerformances.filter(s => s.exitPrice > 0);
    const winners = validStocks.filter(s => s.returnPercent > 0);
    const losers = validStocks.filter(s => s.returnPercent <= 0);

    const avgReturn = validStocks.length > 0
      ? validStocks.reduce((sum, s) => sum + s.returnPercent, 0) / validStocks.length
      : 0;

    const winRate = validStocks.length > 0
      ? winners.length / validStocks.length
      : 0;

    // Calculate hypothetical $1000 investment (equally distributed)
    const investmentPerStock = 1000 / Math.max(validStocks.length, 1);
    const hypotheticalGain = validStocks.reduce((sum, s) => {
      return sum + (investmentPerStock * (1 + s.returnPercent / 100));
    }, 0);

    const response: HistoricalPerformanceResponse = {
      period: {
        monthsAgo,
        snapshotDate: actualSnapshotDate,
        evaluationDate: today,
      },
      summary: {
        avgReturn: Math.round(avgReturn * 100) / 100,
        winRate: Math.round(winRate * 100) / 100,
        winnersCount: winners.length,
        losersCount: losers.length,
        hypotheticalGain: Math.round(hypotheticalGain * 100) / 100,
      },
      stocks: stockPerformances,
      dataAvailable: true,
    };

    // Cache the result
    this.cache.set(cacheKey, { data: response, timestamp: Date.now() });

    console.log(`[PastPerformance] Computed: avgReturn=${avgReturn.toFixed(2)}%, winRate=${(winRate * 100).toFixed(0)}%`);
    return response;
  }

  /**
   * Calculate performance for a single stock
   */
  private async calculateStockPerformance(
    snapshot: typeof rankingSnapshots.$inferSelect,
    snapshotDate: string,
    evaluationDate: string
  ): Promise<StockPerformance | null> {
    const entryPrice = parseFloat(snapshot.avgBuyPrice);

    if (!entryPrice || entryPrice <= 0) {
      return null;
    }

    // Check for insider sell after snapshot date
    const sellInfo = await this.checkInsiderSellAfterDate(snapshot.ticker, snapshotDate);

    let exitPrice: number;
    let exitDate: string;

    if (sellInfo.hasSell && sellInfo.sellDate) {
      // Use price at sell date
      exitDate = sellInfo.sellDate;
      const priceAtSell = await this.getPriceAtDate(snapshot.ticker, sellInfo.sellDate);
      exitPrice = priceAtSell || 0;
    } else {
      // Use current price
      exitDate = evaluationDate;
      const currentPrice = await this.getCurrentPrice(snapshot.ticker);
      exitPrice = currentPrice || 0;
    }

    if (exitPrice <= 0) {
      // Try to get any available price
      const fallbackPrice = await this.getCurrentPrice(snapshot.ticker);
      exitPrice = fallbackPrice || entryPrice; // Use entry price as last resort
    }

    const returnPercent = ((exitPrice - entryPrice) / entryPrice) * 100;
    const returnDollar = 100 * (1 + returnPercent / 100) - 100; // $100 investment gain/loss

    return {
      rank: snapshot.rank,
      ticker: snapshot.ticker,
      companyName: snapshot.companyName,
      entryPrice: Math.round(entryPrice * 100) / 100,
      exitPrice: Math.round(exitPrice * 100) / 100,
      returnPercent: Math.round(returnPercent * 100) / 100,
      returnDollar: Math.round(returnDollar * 100) / 100,
      hadInsiderSell: sellInfo.hasSell,
      sellDate: sellInfo.sellDate,
      sellIndicator: sellInfo.sellerInfo,
      recommendedDate: snapshotDate, // 추천 날짜
    };
  }

  /**
   * Check if any insider sold after the given date
   */
  private async checkInsiderSellAfterDate(
    ticker: string,
    afterDate: string
  ): Promise<{ hasSell: boolean; sellDate?: string; sellerInfo?: string }> {
    const afterDateObj = new Date(afterDate);

    const sellTrades = await db.query.insiderTrades.findMany({
      where: and(
        eq(insiderTrades.ticker, ticker),
        sql`${insiderTrades.tradeType} IN ('SELL', 'SALE', 'S')`,
        gte(insiderTrades.filedDate, afterDateObj)
      ),
      orderBy: [insiderTrades.filedDate],
      limit: 1,
    });

    if (sellTrades.length > 0) {
      const sellTrade = sellTrades[0];
      const sellDate = sellTrade.filedDate.toISOString().split('T')[0];
      const sellerInfo = `${sellTrade.traderTitle || 'Insider'} sold on ${new Date(sellDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;

      return {
        hasSell: true,
        sellDate,
        sellerInfo,
      };
    }

    return { hasSell: false };
  }

  /**
   * Get stock price at a specific date from history
   */
  private async getPriceAtDate(ticker: string, date: string): Promise<number | null> {
    // Try exact date first
    const exactPrice = await db.query.stockPriceHistory.findFirst({
      where: and(
        eq(stockPriceHistory.ticker, ticker),
        eq(stockPriceHistory.date, date)
      ),
    });

    if (exactPrice) {
      return parseFloat(exactPrice.close);
    }

    // Try nearby dates (within 5 trading days)
    const targetDate = new Date(date);
    for (let i = 1; i <= 5; i++) {
      // Try previous day
      const prevDate = new Date(targetDate);
      prevDate.setDate(prevDate.getDate() - i);
      const prevPrice = await db.query.stockPriceHistory.findFirst({
        where: and(
          eq(stockPriceHistory.ticker, ticker),
          eq(stockPriceHistory.date, prevDate.toISOString().split('T')[0])
        ),
      });
      if (prevPrice) return parseFloat(prevPrice.close);

      // Try next day
      const nextDate = new Date(targetDate);
      nextDate.setDate(nextDate.getDate() + i);
      const nextPrice = await db.query.stockPriceHistory.findFirst({
        where: and(
          eq(stockPriceHistory.ticker, ticker),
          eq(stockPriceHistory.date, nextDate.toISOString().split('T')[0])
        ),
      });
      if (nextPrice) return parseFloat(nextPrice.close);
    }

    // Fallback to current price
    return this.getCurrentPrice(ticker);
  }

  /**
   * Get current stock price
   */
  private async getCurrentPrice(ticker: string): Promise<number | null> {
    const price = await db.query.stockPrices.findFirst({
      where: eq(stockPrices.ticker, ticker),
    });

    return price ? parseFloat(price.currentPrice) : null;
  }

  /**
   * Capture daily ranking snapshot (called by cron job)
   */
  async captureRankingSnapshot(rankings: Array<{
    ticker: string;
    companyName: string;
    score: number;
    avgTradeValue: number;
    netBuying: number;
    marketCap?: number | null;
    uniqueInsiders: number;
    recommendation: string;
  }>): Promise<void> {
    const today = new Date().toISOString().split('T')[0];

    console.log(`[PastPerformance] Capturing snapshot for ${today} with ${rankings.length} stocks`);

    for (let i = 0; i < Math.min(rankings.length, 10); i++) {
      const ranking = rankings[i];

      try {
        await db.insert(rankingSnapshots).values({
          snapshotDate: today,
          ticker: ranking.ticker,
          companyName: ranking.companyName,
          rank: i + 1,
          score: Math.round(ranking.score),
          avgBuyPrice: ranking.avgTradeValue.toFixed(2),
          netBuying: ranking.netBuying.toFixed(2),
          marketCap: ranking.marketCap || null,
          uniqueInsiders: ranking.uniqueInsiders,
          recommendation: ranking.recommendation,
        }).onConflictDoUpdate({
          target: [rankingSnapshots.snapshotDate, rankingSnapshots.ticker],
          set: {
            rank: i + 1,
            score: Math.round(ranking.score),
            avgBuyPrice: ranking.avgTradeValue.toFixed(2),
          },
        });
      } catch (error) {
        console.error(`[PastPerformance] Error saving snapshot for ${ranking.ticker}:`, error);
      }
    }

    // Clear cache after new snapshot
    this.cache.clear();
    console.log(`[PastPerformance] Snapshot captured successfully`);
  }

  /**
   * Clear cache (for manual invalidation)
   */
  clearCache(): void {
    this.cache.clear();
  }
}

export const pastPerformanceService = new PastPerformanceService();
