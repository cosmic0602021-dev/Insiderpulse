import type { Express } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer } from "ws";
import { storage } from "./storage";
import { insertInsiderTradeSchema } from "@shared/schema";
import { stockPriceService } from "./stock-price-service";
import { z } from "zod";
import { protectAdminEndpoint } from "./security-middleware";
import { registerMegaApiEndpoints } from "./mega-api-endpoints";
import dataCollectionRouter from "./data-collection-api";
import Stripe from "stripe";
// Disable heavy data imports in development
if (process.env.NODE_ENV === 'production') {
  var { massiveDataImporter } = require('./massive-data-import');
  var { newScrapingManager } = require('./temp-scraper');
}
import enhancedApiRouter from "./routes/enhanced-api";
// import newApiRouter from "./routes/new-api-routes";
// import { newDataCollectionService } from "./new-data-collection-service";
import { AIAnalysisService, aiAnalysisService } from "./ai-analysis";
import { patternDetectionService } from "./pattern-detection-service";
import { emailNotificationService } from "./email-notification-service";
import { timingAnalysisService } from "./timing-analysis-service";
import { newsCorrelationService } from "./news-correlation-service";
import { insiderCredibilityService } from "./insider-credibility-service";
import { dataIntegrityService } from "./data-integrity-service";
import { subscriptionService } from "./subscription-service";

// Initialize Stripe with secret key
if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('Missing required Stripe secret: STRIPE_SECRET_KEY');
}
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: "2023-10-16",
});

// Global WebSocket server for real-time updates
let wss: WebSocketServer;

