import { storage } from "./storage";
import { broadcastUpdate } from "./routes";
import type { InsiderTrade } from "@shared/schema";
import { emailNotificationService } from "./email-notification-service";

export interface PatternAlert {
  id: string;
  type: 'CLUSTER_BUY' | 'CLUSTER_SELL' | 'CONSECUTIVE_TRADES' | 'LARGE_VOLUME' | 'UNUSUAL_TIMING';
  ticker: string;
  companyName: string;
  description: string;
  trades: InsiderTrade[];
  significance: 'HIGH' | 'MEDIUM' | 'LOW';
  detectedAt: Date;
  metadata?: {
    traderCount?: number;
    consecutiveDays?: number;
    totalValue?: number;
    averageValue?: number;
  };
}

class PatternDetectionService {
  private patterns: PatternAlert[] = [];
  private lastCheck: Date = new Date();

  // 패턴 1: 동시 매수/매도 감지 (3명 이상의 임원이 같은 종목을 7일 내에 거래)
  async detectClusterTrades(days: number = 7): Promise<PatternAlert[]> {
    const alerts: PatternAlert[] = [];
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);

    // 최근 거래 데이터 조회
    const recentTrades = await storage.getInsiderTrades(1000, 0, false, cutoffDate.toISOString().split('T')[0]);

    // 티커별로 그룹화
    const tradesByTicker = new Map<string, InsiderTrade[]>();
    for (const trade of recentTrades) {
      if (!trade.ticker) continue;
      const ticker = trade.ticker.toUpperCase();
      if (!tradesByTicker.has(ticker)) {
        tradesByTicker.set(ticker, []);
      }
      tradesByTicker.get(ticker)!.push(trade);
    }

    // 각 티커별로 클러스터 패턴 분석
    for (const [ticker, trades] of tradesByTicker) {
      if (trades.length < 3) continue;

      // 매수 클러스터 감지 (순수 Purchase만)
      const buyTrades = trades.filter(t =>
        t.tradeType === 'BUY' || t.tradeType === 'PURCHASE' || t.transactionCode === 'P'
      );

      if (buyTrades.length >= 3) {
        const uniqueTraders = new Set(buyTrades.map(t => t.traderName));
        if (uniqueTraders.size >= 3) {
          const totalValue = buyTrades.reduce((sum, t) => sum + Math.abs(t.totalValue), 0);

          alerts.push({
            id: `cluster_buy_${ticker}_${Date.now()}`,
            type: 'CLUSTER_BUY',
            ticker,
            companyName: trades[0].companyName,
            description: `${uniqueTraders.size}명의 내부자가 ${days}일 내에 동시 매수 (총 $${totalValue.toLocaleString()})`,
            trades: buyTrades,
            significance: totalValue > 1000000 ? 'HIGH' : totalValue > 100000 ? 'MEDIUM' : 'LOW',
            detectedAt: new Date(),
            metadata: {
              traderCount: uniqueTraders.size,
              totalValue,
              averageValue: totalValue / buyTrades.length
            }
          });
        }
      }

      // 매도 클러스터 감지 (순수 Sale만)
      const sellTrades = trades.filter(t =>
        t.tradeType === 'SELL' || t.tradeType === 'DISPOSITION' || t.transactionCode === 'S'
      );

      if (sellTrades.length >= 3) {
        const uniqueTraders = new Set(sellTrades.map(t => t.traderName));
        if (uniqueTraders.size >= 3) {
          const totalValue = sellTrades.reduce((sum, t) => sum + Math.abs(t.totalValue), 0);

          alerts.push({
            id: `cluster_sell_${ticker}_${Date.now()}`,
            type: 'CLUSTER_SELL',
            ticker,
            companyName: trades[0].companyName,
            description: `${uniqueTraders.size}명의 내부자가 ${days}일 내에 동시 매도 (총 $${totalValue.toLocaleString()})`,
            trades: sellTrades,
            significance: totalValue > 1000000 ? 'HIGH' : totalValue > 100000 ? 'MEDIUM' : 'LOW',
            detectedAt: new Date(),
            metadata: {
              traderCount: uniqueTraders.size,
              totalValue,
              averageValue: totalValue / sellTrades.length
            }
          });
        }
      }
    }

    return alerts;
  }

  // 패턴 2: 연속 거래 감지 (같은 사람이 3개월 연속 같은 종목 거래)
  async detectConsecutiveTrades(months: number = 3): Promise<PatternAlert[]> {
    const alerts: PatternAlert[] = [];
    const cutoffDate = new Date();
    cutoffDate.setMonth(cutoffDate.getMonth() - months);

    const recentTrades = await storage.getInsiderTrades(2000, 0, false, cutoffDate.toISOString().split('T')[0]);

    // 트레이더별, 티커별로 그룹화
    const tradesByTraderTicker = new Map<string, InsiderTrade[]>();

    for (const trade of recentTrades) {
      if (!trade.ticker || !trade.traderName) continue;
      const key = `${trade.traderName}_${trade.ticker}`;
      if (!tradesByTraderTicker.has(key)) {
        tradesByTraderTicker.set(key, []);
      }
      tradesByTraderTicker.get(key)!.push(trade);
    }

    // 연속 거래 패턴 분석
    for (const [key, trades] of tradesByTraderTicker) {
      if (trades.length < 3) continue;

      // 날짜순 정렬
      trades.sort((a, b) => new Date(a.filedDate).getTime() - new Date(b.filedDate).getTime());

      // 연속 거래 확인 (30일 간격 이내)
      let consecutiveCount = 1;
      let consecutiveTrades = [trades[0]];

      for (let i = 1; i < trades.length; i++) {
        const prevDate = new Date(trades[i-1].filedDate);
        const currDate = new Date(trades[i].filedDate);
        const daysDiff = (currDate.getTime() - prevDate.getTime()) / (1000 * 60 * 60 * 24);

        if (daysDiff <= 30) { // 30일 이내면 연속으로 간주
          consecutiveCount++;
          consecutiveTrades.push(trades[i]);
        } else {
          // 연속성이 깨졌으므로 초기화
          if (consecutiveCount >= 3) {
            break; // 이미 패턴을 찾았으므로 중단
          }
          consecutiveCount = 1;
          consecutiveTrades = [trades[i]];
        }
      }

      if (consecutiveCount >= 3) {
        const [traderName, ticker] = key.split('_');
        const totalValue = consecutiveTrades.reduce((sum, t) => sum + Math.abs(t.totalValue), 0);
        const tradeType = consecutiveTrades[0].tradeType;

        alerts.push({
          id: `consecutive_${ticker}_${traderName}_${Date.now()}`,
          type: 'CONSECUTIVE_TRADES',
          ticker,
          companyName: trades[0].companyName,
          description: `${traderName}이(가) ${consecutiveCount}회 연속 ${tradeType} (총 $${totalValue.toLocaleString()})`,
          trades: consecutiveTrades,
          significance: consecutiveCount >= 5 ? 'HIGH' : consecutiveCount >= 4 ? 'MEDIUM' : 'LOW',
          detectedAt: new Date(),
          metadata: {
            consecutiveDays: consecutiveCount,
            totalValue,
            averageValue: totalValue / consecutiveTrades.length
          }
        });
      }
    }

    return alerts;
  }

  // 패턴 3: 대량 거래 감지 (평소보다 10배 이상 큰 거래)
  async detectLargeVolumeTrades(): Promise<PatternAlert[]> {
    const alerts: PatternAlert[] = [];
    const recentTrades = await storage.getInsiderTrades(200, 0, false);

    // 각 거래자의 평균 거래 규모 계산
    const traderAverages = new Map<string, number>();
    const traderTrades = new Map<string, InsiderTrade[]>();

    for (const trade of recentTrades) {
      if (!trade.traderName) continue;

      if (!traderTrades.has(trade.traderName)) {
        traderTrades.set(trade.traderName, []);
      }
      traderTrades.get(trade.traderName)!.push(trade);
    }

    // 평균 거래 규모 계산
    for (const [trader, trades] of traderTrades) {
      if (trades.length < 3) continue; // 최소 3회 거래 이력 필요

      const totalValue = trades.reduce((sum, t) => sum + Math.abs(t.totalValue), 0);
      const avgValue = totalValue / trades.length;
      traderAverages.set(trader, avgValue);
    }

    // 최근 거래 중 이상치 탐지
    const recentTradesLast30Days = await storage.getInsiderTrades(100, 0, false,
      new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]);

    for (const trade of recentTradesLast30Days) {
      if (!trade.traderName || !traderAverages.has(trade.traderName)) continue;

      const avgValue = traderAverages.get(trade.traderName)!;
      const currentValue = Math.abs(trade.totalValue);

      if (currentValue > avgValue * 10 && currentValue > 500000) { // 평소의 10배 이상이면서 50만달러 이상
        alerts.push({
          id: `large_volume_${trade.ticker}_${trade.traderName}_${Date.now()}`,
          type: 'LARGE_VOLUME',
          ticker: trade.ticker || 'N/A',
          companyName: trade.companyName,
          description: `${trade.traderName}의 평소보다 ${Math.round(currentValue / avgValue)}배 큰 거래: $${currentValue.toLocaleString()}`,
          trades: [trade],
          significance: currentValue > 5000000 ? 'HIGH' : currentValue > 1000000 ? 'MEDIUM' : 'LOW',
          detectedAt: new Date(),
          metadata: {
            totalValue: currentValue,
            averageValue: avgValue
          }
        });
      }
    }

    return alerts;
  }

  // 모든 패턴 감지 실행
  async detectAllPatterns(): Promise<PatternAlert[]> {
    console.log('🔍 패턴 감지 시작...');

    const [clusterAlerts, consecutiveAlerts, volumeAlerts] = await Promise.all([
      this.detectClusterTrades(),
      this.detectConsecutiveTrades(),
      this.detectLargeVolumeTrades()
    ]);

    const allAlerts = [...clusterAlerts, ...consecutiveAlerts, ...volumeAlerts];

    // 새로운 패턴만 저장
    const newAlerts = allAlerts.filter(alert =>
      !this.patterns.find(existing => existing.id === alert.id)
    );

    this.patterns.push(...newAlerts);

    // WebSocket으로 실시간 알림 전송
    for (const alert of newAlerts) {
      broadcastUpdate('PATTERN_DETECTED', alert);

      // 이메일 알림 발송 (백그라운드에서 실행)
      emailNotificationService.sendPatternAlert(alert).catch(error => {
        console.error('패턴 알림 이메일 발송 실패:', error);
      });
    }

    console.log(`✅ 패턴 감지 완료: ${newAlerts.length}개의 새로운 패턴 발견`);

    return newAlerts;
  }

  // 패턴 히스토리 조회
  getRecentPatterns(limit: number = 50): PatternAlert[] {
    return this.patterns
      .sort((a, b) => b.detectedAt.getTime() - a.detectedAt.getTime())
      .slice(0, limit);
  }

  // 특정 티커의 패턴 조회
  getPatternsByTicker(ticker: string): PatternAlert[] {
    return this.patterns.filter(p => p.ticker.toUpperCase() === ticker.toUpperCase());
  }

  // 패턴 통계
  getPatternStats() {
    const total = this.patterns.length;
    const today = this.patterns.filter(p => {
      const today = new Date();
      return p.detectedAt.toDateString() === today.toDateString();
    }).length;

    const byType = this.patterns.reduce((acc, p) => {
      acc[p.type] = (acc[p.type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const bySignificance = this.patterns.reduce((acc, p) => {
      acc[p.significance] = (acc[p.significance] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return {
      total,
      today,
      byType,
      bySignificance,
      lastCheck: this.lastCheck
    };
  }
}

export const patternDetectionService = new PatternDetectionService();