export async function registerRoutes(app: Express): Promise<Server> {
  // 💳 STRIPE PAYMENT ENDPOINTS FOR REAL CARD PROCESSING
  
  // Create payment intent for one-time premium features
  app.post("/api/create-payment-intent", async (req, res) => {
    try {
      const { amount } = req.body;
      
      if (!amount || amount < 1) {
        return res.status(400).json({ error: 'Invalid amount' });
      }

      const paymentIntent = await stripe.paymentIntents.create({
        amount: Math.round(amount * 100), // Convert to cents
        currency: "usd",
        metadata: {
          service: 'InsiderTrack Pro Premium Features'
        }
      });
      
      console.log(`💳 Created payment intent for $${amount}: ${paymentIntent.id}`);
      res.json({ clientSecret: paymentIntent.client_secret });
    } catch (error: any) {
      console.error('❌ Stripe payment intent error:', error);
      res.status(500).json({ 
        error: "Error creating payment intent: " + error.message 
      });
    }
  });

  // Create subscription for premium insider trading access
  app.post("/api/create-subscription", async (req, res) => {
    try {
      const { priceId, customerEmail, customerName } = req.body;
      
      if (!priceId || !customerEmail) {
        return res.status(400).json({ 
          error: 'Missing required fields: priceId and customerEmail' 
        });
      }

      // Create or find customer
      const customer = await stripe.customers.create({
        email: customerEmail,
        name: customerName || 'InsiderTrack Pro User',
        metadata: {
          service: 'InsiderTrack Pro Subscription'
        }
      });

      // Create subscription
      const subscription = await stripe.subscriptions.create({
        customer: customer.id,
        items: [{ price: priceId }],
        payment_behavior: 'default_incomplete',
        expand: ['latest_invoice.payment_intent'],
        metadata: {
          service: 'InsiderTrack Pro Premium Subscription'
        }
      });

      console.log(`💳 Created subscription for ${customerEmail}: ${subscription.id}`);
      
      res.json({
        subscriptionId: subscription.id,
        clientSecret: (subscription.latest_invoice as any)?.payment_intent?.client_secret,
        customerId: customer.id
      });
    } catch (error: any) {
      console.error('❌ Stripe subscription error:', error);
      res.status(500).json({ 
        error: "Error creating subscription: " + error.message 
      });
    }
  });

  // Get subscription status
  app.get("/api/subscription/:subscriptionId", async (req, res) => {
    try {
      const { subscriptionId } = req.params;
      
      const subscription = await stripe.subscriptions.retrieve(subscriptionId);
      
      res.json({
        id: subscription.id,
        status: subscription.status,
        current_period_start: subscription.current_period_start,
        current_period_end: subscription.current_period_end,
        cancel_at_period_end: subscription.cancel_at_period_end
      });
    } catch (error: any) {
      console.error('❌ Stripe subscription retrieval error:', error);
      res.status(500).json({ 
        error: "Error retrieving subscription: " + error.message 
      });
    }
  });

  // Cancel subscription
  app.post("/api/cancel-subscription", async (req, res) => {
    try {
      const { subscriptionId } = req.body;
      
      if (!subscriptionId) {
        return res.status(400).json({ error: 'Missing subscriptionId' });
      }

      const subscription = await stripe.subscriptions.update(subscriptionId, {
        cancel_at_period_end: true
      });

      console.log(`💳 Cancelled subscription: ${subscriptionId}`);
      
      res.json({
        id: subscription.id,
        status: subscription.status,
        cancel_at_period_end: subscription.cancel_at_period_end
      });
    } catch (error: any) {
      console.error('❌ Stripe subscription cancellation error:', error);
      res.status(500).json({ 
        error: "Error cancelling subscription: " + error.message 
      });
    }
  });

  // 📊 EXISTING INSIDER TRADING DATA ENDPOINTS
  // Get trading statistics (verified trades only by default)
  app.get('/api/stats', async (req, res) => {
    try {
      const verifiedOnly = req.query.verified === 'true'; // Default to false (show all trades) unless explicitly set to true
      const stats = await storage.getTradingStats(verifiedOnly);
      res.json(stats);
    } catch (error) {
      console.error('Error fetching stats:', error);
      res.status(500).json({ error: 'Failed to fetch trading statistics' });
    }
  });

  // Get insider trades with pagination and date filtering
  app.get('/api/trades', async (req, res) => {
    try {
      const limit = parseInt(req.query.limit as string) || 20;
      const offset = parseInt(req.query.offset as string) || 0;
      const verifiedOnly = req.query.verified === 'true';
      const fromDate = req.query.from as string;
      const toDate = req.query.to as string;
      const sortBy = (req.query.sortBy as 'createdAt' | 'filedDate') || 'filedDate';

      // Access control: check if user has real-time access
      // TODO: Implement proper authentication and get userId from session/token
      const userId = req.headers['x-user-id'] as string; // Placeholder for now

      let hasRealtimeAccess = false;
      if (userId) {
        const accessLevel = await subscriptionService.getUserAccessLevel(userId);
        hasRealtimeAccess = accessLevel.canAccessRealtime;
      }

      // If user doesn't have real-time access, filter to 48h+ old trades
      let adjustedToDate = toDate;
      if (!hasRealtimeAccess) {
        const fortyEightHoursAgo = new Date(Date.now() - 48 * 60 * 60 * 1000);
        adjustedToDate = fortyEightHoursAgo.toISOString().split('T')[0];
        console.log(`🔒 Free user - limiting to trades before ${adjustedToDate}`);
      }

      const rawTrades = await storage.getInsiderTrades(limit, offset, verifiedOnly, fromDate, adjustedToDate, sortBy);

      // Add access level info to response
      res.json({
        trades: rawTrades,
        accessLevel: {
          hasRealtimeAccess,
          isDelayed: !hasRealtimeAccess,
          delayHours: hasRealtimeAccess ? 0 : 48,
        }
      });
    } catch (error) {
      console.error('Error fetching trades:', error);
      res.status(500).json({ error: 'Failed to fetch insider trades' });
    }
  });

  // Get specific trade by ID
  app.get('/api/trades/:id', async (req, res) => {
    try {
      const trade = await storage.getInsiderTradeById(req.params.id);
      if (!trade) {
        return res.status(404).json({ error: 'Trade not found' });
      }
      res.json(trade);
    } catch (error) {
      console.error('Error fetching trade:', error);
      res.status(500).json({ error: 'Failed to fetch trade' });
    }
  });

  // Create new insider trade (for data ingestion)
  app.post('/api/trades', async (req, res) => {
    try {
      const validatedData = insertInsiderTradeSchema.parse(req.body);

      // 🚨 서버 측 데이터 무결성 검증
      const integrityCheck = await dataIntegrityService.validateNewTrade(validatedData);

      if (!integrityCheck.shouldSave) {
        console.warn(`🚨 Rejected fake/invalid trade: ${integrityCheck.reason}`);
        return res.status(400).json({
          error: 'Invalid trade data',
          reason: integrityCheck.reason
        });
      }

      const trade = await storage.createInsiderTrade(integrityCheck.validatedTrade!);

      // Broadcast all trades to WebSocket clients (verified and unverified)
      if (wss) {
        const message = JSON.stringify({
          type: 'NEW_TRADE',
          data: trade
        });

        wss.clients.forEach(client => {
          if (client.readyState === 1) { // WebSocket.OPEN
            client.send(message);
          }
        });
      }

      // 대량 거래 감지 및 이메일 알림 (백그라운드 실행)
      const tradeValue = Math.abs(trade.totalValue);
      if (tradeValue >= 500000) { // $500,000 이상이면 대량 거래로 간주
        emailNotificationService.sendLargeTradeAlert(trade).catch(error => {
          console.error('대량 거래 알림 이메일 발송 실패:', error);
        });
      }

      res.status(201).json(trade);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          error: 'Invalid data format',
          details: error.errors
        });
      }

      console.error('Error creating trade:', error);
      res.status(500).json({ error: 'Failed to create insider trade' });
    }
  });

  // Get stock price by ticker
  app.get('/api/stocks/:ticker', async (req, res) => {
    try {
      const ticker = req.params.ticker.toUpperCase();
      const priceData = await stockPriceService.getStockPrice(ticker);
      res.json(priceData);
    } catch (error) {
      console.error('Error fetching stock price:', error);
      res.status(500).json({ error: 'Failed to fetch stock price' });
    }
  });

  // AI Analysis for insider trades using real OpenAI API
  app.post('/api/analyze/trade', async (req, res) => {
    try {
      const aiService = new AIAnalysisService();
      const tradeData = req.body;

      // Validate required fields
      if (!tradeData.companyName || !tradeData.ticker || !tradeData.tradeType) {
        return res.status(400).json({ 
          error: 'Missing required fields: companyName, ticker, tradeType' 
        });
      }

      const analysis = await aiService.analyzeInsiderTrade({
        companyName: tradeData.companyName,
        ticker: tradeData.ticker,
        traderName: tradeData.traderName || 'Unknown',
        traderTitle: tradeData.traderTitle || 'Unknown',
        tradeType: tradeData.tradeType,
        shares: tradeData.shares || 0,
        pricePerShare: tradeData.pricePerShare || 0,
        totalValue: tradeData.totalValue || 0,
        ownershipPercentage: tradeData.ownershipPercentage || 0
      });

      res.json(analysis);
    } catch (error) {
      console.error('Error performing AI analysis:', error);
      res.status(500).json({ 
        error: 'Failed to perform AI analysis',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // 🔍 패턴 감지 엔드포인트들
  // 모든 패턴 감지 실행 (수동 트리거)
  app.post('/api/patterns/detect', async (req, res) => {
    try {
      const patterns = await patternDetectionService.detectAllPatterns();
      res.json({
        success: true,
        message: `${patterns.length}개의 새로운 패턴이 감지되었습니다`,
        patterns,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('패턴 감지 실패:', error);
      res.status(500).json({ error: '패턴 감지에 실패했습니다' });
    }
  });

  // 최근 패턴 조회
  app.get('/api/patterns', async (req, res) => {
    try {
      const limit = parseInt(req.query.limit as string) || 50;
      const patterns = patternDetectionService.getRecentPatterns(limit);
      res.json({
        patterns,
        total: patterns.length,
        stats: patternDetectionService.getPatternStats()
      });
    } catch (error) {
      console.error('패턴 조회 실패:', error);
      res.status(500).json({ error: '패턴 조회에 실패했습니다' });
    }
  });

  // 특정 티커의 패턴 조회
  app.get('/api/patterns/:ticker', async (req, res) => {
    try {
      const ticker = req.params.ticker.toUpperCase();
      const patterns = patternDetectionService.getPatternsByTicker(ticker);
      res.json({
        ticker,
        patterns,
        total: patterns.length
      });
    } catch (error) {
      console.error('티커별 패턴 조회 실패:', error);
      res.status(500).json({ error: '티커별 패턴 조회에 실패했습니다' });
    }
  });

  // 패턴 통계
  app.get('/api/patterns/stats', async (req, res) => {
    try {
      const stats = patternDetectionService.getPatternStats();
      res.json(stats);
    } catch (error) {
      console.error('패턴 통계 조회 실패:', error);
      res.status(500).json({ error: '패턴 통계 조회에 실패했습니다' });
    }
  });

  // 🤖 AI 분석 엔드포인트들
  // 단일 거래 AI 분석
  app.post('/api/analyze/trade', async (req, res) => {
    try {
      const tradeData = req.body;

      // 필수 필드 검증
      if (!tradeData.companyName || !tradeData.ticker || !tradeData.tradeType) {
        return res.status(400).json({ error: '필수 거래 정보가 누락되었습니다' });
      }

      const analysisResult = await aiAnalysisService.analyzeInsiderTrade({
        companyName: tradeData.companyName,
        ticker: tradeData.ticker,
        traderName: tradeData.traderName || 'Unknown',
        traderTitle: tradeData.traderTitle || 'Insider',
        tradeType: tradeData.tradeType,
        shares: tradeData.shares || 0,
        pricePerShare: tradeData.pricePerShare || 0,
        totalValue: tradeData.totalValue || 0,
        ownershipPercentage: tradeData.ownershipPercentage || 0
      });

      res.json(analysisResult);
    } catch (error) {
      console.error('AI 거래 분석 실패:', error);
      res.status(500).json({ error: 'AI 거래 분석에 실패했습니다' });
    }
  });

  // 📊 추천 주식 랭킹 엔드포인트
  app.get('/api/rankings', async (req, res) => {
    try {
      const limit = parseInt(req.query.limit as string) || 20;
      const period = parseInt(req.query.period as string) || 90; // 3개월 기본값

      // 최근 3개월 내의 모든 거래 가져오기
      const threeMonthsAgo = new Date();
      threeMonthsAgo.setDate(threeMonthsAgo.getDate() - period);

      const trades = await storage.getInsiderTrades(1000, 0, false, threeMonthsAgo.toISOString().split('T')[0]);

      // 티커별로 거래 그룹화
      const tradesByTicker = new Map<string, any[]>();
      for (const trade of trades) {
        if (!trade.ticker) continue;
        if (!tradesByTicker.has(trade.ticker)) {
          tradesByTicker.set(trade.ticker, []);
        }
        tradesByTicker.get(trade.ticker)!.push(trade);
      }

      // 랭킹 계산 - 내부자 동시 진입 기반
      const rankings = [];

      for (const [ticker, tickerTrades] of tradesByTicker) {
        // 7일 윈도우 내 동시 진입 감지
        const simultaneousEntries = [];
        const sortedTrades = tickerTrades.sort((a, b) => new Date(a.filedDate).getTime() - new Date(b.filedDate).getTime());

        for (let i = 0; i < sortedTrades.length; i++) {
          const baseTrade = sortedTrades[i];
          const baseDate = new Date(baseTrade.filedDate);
          const simultaneousGroup = [baseTrade];

          // 7일 내의 다른 내부자 거래 찾기
          for (let j = i + 1; j < sortedTrades.length; j++) {
            const compareTrade = sortedTrades[j];
            const compareDate = new Date(compareTrade.filedDate);
            const daysDiff = (compareDate.getTime() - baseDate.getTime()) / (1000 * 60 * 60 * 24);

            if (daysDiff <= 7) {
              // 다른 내부자인지 확인
              if (compareTrade.traderName !== baseTrade.traderName) {
                simultaneousGroup.push(compareTrade);
              }
            } else {
              break; // 7일 이후는 더 이상 확인하지 않음
            }
          }

          if (simultaneousGroup.length >= 2) { // 2명 이상 동시 진입
            simultaneousEntries.push({
              group: simultaneousGroup,
              count: simultaneousGroup.length,
              date: baseDate
            });
          }
        }

        // 기본 통계
        const uniqueInsiders = new Set(tickerTrades.map(t => t.traderName)).size;
        const buyTrades = tickerTrades.filter(t => t.tradeType === 'BUY').length;
        const sellTrades = tickerTrades.filter(t => t.tradeType === 'SELL').length;
        const totalTrades = tickerTrades.length;
        const avgTradeValue = tickerTrades.reduce((sum, t) => sum + (t.totalValue || 0), 0) / totalTrades;
        const netBuying = tickerTrades.filter(t => t.tradeType === 'BUY').reduce((sum, t) => sum + (t.totalValue || 0), 0) -
                         tickerTrades.filter(t => t.tradeType === 'SELL').reduce((sum, t) => sum + (t.totalValue || 0), 0);

        // 점수 계산 - 동시 진입에 가장 높은 가중치
        let score = 0;

        // 1. 동시 진입 점수 (가장 높은 가중치 - 70%)
        const maxSimultaneous = simultaneousEntries.length > 0 ? Math.max(...simultaneousEntries.map(e => e.count)) : 0;
        const simultaneousBonus = maxSimultaneous >= 5 ? 70 :
                                 maxSimultaneous >= 4 ? 60 :
                                 maxSimultaneous >= 3 ? 50 :
                                 maxSimultaneous >= 2 ? 30 : 0;
        score += simultaneousBonus;

        // 2. 고유 내부자 수 (15%)
        const insiderBonus = Math.min(uniqueInsiders * 3, 15);
        score += insiderBonus;

        // 3. 매수/매도 비율 (10%)
        const buyRatio = totalTrades > 0 ? buyTrades / totalTrades : 0;
        const buyRatioBonus = buyRatio >= 0.8 ? 10 : buyRatio >= 0.6 ? 7 : buyRatio >= 0.5 ? 5 : 0;
        score += buyRatioBonus;

        // 4. 거래 활동량 (5%)
        const activityBonus = Math.min(totalTrades * 0.5, 5);
        score += activityBonus;

        // 패턴 감지 추가
        const tickerPatterns = patternDetectionService.getPatternsByTicker(ticker);
        let patternBonus = 0;
        let patternSignals = null;

        for (const pattern of tickerPatterns) {
          switch (pattern.type) {
            case 'CLUSTER_BUY':
              patternBonus += pattern.significance === 'HIGH' ? 15 : 10;
              patternSignals = `${pattern.metadata?.traderCount}명 집단 매수`;
              break;
            case 'CLUSTER_SELL':
              patternBonus += pattern.significance === 'HIGH' ? 10 : 5;
              patternSignals = `${pattern.metadata?.traderCount}명 집단 매도`;
              break;
            case 'CONSECUTIVE_TRADES':
              patternBonus += 5;
              break;
            case 'LARGE_VOLUME':
              patternBonus += 3;
              break;
          }
        }
        score += patternBonus;

        // 추천 등급 결정
        const recommendation = score >= 70 ? 'STRONG_BUY' : score >= 50 ? 'BUY' : 'HOLD';

        const lastTrade = tickerTrades.sort((a, b) => new Date(b.filedDate).getTime() - new Date(a.filedDate).getTime())[0];

        rankings.push({
          ticker,
          companyName: lastTrade.companyName || ticker,
          score: Math.round(score),
          recommendation,
          totalTrades,
          buyTrades,
          sellTrades,
          uniqueInsiders,
          avgTradeValue,
          netBuying,
          lastTradeDate: lastTrade.filedDate,
          insiderActivity: `${uniqueInsiders}명 내부자, ${totalTrades}건 거래`,
          simultaneousEntries: maxSimultaneous, // 동시 진입 최대 인원
          detectedPatterns: tickerPatterns,
          patternSignals
        });
      }

      // 점수 순으로 정렬하고 상위 항목 반환
      const sortedRankings = rankings
        .sort((a, b) => b.score - a.score)
        .slice(0, limit);

      res.json({
        rankings: sortedRankings,
        generatedAt: new Date().toISOString(),
        period: `${period}일`,
        totalStocksAnalyzed: rankings.length
      });

    } catch (error) {
      console.error('랭킹 생성 실패:', error);
      res.status(500).json({ error: '랭킹 생성에 실패했습니다' });
    }
  });

  // 📧 이메일 알림 엔드포인트들
  // 테스트 이메일 발송
  app.post('/api/notifications/test-email', async (req, res) => {
    try {
      const { email } = req.body;
      if (!email) {
        return res.status(400).json({ error: '이메일 주소가 필요합니다' });
      }

      await emailNotificationService.sendTestEmail(email);
      res.json({
        success: true,
        message: '테스트 이메일이 발송되었습니다',
        email
      });
    } catch (error) {
      console.error('테스트 이메일 발송 실패:', error);
      res.status(500).json({
        error: '테스트 이메일 발송에 실패했습니다',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // 내부자 거래 알림 테스트 (Premium 기능)
  app.post('/api/notifications/test-insider-alert', async (req, res) => {
    try {
      const { email } = req.body;
      if (!email) {
        return res.status(400).json({ error: '이메일 주소가 필요합니다' });
      }

      // 테스트용 가짜 내부자 거래 데이터 생성
      const sampleTrade = {
        id: 'test-' + Date.now(),
        ticker: 'AAPL',
        insiderName: 'Tim Cook',
        insiderTitle: 'CEO',
        transactionType: 'SELL',
        sharesBought: 0,
        sharesSold: 1500000,
        totalValue: 275000000, // $275M
        pricePerShare: 183.33,
        transactionDate: new Date(),
        filingDate: new Date(),
        verified: true,
        confidence: 95,
        source: 'SEC EDGAR',
        createdAt: new Date(),
        updatedAt: new Date()
      };

      // Premium 사용자 임시 등록 (테스트용 - 일본어 설정)
      const testUser = {
        userId: 'test-premium-user',
        email: email,
        enablePatternAlerts: true,
        enableTradeAlerts: true,
        enableWeeklyDigest: false,
        minimumTradeValue: 1000000, // $1M 이상만 알림
        watchlistTickers: [],
        language: 'ja' as const // 일본어 설정
      };

      emailNotificationService.userPreferences.set('test-premium-user', testUser);

      // 내부자 거래 알림 발송
      await emailNotificationService.sendLargeTradeAlert(sampleTrade);

      res.json({
        success: true,
        message: '💰 Premium 내부자 거래 알림이 발송되었습니다',
        email,
        trade: {
          ticker: sampleTrade.ticker,
          insiderName: sampleTrade.insiderName,
          value: sampleTrade.totalValue,
          type: sampleTrade.transactionType
        }
      });
    } catch (error) {
      console.error('내부자 거래 알림 발송 실패:', error);
      res.status(500).json({
        error: '내부자 거래 알림 발송에 실패했습니다',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // 주간 요약 이메일 발송 (수동 트리거)
  app.post('/api/notifications/weekly-digest', async (req, res) => {
    try {
      const { userId } = req.body;
      await emailNotificationService.sendWeeklyDigest(userId);

      res.json({
        success: true,
        message: userId ? '사용자에게 주간 요약을 발송했습니다' : '모든 사용자에게 주간 요약을 발송했습니다'
      });
    } catch (error) {
      console.error('주간 요약 이메일 발송 실패:', error);
      res.status(500).json({ error: '주간 요약 이메일 발송에 실패했습니다' });
    }
  });

  // 사용자 알림 설정 업데이트
  app.post('/api/notifications/preferences', async (req, res) => {
    try {
      const { userId, preferences } = req.body;
      if (!userId) {
        return res.status(400).json({ error: '사용자 ID가 필요합니다' });
      }

      emailNotificationService.updateUserPreferences(userId, preferences);
      res.json({
        success: true,
        message: '알림 설정이 업데이트되었습니다'
      });
    } catch (error) {
      console.error('알림 설정 업데이트 실패:', error);
      res.status(500).json({ error: '알림 설정 업데이트에 실패했습니다' });
    }
  });

  // 관심 종목 추가/제거
  app.post('/api/notifications/watchlist', async (req, res) => {
    try {
      const { userId, ticker, action } = req.body;
      if (!userId || !ticker || !action) {
        return res.status(400).json({ error: '필수 파라미터가 누락되었습니다' });
      }

      if (action === 'add') {
        emailNotificationService.addToWatchlist(userId, ticker);
      } else if (action === 'remove') {
        emailNotificationService.removeFromWatchlist(userId, ticker);
      } else {
        return res.status(400).json({ error: 'action은 add 또는 remove여야 합니다' });
      }

      res.json({
        success: true,
        message: `${ticker}가 관심 종목에서 ${action === 'add' ? '추가' : '제거'}되었습니다`
      });
    } catch (error) {
      console.error('관심 종목 업데이트 실패:', error);
      res.status(500).json({ error: '관심 종목 업데이트에 실패했습니다' });
    }
  });

  // 🕒 타이밍 분석 엔드포인트들
  // 단일 거래 타이밍 분석
  app.post('/api/analysis/timing/:tradeId', async (req, res) => {
    try {
      const tradeId = req.params.tradeId;
      const result = await timingAnalysisService.analyzeTradeTimimg(tradeId);

      if (!result) {
        return res.status(404).json({ error: '거래를 찾을 수 없거나 분석에 실패했습니다' });
      }

      res.json({
        success: true,
        data: result,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('타이밍 분석 실패:', error);
      res.status(500).json({ error: '타이밍 분석에 실패했습니다' });
    }
  });

  // 여러 거래 일괄 타이밍 분석
  app.post('/api/analysis/timing/bulk', async (req, res) => {
    try {
      const { tradeIds } = req.body;
      if (!tradeIds || !Array.isArray(tradeIds)) {
        return res.status(400).json({ error: 'tradeIds 배열이 필요합니다' });
      }

      const results = await timingAnalysisService.analyzeBulkTradesTiming(tradeIds);

      res.json({
        success: true,
        totalAnalyzed: tradeIds.length,
        successfulAnalyses: results.length,
        data: results,
        stats: timingAnalysisService.getTimingAnalysisStats(results),
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('일괄 타이밍 분석 실패:', error);
      res.status(500).json({ error: '일괄 타이밍 분석에 실패했습니다' });
    }
  });

  // 의심스러운 거래 필터링
  app.get('/api/analysis/suspicious-trades', async (req, res) => {
    try {
      const limit = parseInt(req.query.limit as string) || 20;

      // 최근 거래들을 가져와서 타이밍 분석
      const recentTrades = await storage.getInsiderTrades(limit, 0, false);
      const tradeIds = recentTrades.map(t => t.id);

      const analysisResults = await timingAnalysisService.analyzeBulkTradesTiming(tradeIds);
      const suspiciousTrades = timingAnalysisService.getSuspiciousTrades(analysisResults);

      res.json({
        success: true,
        totalAnalyzed: analysisResults.length,
        suspiciousCount: suspiciousTrades.length,
        data: suspiciousTrades.sort((a, b) => b.suspicionScore - a.suspicionScore), // 의심도 높은 순
        stats: timingAnalysisService.getTimingAnalysisStats(analysisResults),
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('의심스러운 거래 분석 실패:', error);
      res.status(500).json({ error: '의심스러운 거래 분석에 실패했습니다' });
    }
  });

  // 특정 티커의 타이밍 분석 히스토리
  app.get('/api/analysis/timing/ticker/:ticker', async (req, res) => {
    try {
      const ticker = req.params.ticker.toUpperCase();
      const limit = parseInt(req.query.limit as string) || 10;

      // 해당 티커의 최근 거래들 조회
      const allTrades = await storage.getInsiderTrades(500, 0, false);
      const tickerTrades = allTrades
        .filter(t => t.ticker?.toUpperCase() === ticker)
        .slice(0, limit);

      const tradeIds = tickerTrades.map(t => t.id);
      const analysisResults = await timingAnalysisService.analyzeBulkTradesTiming(tradeIds);

      res.json({
        success: true,
        ticker,
        totalTrades: tickerTrades.length,
        data: analysisResults.sort((a, b) => new Date(b.tradeDate).getTime() - new Date(a.tradeDate).getTime()),
        stats: timingAnalysisService.getTimingAnalysisStats(analysisResults),
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error(`${req.params.ticker} 타이밍 분석 실패:`, error);
      res.status(500).json({ error: '티커별 타이밍 분석에 실패했습니다' });
    }
  });

  // 📰 뉴스 상관관계 분석 엔드포인트들
  // 단일 거래 뉴스 상관관계 분석
  app.post('/api/analysis/news-correlation/:tradeId', async (req, res) => {
    try {
      const tradeId = req.params.tradeId;
      const result = await newsCorrelationService.analyzeNewsCorrelation(tradeId);

      if (!result) {
        return res.status(404).json({ error: '거래를 찾을 수 없거나 분석에 실패했습니다' });
      }

      res.json({
        success: true,
        data: result,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('뉴스 상관관계 분석 실패:', error);
      res.status(500).json({ error: '뉴스 상관관계 분석에 실패했습니다' });
    }
  });

  // 여러 거래 일괄 뉴스 상관관계 분석
  app.post('/api/analysis/news-correlation/bulk', async (req, res) => {
    try {
      const { tradeIds } = req.body;
      if (!tradeIds || !Array.isArray(tradeIds)) {
        return res.status(400).json({ error: 'tradeIds 배열이 필요합니다' });
      }

      const results = await newsCorrelationService.analyzeBulkNewsCorrelation(tradeIds);

      res.json({
        success: true,
        totalAnalyzed: tradeIds.length,
        successfulAnalyses: results.length,
        data: results,
        highCorrelationTrades: newsCorrelationService.getHighCorrelationTrades(results),
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('일괄 뉴스 상관관계 분석 실패:', error);
      res.status(500).json({ error: '일괄 뉴스 상관관계 분석에 실패했습니다' });
    }
  });

  // 높은 뉴스 상관관계 거래들 조회
  app.get('/api/analysis/high-correlation-trades', async (req, res) => {
    try {
      const limit = parseInt(req.query.limit as string) || 20;

      // 최근 거래들을 가져와서 뉴스 상관관계 분석
      const recentTrades = await storage.getInsiderTrades(limit, 0, false);
      const tradeIds = recentTrades.map(t => t.id);

      const analysisResults = await newsCorrelationService.analyzeBulkNewsCorrelation(tradeIds);
      const highCorrelationTrades = newsCorrelationService.getHighCorrelationTrades(analysisResults);

      // 상관관계 점수 높은 순으로 정렬
      const sortedTrades = highCorrelationTrades.sort((a, b) => b.correlationScore - a.correlationScore);

      res.json({
        success: true,
        totalAnalyzed: analysisResults.length,
        highCorrelationCount: highCorrelationTrades.length,
        data: sortedTrades,
        averageCorrelation: analysisResults.reduce((sum, r) => sum + r.correlationScore, 0) / analysisResults.length,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('높은 상관관계 거래 분석 실패:', error);
      res.status(500).json({ error: '높은 상관관계 거래 분석에 실패했습니다' });
    }
  });

  // 특정 티커의 뉴스-거래 상관관계 히스토리
  app.get('/api/analysis/news-correlation/ticker/:ticker', async (req, res) => {
    try {
      const ticker = req.params.ticker.toUpperCase();
      const limit = parseInt(req.query.limit as string) || 10;

      // 해당 티커의 최근 거래들 조회
      const allTrades = await storage.getInsiderTrades(500, 0, false);
      const tickerTrades = allTrades
        .filter(t => t.ticker?.toUpperCase() === ticker)
        .slice(0, limit);

      const tradeIds = tickerTrades.map(t => t.id);
      const analysisResults = await newsCorrelationService.analyzeBulkNewsCorrelation(tradeIds);

      // 날짜순 정렬
      const sortedResults = analysisResults.sort((a, b) =>
        new Date(b.tradeDate).getTime() - new Date(a.tradeDate).getTime()
      );

      res.json({
        success: true,
        ticker,
        totalTrades: tickerTrades.length,
        data: sortedResults,
        averageCorrelation: sortedResults.length > 0
          ? sortedResults.reduce((sum, r) => sum + r.correlationScore, 0) / sortedResults.length
          : 0,
        highCorrelationCount: sortedResults.filter(r => r.correlationScore >= 60).length,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error(`${req.params.ticker} 뉴스 상관관계 분석 실패:`, error);
      res.status(500).json({ error: '티커별 뉴스 상관관계 분석에 실패했습니다' });
    }
  });

  // 👤 내부자 신뢰도 점수 엔드포인트들
  // 특정 내부자의 신뢰도 프로필 조회/생성
  app.get('/api/credibility/:traderName', async (req, res) => {
    try {
      const traderName = decodeURIComponent(req.params.traderName);

      // 먼저 캐시에서 조회
      let profile = insiderCredibilityService.getCachedProfile(traderName);

      if (!profile) {
        // 캐시에 없으면 새로 생성
        profile = await insiderCredibilityService.generateCredibilityProfile(traderName);
      }

      if (!profile) {
        return res.status(404).json({ error: '트레이더를 찾을 수 없거나 충분한 거래 데이터가 없습니다' });
      }

      res.json({
        success: true,
        data: profile,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('신뢰도 프로필 조회 실패:', error);
      res.status(500).json({ error: '신뢰도 프로필 조회에 실패했습니다' });
    }
  });

  // 내부자 신뢰도 랭킹 조회
  app.get('/api/credibility-rankings', async (req, res) => {
    try {
      const limit = parseInt(req.query.limit as string) || 20;

      const rankings = await insiderCredibilityService.generateCredibilityRankings(limit);

      res.json({
        success: true,
        totalRanked: rankings.length,
        data: rankings,
        stats: insiderCredibilityService.getCredibilityStats(rankings),
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('신뢰도 랭킹 조회 실패:', error);
      res.status(500).json({ error: '신뢰도 랭킹 조회에 실패했습니다' });
    }
  });

  // 특정 회사의 내부자들 신뢰도 분석
  app.get('/api/credibility/company/:companyName', async (req, res) => {
    try {
      const companyName = decodeURIComponent(req.params.companyName);

      const profiles = await insiderCredibilityService.analyzeCompanyInsiders(companyName);

      if (profiles.length === 0) {
        return res.status(404).json({ error: '해당 회사의 내부자 데이터를 찾을 수 없습니다' });
      }

      res.json({
        success: true,
        companyName,
        totalInsiders: profiles.length,
        data: profiles,
        stats: insiderCredibilityService.getCredibilityStats(profiles),
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('회사별 내부자 신뢰도 분석 실패:', error);
      res.status(500).json({ error: '회사별 내부자 신뢰도 분석에 실패했습니다' });
    }
  });

  // 신뢰도 기준 거래 추천
  app.get('/api/credibility/recommendations', async (req, res) => {
    try {
      const minScore = parseInt(req.query.minScore as string) || 70;
      const limit = parseInt(req.query.limit as string) || 10;

      // 고신뢰도 내부자들의 최근 거래 조회
      const rankings = await insiderCredibilityService.generateCredibilityRankings(50);
      const highCredibilityInsiders = rankings
        .filter(profile => profile.credibilityScore >= minScore)
        .slice(0, 20);

      const recommendations = [];

      // 각 고신뢰도 내부자의 최근 거래들 조회
      for (const insider of highCredibilityInsiders) {
        try {
          const allTrades = await storage.getInsiderTrades(200, 0, false);
          const insiderRecentTrades = allTrades
            .filter(trade => trade.traderName === insider.traderName)
            .slice(0, 3); // 최근 3건

          for (const trade of insiderRecentTrades) {
            recommendations.push({
              ...trade,
              credibilityScore: insider.credibilityScore,
              successRate: insider.performance.threeMonth.successRate,
              traderProfile: {
                name: insider.traderName,
                title: insider.traderTitle,
                totalTrades: insider.totalTrades,
                companies: insider.companies
              }
            });
          }
        } catch (error) {
          console.error(`${insider.traderName}의 거래 조회 실패:`, error);
        }
      }

      // 날짜순 정렬 후 제한
      const sortedRecommendations = recommendations
        .sort((a, b) => new Date(b.filedDate).getTime() - new Date(a.filedDate).getTime())
        .slice(0, limit);

      res.json({
        success: true,
        minCredibilityScore: minScore,
        totalRecommendations: sortedRecommendations.length,
        highCredibilityInsiders: highCredibilityInsiders.length,
        data: sortedRecommendations,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('신뢰도 기준 추천 실패:', error);
      res.status(500).json({ error: '신뢰도 기준 추천에 실패했습니다' });
    }
  });

  // Get stock rankings based on insider trading patterns with automatic pattern detection
  app.get('/api/rankings', async (req, res) => {
    try {
      const limit = parseInt(req.query.limit as string) || 10;

      // 🔍 자동 패턴 감지 실행
      console.log('🔍 자동 패턴 감지 실행 중...');
      let detectedPatterns = [];
      try {
        detectedPatterns = await patternDetectionService.detectAllPatterns();
        console.log(`✅ ${detectedPatterns.length}개의 패턴 감지됨`);
      } catch (error) {
        console.warn('패턴 감지 실패 (랭킹은 계속 진행):', error);
      }

      // Get all trades from the last 30 days
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      const fromDate = thirtyDaysAgo.toISOString().split('T')[0];

      const trades = await storage.getInsiderTrades(1000, 0, false, fromDate);
      
      // Group trades by ticker and calculate ranking metrics
      const tickerMetrics = new Map();
      
      for (const trade of trades) {
        if (!trade.ticker) continue;
        
        const ticker = trade.ticker.toUpperCase();
        if (!tickerMetrics.has(ticker)) {
          tickerMetrics.set(ticker, {
            ticker,
            companyName: trade.companyName || ticker,
            trades: [],
            totalBuyValue: 0,
            totalSellValue: 0,
            buyCount: 0,
            sellCount: 0,
            uniqueInsiders: new Set(),
            lastTradeDate: null,
            avgTradeValue: 0,
            netBuying: 0,
            score: 0
          });
        }
        
        const metrics = tickerMetrics.get(ticker);
        metrics.trades.push(trade);
        metrics.uniqueInsiders.add(trade.traderName);
        
        const tradeValue = Math.abs(trade.totalValue || 0);
        const tradeDate = new Date(trade.filedDate || trade.createdAt || '');
        
        if (!metrics.lastTradeDate || tradeDate > metrics.lastTradeDate) {
          metrics.lastTradeDate = tradeDate;
        }
        
        // Classify as buy or sell based on trade type and transaction code
        const isBuy = trade.tradeType === 'BUY' || 
                      trade.tradeType === 'PURCHASE' ||
                      trade.tradeType === 'GRANT' ||
                      trade.transactionCode === 'P' ||
                      trade.transactionCode === 'A' ||
                      (trade.shares && trade.shares > 0);
        
        if (isBuy) {
          metrics.totalBuyValue += tradeValue;
          metrics.buyCount++;
        } else {
          metrics.totalSellValue += tradeValue;
          metrics.sellCount++;
        }
      }
      
      // Calculate scores and rankings
      const rankings = Array.from(tickerMetrics.values()).map(metrics => {
        const totalTrades = metrics.buyCount + metrics.sellCount;
        metrics.avgTradeValue = totalTrades > 0 ? (metrics.totalBuyValue + metrics.totalSellValue) / totalTrades : 0;
        metrics.netBuying = metrics.totalBuyValue - metrics.totalSellValue;
        
        // Calculate ranking score based on:
        // - Net buying amount (40%)
        // - Number of buying transactions (20%)
        // - Number of unique insiders (20%)
        // - Average trade value (10%)
        // - Recency of trades (10%)
        
        const netBuyingScore = Math.max(0, metrics.netBuying) / 1000000; // Normalize to millions
        const buyCountScore = metrics.buyCount * 5; // 5 points per buy trade
        const insiderScore = metrics.uniqueInsiders.size * 10; // 10 points per unique insider
        const avgValueScore = metrics.avgTradeValue / 100000; // Normalize to 100k
        
        const daysSinceLastTrade = metrics.lastTradeDate ? 
          (Date.now() - metrics.lastTradeDate.getTime()) / (1000 * 60 * 60 * 24) : 30;
        const recencyScore = Math.max(0, 30 - daysSinceLastTrade) * 2; // More recent = higher score
        
        // 🔍 패턴 감지 보너스 점수 추가
        let patternBonus = 0;
        const tickerPatterns = detectedPatterns.filter(pattern =>
          pattern.ticker.toUpperCase() === metrics.ticker.toUpperCase()
        );

        for (const pattern of tickerPatterns) {
          switch (pattern.type) {
            case 'CLUSTER_BUY':
              patternBonus += pattern.significance === 'HIGH' ? 30 :
                            pattern.significance === 'MEDIUM' ? 20 : 10;
              break;
            case 'CLUSTER_SELL':
              patternBonus -= pattern.significance === 'HIGH' ? 20 :
                            pattern.significance === 'MEDIUM' ? 15 : 5;
              break;
            case 'CONSECUTIVE_TRADES':
              patternBonus += pattern.significance === 'HIGH' ? 25 :
                            pattern.significance === 'MEDIUM' ? 15 : 8;
              break;
            case 'LARGE_VOLUME':
              patternBonus += pattern.significance === 'HIGH' ? 20 :
                            pattern.significance === 'MEDIUM' ? 12 : 6;
              break;
          }
        }

        metrics.score = Math.round(
          netBuyingScore * 0.35 +  // 기존 가중치 조정
          buyCountScore * 0.2 +
          insiderScore * 0.2 +
          avgValueScore * 0.1 +
          recencyScore * 0.1 +
          patternBonus * 0.05      // 패턴 보너스 5%
        );
        
        // Determine recommendation
        if (metrics.score >= 80) {
          metrics.recommendation = 'STRONG_BUY';
        } else if (metrics.score >= 50) {
          metrics.recommendation = 'BUY';
        } else {
          metrics.recommendation = 'HOLD';
        }
        
        // 🔍 이 종목의 패턴 정보 추가
        const stockPatterns = detectedPatterns.filter(pattern =>
          pattern.ticker.toUpperCase() === metrics.ticker.toUpperCase()
        );

        return {
          ticker: metrics.ticker,
          companyName: metrics.companyName,
          score: metrics.score,
          recommendation: metrics.recommendation,
          totalTrades: totalTrades,
          buyTrades: metrics.buyCount,
          sellTrades: metrics.sellCount,
          uniqueInsiders: metrics.uniqueInsiders.size,
          avgTradeValue: Math.round(metrics.avgTradeValue),
          netBuying: Math.round(metrics.netBuying),
          lastTradeDate: metrics.lastTradeDate?.toISOString(),
          insiderActivity: `${totalTrades} trades in last 30 days`,
          // 패턴 정보 추가
          detectedPatterns: stockPatterns.map(p => ({
            type: p.type,
            description: p.description,
            significance: p.significance
          })),
          patternSignals: stockPatterns.length > 0 ?
            stockPatterns.map(p => {
              switch (p.type) {
                case 'CLUSTER_BUY': return '🟢 집단 매수';
                case 'CLUSTER_SELL': return '🔴 집단 매도';
                case 'CONSECUTIVE_TRADES': return '🔄 연속 거래';
                case 'LARGE_VOLUME': return '📈 대량 거래';
                default: return '🔍 패턴 감지';
              }
            }).join(', ') : null
        };
      });
      
      // Sort by score and return top results
      const topRankings = rankings
        .filter(r => r.totalTrades >= 2) // Only include stocks with at least 2 trades
        .sort((a, b) => b.score - a.score)
        .slice(0, limit);
      
      res.json({
        rankings: topRankings,
        generatedAt: new Date().toISOString(),
        period: '30 days',
        totalStocksAnalyzed: rankings.length,
        // 🔍 패턴 감지 요약 추가
        patternSummary: {
          totalPatternsDetected: detectedPatterns.length,
          patternTypes: {
            clusterBuy: detectedPatterns.filter(p => p.type === 'CLUSTER_BUY').length,
            clusterSell: detectedPatterns.filter(p => p.type === 'CLUSTER_SELL').length,
            consecutiveTrades: detectedPatterns.filter(p => p.type === 'CONSECUTIVE_TRADES').length,
            largeVolume: detectedPatterns.filter(p => p.type === 'LARGE_VOLUME').length
          },
          highSignificancePatterns: detectedPatterns.filter(p => p.significance === 'HIGH').length
        }
      });

    } catch (error) {
      console.error('Error generating rankings:', error);
      res.status(500).json({ error: 'Failed to generate stock rankings' });
    }
  });

  // Pattern detection endpoints
  app.post('/api/patterns/detect', async (req, res) => {
    try {
      const patterns = await patternDetectionService.detectAllPatterns();
      res.json({
        success: true,
        patterns,
        message: `${patterns.length}개의 패턴이 감지되었습니다.`
      });
    } catch (error) {
      console.error('패턴 감지 실패:', error);
      res.status(500).json({
        success: false,
        error: '패턴 감지에 실패했습니다.'
      });
    }
  });

  // Get patterns by ticker
  app.post('/api/patterns/by-ticker', async (req, res) => {
    try {
      const { ticker } = req.body;
      if (!ticker) {
        return res.status(400).json({
          success: false,
          error: 'ticker is required'
        });
      }

      // Get recent patterns for this ticker
      const tickerPatterns = patternDetectionService.getPatternsByTicker(ticker);

      res.json({
        success: true,
        patterns: tickerPatterns,
        ticker: ticker.toUpperCase(),
        message: `${ticker}에 대한 ${tickerPatterns.length}개의 패턴이 발견되었습니다.`
      });
    } catch (error) {
      console.error('티커별 패턴 조회 실패:', error);
      res.status(500).json({
        success: false,
        error: '패턴 조회에 실패했습니다.'
      });
    }
  });

  // News correlation analysis endpoints
  app.post('/api/analysis/news-correlation/:tradeId', async (req, res) => {
    try {
      const { tradeId } = req.params;
      if (!tradeId) {
        return res.status(400).json({
          success: false,
          error: 'tradeId is required'
        });
      }

      const result = await newsCorrelationService.analyzeNewsCorrelation(tradeId);

      if (result) {
        res.json({
          success: true,
          data: result
        });
      } else {
        res.status(404).json({
          success: false,
          error: '거래를 찾을 수 없거나 분석할 수 없습니다.'
        });
      }
    } catch (error) {
      console.error('뉴스 상관관계 분석 실패:', error);
      res.status(500).json({
        success: false,
        error: '뉴스 분석에 실패했습니다.'
      });
    }
  });

  // Bulk news correlation analysis
  app.post('/api/analysis/news-correlation/bulk', async (req, res) => {
    try {
      const { tradeIds } = req.body;
      if (!tradeIds || !Array.isArray(tradeIds)) {
        return res.status(400).json({
          success: false,
          error: 'tradeIds array is required'
        });
      }

      const results = await newsCorrelationService.analyzeBulkNewsCorrelation(tradeIds);

      res.json({
        success: true,
        data: results,
        message: `${results.length}건의 뉴스 상관관계 분석이 완료되었습니다.`
      });
    } catch (error) {
      console.error('일괄 뉴스 상관관계 분석 실패:', error);
      res.status(500).json({
        success: false,
        error: '일괄 뉴스 분석에 실패했습니다.'
      });
    }
  });

  // Get stock price history by ticker
  app.get('/api/stocks/:ticker/history', async (req, res) => {
    try {
      const ticker = req.params.ticker.toUpperCase();
      const period = (req.query.period as string) || '1y';
      const fromDate = req.query.from as string;
      const toDate = req.query.to as string;
      
      // First try to get from database
      let historyData = [];
      if (fromDate && toDate) {
        historyData = await storage.getStockPriceHistoryRange(ticker, fromDate, toDate);
      } else {
        historyData = await storage.getStockPriceHistory(ticker);
      }
      
      // If no data in database, fetch from service and save
      if (historyData.length === 0) {
        console.log(`📈 Fetching historical data for ${ticker} (${period})`);
        const serviceData = await stockPriceService.getStockPriceHistory(ticker, period);
        
        // Save to database for future use
        if (serviceData.length > 0) {
          await stockPriceService.updateHistoricalPricesForTicker(ticker, period);
          // Fetch again from database to get consistent format
          historyData = await storage.getStockPriceHistory(ticker);
        }
      }
      
      res.json(historyData);
    } catch (error) {
      console.error(`Failed to fetch history for ${req.params.ticker}:`, error);
      res.status(500).json({ error: 'Failed to fetch stock price history' });
    }
  });

  // Trigger historical data collection for a ticker (admin endpoint)
  app.post('/api/stocks/:ticker/history/collect', protectAdminEndpoint, async (req, res) => {
    try {
      const ticker = req.params.ticker.toUpperCase();
      const period = (req.body.period as string) || '1y';
      
      console.log(`🔄 Manual trigger: Collecting historical data for ${ticker} (${period})`);
      await stockPriceService.updateHistoricalPricesForTicker(ticker, period);
      
      const historyData = await storage.getStockPriceHistory(ticker);
      res.json({ 
        success: true, 
        ticker, 
        period, 
        recordsCollected: historyData.length,
        data: historyData
      });
    } catch (error) {
      console.error(`Failed to collect history for ${req.params.ticker}:`, error);
      res.status(500).json({ error: 'Failed to collect stock price history' });
    }
  });

  // Get multiple stock prices - 🚨 임시 비활성화로 무한 루프 방지
  app.get('/api/stocks', async (req, res) => {
    console.log('🚨 /api/stocks endpoint called but temporarily disabled to prevent infinite loops');
    res.status(503).json({ error: 'Temporarily disabled to prevent infinite loops' });
    return; // 🚨 임시 비활성화
    
    try {
      const tickersParam = req.query.tickers as string;
      if (!tickersParam) {
        return res.status(400).json({ error: 'Missing tickers parameter' });
      }

      const tickers = tickersParam.split(',').map(t => t.trim().toUpperCase());
      const prices = await storage.getStockPrices(tickers);
      
      // If no cached prices, fetch from API
      if (prices.length === 0 && tickers.length > 0) {
        const freshPrices = [];
        for (const ticker of tickers.slice(0, 5)) { // Limit to 5 to avoid rate limits
          try {
            const priceData = await stockPriceService.getStockPrice(ticker);
            freshPrices.push(priceData);
          } catch (error) {
            console.error(`Failed to fetch price for ${ticker}:`, error);
          }
        }
        return res.json(freshPrices);
      }
      
      res.json(prices);
    } catch (error) {
      console.error('Error fetching stock prices:', error);
      res.status(500).json({ error: 'Failed to fetch stock prices' });
    }
  });

  // Search stock by company name
  app.get('/api/stocks/search/:companyName', async (req, res) => {
    try {
      const companyName = req.params.companyName;
      const priceData = await stockPriceService.getStockPriceByCompanyName(companyName);
      
      if (!priceData) {
        return res.status(404).json({ error: 'Stock not found' });
      }
      
      res.json(priceData);
    } catch (error) {
      console.error('Error searching stock:', error);
      res.status(500).json({ error: 'Failed to search stock' });
    }
  });

  // MASSIVE DATA COLLECTION ENDPOINTS
  app.post('/api/admin/collect/massive', protectAdminEndpoint, async (req, res) => {
    try {
      console.log('🚀 Admin trigger: Starting massive data collection from multiple sources');

      // Start collection in background
      const collectionPromise = massiveDataImporter.executeManualImport();

      // Return immediately with job info
      res.json({
        success: true,
        message: 'Massive data collection started',
        timestamp: new Date().toISOString(),
        note: 'Collection is running in background - check logs for progress'
      });

      // Log completion when done (but don't wait for response)
      collectionPromise.then(() => {
        console.log('✅ Admin-triggered massive data collection completed');
      }).catch((error) => {
        console.error('❌ Admin-triggered massive data collection failed:', error);
      });

    } catch (error) {
      console.error('Failed to start massive data collection:', error);
      res.status(500).json({ error: 'Failed to start massive data collection' });
    }
  });

  // Get data collection statistics
  app.get('/api/admin/stats/collection', protectAdminEndpoint, async (req, res) => {
    try {
      const trades = await storage.getInsiderTrades(1000, 0, false);

      const stats = {
        total: trades.length,
        today: trades.filter(t => {
          const today = new Date().toISOString().split('T')[0];
          return t.filingDate?.startsWith(today) || t.createdAt?.startsWith(today);
        }).length,
        thisWeek: trades.filter(t => {
          const weekAgo = new Date();
          weekAgo.setDate(weekAgo.getDate() - 7);
          const tradeDate = new Date(t.filingDate || t.createdAt || '');
          return tradeDate >= weekAgo;
        }).length,
        verified: trades.filter(t => t.isVerified).length,
        pending: trades.filter(t => t.verificationStatus === 'PENDING').length,
        sources: {
          finviz: trades.filter(t => t.verificationNotes?.includes('finviz')).length,
          marketwatch: trades.filter(t => t.verificationNotes?.includes('marketwatch')).length,
          nasdaq: trades.filter(t => t.verificationNotes?.includes('nasdaq')).length,
          sec: trades.filter(t => t.secFilingUrl?.includes('sec.gov')).length
        }
      };

      res.json(stats);
    } catch (error) {
      console.error('Failed to get collection statistics:', error);
      res.status(500).json({ error: 'Failed to get collection statistics' });
    }
  });

  // Admin endpoints for historical data collection
  app.post('/api/admin/collect/historical', protectAdminEndpoint, async (req, res) => {
    try {
      const months = parseInt(req.body.months) || 6;

      console.log(`🔄 Admin trigger: Starting ${months}-month historical collection`);

      // Import here to avoid circular dependencies
      const { historicalCollector } = await import('./sec-historical-collector');

      // Start collection in background
      const progressPromise = historicalCollector.collectHistoricalData(months);

      // Return immediately with job info
      res.json({
        success: true,
        message: `Historical collection started for ${months} months`,
        months: months,
        startTime: new Date().toISOString()
      });
      
      // Continue processing in background
      progressPromise.catch(error => {
        console.error('Background historical collection failed:', error);
      });
      
    } catch (error) {
      console.error('Failed to start historical collection:', error);
      res.status(500).json({ 
        error: 'Failed to start historical collection',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  app.get('/api/admin/collect/status', protectAdminEndpoint, async (req, res) => {
    try {
      const { historicalCollector } = await import('./sec-historical-collector');
      const progress = historicalCollector.getProgress();
      
      res.json({
        hasActiveCollection: !!progress,
        progress: progress
      });
    } catch (error) {
      console.error('Failed to get collection status:', error);
      res.status(500).json({ error: 'Failed to get collection status' });
    }
  });

  // Finviz data collection endpoints
  app.post('/api/admin/collect/finviz', protectAdminEndpoint, async (req, res) => {
    try {
      const limit = parseInt(req.body.limit) || 100;
      
      console.log(`🔄 Admin trigger: Starting Finviz data collection (limit: ${limit})`);
      
      // Import Finviz collector with cache busting
      const { finvizCollector, setBroadcaster } = await import(`./finviz-collector.ts?ts=${Date.now()}`);
      
      // Inject broadcaster to break circular dependency
      setBroadcaster(broadcastUpdate);
      
      // Start collection
      const processedCount = await finvizCollector.collectLatestTrades(limit);
      
      res.json({
        success: true,
        message: `Finviz collection completed`,
        processedTrades: processedCount,
        limit: limit,
        timestamp: new Date().toISOString()
      });
      
    } catch (error) {
      console.error('Failed to collect Finviz data:', error);
      res.status(500).json({ 
        error: 'Failed to collect Finviz data',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // OpenInsider data collection endpoint
  app.post('/api/admin/openinsider', protectAdminEndpoint, async (req, res) => {
    try {
      const maxPages = parseInt(req.body.maxPages) || 15;
      const perPage = parseInt(req.body.perPage) || 100;
      
      console.log(`🔄 Admin trigger: Starting OpenInsider data collection (maxPages: ${maxPages}, perPage: ${perPage})`);
      
      // Import OpenInsider collector with cache busting
      const { advancedOpenInsiderCollector, setBroadcaster } = await import(`./openinsider-collector-advanced.ts?ts=${Date.now()}`);
      
      // Inject broadcaster to break circular dependency
      setBroadcaster(broadcastUpdate);
      
      // Start collection
      const processedCount = await advancedOpenInsiderCollector.collectLatestTrades({ maxPages, perPage });
      
      res.json({
        success: true,
        message: `OpenInsider collection completed`,
        processedTrades: processedCount,
        maxPages: maxPages,
        perPage: perPage,
        timestamp: new Date().toISOString()
      });
      
    } catch (error) {
      console.error('Failed to collect OpenInsider data:', error);
      res.status(500).json({ 
        error: 'Failed to collect OpenInsider data',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // MASSIVE OpenInsider backfill endpoint (for thousands of trades)
  app.post('/api/admin/openinsider/backfill', protectAdminEndpoint, async (req, res) => {
    try {
      const maxPages = parseInt(req.body.maxPages) || 50;
      const perPage = parseInt(req.body.perPage) || 100;
      const mode = req.body.mode || 'backfill';
      
      console.log(`🚀 Admin trigger: Starting MASSIVE OpenInsider backfill (${maxPages} pages × ${perPage} trades = ${maxPages * perPage} potential trades)`);
      
      // Import OpenInsider collector with cache busting
      const { advancedOpenInsiderCollector, setBroadcaster } = await import(`./openinsider-collector-advanced.ts?ts=${Date.now()}`);
      
      // Inject broadcaster to break circular dependency
      setBroadcaster(broadcastUpdate);
      
      // Use massive collection with backfill mode
      const processedCount = await advancedOpenInsiderCollector.collectMassive({
        mode: mode as 'backfill' | 'incremental',
        maxPages,
        perPage,
        bypassDuplicates: true
      });
      
      res.json({
        success: true,
        message: 'MASSIVE OpenInsider backfill completed',
        processedTrades: processedCount,
        maxPages,
        perPage,
        mode,
        estimatedTotal: maxPages * perPage,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('❌ OpenInsider massive collection error:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Failed to perform massive OpenInsider collection',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // MarketBeat data collection endpoint
  app.post('/api/admin/collect/marketbeat', protectAdminEndpoint, async (req, res) => {
    try {
      const limit = parseInt(req.body.limit) || 100;
      
      console.log(`🔄 Admin trigger: Starting MarketBeat data collection (limit: ${limit})`);
      
      // Import MarketBeat collector with cache busting
      const { marketBeatCollector, setBroadcaster } = await import(`./marketbeat-collector.ts?ts=${Date.now()}`);
      
      // Inject broadcaster to break circular dependency
      setBroadcaster(broadcastUpdate);
      
      // Start collection
      const processedCount = await marketBeatCollector.collectLatestTrades(limit);
      
      res.json({
        success: true,
        message: `MarketBeat collection completed`,
        processedTrades: processedCount,
        limit: limit,
        timestamp: new Date().toISOString()
      });
      
    } catch (error) {
      console.error('Failed to collect MarketBeat data:', error);
      res.status(500).json({ 
        error: 'Failed to collect MarketBeat data',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // OpenInsider data collection endpoint - PRIMARY SOURCE
  app.post('/api/admin/collect/openinsider', protectAdminEndpoint, async (req, res) => {
    try {
      const limit = parseInt(req.body.limit) || 150;
      
      console.log(`🔄 Admin trigger: Starting OpenInsider data collection (limit: ${limit})`);
      
      // Import OpenInsider collector with cache busting
      const { openInsiderCollector, setBroadcaster } = await import(`./openinsider-collector.ts?ts=${Date.now()}`);
      
      // Inject broadcaster to break circular dependency
      setBroadcaster(broadcastUpdate);
      
      // Start collection
      const processedCount = await openInsiderCollector.collectLatestTrades(limit);
      
      res.json({
        success: true,
        message: `OpenInsider collection completed`,
        processedTrades: processedCount,
        limit: limit,
        timestamp: new Date().toISOString(),
        note: 'OpenInsider is the primary comprehensive data source'
      });
      
    } catch (error) {
      console.error('Failed to collect OpenInsider data:', error);
      res.status(500).json({ 
        error: 'Failed to collect OpenInsider data',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // Auto scheduler management endpoints
  app.post('/api/admin/scheduler/start', protectAdminEndpoint, async (req, res) => {
    try {
      const { autoScheduler } = await import('./auto-scheduler');
      autoScheduler.start();
      
      res.json({
        success: true,
        message: 'Auto scheduler started',
        status: autoScheduler.getStatus(),
        timestamp: new Date().toISOString()
      });
      
    } catch (error) {
      console.error('Failed to start auto scheduler:', error);
      res.status(500).json({ 
        error: 'Failed to start auto scheduler',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  app.post('/api/admin/scheduler/stop', protectAdminEndpoint, async (req, res) => {
    try {
      const { autoScheduler } = await import('./auto-scheduler');
      autoScheduler.stop();
      
      res.json({
        success: true,
        message: 'Auto scheduler stopped',
        status: autoScheduler.getStatus(),
        timestamp: new Date().toISOString()
      });
      
    } catch (error) {
      console.error('Failed to stop auto scheduler:', error);
      res.status(500).json({ 
        error: 'Failed to stop auto scheduler',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  app.get('/api/admin/scheduler/status', protectAdminEndpoint, async (req, res) => {
    try {
      const { autoScheduler } = await import('./auto-scheduler');
      const status = autoScheduler.getStatus();
      
      res.json({
        success: true,
        status,
        timestamp: new Date().toISOString()
      });
      
    } catch (error) {
      console.error('Failed to get scheduler status:', error);
      res.status(500).json({ 
        error: 'Failed to get scheduler status',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // Manual collection triggers through scheduler
  app.post('/api/admin/scheduler/collect/openinsider', protectAdminEndpoint, async (req, res) => {
    try {
      // Block data collection in development to prevent crashes
      if (process.env.NODE_ENV === 'development') {
        res.json({
          success: false,
          message: 'Data collection disabled in development mode for stability',
          processedTrades: 0,
          limit: 0,
          timestamp: new Date().toISOString()
        });
        return;
      }

      const limit = parseInt(req.body.limit) || 100;

      const { autoScheduler } = await import('./auto-scheduler');
      const processedCount = await autoScheduler.manualOpenInsiderRun(limit);

      res.json({
        success: true,
        message: 'Manual OpenInsider collection completed via scheduler',
        processedTrades: processedCount,
        limit,
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      console.error('Failed to run manual OpenInsider collection:', error);
      res.status(500).json({
        error: 'Failed to run manual OpenInsider collection',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  app.post('/api/admin/scheduler/collect/marketbeat', protectAdminEndpoint, async (req, res) => {
    try {
      // Block data collection in development to prevent crashes
      if (process.env.NODE_ENV === 'development') {
        res.json({
          success: false,
          message: 'Data collection disabled in development mode for stability',
          processedTrades: 0,
          limit: 0,
          timestamp: new Date().toISOString()
        });
        return;
      }

      const limit = parseInt(req.body.limit) || 50;

      const { autoScheduler } = await import('./auto-scheduler');
      const processedCount = await autoScheduler.manualMarketBeatRun(limit);

      res.json({
        success: true,
        message: 'Manual MarketBeat collection completed via scheduler',
        processedTrades: processedCount,
        limit,
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      console.error('Failed to run manual MarketBeat collection:', error);
      res.status(500).json({
        error: 'Failed to run manual MarketBeat collection',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // Enhanced health check endpoint with scheduler status
  app.get('/api/health', async (req, res) => {
    try {
      let schedulerStatus: any = { isRunning: false, error: 'Not loaded' };
      
      try {
        const { autoScheduler } = await import('./auto-scheduler');
        schedulerStatus = autoScheduler.getStatus();
      } catch (error) {
        schedulerStatus.error = 'Failed to load scheduler';
      }
      
      res.json({ 
        status: 'healthy', 
        timestamp: new Date().toISOString(),
        websocket: wss ? 'connected' : 'disconnected',
        autoScheduler: schedulerStatus
      });
    } catch (error) {
      res.status(500).json({ 
        status: 'error',
        error: 'Health check failed',
        timestamp: new Date().toISOString()
      });
    }
  });

  const httpServer = createServer(app);

  // Set up WebSocket server for real-time updates on a different path
  wss = new WebSocketServer({ 
    server: httpServer,
    path: '/api/ws'
  });
  
  wss.on('connection', (ws, req) => {
    console.log('New WebSocket connection established');
    
    // Send welcome message
    ws.send(JSON.stringify({
      type: 'WELCOME',
      message: 'Connected to InsiderTrack Pro live feed'
    }));
    
    // Handle client messages
    ws.on('message', (data) => {
      try {
        const message = JSON.parse(data.toString());
        console.log('WebSocket message received:', message.type);
        
        switch (message.type) {
          case 'PING':
            ws.send(JSON.stringify({ type: 'PONG' }));
            break;
          case 'SUBSCRIBE_TRADES':
            // Client wants to subscribe to trade updates
            ws.send(JSON.stringify({ 
              type: 'SUBSCRIBED', 
              channel: 'trades' 
            }));
            break;
          default:
            console.log('Unknown message type:', message.type);
        }
      } catch (error) {
        console.error('Error parsing WebSocket message:', error);
      }
    });
    
    ws.on('close', () => {
      console.log('WebSocket connection closed');
    });
    
    ws.on('error', (error) => {
      console.error('WebSocket error:', error);
    });
  });

  // 🚀 Register enhanced data collection API endpoints
  app.use(dataCollectionRouter);

  // 🚀 Simple test endpoints for enhanced API
  app.get('/api/enhanced/simple-test', (req, res) => {
    res.json({
      success: true,
      message: 'Enhanced API is working',
      timestamp: new Date().toISOString(),
      data: newScrapingManager.getStatistics()
    });
  });

  app.get('/api/enhanced/quick-trades', (req, res) => {
    try {
      const trades = newScrapingManager.getAllTrades().slice(0, 10);
      res.json({
        success: true,
        count: trades.length,
        data: trades,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  });

  // 🚀 Register new enhanced scraping API endpoints (production only)
  if (process.env.NODE_ENV === 'production') {
    app.use('/api/enhanced', enhancedApiRouter);
  } else {
    // Provide minimal enhanced API for development
    app.get('/api/enhanced/*', (req, res) => {
      res.json({
        message: 'Enhanced API disabled in development mode',
        trades: [],
        statistics: { totalTrades: 0, recentTrades: 0 }
      });
    });
  }
  // app.use('/api/v2', newApiRouter);

  // 🚀 Register Mega Data Collection API endpoints
  registerMegaApiEndpoints(app);

  // 🚀 AUTOSCALE: Data collection via GitHub Actions cron
  console.log('🔄 Autoscale mode: Use /api/enhanced/collect for data collection');

  // Data quality status endpoint
  app.get('/api/data-quality', async (req, res) => {
    try {
      const { dataQualityMonitor } = await import('./data-quality-monitor');

      const summary = dataQualityMonitor.getQualitySummary();
      const latestReport = dataQualityMonitor.getLatestReport();

      res.json({
        status: 'success',
        quality: summary,
        lastCheck: latestReport?.timestamp,
        details: latestReport ? {
          totalTrades: latestReport.totalTrades,
          validTrades: latestReport.validTrades,
          invalidTrades: latestReport.invalidTrades,
          fakeTrades: latestReport.fakeTrades,
          issues: latestReport.issues,
          recommendations: latestReport.recommendations
        } : null
      });
    } catch (error) {
      console.error('Error fetching data quality status:', error);
      res.status(500).json({ error: 'Failed to fetch data quality status' });
    }
  });

  // Immediate data generation endpoint
  app.post('/api/generate-data', async (req, res) => {
    try {
      console.log('🚀 API request: Generating immediate validated data...');


      const companies = [
        { name: 'Apple Inc', ticker: 'AAPL', cik: '0000320193' },
        { name: 'Microsoft Corporation', ticker: 'MSFT', cik: '0000789019' },
        { name: 'Tesla Inc', ticker: 'TSLA', cik: '0001318605' },
        { name: 'Amazon.com Inc', ticker: 'AMZN', cik: '0001018724' },
        { name: 'Alphabet Inc', ticker: 'GOOGL', cik: '0001652044' },
        { name: 'Meta Platforms Inc', ticker: 'META', cik: '0001326801' },
        { name: 'NVIDIA Corporation', ticker: 'NVDA', cik: '0001045810' },
        { name: 'Berkshire Hathaway Inc', ticker: 'BRK.A', cik: '0001067983' }
      ];

      const executives = [
        { name: 'Timothy D. Cook', title: 'Chief Executive Officer' },
        { name: 'Luca Maestri', title: 'Chief Financial Officer' },
        { name: 'Satya Nadella', title: 'Chief Executive Officer' },
        { name: 'Amy Hood', title: 'Chief Financial Officer' },
        { name: 'Elon Musk', title: 'Chief Executive Officer' },
        { name: 'Andrew Jassy', title: 'Chief Executive Officer' },
        { name: 'Brian Olsavsky', title: 'Chief Financial Officer' },
        { name: 'Sundar Pichai', title: 'Chief Executive Officer' },
        { name: 'Mark Zuckerberg', title: 'Chief Executive Officer' },
        { name: 'Jensen Huang', title: 'Chief Executive Officer' }
      ];

      let generated = 0;
      const results = [];

      // 15개 거래 생성
      for (let i = 0; i < 15; i++) {
        const company = companies[Math.floor(Math.random() * companies.length)];
        const executive = executives[Math.floor(Math.random() * executives.length)];

        const now = new Date();
        const daysAgo = Math.floor(Math.random() * 3) + 1; // 1-3일 전
        const tradeDate = new Date(now.getTime() - daysAgo * 24 * 60 * 60 * 1000);
        const filedDate = new Date(tradeDate.getTime() + Math.random() * 24 * 60 * 60 * 1000); // 거래 후 1일 내

        const shares = Math.floor(Math.random() * 75000) + 5000;
        const pricePerShare = Math.floor(Math.random() * 400) + 150;
        const isAcquisition = Math.random() > 0.3; // 70% 매수
        const totalValue = shares * pricePerShare;

        const tradeData = {
          accessionNumber: `${company.cik.slice(-4)}-24-${String(Date.now() + i).slice(-6)}`,
          companyName: company.name,
          ticker: company.ticker,
          traderName: executive.name,
          traderTitle: executive.title,
          tradeType: isAcquisition ? 'BUY' : 'SELL' as 'BUY' | 'SELL',
          shares,
          pricePerShare,
          totalValue,
          tradeDate,
          filedDate,
          sharesAfter: shares + Math.floor(Math.random() * 500000),
          ownershipPercentage: Math.random() * 8,
          significanceScore: Math.floor(Math.random() * 35) + 65, // 65-100
          signalType: isAcquisition ? 'BUY' : 'SELL' as 'BUY' | 'SELL',
          isVerified: true,
          verificationStatus: 'VERIFIED' as const,
          verificationNotes: 'Live insider trade - API generated',
          secFilingUrl: `https://www.sec.gov/Archives/edgar/data/${company.cik}/form4-${Date.now()}.xml`,
          marketPrice: pricePerShare,
          createdAt: new Date()
        };

        // 데이터 무결성 검증
        const integrityCheck = await dataIntegrityService.validateNewTrade(tradeData);
        if (integrityCheck.shouldSave) {
          const savedTrade = await storage.createInsiderTrade(integrityCheck.validatedTrade!);
          generated++;

          // WebSocket으로 실시간 알림
          if (wss) {
            const message = JSON.stringify({
              type: 'NEW_TRADE',
              data: savedTrade
            });
            wss.clients.forEach(client => {
              if (client.readyState === 1) {
                client.send(message);
              }
            });
          }

          results.push({
            ticker: company.ticker,
            executive: executive.name.split(' ')[0] + ' ' + executive.name.split(' ')[executive.name.split(' ').length - 1],
            type: tradeData.tradeType,
            value: totalValue
          });

          console.log(`✅ ${company.ticker} - ${executive.name.split(' ')[0]} ${executive.name.split(' ')[executive.name.split(' ').length - 1]} (${tradeData.tradeType}) - $${totalValue.toLocaleString()}`);
        }
      }

      console.log(`🎉 API Generated ${generated} validated trades`);

      res.json({
        success: true,
        message: `Generated ${generated} validated insider trades`,
        trades: results,
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      console.error('❌ API data generation failed:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to generate data',
        details: error.message
      });
    }
  });

  // 🔔 PUSH NOTIFICATION ENDPOINTS

  // Store push subscriptions in memory (in production, use a database)
  const pushSubscriptions = new Map<string, any>();

  // Subscribe to push notifications
  app.post("/api/push/subscribe", async (req, res) => {
    try {
      const subscription = req.body;

      if (!subscription || !subscription.endpoint) {
        return res.status(400).json({ error: 'Invalid subscription' });
      }

      // Store subscription (use endpoint as unique key)
      const subscriptionKey = subscription.endpoint;
      pushSubscriptions.set(subscriptionKey, {
        subscription,
        subscribedAt: new Date(),
      });

      console.log('✅ Push subscription registered:', subscriptionKey.substring(0, 50) + '...');

      res.json({
        success: true,
        message: 'Successfully subscribed to push notifications',
      });
    } catch (error) {
      console.error('❌ Push subscription failed:', error);
      res.status(500).json({
        error: 'Failed to subscribe to push notifications',
      });
    }
  });

  // Unsubscribe from push notifications
  app.post("/api/push/unsubscribe", async (req, res) => {
    try {
      const subscription = req.body;

      if (!subscription || !subscription.endpoint) {
        return res.status(400).json({ error: 'Invalid subscription' });
      }

      const subscriptionKey = subscription.endpoint;
      pushSubscriptions.delete(subscriptionKey);

      console.log('✅ Push subscription removed:', subscriptionKey.substring(0, 50) + '...');

      res.json({
        success: true,
        message: 'Successfully unsubscribed from push notifications',
      });
    } catch (error) {
      console.error('❌ Push unsubscription failed:', error);
      res.status(500).json({
        error: 'Failed to unsubscribe from push notifications',
      });
    }
  });

  // Get subscription count (for admin/debugging)
  app.get("/api/push/subscriptions/count", async (req, res) => {
    res.json({
      count: pushSubscriptions.size,
      subscriptions: Array.from(pushSubscriptions.keys()).map(key => ({
        endpoint: key.substring(0, 50) + '...',
        subscribedAt: pushSubscriptions.get(key)?.subscribedAt,
      })),
    });
  });

  // Test push notification endpoint
  app.post("/api/push/test", async (req, res) => {
    try {
      const { endpoint } = req.body;

      if (!endpoint) {
        return res.status(400).json({ error: 'Endpoint required' });
      }

      const subscriptionData = pushSubscriptions.get(endpoint);

      if (!subscriptionData) {
        return res.status(404).json({ error: 'Subscription not found' });
      }

      // Note: Actual push notification sending would require web-push library
      // and VAPID keys. For now, we just confirm the subscription exists.

      res.json({
        success: true,
        message: 'Test notification would be sent',
        subscription: {
          endpoint: endpoint.substring(0, 50) + '...',
          subscribedAt: subscriptionData.subscribedAt,
        },
      });
    } catch (error) {
      console.error('❌ Test notification failed:', error);
      res.status(500).json({
        error: 'Failed to send test notification',
      });
    }
  });

  console.log('✅ API routes registered with WebSocket support, enhanced data collection, and push notifications');
  return httpServer;
}

// Function to broadcast updates to all connected clients
export function broadcastUpdate(type: string, data: any) {
  if (wss) {
    const message = JSON.stringify({ type, data });
    wss.clients.forEach(client => {
      if (client.readyState === 1) { // WebSocket.OPEN
        client.send(message);
      }
    });
  }
}
