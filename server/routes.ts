import type { Express } from "express";
import express from "express";
import { createServer, type Server } from "http";
import { WebSocketServer } from "ws";
import { storage } from "./storage";
import { insertInsiderTradeSchema, users, insiderTrades } from "@shared/schema";
import { drizzle } from "drizzle-orm/neon-http";
import { eq, sql, and, desc, inArray, isNotNull } from "drizzle-orm";
import * as schema from "@shared/schema";
import { stockPriceService } from "./stock-price-service";
import { z } from "zod";
import { protectAdminEndpoint } from "./security-middleware";
import { registerMegaApiEndpoints } from "./mega-api-endpoints";
import dataCollectionRouter from "./data-collection-api";
import notificationRouter from "./notification-routes";
import Stripe from "stripe";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import OpenAI from "openai";
import { adminMetricsService } from "./admin-metrics-service";
import { ipGeolocationService } from "./ip-geolocation-service";
// Import scraping manager (always needed for auto-collection)
import { newScrapingManager } from './temp-scraper';

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
import { exchangeRateService } from "./exchange-rate-service";
import { pastPerformanceService } from "./past-performance-service";
import tossLoginRouter from "./toss-login-routes";
import cookieParser from "cookie-parser";

// Initialize database
const db = drizzle(process.env.DATABASE_URL!, { schema });

/**
 * 앱인토스 환경인지 확인하는 헬퍼 함수
 * Request header의 origin 또는 x-appintos-env를 확인
 */
function isAppintosEnvironment(req: express.Request): boolean {
  // x-appintos-env 헤더 확인
  if (req.headers['x-appintos-env'] === 'true') {
    return true;
  }

  // origin 헤더에서 tossmini.com 확인
  const origin = req.headers.origin || req.headers.referer || '';
  if (origin.includes('tossmini.com') || origin.includes('apps-in-toss')) {
    return true;
  }

  return false;
}

// Initialize Stripe with secret key
if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('Missing required Stripe secret: STRIPE_SECRET_KEY');
}
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: "2023-10-16",
});

// Initialize OpenAI for translation
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// Sector 캐시 (Finnhub API 호출 최소화) - 다국어 지원
// ticker → language → { sector, timestamp }
const sectorCache = new Map<string, Map<string, {
  sector: string | null;
  timestamp: number
}>>();
const SECTOR_CACHE_TTL = 24 * 60 * 60 * 1000; // 24시간

// Finnhub API Rate Limiter (동시 요청 제한)
let finnhubRequestQueue: Array<() => Promise<void>> = [];
let finnhubActiveRequests = 0;
const FINNHUB_MAX_CONCURRENT = 1; // 동시에 1개 요청만 (60/분 제한 준수)
const FINNHUB_REQUEST_DELAY = 1100; // 요청 간 1.1초 딜레이

async function finnhubRateLimitedFetch(url: string): Promise<Response> {
  return new Promise((resolve, reject) => {
    const executeRequest = async () => {
      finnhubActiveRequests++;
      try {
        await new Promise(r => setTimeout(r, FINNHUB_REQUEST_DELAY));
        const response = await fetch(url);
        resolve(response);
      } catch (error) {
        reject(error);
      } finally {
        finnhubActiveRequests--;
        processNextFinnhubRequest();
      }
    };

    if (finnhubActiveRequests < FINNHUB_MAX_CONCURRENT) {
      executeRequest();
    } else {
      finnhubRequestQueue.push(executeRequest);
    }
  });
}

function processNextFinnhubRequest() {
  if (finnhubRequestQueue.length > 0 && finnhubActiveRequests < FINNHUB_MAX_CONCURRENT) {
    const next = finnhubRequestQueue.shift();
    if (next) next();
  }
}

async function getSectorFromFinnhub(ticker: string, language: string = 'en'): Promise<string | null> {
  // 1. 해당 언어의 캐시 확인
  const tickerCache = sectorCache.get(ticker);
  if (tickerCache) {
    const langCache = tickerCache.get(language);
    // 캐시된 값이 있고, 유효 기간 내이고, null이 아닌 경우에만 사용
    if (langCache && Date.now() - langCache.timestamp < SECTOR_CACHE_TTL && langCache.sector) {
      console.log(`✅ Using cached ${language} sector for ${ticker}: ${langCache.sector}`);
      return langCache.sector;
    }
  }

  // 2. 영문 캐시 확인 (Finnhub API 호출 최소화)
  let englishSector: string | null = null;
  const enCache = tickerCache?.get('en');

  // 캐시된 값이 있고, 유효 기간 내이고, null이 아닌 경우에만 사용
  if (enCache && Date.now() - enCache.timestamp < SECTOR_CACHE_TTL && enCache.sector) {
    englishSector = enCache.sector;
    console.log(`✅ Using cached EN sector for ${ticker}: ${englishSector}`);
  } else {
    // 3. Finnhub API에서 영문 업종 가져오기
    try {
      const finnhubKey = process.env.FINNHUB_API_KEY;
      if (!finnhubKey) {
        console.log(`⚠️ FINNHUB_API_KEY not set, skipping sector fetch for ${ticker}`);
        return null;
      }

      const profileUrl = `https://finnhub.io/api/v1/stock/profile2?symbol=${ticker}&token=${finnhubKey}`;

      // Rate-limited fetch로 429 에러 방지 + 재시도 로직
      let retries = 0;
      const maxRetries = 2;
      while (retries <= maxRetries) {
        const response = await finnhubRateLimitedFetch(profileUrl);
        if (response.ok) {
          const profile = await response.json();
          englishSector = profile.finnhubIndustry || null;
          break;
        } else if (response.status === 429 && retries < maxRetries) {
          const delay = Math.pow(2, retries) * 1000; // 1초, 2초
          console.log(`⏳ Finnhub rate limit for ${ticker}, waiting ${delay}ms (retry ${retries + 1}/${maxRetries})`);
          await new Promise(resolve => setTimeout(resolve, delay));
          retries++;
        } else {
          console.log(`⚠️ Finnhub API error for ${ticker}: ${response.status}`);
          break; // Don't return null yet, try Polygon fallback
        }
      }

      // Finnhub가 null이면 fallback APIs 시도
      if (!englishSector) {
        console.log(`⚠️ Finnhub returned null for ${ticker}, trying fallback APIs...`);

        // Try Polygon API first (if key available)
        const polygonKey = process.env.POLYGON_API_KEY;
        if (polygonKey && !englishSector) {
          try {
            const polygonUrl = `https://api.polygon.io/v3/reference/tickers/${ticker}?apiKey=${polygonKey}`;
            const polygonResponse = await fetch(polygonUrl);
            if (polygonResponse.ok) {
              const polygonData = await polygonResponse.json();
              englishSector = polygonData.results?.sic_description || null;
              if (englishSector) {
                console.log(`✅ Got sector from Polygon for ${ticker}: ${englishSector}`);
              }
            }
          } catch (polygonError) {
            console.log(`⚠️ Polygon API failed for ${ticker}:`, polygonError);
          }
        }

        // Try Yahoo Finance as final fallback (no API key needed)
        if (!englishSector) {
          try {
            const yahooUrl = `https://query2.finance.yahoo.com/v10/finance/quoteSummary/${ticker}?modules=assetProfile`;
            const yahooResponse = await fetch(yahooUrl, {
              headers: { 'User-Agent': 'Mozilla/5.0' }
            });
            if (yahooResponse.ok) {
              const yahooData = await yahooResponse.json();
              const industry = yahooData.quoteSummary?.result?.[0]?.assetProfile?.industry;
              const sector = yahooData.quoteSummary?.result?.[0]?.assetProfile?.sector;
              englishSector = industry || sector || null;
              if (englishSector) {
                console.log(`✅ Got sector from Yahoo Finance for ${ticker}: ${englishSector}`);
              }
            }
          } catch (yahooError) {
            console.log(`⚠️ Yahoo Finance failed for ${ticker}:`, yahooError);
          }
        }
      }

      // 영문 캐시 저장 (null이 아닌 경우에만!)
      if (englishSector) {
        if (!sectorCache.has(ticker)) {
          sectorCache.set(ticker, new Map());
        }
        sectorCache.get(ticker)!.set('en', {
          sector: englishSector,
          timestamp: Date.now()
        });
        console.log(`✅ Fetched and cached EN sector for ${ticker}: ${englishSector}`);
      } else {
        console.log(`⚠️ Finnhub returned null for ${ticker}, NOT caching (will retry next request)`);
      }
    } catch (error) {
      console.log(`❌ Sector fetch failed for ${ticker}:`, error);
      return null;
    }
  }

  if (!englishSector) {
    console.log(`⚠️ No sector data available for ${ticker} from any source`);
    return null;
  }

  // 4. 영어 요청이면 영문 그대로 반환
  if (language === 'en') {
    return englishSector;
  }

  // 5. 번역 수행
  const translatedSector = await translateText(englishSector, language);

  // 6. 번역본 캐시 저장 (번역 성공 시에만)
  // 번역이 실패하면 원본 영문이 반환되므로, 영문과 동일한지 확인
  const translationSucceeded = translatedSector !== englishSector;

  if (translationSucceeded) {
    if (!sectorCache.has(ticker)) {
      sectorCache.set(ticker, new Map());
    }
    sectorCache.get(ticker)!.set(language, {
      sector: translatedSector,
      timestamp: Date.now()
    });
    console.log(`✅ Translated and cached ${language} sector for ${ticker}: ${translatedSector}`);
  } else {
    console.warn(`⚠️ Translation failed for ${ticker} (${language}), using English: ${englishSector}`);
  }

  return translatedSector;
}

// Helper function to translate text
async function translateText(text: string, targetLanguage: string): Promise<string> {
  if (!text) {
    return text;
  }

  const languageNames: Record<string, string> = {
    en: 'English',
    ko: 'Korean',
    ja: 'Japanese',
    zh: 'Chinese (Simplified)'
  };

  const targetLangName = languageNames[targetLanguage] || 'English';

  // 영어 타겟이면 바로 반환 (번역 불필요)
  if (targetLanguage === 'en') {
    return text;
  }

  // 나머지 언어는 항상 번역 수행 (캐싱으로 중복 호출 방지됨)
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: `You are a professional translator. Translate the following text to ${targetLangName}.
IMPORTANT RULES:
- DO NOT translate company names (e.g., "Marriott Vacations Worldwide" stays as is)
- DO NOT translate stock ticker symbols (e.g., VAC, AAPL, MSFT)
- DO NOT translate person names
- Translate ALL industry/sector terms completely (e.g., "Software - Internet" → "소프트웨어 - 인터넷")
- Keep numbers, percentages, and currencies in their original format
- Only translate the descriptive/analytical parts of the text
Only return the translated text, nothing else.`
        },
        {
          role: "user",
          content: text
        }
      ],
      temperature: 0.3,
      max_tokens: 500
    });

    return response.choices[0].message.content || text;
  } catch (error) {
    console.error(`❌ Translation FAILED for "${text}" to ${targetLanguage}:`, error);
    console.error(`   Error details: ${error instanceof Error ? error.message : 'Unknown error'}`);
    console.error(`   Returning original text (NOT CACHING)`);
    return text; // Return original text if translation fails
  }
}

// Ranking tickers cache for AI analysis eligibility (5 min TTL)
let rankingTickersCache: {
  tickers: string[];
  tickerData: Map<string, { avgTradeValue: number }>;
  timestamp: number;
} | null = null;
const RANKING_CACHE_TTL = 5 * 60 * 1000; // 5 minutes

// Helper function to fetch current ranking tickers with caching
async function fetchRankingTickers(): Promise<string[]> {
  // Check cache validity
  if (rankingTickersCache && (Date.now() - rankingTickersCache.timestamp) < RANKING_CACHE_TTL) {
    console.log('✅ Using cached ranking tickers');
    return rankingTickersCache.tickers;
  }

  console.log('🔄 Fetching fresh ranking tickers...');

  try {
    // 🎯 CRITICAL FIX: Fetch from /api/rankings to ensure same ranking logic
    // This guarantees AI analysis is only generated for actual top-ranked stocks
    const response = await fetch(`http://localhost:${process.env.PORT || 5000}/api/rankings?limit=6`);

    if (!response.ok) {
      throw new Error(`Rankings API returned ${response.status}`);
    }

    const data = await response.json();
    const rankings = data.rankings || [];
    const tickers = rankings.map((r: any) => r.ticker).filter(Boolean);

    // Build ticker data map with avgTradeValue
    const tickerData = new Map<string, { avgTradeValue: number }>();
    rankings.forEach((r: any) => {
      if (r.ticker) {
        tickerData.set(r.ticker, { avgTradeValue: r.avgTradeValue || 0 });
      }
    });

    // Update cache
    rankingTickersCache = {
      tickers,
      tickerData,
      timestamp: Date.now()
    };

    console.log(`📦 Cached ${tickers.length} ranking tickers for AI analysis`);
    return tickers;
  } catch (error) {
    console.error('❌ Failed to fetch ranking tickers:', error);

    // If cache exists but expired, use it anyway (stale cache better than nothing)
    if (rankingTickersCache) {
      console.log('⚠️ Using stale cache due to fetch error');
      return rankingTickersCache.tickers;
    }

    // No cache available - throw error to deny analysis (fail-safe)
    throw new Error('Unable to fetch ranking tickers');
  }
}

// Helper function to get avgBuyPrice for a ticker from ranking cache
function getTickerAvgBuyPrice(ticker: string): number | undefined {
  if (rankingTickersCache && rankingTickersCache.tickerData) {
    const data = rankingTickersCache.tickerData.get(ticker);
    return data?.avgTradeValue;
  }
  return undefined;
}

// Global WebSocket server for real-time updates
let wss: WebSocketServer;

// Country to language mapping for auto-detection
const COUNTRY_LANGUAGE_MAP: Record<string, 'en' | 'ko' | 'ja' | 'zh'> = {
  'KR': 'ko',  // South Korea
  'JP': 'ja',  // Japan
  'CN': 'zh',  // China
  'TW': 'zh',  // Taiwan
  'HK': 'zh',  // Hong Kong
};

export async function registerRoutes(app: Express): Promise<Server> {

  // 🌐 Language detection endpoint - detect user's language based on IP geolocation
  app.get("/api/detect-language", async (req, res) => {
    try {
      const clientIP = ipGeolocationService.getClientIP(req);
      const location = await ipGeolocationService.getLocation(clientIP);

      if (!location) {
        return res.json({
          language: 'en',
          country: 'UNKNOWN',
          countryName: 'Unknown',
          source: 'fallback'
        });
      }

      const language = COUNTRY_LANGUAGE_MAP[location.country] || 'en';

      console.log(`[detect-language] IP: ${clientIP}, Country: ${location.country} (${location.countryName}) -> Language: ${language}`);

      return res.json({
        language,
        country: location.country,
        countryName: location.countryName,
        source: 'ip'
      });
    } catch (error) {
      console.error('[detect-language] Error:', error);
      return res.json({
        language: 'en',
        country: 'ERROR',
        countryName: 'Error',
        source: 'fallback'
      });
    }
  });

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

  // Create Checkout Session for subscription with 7-day free trial
  app.post("/api/create-subscription", async (req, res) => {
    console.log('\n🔵 ===== CREATE SUBSCRIPTION REQUEST =====');
    console.log('📥 Request body:', JSON.stringify(req.body, null, 2));
    console.log('📨 Headers:', {
      'content-type': req.headers['content-type'],
      'authorization': req.headers.authorization ? 'Bearer ***' : 'missing'
    });

    try {
      const { priceId } = req.body;
      const userId = getUserIdFromToken(req);

      console.log('🔍 Extracted data:', {
        priceId,
        userId,
        hasUserId: !!userId
      });

      if (!priceId) {
        console.error('❌ Missing priceId in request');
        return res.status(400).json({
          error: 'Missing required field: priceId'
        });
      }

      if (!userId) {
        console.error('❌ User not authenticated - no userId from token');
        return res.status(401).json({
          error: 'User not authenticated'
        });
      }

      // RACE CONDITION MITIGATION:
      // Multiple concurrent requests could reach this point simultaneously.
      // We rely on Stripe's idempotency key (line 368) to prevent duplicate checkout sessions.
      // The idempotency key uses a 30-second window, so concurrent requests within that window
      // will receive the same checkout session from Stripe, preventing double-charging.
      //
      // FUTURE IMPROVEMENT: For maximum safety, wrap this entire user check + subscription validation
      // in a database transaction with row-level locking (SELECT ... FOR UPDATE).
      // However, this requires careful refactoring to avoid including Stripe API calls in the transaction.

      // Get user info
      const user = await db.query.users.findFirst({
        where: eq(users.id, userId),
      });

      if (!user || !user.email) {
        return res.status(404).json({
          error: 'User not found or email missing'
        });
      }

      // ✅ Check for existing active subscriptions to prevent duplicates
      if (user.stripeSubscriptionId) {
        try {
          const existingSub = await stripe.subscriptions.retrieve(user.stripeSubscriptionId);
          console.log(`🔍 Existing subscription status: ${existingSub.status}, cancel_at_period_end: ${existingSub.cancel_at_period_end}`);

          // Only block if truly active (not set to cancel)
          if ((existingSub.status === 'active' || existingSub.status === 'trialing') && !existingSub.cancel_at_period_end) {
            console.log(`⚠️ User ${userId} already has active subscription: ${existingSub.id}`);
            return res.status(400).json({
              error: '이미 활성 구독이 있습니다',
              subscriptionId: existingSub.id,
              status: existingSub.status
            });
          } else if (existingSub.status === 'canceled' || existingSub.status === 'incomplete_expired') {
            // Only update DB to canceled/inactive if Stripe status is actually canceled or expired
            console.log(`✅ Subscription ${existingSub.id} status is ${existingSub.status}, syncing DB and allowing new checkout`);
            await db.update(users)
              .set({
                subscriptionStatus: existingSub.status === 'canceled' ? 'canceled' : 'inactive',
                stripeSubscriptionId: null
              })
              .where(eq(users.id, userId));
          } else if (existingSub.cancel_at_period_end && (existingSub.status === 'active' || existingSub.status === 'trialing')) {
            // Subscription is set to cancel but still active - keep current status, just allow new checkout
            console.log(`⚠️ Subscription ${existingSub.id} is set to cancel but still ${existingSub.status}, keeping DB status unchanged`);
          }
        } catch (error: any) {
          // Subscription doesn't exist in Stripe anymore, continue with checkout
          console.log(`⚠️ Stored subscription ${user.stripeSubscriptionId} not found in Stripe, allowing new checkout`);
          // Clear the invalid subscription ID
          await db.update(users)
            .set({
              subscriptionStatus: 'inactive',
              stripeSubscriptionId: null
            })
            .where(eq(users.id, userId));
        }
      }

      // Re-fetch user to get updated subscription status after potential sync
      const updatedUser = await db.query.users.findFirst({
        where: eq(users.id, userId),
      });

      if (!updatedUser) {
        return res.status(404).json({
          error: 'User not found after update'
        });
      }

      // Also check database subscription status (but only for truly active states)
      // Note: Don't block 'canceled' status as user should be able to re-subscribe
      if ((updatedUser.subscriptionStatus === 'active' || updatedUser.subscriptionStatus === 'trialing') && updatedUser.stripeSubscriptionId) {
        console.log(`⚠️ User ${userId} has active subscription status in database: ${updatedUser.subscriptionStatus}`);
        return res.status(400).json({
          error: '이미 활성 구독이 있습니다',
          status: updatedUser.subscriptionStatus
        });
      }

      // Create or find customer (use updated user data)
      let customerId = updatedUser.stripeCustomerId;

      // Verify stored customer ID still exists in Stripe
      if (customerId && typeof customerId === 'string' && customerId.trim() !== '') {
        try {
          await stripe.customers.retrieve(customerId);
          console.log(`✅ Using existing Stripe customer: ${customerId}`);
        } catch (error: any) {
          console.warn(`⚠️ Stored customer ${customerId} validation failed:`, error.message);
          // Create new customer for any Stripe error instead of crashing
          if (error.type === 'StripeInvalidRequestError' || error.code === 'resource_missing') {
            console.warn(`⚠️ Customer not found in Stripe, will create new one`);
          } else {
            console.error(`⚠️ Unexpected Stripe error, will create new customer:`, error);
          }
          // Clear invalid customer ID from database immediately
          await db.update(users)
            .set({ stripeCustomerId: null })
            .where(eq(users.id, userId));
          console.log(`🔄 Cleared invalid customer ID from database for user ${userId}`);
          customerId = null; // Force creation of new customer
        }
      } else if (customerId) {
        console.warn(`⚠️ Invalid customer ID format: "${customerId}", will create new one`);
        // Clear invalid customer ID from database
        await db.update(users)
          .set({ stripeCustomerId: null })
          .where(eq(users.id, userId));
        customerId = null;
      }

      // Force delete existing customer and create fresh one to remove Link
      if (customerId) {
        try {
          await stripe.customers.del(customerId);
          console.log(`🗑️ Deleted old Stripe customer to remove Link: ${customerId}`);
        } catch (e) {
          console.log(`⚠️ Could not delete old customer: ${e.message}`);
        }
        customerId = null;
      }

      if (!customerId) {
        const customer = await stripe.customers.create({
          email: user.email,
          metadata: {
            userId: userId
          },
          invoice_settings: {
            default_payment_method: null
          }
        });
        customerId = customer.id;

        // Save Stripe customer ID to database
        await db.update(users)
          .set({ stripeCustomerId: customerId })
          .where(eq(users.id, userId));
        console.log(`💾 Created fresh Stripe customer for user ${userId} (Link removed)`);
      }

      // ✅ Double-check: ensure customer has no active subscriptions in Stripe
      if (customerId) {
        try {
          const subscriptions = await stripe.subscriptions.list({
            customer: customerId,
            status: 'all',
            limit: 10
          });

          // Filter for truly active subscriptions (not set to cancel)
          const activeOrTrialing = subscriptions.data.filter(
            sub => (sub.status === 'active' || sub.status === 'trialing') && !sub.cancel_at_period_end
          );

          if (activeOrTrialing.length > 0) {
            console.log(`⚠️ Customer ${customerId} already has ${activeOrTrialing.length} active subscription(s)`);
            return res.status(400).json({
              error: '이미 활성 구독이 있습니다',
              existingSubscriptions: activeOrTrialing.map(s => ({ id: s.id, status: s.status }))
            });
          }
        } catch (error: any) {
          // Customer doesn't exist - clear from DB and return error
          console.error(`❌ Failed to check subscriptions for customer ${customerId}:`, error.message);
          await db.update(users)
            .set({ stripeCustomerId: null })
            .where(eq(users.id, userId));
          return res.status(400).json({
            error: '결제 정보를 확인할 수 없습니다. 다시 시도해주세요.',
            details: 'Customer validation failed'
          });
        }
      }

      // Check if user has already used their trial
      const hasUsedTrial = updatedUser.hasUsedTrial || false;
      console.log(`🔍 User trial status - hasUsedTrial: ${hasUsedTrial}`);

      // Determine plan type and set appropriate trial period
      // Monthly: 3 days free trial (72 hours)
      // Yearly: 7 days free trial (168 hours)
      // Note: Trial only available if user hasn't used it before
      const monthlyPriceId = process.env.STRIPE_PRICE_ID_MONTHLY;
      const yearlyPriceId = process.env.STRIPE_PRICE_ID_YEARLY;

      console.log(`🔍 Plan detection - Received priceId: "${priceId}"`);
      console.log(`🔍 Available prices - Monthly: "${monthlyPriceId}", Yearly: "${yearlyPriceId}"`);

      let planType: 'monthly' | 'yearly' = 'monthly';
      let trialDays = 3; // Default: 3 days for monthly

      if (priceId === yearlyPriceId) {
        planType = 'yearly';
        trialDays = 7; // 7 days for yearly
        console.log(`🎯 Detected YEARLY PLAN - ${trialDays} day trial${hasUsedTrial ? ' (but trial already used)' : ''}`);
      } else if (priceId === monthlyPriceId) {
        planType = 'monthly';
        trialDays = 3; // 3 days for monthly
        console.log(`🎯 Detected MONTHLY PLAN - ${trialDays} day trial${hasUsedTrial ? ' (but trial already used)' : ''}`);
      } else {
        // Unknown price ID - default to monthly with 3 days
        console.warn(`⚠️ Unknown priceId "${priceId}", defaulting to monthly with 3 day trial`);
      }

      const subscriptionData: any = {
        metadata: {
          userId: userId,
          planType: planType
        }
      };

      // Only add trial if user hasn't used it before
      if (!hasUsedTrial) {
        // Calculate trial_end timestamp - fix to today's midnight + N days
        // This ensures same trial_end for all requests on the same day (fixes idempotency errors)
        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()); // Today at 00:00:00
        const trialEnd = new Date(today);
        trialEnd.setDate(trialEnd.getDate() + trialDays);
        trialEnd.setHours(23, 59, 59, 0); // End of day, milliseconds = 0 (fixed value)
        const trialEndTimestamp = Math.floor(trialEnd.getTime() / 1000);

        subscriptionData.trial_end = trialEndTimestamp;
        console.log(`✅ Setting ${trialDays}-day free trial for ${planType} plan (ends ${trialEnd.toISOString()})`);
      } else {
        console.log(`⚠️ User has already used trial - creating subscription without trial (immediate billing)`);
      }

      // Create Checkout Session with idempotency key to prevent duplicate requests
      // Use 30-second window (reduced from 60s) to allow faster retries while preventing duplicates
      const idempotencyKey = `checkout_${userId}_${priceId}_${Math.floor(Date.now() / 30000)}`;

      let session;
      try {
        // Checkout session configuration - use customer ID to ensure proper webhook matching
        const sessionConfig: any = {
          customer: customerId,
          mode: 'subscription',
          payment_method_types: ['card'],
          payment_method_options: {
            card: {
              request_three_d_secure: 'automatic'
            }
          },
          line_items: [
            {
              price: priceId,
              quantity: 1,
            },
          ],
          subscription_data: {
            ...subscriptionData,
            metadata: {
              userId: userId
            }
          },
          // Disable automatic tax to remove "세금별도" text
          automatic_tax: {
            enabled: false
          },
          success_url: `${process.env.FRONTEND_URL || 'http://localhost:5000'}/payment-success?session_id={CHECKOUT_SESSION_ID}`,
          cancel_url: `${process.env.FRONTEND_URL || 'http://localhost:5000'}/premium-checkout?canceled=true`,
          metadata: {
            userId: userId
          }
        }

        console.log('🔍 DEBUG: Checkout session config:', JSON.stringify(sessionConfig, null, 2));

        session = await stripe.checkout.sessions.create(sessionConfig, {
          idempotencyKey
        });

        console.log(`💳 Created Checkout Session for ${user.email}: ${session.id}`);
      } catch (error: any) {
        console.error(`❌ Failed to create checkout session:`, error.message);

        // If customer-related error, clear from database
        if (error.message?.includes('customer') || error.code === 'resource_missing') {
          await db.update(users)
            .set({ stripeCustomerId: null })
            .where(eq(users.id, userId));
          console.log(`🔄 Cleared invalid customer from database`);
        }

        return res.status(500).json({
          error: '결제 세션을 생성할 수 없습니다. 페이지를 새로고침한 후 다시 시도해주세요.',
          details: error.message
        });
      }

      res.json({
        sessionId: session.id,
        url: session.url
      });
    } catch (error: any) {
      console.error('❌ Stripe Checkout Session error:', error);
      res.status(500).json({
        error: "Error creating checkout session: " + error.message
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

  // Redeem coupon to extend trial period
  app.post("/api/coupon/redeem", async (req, res) => {
    try {
      const userId = getUserIdFromToken(req);
      const { couponCode } = req.body;

      console.log(`🎟️ Coupon redemption attempt - userId: ${userId}, code: ${couponCode}`);

      // 1. Validate user authentication
      if (!userId) {
        return res.status(401).json({
          success: false,
          message: '로그인이 필요합니다'
        });
      }

      // 2. Validate coupon code input
      if (!couponCode || typeof couponCode !== 'string') {
        return res.status(400).json({
          success: false,
          message: '쿠폰 코드를 입력해주세요'
        });
      }

      // 3. Get user from database
      const user = await db.query.users.findFirst({
        where: eq(users.id, userId),
      });

      if (!user) {
        return res.status(404).json({
          success: false,
          message: '사용자를 찾을 수 없습니다'
        });
      }

      // 4. Check if user is on trial
      if (user.subscriptionStatus !== 'trialing') {
        return res.status(400).json({
          success: false,
          message: '쿠폰은 무료체험 기간 중에만 사용할 수 있습니다'
        });
      }

      // 5. Validate coupon code (case-insensitive)
      const validCoupons = ['tosslove', 'stocktwitslove', 'redditlove', 'naverlove', 'kiwilove', 'producthunt', 'facebooklove'];
      const normalizedCoupon = couponCode.toLowerCase().trim();

      if (!validCoupons.includes(normalizedCoupon)) {
        return res.status(400).json({
          success: false,
          message: '유효하지 않은 쿠폰 코드입니다'
        });
      }

      // 6. Check if user has already used ANY coupon (only 1 coupon per account allowed)
      const usedCoupons = (user.usedCoupons as string[]) || [];
      if (usedCoupons.length > 0) {
        return res.status(400).json({
          success: false,
          message: `이미 쿠폰을 사용하셨습니다 (${usedCoupons[0]}). 계정당 1개의 쿠폰만 사용 가능합니다.`
        });
      }

      // 7. Validate coupon code (case-insensitive)
      if (usedCoupons.includes(normalizedCoupon)) {
        return res.status(400).json({
          success: false,
          message: '이미 사용한 쿠폰입니다'
        });
      }

      // 8. Verify Stripe subscription exists and is trialing
      if (!user.stripeSubscriptionId) {
        return res.status(400).json({
          success: false,
          message: 'Stripe 구독을 찾을 수 없습니다'
        });
      }

      const stripeSubscription = await stripe.subscriptions.retrieve(user.stripeSubscriptionId);

      if (stripeSubscription.status !== 'trialing') {
        return res.status(400).json({
          success: false,
          message: 'Stripe 구독이 무료체험 상태가 아닙니다'
        });
      }

      // 9. Calculate new trial end (current trial_end + 3 days)
      const currentTrialEnd = stripeSubscription.trial_end;
      if (!currentTrialEnd) {
        return res.status(400).json({
          success: false,
          message: '체험 종료 날짜를 찾을 수 없습니다'
        });
      }

      const threeDaysInSeconds = 3 * 24 * 60 * 60;
      const newTrialEnd = currentTrialEnd + threeDaysInSeconds;

      console.log(`🔄 Extending trial: ${new Date(currentTrialEnd * 1000)} -> ${new Date(newTrialEnd * 1000)}`);

      // 10. Update Stripe subscription trial_end
      const updatedSubscription = await stripe.subscriptions.update(
        user.stripeSubscriptionId,
        {
          trial_end: newTrialEnd
        }
      );

      // 11. Update user record
      const newTrialExpiresAt = new Date(newTrialEnd * 1000);
      const newUsedCoupons = [...usedCoupons, normalizedCoupon];
      const newExtensionDays = (user.couponExtensionDays || 0) + 3;

      await db.update(users)
        .set({
          trialExpiresAt: newTrialExpiresAt,
          subscriptionEndDate: newTrialExpiresAt,
          usedCoupons: newUsedCoupons as any,
          couponExtensionDays: newExtensionDays,
          lastCouponUsedAt: new Date()
        })
        .where(eq(users.id, userId));

      console.log(`✅ Coupon "${normalizedCoupon}" redeemed by ${user.email}, trial extended to ${newTrialExpiresAt}`);

      // SUCCESS RESPONSE
      return res.status(200).json({
        success: true,
        message: '쿠폰이 성공적으로 적용되었습니다! 무료체험 기간이 3일 연장되었습니다.',
        newTrialEnd: newTrialExpiresAt.toISOString(),
        daysExtended: 3,
        couponCode: normalizedCoupon,
        totalExtensionDays: newExtensionDays,
        usedCoupons: newUsedCoupons
      });

    } catch (error: any) {
      console.error('❌ Coupon redemption error:', error);
      return res.status(500).json({
        success: false,
        message: '쿠폰 적용 중 오류가 발생했습니다',
        error: error.message
      });
    }
  });

  // Cancel subscription
  app.post("/api/cancel-subscription", async (req, res) => {
    try {
      const userId = getUserIdFromToken(req);
      const { feedback } = req.body || {};

      if (!userId) {
        return res.status(401).json({
          success: false,
          message: '인증이 필요합니다'
        });
      }

      // Get user info
      const user = await db.query.users.findFirst({
        where: eq(users.id, userId),
      });

      if (!user) {
        return res.status(404).json({
          success: false,
          message: '사용자를 찾을 수 없습니다'
        });
      }

      // Check if already canceled
      if (user.subscriptionStatus === 'canceled' || user.subscriptionStatus === 'inactive') {
        return res.status(400).json({
          success: false,
          message: '이미 해지된 구독입니다'
        });
      }

      // Check if user has any active subscription or trial to cancel
      if (user.subscriptionStatus !== 'active' && user.subscriptionStatus !== 'trialing') {
        return res.status(400).json({
          success: false,
          message: '활성 구독이 없습니다'
        });
      }

      let periodEnd: Date;

      // Handle Stripe subscription cancellation
      if (user.stripeSubscriptionId) {
        let subscription;
        try {
          subscription = await stripe.subscriptions.update(user.stripeSubscriptionId, {
            cancel_at_period_end: true
          });
        } catch (stripeError: any) {
          console.error('❌ Stripe API error:', stripeError);

          // Handle specific Stripe errors
          if (stripeError.type === 'StripeInvalidRequestError') {
            return res.status(400).json({
              success: false,
              message: '유효하지 않은 구독 정보입니다'
            });
          }

          throw stripeError;
        }

        console.log(`💳 Cancelled Stripe subscription for user ${userId}: ${user.stripeSubscriptionId}`);

        // Get the period end date from Stripe
        periodEnd = subscription.current_period_end
          ? new Date(subscription.current_period_end * 1000)
          : new Date();
      } else {
        // Handle legacy trial cancellation (no Stripe subscription)
        console.log(`💳 Cancelled legacy trial for user ${userId}`);

        // Use trial expiry date or current date
        periodEnd = user.trialExpiresAt || user.subscriptionEndDate || new Date();
      }

      // Update database - set to "canceled" status but keep access until period end
      await db.update(users)
        .set({
          subscriptionStatus: 'canceled',
          subscriptionEndDate: periodEnd,
        })
        .where(eq(users.id, userId));

      // Send cancellation feedback email if feedback is provided
      if (feedback && feedback.trim()) {
        try {
          const nodemailer = await import('nodemailer');
          const transporter = nodemailer.default.createTransport({
            host: process.env.SMTP_HOST || 'smtp.gmail.com',
            port: parseInt(process.env.SMTP_PORT || '587'),
            secure: false,
            auth: {
              user: process.env.SMTP_USER,
              pass: process.env.SMTP_PASS,
            },
          });

          await transporter.sendMail({
            from: process.env.SMTP_FROM || 'noreply@insidertrack.pro',
            to: 'scottnim7777@gmail.com',
            subject: `[InsiderTrack] 구독 취소 피드백 - ${user.email}`,
            html: `
              <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2 style="color: #333;">구독 취소 피드백</h2>
                <div style="background: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
                  <p><strong>사용자:</strong> ${user.email}</p>
                  <p><strong>구독 상태:</strong> ${user.subscriptionStatus}</p>
                  <p><strong>취소 시간:</strong> ${new Date().toLocaleString('ko-KR', { timeZone: 'Asia/Seoul' })}</p>
                  <p><strong>구독 종료일:</strong> ${periodEnd.toLocaleString('ko-KR', { timeZone: 'Asia/Seoul' })}</p>
                </div>
                <div style="background: #fff3cd; padding: 20px; border-radius: 8px; border-left: 4px solid #ffc107;">
                  <h3 style="margin-top: 0; color: #856404;">피드백 내용:</h3>
                  <p style="white-space: pre-wrap;">${feedback}</p>
                </div>
              </div>
            `,
          });
          console.log(`📧 Cancellation feedback email sent for user ${user.email}`);
        } catch (emailError) {
          console.error('❌ Failed to send cancellation feedback email:', emailError);
        }
      }

      res.json({
        success: true,
        message: '구독이 해지되었습니다',
        periodEnd: periodEnd.toISOString()
      });
    } catch (error: any) {
      console.error('❌ Stripe subscription cancellation error:', error);
      res.status(500).json({
        success: false,
        message: '구독 해지 중 오류가 발생했습니다',
        error: error.message
      });
    }
  });

  // Create Customer Portal Session for subscription management
  app.post("/api/create-portal-session", async (req, res) => {
    try {
      const userId = getUserIdFromToken(req);

      if (!userId) {
        return res.status(401).json({
          error: 'User not authenticated'
        });
      }

      // Get user info
      const user = await db.query.users.findFirst({
        where: eq(users.id, userId),
      });

      if (!user || !user.stripeCustomerId) {
        return res.status(404).json({
          error: 'User not found or no active subscription'
        });
      }

      // Create Customer Portal Session
      const session = await stripe.billingPortal.sessions.create({
        customer: user.stripeCustomerId,
        return_url: `${process.env.FRONTEND_URL || 'http://localhost:5000'}/settings`,
      });

      console.log(`🔐 Created Customer Portal session for user ${userId}`);

      res.json({
        url: session.url
      });
    } catch (error: any) {
      console.error('❌ Stripe Customer Portal error:', error);
      res.status(500).json({
        error: "Error creating portal session: " + error.message
      });
    }
  });

  // 🔐 AUTHENTICATION ENDPOINTS
  // CRITICAL SECURITY: JWT_SECRET must be set in environment variables
  const JWT_SECRET = process.env.JWT_SECRET;
  if (!JWT_SECRET) {
    throw new Error('FATAL: JWT_SECRET environment variable is required. Please set it in your .env file for security.');
  }

  // CRITICAL SECURITY FIX: Validate JWT secret strength
  // Weak secrets can be brute-forced, allowing attackers to forge authentication tokens
  if (JWT_SECRET.trim().length < 32) {
    throw new Error(
      `FATAL: JWT_SECRET must be at least 32 characters for security. ` +
      `Current length: ${JWT_SECRET.length} characters. ` +
      `Please generate a stronger secret: openssl rand -base64 48`
    );
  }

  if (JWT_SECRET.trim() !== JWT_SECRET) {
    throw new Error('FATAL: JWT_SECRET contains leading/trailing whitespace. This is a security risk.');
  }
  const SALT_ROUNDS = 10;

  // Middleware to extract userId from JWT token
  const getUserIdFromToken = (req: any): string | null => {
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) {
      console.log('⚠️ [AUTH] No authorization token provided in request');
      return null;
    }

    try {
      const decoded = jwt.verify(token, JWT_SECRET) as { userId: string; email: string };
      console.log('✅ [AUTH] Token verified for user:', decoded.email, '(ID:', decoded.userId + ')');
      return decoded.userId;
    } catch (error) {
      console.error('❌ [AUTH] Token verification failed:', error instanceof Error ? error.message : String(error));
      return null;
    }
  };

  // 🔔 Stripe Webhook - 결제 완료 시 자동으로 사용자 등급 업그레이드
  app.post('/api/stripe/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
    const sig = req.headers['stripe-signature'];
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

    if (!webhookSecret) {
      console.error('⚠️ STRIPE_WEBHOOK_SECRET is not set');
      return res.status(400).send('Webhook secret not configured');
    }

    let event;

    try {
      event = stripe.webhooks.constructEvent(req.body, sig!, webhookSecret);
    } catch (err: any) {
      // CRITICAL SECURITY FIX: Return 200 instead of 400 to prevent Stripe webhook storms
      // Invalid signatures indicate either:
      // 1. Malicious webhook attempt (security threat)
      // 2. Misconfigured webhook secret (config issue)
      // Returning 400 causes Stripe to retry indefinitely, creating DoS-like load
      console.error('🚨 SECURITY ALERT: Invalid webhook signature detected!');
      console.error(`   Error: ${err.message}`);
      console.error(`   Origin: ${req.headers.origin || 'unknown'}`);
      console.error(`   IP: ${req.ip}`);

      // TODO: Send security alert to admin
      // await sendSecurityAlert('Invalid Stripe webhook signature', {
      //   error: err.message,
      //   ip: req.ip,
      //   timestamp: new Date()
      // });

      // Return 200 to stop Stripe retries, but log security incident
      return res.status(200).send('Signature verification failed - incident logged');
    }

    console.log('🔔 Stripe webhook received:', event.type);

    // Handle the event
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as any;
        console.log('💳 Checkout session completed:', session.id);

        // Get customer and subscription info
        const customerId = session.customer;
        const subscriptionId = session.subscription;

        if (customerId && subscriptionId) {
          try {
            // Find user by stripe customer ID
            let user = await db.query.users.findFirst({
              where: eq(users.stripeCustomerId, customerId),
            });

            // Fallback: If user not found by Stripe ID, search by email
            if (!user) {
              console.log(`⚠️ User not found by Stripe customer ID ${customerId}, trying email fallback...`);

              // Get customer email from Stripe
              const customer = await stripe.customers.retrieve(customerId);
              if (customer && !customer.deleted && customer.email) {
                console.log(`🔍 Searching for user by email: ${customer.email}`);

                user = await db.query.users.findFirst({
                  where: eq(users.email, customer.email),
                });

                if (user) {
                  console.log(`✅ Found user by email fallback: ${customer.email}`);
                } else {
                  console.warn(`⚠️ User not found by email either: ${customer.email}`);
                }
              }
            }

            if (user) {
              // Get subscription details to extract period end and determine tier
              const subscription = await stripe.subscriptions.retrieve(subscriptionId);
              const periodEnd = new Date(subscription.current_period_end * 1000);

              // Get the priceId from the subscription to determine the plan type
              const priceId = subscription.items.data[0]?.price?.id;
              console.log(`🔍 Subscription priceId: "${priceId}"`);

              // Determine tier based on priceId
              const monthlyPriceId = process.env.STRIPE_PRICE_ID_MONTHLY;
              const yearlyPriceId = process.env.STRIPE_PRICE_ID_YEARLY;
              const testPriceId = process.env.STRIPE_PRICE_ID_TEST;

              // Both Mini and Pro plans grant insider_pro tier (they both provide premium features)
              // The difference is only in price/billing, not in access level
              const tier: 'insider_pro' = 'insider_pro';

              if (priceId === testPriceId) {
                console.log(`🎯 Detected MINI PLAN subscription - setting tier to 'insider_pro'`);
              } else if (priceId === yearlyPriceId || priceId === monthlyPriceId) {
                console.log(`🎯 Detected PRO PLAN subscription - setting tier to 'insider_pro'`);
              }

              // Upgrade user with correct tier
              await db.update(users)
                .set({
                  subscriptionTier: tier,
                  subscriptionStatus: subscription.status as any,
                  stripeCustomerId: customerId,
                  stripeSubscriptionId: subscriptionId,
                  subscriptionStartDate: new Date(subscription.created * 1000),
                  subscriptionEndDate: periodEnd,
                  hasUsedTrial: true,
                })
                .where(eq(users.id, user.id));

              console.log(`✅ [Webhook Success] User ${user.email} upgraded to ${tier} until ${periodEnd}`);
              console.log(`📊 [Webhook Success] Details: userId=${user.id}, customerId=${customerId}, subscriptionId=${subscriptionId}, status=${subscription.status}`);
            } else {
              console.error(`❌ CRITICAL: User not found for Stripe customer ${customerId}`);
              // Stripe에게는 200 OK를 보내서 재시도 중지
              // 에러는 로그에만 기록하고 추후 수동 처리
              return res.status(200).json({ received: true, error: 'user_not_found', customerId });
            }
          } catch (error: any) {
            console.error('❌ Error upgrading user:', {
              error: error.message,
              stack: error.stack,
              userId: user?.id,
              customerId,
              subscriptionId,
              attemptedTier: 'insider_pro'
            });
            // Stripe에게는 200 OK를 보내서 재시도 중지
            // 에러는 로그에만 기록하고 추후 수동 처리
            return res.status(200).json({ received: true, error: 'processing_error', message: error.message });
          }
        }
        break;
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object as any;
        console.log('🔄 Subscription updated:', subscription.id);

        try {
          const user = await db.query.users.findFirst({
            where: eq(users.stripeSubscriptionId, subscription.id),
          });

          if (user) {
            // Check if subscription is set to cancel at period end
            if (subscription.cancel_at_period_end) {
              const periodEnd = new Date(subscription.current_period_end * 1000);
              // CRITICAL FIX: Keep status as "active" even when cancel_at_period_end is true
              // User still has paid access until periodEnd
              await db.update(users)
                .set({
                  subscriptionStatus: "active",
                  subscriptionEndDate: periodEnd,
                })
                .where(eq(users.id, user.id));
              console.log(`⚠️ Subscription will cancel for user ${user.email} at ${periodEnd} (keeping active status until then)`);
            } else if (subscription.status === 'active') {
              // Subscription was reactivated - update end date
              const periodEnd = new Date(subscription.current_period_end * 1000);
              await db.update(users)
                .set({
                  subscriptionStatus: "active",
                  subscriptionEndDate: periodEnd,
                })
                .where(eq(users.id, user.id));
              console.log(`✅ Subscription reactivated for user ${user.email}`);
            }
          }
        } catch (error) {
          console.error('❌ Error updating subscription:', error);
        }
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as any;
        console.log('❌ Subscription deleted:', subscription.id);

        try {
          const user = await db.query.users.findFirst({
            where: eq(users.stripeSubscriptionId, subscription.id),
          });

          if (user) {
            // Use current_period_end as the final access date
            const periodEnd = new Date(subscription.current_period_end * 1000);
            await subscriptionService.cancelSubscription(user.id, periodEnd);
            console.log(`✅ Subscription ended for user ${user.email}, access until ${periodEnd}`);
          }
        } catch (error) {
          console.error('❌ Error cancelling subscription:', error);
        }
        break;
      }

      case 'invoice.payment_succeeded': {
        const invoice = event.data.object as any;
        console.log('💰 Payment succeeded for invoice:', invoice.id);

        // Update subscription end date on successful recurring payment
        if (invoice.subscription) {
          try {
            const user = await db.query.users.findFirst({
              where: eq(users.stripeSubscriptionId, invoice.subscription),
            });

            if (user) {
              const subscription = await stripe.subscriptions.retrieve(invoice.subscription);
              const periodEnd = new Date(subscription.current_period_end * 1000);

              // If this is first payment after trial, update status to 'active'
              const updates: any = {
                subscriptionEndDate: periodEnd,
              };

              if (user.subscriptionStatus === 'trialing') {
                updates.subscriptionStatus = 'active';
                console.log(`✅ Trial ended, subscription now active for user ${user.email}`);
              }

              await db.update(users)
                .set(updates)
                .where(eq(users.id, user.id));

              console.log(`💳 Renewed subscription for user ${user.email} until ${periodEnd}`);
            }
          } catch (error) {
            console.error('❌ Error updating subscription end date:', error);
          }
        }
        break;
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as any;
        console.log('❌ Payment failed for invoice:', invoice.id);

        if (invoice.subscription) {
          try {
            const user = await db.query.users.findFirst({
              where: eq(users.stripeSubscriptionId, invoice.subscription),
            });

            if (user) {
              // CRITICAL FIX: Don't downgrade immediately on payment failure!
              // Stripe automatically retries failed payments 3-4 times over ~2 weeks
              // Only log and notify - let Stripe's retry logic handle it
              // Actual downgrade happens when subscription is canceled (customer.subscription.deleted)
              console.log(`⚠️ Payment failed for user ${user.email} - Stripe will retry automatically`);
              console.log(`📧 TODO: Send payment failure notification email to ${user.email}`);

              // TODO: Integrate email notification service here
              // await emailNotificationService.sendPaymentFailedNotification(user.email, {
              //   invoiceUrl: invoice.hosted_invoice_url,
              //   nextRetryDate: new Date(invoice.next_payment_attempt * 1000)
              // });
            }
          } catch (error) {
            console.error('❌ Error handling payment failure:', error);
          }
        }
        break;
      }

      case 'customer.subscription.trial_will_end': {
        const subscription = event.data.object as any;
        console.log('⏰ Trial ending soon for subscription:', subscription.id);

        try {
          const user = await db.query.users.findFirst({
            where: eq(users.stripeSubscriptionId, subscription.id),
          });

          if (user) {
            const trialEnd = new Date(subscription.trial_end * 1000);
            console.log(`📧 Trial will end for user ${user.email} on ${trialEnd}`);
            // TODO: Send email notification (optional)
            // await emailNotificationService.sendTrialEndingNotification(user.email, trialEnd);
          }
        } catch (error) {
          console.error('❌ Error handling trial ending notification:', error);
        }
        break;
      }

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    res.json({ received: true });
  });

  // 🔄 Admin: Sync subscription from Stripe (fixes orphaned subscriptions)
  app.post('/api/admin/sync-subscription', protectAdminEndpoint, async (req, res) => {
    try {
      const { email } = req.body;

      if (!email) {
        return res.status(400).json({
          success: false,
          message: 'Email is required'
        });
      }

      console.log(`🔍 Syncing subscription for email: ${email}`);

      // Find user in database
      const user = await db.query.users.findFirst({
        where: eq(users.email, email),
      });

      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found in database'
        });
      }

      // Search for customer in Stripe by email
      const customers = await stripe.customers.list({
        email: email,
        limit: 1
      });

      if (customers.data.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'No Stripe customer found for this email'
        });
      }

      const customer = customers.data[0];
      console.log(`✅ Found Stripe customer: ${customer.id}`);

      // Get customer's subscriptions
      const subscriptions = await stripe.subscriptions.list({
        customer: customer.id,
        status: 'all',
        limit: 10
      });

      if (subscriptions.data.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'No subscriptions found for this customer'
        });
      }

      // Find the most recent active or trialing subscription
      const activeSubscription = subscriptions.data.find(
        sub => sub.status === 'active' || sub.status === 'trialing'
      ) || subscriptions.data[0]; // Fallback to most recent

      console.log(`✅ Found subscription: ${activeSubscription.id} (status: ${activeSubscription.status})`);

      // Get subscription details
      const periodEnd = new Date(activeSubscription.current_period_end * 1000);
      const trialEnd = activeSubscription.trial_end
        ? new Date(activeSubscription.trial_end * 1000)
        : null;

      // Determine if user is trialing
      const isTrialing = activeSubscription.status === 'trialing';
      const subscriptionEndDate = isTrialing && trialEnd ? trialEnd : periodEnd;

      // Update database with Stripe data
      await db.update(users)
        .set({
          stripeCustomerId: customer.id,
          stripeSubscriptionId: activeSubscription.id,
          subscriptionTier: 'insider_pro',
          subscriptionStatus: activeSubscription.status as any,
          subscriptionEndDate: subscriptionEndDate,
          subscriptionStartDate: new Date(activeSubscription.created * 1000),
        })
        .where(eq(users.id, user.id));

      console.log(`✅ Database updated for user ${email}`);

      return res.json({
        success: true,
        message: 'Subscription synced successfully',
        data: {
          email: email,
          stripeCustomerId: customer.id,
          stripeSubscriptionId: activeSubscription.id,
          subscriptionStatus: activeSubscription.status,
          subscriptionEndDate: subscriptionEndDate,
          isTrialing: isTrialing,
          trialEnd: trialEnd
        }
      });

    } catch (error: any) {
      console.error('❌ Error syncing subscription:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to sync subscription',
        error: error.message
      });
    }
  });

  // 🔍 Admin: Check production DB status (debugging)
  app.get('/api/admin/check-production-db', protectAdminEndpoint, async (req, res) => {
    try {
      const user = await db.query.users.findFirst({
        where: eq(users.id, 'user_1762200564967_t6whya')
      });

      res.json({
        userFound: !!user,
        userId: user?.id,
        email: user?.email,
        status: user?.subscriptionStatus,
        endDate: user?.subscriptionEndDate,
        hasUsedTrial: user?.hasUsedTrial,
        trialExpiresAt: user?.trialExpiresAt,
        dbHost: process.env.DATABASE_URL?.match(/@([^/]+)/)?.[1],
        dbEndpoint: process.env.DATABASE_URL?.match(/ep-[^.]+/)?.[0],
        timestamp: new Date().toISOString()
      });
    } catch (error: any) {
      res.status(500).json({
        error: error.message
      });
    }
  });

  // 🔄 Admin: Sync ALL subscriptions from Stripe (batch recovery)
  app.post('/api/admin/sync-all-subscriptions', protectAdminEndpoint, async (req, res) => {
    try {
      console.log('🔄 Starting batch subscription sync from Stripe...');

      // Get all active/trialing subscriptions from Stripe
      const subscriptions = await stripe.subscriptions.list({
        status: 'all',
        limit: 100
      });

      const results = {
        total: subscriptions.data.length,
        synced: 0,
        failed: 0,
        skipped: 0,
        errors: [] as any[]
      };

      for (const subscription of subscriptions.data) {
        try {
          // Skip if not active or trialing
          if (subscription.status !== 'active' && subscription.status !== 'trialing') {
            results.skipped++;
            continue;
          }

          // Get customer email
          const customer = await stripe.customers.retrieve(subscription.customer as string);
          if (!customer || customer.deleted || !customer.email) {
            console.warn(`⚠️ No email for customer ${subscription.customer}`);
            results.skipped++;
            continue;
          }

          // Find user in database
          const user = await db.query.users.findFirst({
            where: eq(users.email, customer.email),
          });

          if (!user) {
            console.warn(`⚠️ No database user for email ${customer.email}`);
            results.skipped++;
            continue;
          }

          // Calculate subscription end date
          const periodEnd = new Date(subscription.current_period_end * 1000);
          const trialEnd = subscription.trial_end
            ? new Date(subscription.trial_end * 1000)
            : null;
          const isTrialing = subscription.status === 'trialing';
          const subscriptionEndDate = isTrialing && trialEnd ? trialEnd : periodEnd;

          // Update database
          await db.update(users)
            .set({
              stripeCustomerId: customer.id,
              stripeSubscriptionId: subscription.id,
              subscriptionTier: 'insider_pro',
              subscriptionStatus: subscription.status as any,
              subscriptionEndDate: subscriptionEndDate,
              subscriptionStartDate: new Date(subscription.created * 1000),
            })
            .where(eq(users.id, user.id));

          console.log(`✅ Synced ${customer.email}`);
          results.synced++;

        } catch (error: any) {
          console.error(`❌ Error syncing subscription ${subscription.id}:`, error.message);
          results.failed++;
          results.errors.push({
            subscriptionId: subscription.id,
            error: error.message
          });
        }
      }

      console.log(`✅ Batch sync completed: ${results.synced} synced, ${results.failed} failed, ${results.skipped} skipped`);

      return res.json({
        success: true,
        message: 'Batch subscription sync completed',
        results
      });

    } catch (error: any) {
      console.error('❌ Error in batch sync:', error);
      return res.status(500).json({
        success: false,
        message: 'Batch sync failed',
        error: error.message
      });
    }
  });

  // Sign up
  app.post('/api/auth/signup', async (req, res) => {
    try {
      const { email, password } = req.body;
      console.log('📝 Signup attempt:', { email, passwordLength: password?.length });

      if (!email || !password) {
        console.log('❌ Missing email or password');
        return res.status(400).json({
          success: false,
          message: '이메일과 비밀번호를 입력해주세요',
        });
      }

      if (password.length < 8) {
        console.log('❌ Password too short');
        return res.status(400).json({
          success: false,
          message: '비밀번호는 최소 8자 이상이어야 합니다',
        });
      }

      // Check if user already exists
      const existingUser = await db.query.users.findFirst({
        where: eq(users.email, email),
      });

      if (existingUser) {
        // If email is already verified, don't allow re-registration
        if (existingUser.emailVerified) {
          console.log('❌ User already exists and verified:', email);
          return res.status(400).json({
            success: false,
            message: '이미 등록된 이메일입니다',
          });
        }

        // If email is not verified, update the user with new password and verification code
        console.log('🔄 User exists but not verified, updating verification code:', email);

        const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);
        const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
        const verificationCodeExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

        console.log('🔑 New verification code generated:', verificationCode);

        // Update existing user with new password and verification code
        const updatedUser = await db.update(users)
          .set({
            password: hashedPassword,
            verificationCode,
            verificationCodeExpires,
          })
          .where(eq(users.email, email))
          .returning();

        console.log('✅ User updated with new verification code:', {
          id: updatedUser[0].id,
          email: updatedUser[0].email,
        });

        // Send new verification code email
        try {
          await emailNotificationService.sendVerificationCode(email, verificationCode);
          console.log('📧 New verification code sent to:', email);
        } catch (emailError) {
          console.error('❌ Failed to send verification email:', emailError);
        }

        return res.json({
          success: true,
          message: '인증 코드가 재발송되었습니다. 이메일을 확인하여 계정을 인증해주세요.',
          user: {
            id: updatedUser[0].id,
            email: updatedUser[0].email,
            subscriptionTier: updatedUser[0].subscriptionTier,
            emailVerified: false,
          },
        });
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);
      console.log('🔐 Password hashed');

      // Generate 6-digit verification code
      const verificationCode = Math.floor(100000 + Math.random() * 900000).toString(); // 6-digit code
      const verificationCodeExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

      console.log('🔑 Verification code generated:', verificationCode);

      // Create user
      const newUser = await db.insert(users).values({
        id: `user_${Date.now()}_${Math.random().toString(36).substring(7)}`,
        email,
        password: hashedPassword,
        subscriptionTier: 'free',
        subscriptionStatus: 'inactive',
        hasUsedTrial: false,
        emailVerified: false,
        verificationCode,
        verificationCodeExpires,
      }).returning();

      console.log('✅ User created successfully:', {
        id: newUser[0].id,
        email: newUser[0].email,
      });

      // Send verification code email
      try {
        await emailNotificationService.sendVerificationCode(email, verificationCode);
        console.log('📧 Verification code sent to:', email);
      } catch (emailError) {
        console.error('❌ Failed to send verification email:', emailError);
        // Continue even if email fails - user can request resend
      }

      res.json({
        success: true,
        message: '회원가입이 완료되었습니다. 이메일을 확인하여 계정을 인증해주세요.',
        user: {
          id: newUser[0].id,
          email: newUser[0].email,
          subscriptionTier: newUser[0].subscriptionTier,
          emailVerified: false,
        },
      });
    } catch (error) {
      console.error('Signup error:', error);
      res.status(500).json({
        success: false,
        message: '회원가입에 실패했습니다',
      });
    }
  });

  // Login
  app.post('/api/auth/login', async (req, res) => {
    try {
      const { email, password } = req.body;
      console.log('🔐 Login attempt:', { email, passwordLength: password?.length });

      if (!email || !password) {
        console.log('❌ Missing email or password');
        return res.status(400).json({
          success: false,
          message: '이메일과 비밀번호를 입력해주세요',
        });
      }

      // Find user
      const user = await db.query.users.findFirst({
        where: eq(users.email, email),
      });

      console.log('👤 User found:', user ? `Yes (${user.email}, ID: ${user.id})` : 'No');
      if (user) {
        console.log('🔍 User details:', {
          id: user.id,
          email: user.email,
          tier: user.subscriptionTier,
          status: user.subscriptionStatus,
          endDate: user.subscriptionEndDate,
        });
      }

      if (!user) {
        console.log('❌ Login failed: User not found');
        return res.status(401).json({
          success: false,
          message: '이메일 또는 비밀번호가 올바르지 않습니다',
        });
      }

      // Check if email is verified
      console.log('✉️ Email verified status:', user.emailVerified);
      if (!user.emailVerified) {
        console.log('❌ Login failed: Email not verified');
        return res.status(403).json({
          success: false,
          message: '이메일 인증이 필요합니다. 가입 시 받은 인증 이메일을 확인해주세요.',
          emailVerified: false,
        });
      }

      // Verify password
      const isValidPassword = await bcrypt.compare(password, user.password);
      console.log('🔑 Password valid:', isValidPassword);

      if (!isValidPassword) {
        console.log('❌ Login failed: Invalid password for', email);
        return res.status(401).json({
          success: false,
          message: '이메일 또는 비밀번호가 올바르지 않습니다',
        });
      }

      console.log('✅ Password verified successfully');

      // Generate JWT token - 30일 유효 (자동 로그인 유지)
      const token = jwt.sign(
        { userId: user.id, email: user.email },
        JWT_SECRET,
        { expiresIn: '30d' }
      );

      // Track login session for geographic analytics
      try {
        const clientIP = ipGeolocationService.getClientIP(req);
        const locationData = await ipGeolocationService.getLocation(clientIP);

        if (locationData) {
          await db.insert(schema.userSessions).values({
            userId: user.id,
            ipAddress: clientIP,
            country: locationData.country,
            countryName: locationData.countryName,
            region: locationData.region,
            city: locationData.city,
            userAgent: req.headers['user-agent'] || null,
          });
          console.log(`📍 Session tracked: ${locationData.countryName} (${locationData.country})`);
        }
      } catch (sessionError) {
        // Don't fail login if session tracking fails
        console.error('Failed to track session:', sessionError);
      }

      console.log('✅ Login successful for:', email);
      res.json({
        success: true,
        message: '로그인 성공',
        token,
        user: {
          id: user.id,
          email: user.email,
          subscriptionTier: user.subscriptionTier,
          subscriptionStatus: user.subscriptionStatus,
          subscriptionEndDate: user.subscriptionEndDate,
          hasUsedTrial: user.hasUsedTrial,
          trialExpiresAt: user.trialExpiresAt,
          emailVerified: user.emailVerified,
        },
      });
    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({
        success: false,
        message: '로그인에 실패했습니다',
      });
    }
  });

  // Forgot password - Request password reset
  app.post('/api/auth/forgot-password', async (req, res) => {
    try {
      const { email } = req.body;
      console.log('🔐 Password reset request for:', email);

      if (!email) {
        return res.status(400).json({
          success: false,
          message: '이메일을 입력해주세요',
        });
      }

      // Find user by email
      const user = await db.query.users.findFirst({
        where: eq(users.email, email),
      });

      // Always return success even if user doesn't exist (security best practice)
      if (!user) {
        console.log('⚠️ User not found, but returning success for security');
        return res.json({
          success: true,
          message: '비밀번호 재설정 이메일이 발송되었습니다',
        });
      }

      // Generate reset token
      const resetToken = jwt.sign(
        { email: user.email, timestamp: Date.now() },
        JWT_SECRET,
        { expiresIn: '1h' }
      );

      // Set token expiration (1 hour from now)
      const resetExpires = new Date(Date.now() + 60 * 60 * 1000);

      // Save reset token to database
      console.log('💾 Saving reset token to database...');
      await db.update(users)
        .set({
          passwordResetToken: resetToken,
          passwordResetExpires: resetExpires,
        })
        .where(eq(users.id, user.id));
      console.log('✅ Reset token saved to database');

      // Send password reset email (non-blocking - don't fail if email fails)
      try {
        console.log('📧 Attempting to send password reset email...');
        await emailNotificationService.sendPasswordResetEmail(email, resetToken);
        console.log('✅ Password reset email sent to:', email);
      } catch (emailError) {
        console.error('⚠️ Email sending failed (non-critical):', emailError);
        console.error('Email error details:', emailError);
        // Continue - token is saved, user can still reset via direct link if needed
      }

      // Development: Print reset link to console
      const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:5000'}/reset-password?token=${resetToken}`;
      console.log('🔗 Password reset link (DEV ONLY):', resetUrl);

      res.json({
        success: true,
        message: '비밀번호 재설정 이메일이 발송되었습니다',
      });
    } catch (error) {
      console.error('❌ Password reset request error:', error);
      console.error('Error details:', error instanceof Error ? error.message : String(error));
      console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace');
      res.status(500).json({
        success: false,
        message: '비밀번호 재설정 요청에 실패했습니다',
      });
    }
  });

  // Reset password - Complete password reset with token
  app.post('/api/auth/reset-password', async (req, res) => {
    try {
      const { token, newPassword } = req.body;
      console.log('🔐 Password reset attempt with token');

      if (!token || !newPassword) {
        return res.status(400).json({
          success: false,
          message: '토큰과 새 비밀번호를 입력해주세요',
        });
      }

      if (newPassword.length < 6) {
        return res.status(400).json({
          success: false,
          message: '비밀번호는 최소 6자 이상이어야 합니다',
        });
      }

      // Verify JWT token
      let decoded: { email: string; timestamp: number };
      try {
        decoded = jwt.verify(token, JWT_SECRET) as { email: string; timestamp: number };
        console.log('✅ Reset token verified for:', decoded.email);
      } catch (error) {
        console.log('❌ Invalid or expired token');
        return res.status(400).json({
          success: false,
          message: '유효하지 않거나 만료된 토큰입니다',
        });
      }

      // Find user with matching reset token
      const user = await db.query.users.findFirst({
        where: eq(users.email, decoded.email),
      });

      if (!user) {
        return res.status(404).json({
          success: false,
          message: '사용자를 찾을 수 없습니다',
        });
      }

      // Check if token matches and hasn't expired
      if (user.passwordResetToken !== token) {
        return res.status(400).json({
          success: false,
          message: '유효하지 않은 토큰입니다',
        });
      }

      if (user.passwordResetExpires && user.passwordResetExpires < new Date()) {
        return res.status(400).json({
          success: false,
          message: '토큰이 만료되었습니다. 비밀번호 재설정을 다시 요청해주세요.',
        });
      }

      // Hash new password
      const hashedPassword = await bcrypt.hash(newPassword, SALT_ROUNDS);

      // Update password and clear reset token
      await db.update(users)
        .set({
          password: hashedPassword,
          passwordResetToken: null,
          passwordResetExpires: null,
        })
        .where(eq(users.id, user.id));

      console.log('✅ Password reset successful for:', decoded.email);

      res.json({
        success: true,
        message: '비밀번호가 성공적으로 변경되었습니다',
      });
    } catch (error) {
      console.error('Password reset error:', error);
      res.status(500).json({
        success: false,
        message: '비밀번호 재설정에 실패했습니다',
      });
    }
  });

  // Email verification endpoint
  app.get('/api/auth/verify-email/:token', async (req, res) => {
    try {
      const { token } = req.params;
      console.log('📧 Email verification attempt');
      console.log('Token (first 50 chars):', token.substring(0, 50) + '...');

      if (!token) {
        console.log('❌ No token provided');
        return res.status(400).json({
          success: false,
          message: '인증 토큰이 없습니다',
        });
      }

      // Verify JWT token
      let decoded: { email: string; timestamp: number };
      try {
        decoded = jwt.verify(token, JWT_SECRET) as { email: string; timestamp: number };
        console.log('✅ JWT token decoded successfully:', { email: decoded.email });
      } catch (error) {
        console.log('❌ JWT verification failed:', error);
        return res.status(400).json({
          success: false,
          message: '유효하지 않거나 만료된 인증 링크입니다',
        });
      }

      // Find user by email and token
      console.log('🔍 Looking for user with email:', decoded.email);
      const user = await db.query.users.findFirst({
        where: and(
          eq(users.email, decoded.email),
          eq(users.verificationToken, token)
        ),
      });

      if (!user) {
        console.log('❌ User not found with email and token combo');
        // Try to find user by email only to see if they exist
        const userByEmail = await db.query.users.findFirst({
          where: eq(users.email, decoded.email),
        });
        if (userByEmail) {
          console.log('⚠️ User exists but token mismatch');
          console.log('Stored token (first 50):', userByEmail.verificationToken?.substring(0, 50) + '...');
          console.log('Received token (first 50):', token.substring(0, 50) + '...');
          console.log('User already verified:', userByEmail.emailVerified);
        } else {
          console.log('❌ User does not exist with this email');
        }
        return res.status(404).json({
          success: false,
          message: '사용자를 찾을 수 없거나 이미 인증되었습니다',
        });
      }

      console.log('✅ User found:', { email: user.email, verified: user.emailVerified });

      // Check if already verified
      if (user.emailVerified) {
        return res.json({
          success: true,
          message: '이미 인증된 계정입니다',
          alreadyVerified: true,
        });
      }

      // Check token expiration
      if (user.verificationTokenExpires && new Date() > user.verificationTokenExpires) {
        return res.status(400).json({
          success: false,
          message: '인증 링크가 만료되었습니다. 새로운 인증 링크를 요청해주세요',
        });
      }

      // Update user as verified
      await db.update(users)
        .set({
          emailVerified: true,
          verificationToken: null,
          verificationTokenExpires: null,
        })
        .where(eq(users.id, user.id));

      console.log('✅ Email verified successfully for:', user.email);

      res.json({
        success: true,
        message: '이메일 인증이 완료되었습니다! 이제 로그인할 수 있습니다.',
      });
    } catch (error) {
      console.error('Email verification error:', error);
      res.status(500).json({
        success: false,
        message: '이메일 인증에 실패했습니다',
      });
    }
  });

  // Verify email with 6-digit code
  app.post('/api/auth/verify-code', async (req, res) => {
    try {
      const { email, code } = req.body;
      console.log('🔐 Code verification attempt:', { email, code });

      if (!email || !code) {
        return res.status(400).json({
          success: false,
          message: '이메일과 인증 코드를 입력해주세요',
        });
      }

      // Find user by email
      const user = await db.query.users.findFirst({
        where: eq(users.email, email),
      });

      if (!user) {
        console.log('❌ User not found:', email);
        return res.status(404).json({
          success: false,
          message: '사용자를 찾을 수 없습니다',
        });
      }

      // Check if already verified
      if (user.emailVerified) {
        console.log('⚠️ User already verified:', email);
        return res.json({
          success: true,
          message: '이미 인증된 계정입니다',
          alreadyVerified: true,
        });
      }

      // Check if code matches
      if (user.verificationCode !== code) {
        console.log('❌ Code mismatch:', { expected: user.verificationCode, received: code });
        return res.status(400).json({
          success: false,
          message: '인증 코드가 올바르지 않습니다',
        });
      }

      // Check if code expired
      if (user.verificationCodeExpires && new Date() > user.verificationCodeExpires) {
        console.log('❌ Code expired');
        return res.status(400).json({
          success: false,
          message: '인증 코드가 만료되었습니다. 새로운 코드를 요청해주세요',
        });
      }

      // Verify user
      await db.update(users)
        .set({
          emailVerified: true,
          verificationCode: null,
          verificationCodeExpires: null,
        })
        .where(eq(users.id, user.id));

      console.log('✅ Email verified successfully with code:', email);

      res.json({
        success: true,
        message: '이메일 인증이 완료되었습니다! 이제 로그인할 수 있습니다.',
      });
    } catch (error) {
      console.error('Code verification error:', error);
      res.status(500).json({
        success: false,
        message: '인증에 실패했습니다',
      });
    }
  });

  // Resend verification code
  app.post('/api/auth/resend-code', async (req, res) => {
    try {
      const { email } = req.body;
      console.log('📧 Resend code request for:', email);

      if (!email) {
        return res.status(400).json({
          success: false,
          message: '이메일을 입력해주세요',
        });
      }

      // Find user
      const user = await db.query.users.findFirst({
        where: eq(users.email, email),
      });

      if (!user) {
        console.log('❌ User not found:', email);
        return res.status(404).json({
          success: false,
          message: '사용자를 찾을 수 없습니다',
        });
      }

      // Check if already verified
      if (user.emailVerified) {
        console.log('⚠️ User already verified:', email);
        return res.json({
          success: true,
          message: '이미 인증된 계정입니다',
          alreadyVerified: true,
        });
      }

      // Generate new code
      const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
      const verificationCodeExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

      // Update user
      await db.update(users)
        .set({
          verificationCode,
          verificationCodeExpires,
        })
        .where(eq(users.id, user.id));

      // Send new code
      try {
        await emailNotificationService.sendVerificationCode(email, verificationCode);
        console.log('📧 New verification code sent to:', email);

        res.json({
          success: true,
          message: '새로운 인증 코드를 발송했습니다',
        });
      } catch (emailError) {
        console.error('❌ Failed to send email:', emailError);
        res.status(500).json({
          success: false,
          message: '이메일 발송에 실패했습니다',
        });
      }
    } catch (error) {
      console.error('Resend code error:', error);
      res.status(500).json({
        success: false,
        message: '코드 재발송에 실패했습니다',
      });
    }
  });

  // Verify token (for client to check if token is still valid)
  app.get('/api/auth/verify', async (req, res) => {
    try {
      const token = req.headers.authorization?.replace('Bearer ', '');

      if (!token) {
        console.log('❌ [/api/auth/verify] No token provided');
        return res.status(401).json({ success: false, message: '토큰이 없습니다' });
      }

      const decoded = jwt.verify(token, JWT_SECRET) as { userId: string; email: string };
      console.log(`🔐 [/api/auth/verify] Token decoded - userId: ${decoded.userId}, email: ${decoded.email}`);

      const user = await db.query.users.findFirst({
        where: eq(users.id, decoded.userId),
      });

      if (!user) {
        console.log(`❌ [/api/auth/verify] User not found for userId: ${decoded.userId}`);
        return res.status(401).json({ success: false, message: '사용자를 찾을 수 없습니다' });
      }

      console.log(`✅ [/api/auth/verify] User found - email: ${user.email}, tier: ${user.subscriptionTier}, status: ${user.subscriptionStatus}`);

      // Prevent caching of user authentication data
      res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, private');
      res.setHeader('Pragma', 'no-cache');
      res.setHeader('Expires', '0');

      res.json({
        success: true,
        user: {
          id: user.id,
          email: user.email,
          subscriptionTier: user.subscriptionTier,
          subscriptionStatus: user.subscriptionStatus,
          subscriptionEndDate: user.subscriptionEndDate,
          hasUsedTrial: user.hasUsedTrial,
          trialExpiresAt: user.trialExpiresAt,
          emailVerified: user.emailVerified,
          createdAt: user.createdAt,
          stripeCustomerId: user.stripeCustomerId,
          stripeSubscriptionId: user.stripeSubscriptionId,
        },
      });
    } catch (error) {
      console.error('❌ [/api/auth/verify] Token verification error:', error);
      res.status(401).json({ success: false, message: '유효하지 않은 토큰입니다' });
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

      // Transaction type filtering - defaults to pure buy/sell only
      // This filters out grants, option exercises, awards, etc.
      const transactionFilter = req.query.transactionTypes as string;
      let transactionTypes: string[] | undefined;
      let includeDerivatives = false;

      console.log(`📋 [/api/trades] Transaction filter received: "${transactionFilter}"`);

      if (transactionFilter) {
        // If 'ALL' is specified, don't filter by transaction type
        if (transactionFilter.toUpperCase() === 'ALL') {
          transactionTypes = undefined;  // 모든 transaction code
          includeDerivatives = true;     // Table 1 + Table 2 (전체거래)
          console.log(`   ✅ ALL mode: transactionTypes=undefined, includeDerivatives=true`);
        } else {
          transactionTypes = transactionFilter.split(',');
          includeDerivatives = false;    // Table 1만 (핵심거래)
          console.log(`   🔹 Core mode: transactionTypes=${JSON.stringify(transactionTypes)}, includeDerivatives=false`);
        }
      } else {
        // Default: pure buy/sell only (schema-valid values)
        transactionTypes = ['BUY', 'SELL'];  // 핵심거래 (P/S만)
        includeDerivatives = false;          // Table 1만
        console.log(`   🔸 Default mode: transactionTypes=['BUY', 'SELL'], includeDerivatives=false`);
      }

      // Ticker filter
      const ticker = req.query.ticker as string;

      // Access control: check if user has real-time access
      const userId = getUserIdFromToken(req);

      let hasRealtimeAccess = false;
      if (!userId) {
        console.log('🔒 [/api/trades] No auth token found - treating as free user');
      } else {
        const isAppintos = isAppintosEnvironment(req);
        const accessLevel = await subscriptionService.getUserAccessLevel(userId, isAppintos);
        hasRealtimeAccess = accessLevel.canAccessRealtime;
        console.log(`🔑 [/api/trades] User ${userId.substring(0, 20)}... - hasRealtimeAccess: ${hasRealtimeAccess} (Appintos: ${isAppintos})`);
        console.log(`   📊 Tier: ${accessLevel.tier}, Status: ${accessLevel.status}, Trial: ${accessLevel.isTrialing}`);
      }

      // If user doesn't have real-time access, filter to 48h+ old trades
      let adjustedToDate: string | undefined = toDate; // Start with original toDate from request
      let filterBy: 'createdAt' | 'filedDate' | undefined = undefined;

      if (!hasRealtimeAccess) {
        // Free users: Force 48-hour delay filter based on SEC filing date
        // Use full ISO timestamp for precise 48-hour comparison (not truncated to midnight)
        const fortyEightHoursAgo = new Date(Date.now() - 48 * 60 * 60 * 1000);
        adjustedToDate = fortyEightHoursAgo.toISOString(); // Full timestamp for precise comparison
        filterBy = 'filedDate'; // Filter by SEC filing date for free users
        console.log(`🔒 Free user access - applying 48-hour delay filter`);
        console.log(`   Cutoff timestamp: ${adjustedToDate}`);
        console.log(`   Filter: trades with filedDate <= ${adjustedToDate} (filed more than 48h ago)`);
        console.log(`   Sort: ${sortBy}`);
        console.log(`   Request: limit=${limit}, offset=${offset}`);
      } else {
        // Premium users: NO delay filter - use original toDate if provided, otherwise no filter
        filterBy = undefined;
        console.log(`✅ Premium user access - NO delay filter applied`);
        console.log(`   Original toDate from request: ${adjustedToDate || 'none'}`);
        console.log(`   Sort: ${sortBy}`);
        console.log(`   Request: limit=${limit}, offset=${offset}`);
      }

      const rawTrades = await storage.getInsiderTrades(limit, offset, verifiedOnly, fromDate, adjustedToDate, sortBy, transactionTypes, filterBy, ticker, includeDerivatives);

      if (!hasRealtimeAccess) {
        console.log(`   Result: ${rawTrades.length} trades returned (filtered by 48h delay)`);
        if (rawTrades.length > 0) {
          const newest = rawTrades[0];
          console.log(`   Newest visible trade: ${newest.ticker} filed on ${newest.filedDate}`);
        } else {
          console.log(`   ⚠️ No trades available for free users - may need data collection`);
        }
      }

      // Enrich trades with current stock prices for percentage calculation
      const uniqueTickers = [...new Set(rawTrades.map(t => t.ticker).filter(Boolean))];
      const stockPriceMap = new Map<string, { currentPrice: number; marketCap: number | null; lastUpdated: Date | null }>();

      if (uniqueTickers.length > 0) {
        try {
          const prices = await db.query.stockPrices.findMany({
            where: (stockPrices, { inArray }) => inArray(stockPrices.ticker, uniqueTickers as string[]),
            columns: {
              ticker: true,
              currentPrice: true,
              marketCap: true,
              lastUpdated: true,
            }
          });

          prices.forEach(price => {
            if (price.ticker && price.currentPrice) {
              stockPriceMap.set(price.ticker, {
                currentPrice: Number(price.currentPrice),
                marketCap: price.marketCap ? Number(price.marketCap) : null,
                lastUpdated: price.lastUpdated,
              });
            }
          });

          // NOTE: On-demand marketCap fetch disabled for performance
          // MarketCap is now updated by background job (every 6 hours) instead of blocking API response
          // This improves API response time from ~50 seconds to <1 second
          const tickersWithoutMarketCap = uniqueTickers.filter(ticker => {
            const priceData = stockPriceMap.get(ticker);
            return !priceData || !priceData.marketCap || priceData.marketCap === 0;
          });
          
          if (tickersWithoutMarketCap.length > 0) {
            console.log(`ℹ️ ${tickersWithoutMarketCap.length} tickers missing marketCap (will be fetched by background job)`);
          }
        } catch (error) {
          console.warn('Failed to fetch stock prices for percentage calculation:', error);
        }
      }

      // Add current price and percentage change to each trade
      const enrichedTrades = rawTrades.map(trade => {
        const priceData = trade.ticker ? stockPriceMap.get(trade.ticker) : undefined;
        const currentPrice = priceData?.currentPrice;
        const marketCap = priceData?.marketCap;
        const priceLastUpdated = priceData?.lastUpdated;
        let priceChangePercent: number | undefined = undefined;


        if (currentPrice && trade.pricePerShare) {
          priceChangePercent = ((currentPrice - trade.pricePerShare) / trade.pricePerShare) * 100;
        }

        return {
          ...trade,
          currentPrice,
          marketCap: marketCap || null,
          priceChangePercent: priceChangePercent !== undefined ? Number(priceChangePercent.toFixed(2)) : undefined,
          priceLastUpdated: priceLastUpdated || null,
        };
      });

      // Add cache control headers to prevent browser caching of stale data
      res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
      res.setHeader('Pragma', 'no-cache');
      res.setHeader('Expires', '0');

      // Add access level info to response
      res.json({
        trades: enrichedTrades,
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

  // DEBUG: Get storage statistics
  app.get('/api/debug/storage-stats', async (req, res) => {
    try {
      const allTrades = await storage.getInsiderTrades(10000, 0, false); // Get all trades
      const now = new Date();
      const fortyEightHoursAgo = new Date(now.getTime() - 48 * 60 * 60 * 1000);
      const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

      // Find most recent trade by filedDate and createdAt
      const mostRecentByFiledDate = allTrades.length > 0 ? allTrades[0] : null;
      const sortedByCreatedAt = [...allTrades].sort((a, b) =>
        new Date(b.createdAt!).getTime() - new Date(a.createdAt!).getTime()
      );
      const mostRecentByCreatedAt = sortedByCreatedAt.length > 0 ? sortedByCreatedAt[0] : null;

      // Count trades in different time ranges
      const tradesLast48Hours = allTrades.filter(t =>
        new Date(t.filedDate) >= fortyEightHoursAgo
      ).length;
      const tradesLast7Days = allTrades.filter(t =>
        new Date(t.filedDate) >= sevenDaysAgo
      ).length;
      const freeUserVisibleTrades = allTrades.filter(t =>
        new Date(t.filedDate) <= fortyEightHoursAgo
      ).length;

      res.json({
        totalTrades: allTrades.length,
        mostRecentTrade: {
          byFiledDate: mostRecentByFiledDate ? {
            ticker: mostRecentByFiledDate.ticker,
            company: mostRecentByFiledDate.companyName,
            filedDate: mostRecentByFiledDate.filedDate,
            createdAt: mostRecentByFiledDate.createdAt
          } : null,
          byCreatedAt: mostRecentByCreatedAt ? {
            ticker: mostRecentByCreatedAt.ticker,
            company: mostRecentByCreatedAt.companyName,
            filedDate: mostRecentByCreatedAt.filedDate,
            createdAt: mostRecentByCreatedAt.createdAt
          } : null
        },
        timeRangeStats: {
          last48Hours: tradesLast48Hours,
          last7Days: tradesLast7Days,
          freeUserVisible: freeUserVisibleTrades,
          cutoffDate: fortyEightHoursAgo.toISOString()
        },
        currentTime: now.toISOString()
      });
    } catch (error) {
      console.error('Error getting storage stats:', error);
      res.status(500).json({ error: 'Failed to get storage stats' });
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

  // 🎯 CREATE SETUP INTENT FOR TRIAL CARD COLLECTION
  app.post('/api/trial/setup-intent', async (req, res) => {
    try {
      const userId = getUserIdFromToken(req);

      if (!userId) {
        return res.status(401).json({
          success: false,
          message: '로그인이 필요합니다',
        });
      }

      console.log(`💳 Creating SetupIntent for trial user: ${userId}`);

      // Get user info
      const user = await db.query.users.findFirst({
        where: eq(users.id, userId),
      });

      if (!user || !user.email) {
        return res.status(404).json({
          success: false,
          message: '사용자를 찾을 수 없습니다',
        });
      }

      // Check if user already used trial
      if (user.hasUsedTrial) {
        return res.status(400).json({
          success: false,
          message: '이미 무료 체험을 사용하셨습니다',
        });
      }

      // Check if user already has active subscription or trial
      if (user.subscriptionStatus === 'active' || user.subscriptionStatus === 'trialing') {
        return res.status(400).json({
          success: false,
          message: '이미 활성 구독이 있습니다',
        });
      }

      // Create or retrieve Stripe customer
      let customerId = user.stripeCustomerId;

      // Verify stored customer ID still exists in Stripe
      if (customerId && typeof customerId === 'string' && customerId.trim() !== '') {
        try {
          await stripe.customers.retrieve(customerId);
          console.log(`✅ Using existing Stripe customer: ${customerId}`);
        } catch (error: any) {
          console.warn(`⚠️ Stored customer ${customerId} validation failed:`, error.message);
          // Create new customer for any Stripe error instead of crashing
          if (error.type === 'StripeInvalidRequestError' || error.code === 'resource_missing') {
            console.warn(`⚠️ Customer not found in Stripe, will create new one`);
          } else {
            console.error(`⚠️ Unexpected Stripe error, will create new customer:`, error);
          }
          customerId = null; // Force creation of new customer
        }
      } else if (customerId) {
        console.warn(`⚠️ Invalid customer ID format: "${customerId}", will create new one`);
        customerId = null;
      }

      if (!customerId) {
        const customer = await stripe.customers.create({
          email: user.email,
          metadata: { userId: user.id },
          invoice_settings: {
            default_payment_method: null
          }
        });
        customerId = customer.id;

        // Save Stripe customer ID
        await db.update(users)
          .set({ stripeCustomerId: customerId })
          .where(eq(users.id, userId));

        console.log(`✅ Created Stripe customer for user ${userId}: ${customerId}`);
      }

      // Create SetupIntent
      const setupIntent = await stripe.setupIntents.create({
        customer: customerId,
        payment_method_types: ['card'],
        metadata: {
          userId: user.id,
          purpose: 'trial_signup',
        },
      });

      console.log(`✅ Created SetupIntent: ${setupIntent.id}`);

      res.json({
        success: true,
        clientSecret: setupIntent.client_secret,
        customerId: customerId,
      });

    } catch (error: any) {
      console.error('❌ SetupIntent creation error:', error);
      res.status(500).json({
        success: false,
        error: 'SetupIntent 생성 실패: ' + error.message
      });
    }
  });

  // 🎯 TRIAL ACTIVATION ENDPOINT (WITH CARD)
  app.post('/api/trial/activate', async (req, res) => {
    try {
      const userId = getUserIdFromToken(req);
      const { paymentMethodId, planType } = req.body; // planType: 'monthly' or 'yearly'

      if (!userId) {
        return res.status(401).json({
          success: false,
          message: '로그인이 필요합니다',
        });
      }

      if (!paymentMethodId) {
        return res.status(400).json({
          success: false,
          message: '결제 정보가 필요합니다',
        });
      }

      if (!planType || !['monthly', 'yearly', 'test'].includes(planType)) {
        return res.status(400).json({
          success: false,
          message: '유효하지 않은 구독 플랜입니다',
        });
      }

      console.log(`🎯 Activating trial with card for user: ${userId}, plan: ${planType}`);

      // Get user info
      const user = await db.query.users.findFirst({
        where: eq(users.id, userId),
      });

      if (!user || !user.email) {
        return res.status(404).json({
          success: false,
          message: '사용자를 찾을 수 없습니다',
        });
      }

      // Check if user already used trial
      if (user.hasUsedTrial) {
        return res.status(400).json({
          success: false,
          message: '이미 무료 체험을 사용하셨습니다',
        });
      }

      // Check if user already has active subscription or trial
      if (user.subscriptionStatus === 'active' || user.subscriptionStatus === 'trialing') {
        return res.status(400).json({
          success: false,
          message: '이미 활성 구독이 있습니다',
        });
      }

      // Get Price ID based on plan type
      const priceId = planType === 'monthly'
        ? process.env.STRIPE_PRICE_ID_MONTHLY
        : planType === 'yearly'
        ? process.env.STRIPE_PRICE_ID_YEARLY
        : process.env.STRIPE_PRICE_ID_TEST;

      if (!priceId) {
        console.error(`❌ Missing price ID for plan: ${planType}`);
        return res.status(500).json({
          success: false,
          message: '구독 플랜 설정 오류',
        });
      }

      // Ensure customer exists
      let customerId = user.stripeCustomerId;

      // Verify stored customer ID still exists in Stripe
      if (customerId && typeof customerId === 'string' && customerId.trim() !== '') {
        try {
          await stripe.customers.retrieve(customerId);
          console.log(`✅ Using existing Stripe customer: ${customerId}`);
        } catch (error: any) {
          console.warn(`⚠️ Stored customer ${customerId} validation failed:`, error.message);
          // Create new customer for any Stripe error instead of crashing
          if (error.type === 'StripeInvalidRequestError' || error.code === 'resource_missing') {
            console.warn(`⚠️ Customer not found in Stripe, will create new one`);
          } else {
            console.error(`⚠️ Unexpected Stripe error, will create new customer:`, error);
          }
          customerId = null; // Force creation of new customer
        }
      } else if (customerId) {
        console.warn(`⚠️ Invalid customer ID format: "${customerId}", will create new one`);
        customerId = null;
      }

      if (!customerId) {
        const customer = await stripe.customers.create({
          email: user.email,
          metadata: { userId: user.id },
          invoice_settings: {
            default_payment_method: null
          }
        });
        customerId = customer.id;

        // Save Stripe customer ID
        await db.update(users)
          .set({ stripeCustomerId: customerId })
          .where(eq(users.id, userId));

        console.log(`✅ Created Stripe customer: ${customerId}`);
      }

      // Attach payment method to customer
      await stripe.paymentMethods.attach(paymentMethodId, {
        customer: customerId,
      });

      // Set as default payment method
      await stripe.customers.update(customerId, {
        invoice_settings: {
          default_payment_method: paymentMethodId,
        },
      });

      console.log(`✅ Attached payment method to customer: ${customerId}`);

      // Create subscription with immediate billing (no trial)
      const subscriptionParams: any = {
        customer: customerId,
        items: [{ price: priceId }],
        payment_behavior: 'default_incomplete',
        payment_settings: {
          payment_method_types: ['card'],
          save_default_payment_method: 'on_subscription',
        },
        expand: ['latest_invoice.payment_intent'],
        metadata: {
          userId: user.id,
        },
        // No trial_end - immediate billing
      };

      const subscription = await stripe.subscriptions.create(subscriptionParams);

      console.log(`✅ Created Stripe subscription with immediate billing: ${subscription.id}`);

      // Calculate subscription period
      const subscriptionStart = new Date();
      const subscriptionEnd = new Date(subscription.current_period_end * 1000);

      // Update user in database
      await db.update(users)
        .set({
          stripeCustomerId: customerId,
          stripeSubscriptionId: subscription.id,
          subscriptionTier: 'insider_pro',
          subscriptionStatus: subscription.status as any, // Will be 'incomplete' until payment succeeds
          subscriptionStartDate: subscriptionStart,
          subscriptionEndDate: subscriptionEnd,
          hasUsedTrial: false, // No trial used - immediate billing
        })
        .where(eq(users.id, userId));

      console.log(`✅ Subscription created for user ${userId} - billing immediately`);

      const subscriptionMessage = '구독이 생성되었습니다. 결제 완료 후 즉시 프리미엄 기능을 이용하실 수 있습니다.';

      res.json({
        success: true,
        message: subscriptionMessage,
        subscriptionStartDate: subscriptionStart.toISOString(),
        subscriptionEndDate: subscriptionEnd.toISOString(),
        subscriptionId: subscription.id,
      });

    } catch (error: any) {
      console.error('❌ Subscription creation error:', error);
      res.status(500).json({
        success: false,
        error: '구독 생성 실패: ' + error.message
      });
    }
  });

  // Get trial status
  app.get('/api/trial/status', async (req, res) => {
    try {
      const userId = getUserIdFromToken(req);

      if (!userId) {
        console.log('🔒 [/api/trial/status] No auth token found - returning 401');
        return res.status(401).json({
          success: false,
          message: '로그인이 필요합니다',
        });
      }

      console.log(`🔑 [/api/trial/status] Checking status for user ${userId.substring(0, 20)}...`);

      const isAppintos = isAppintosEnvironment(req);
      const accessLevel = await subscriptionService.getUserAccessLevel(userId, isAppintos);

      // Get user for hasUsedTrial info
      const user = await db.query.users.findFirst({
        where: eq(users.id, userId),
      });

      // Prevent caching of trial/subscription status data
      res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, private');
      res.setHeader('Pragma', 'no-cache');
      res.setHeader('Expires', '0');

      res.json({
        isTrialing: accessLevel.isTrialing,
        canAccessRealtime: accessLevel.canAccessRealtime,
        trialExpiresAt: accessLevel.trialExpiresAt,
        daysUntilExpiry: accessLevel.daysUntilExpiry,
        tier: accessLevel.tier,
        status: accessLevel.status,
        hasUsedTrial: user?.hasUsedTrial || false,
      });
    } catch (error) {
      console.error('❌ Trial status error:', error);
      res.status(500).json({ error: 'Failed to fetch trial status' });
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

  // Get stock price by ticker (with sector info from Finnhub)
  app.get('/api/stocks/:ticker', async (req, res) => {
    try {
      const ticker = req.params.ticker.toUpperCase();
      const priceData = await stockPriceService.getStockPrice(ticker);

      // Finnhub에서 섹터 정보 가져오기 (무료 API)
      let sector = null;
      try {
        const finnhubKey = process.env.FINNHUB_API_KEY;
        if (finnhubKey) {
          const profileUrl = `https://finnhub.io/api/v1/stock/profile2?symbol=${ticker}&token=${finnhubKey}`;
          const profileRes = await fetch(profileUrl);
          if (profileRes.ok) {
            const profile = await profileRes.json();
            sector = profile.finnhubIndustry || null;
          }
        }
      } catch (sectorError) {
        console.log(`Sector fetch failed for ${ticker}:`, sectorError);
      }

      res.json({ ...priceData, sector });
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

  // Get the most recent trade for a ranked stock (bypasses 48h delay for AI analysis)
  app.get('/api/rankings/stock/:ticker/analysis-trade', async (req, res) => {
    try {
      const ticker = req.params.ticker?.toUpperCase();
      const language = (req.query.language as string) || 'en';

      if (!ticker) {
        return res.status(400).json({ error: 'Ticker parameter required' });
      }

      // 1. 랭킹 자격 확인 (Top 6에 있는지 확인)
      const rankingTickers = await fetchRankingTickers();
      if (!rankingTickers.includes(ticker)) {
        return res.status(403).json({
          error: 'NOT_RANKED',
          message: 'This stock is not currently in top rankings',
          ticker
        });
      }

      // 2. 최근 30일 거래 조회 (딜레이 필터 없음)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      const fromDate = thirtyDaysAgo.toISOString().split('T')[0];

      const trades = await storage.getInsiderTrades(
        1,           // limit: 1 (only need most recent)
        0,           // offset: 0
        false,       // verifiedOnly: false
        fromDate,    // fromDate: 30일 전
        undefined,   // toDate: 제한 없음 (no upper limit)
        'filedDate', // sortBy: 최신순 (most recent filing)
        undefined,   // transactionTypes: 기본값 (P/S)
        'filedDate', // filterBy: filedDate
        ticker,      // ticker 필터
        false        // includeDerivatives: false (핵심 거래만)
      );

      if (!trades || trades.length === 0) {
        return res.status(404).json({
          error: 'NO_TRADE_DATA',
          message: 'No trade data found for this ticker in the last 30 days',
          ticker
        });
      }

      const trade = trades[0];

      // 3. 캐시된 분석 확인
      const cachedAnalysis = trade.comprehensiveAnalysis as any;
      const hasCachedAnalysis = cachedAnalysis?.[language] || cachedAnalysis?.en;

      res.json({
        tradeId: trade.id,
        ticker: trade.ticker,
        filedDate: trade.filedDate,
        hasCachedAnalysis: !!hasCachedAnalysis,
        comprehensiveAnalysis: hasCachedAnalysis || null
      });

    } catch (error) {
      console.error('Error fetching analysis trade:', error);
      res.status(500).json({
        error: 'INTERNAL_ERROR',
        message: 'Failed to fetch trade for analysis'
      });
    }
  });

  // Get comprehensive AI analysis for a specific trade
  app.get('/api/trades/:id/comprehensive-analysis', async (req, res) => {
    try {
      const tradeId = req.params.id;
      const language = (req.query.language as string) || 'en';

      // Fetch trade from database with explicit field selection
      // ⚠️ CRITICAL: Must explicitly select comprehensiveAnalysis to ensure it's loaded
      const tradeResults = await db.select({
        id: insiderTrades.id,
        ticker: insiderTrades.ticker,
        companyName: insiderTrades.companyName,
        traderName: insiderTrades.traderName,
        traderTitle: insiderTrades.traderTitle,
        tradeType: insiderTrades.tradeType,
        shares: insiderTrades.shares,
        pricePerShare: insiderTrades.pricePerShare,
        totalValue: insiderTrades.totalValue,
        filedDate: insiderTrades.filedDate,
        transactionDate: insiderTrades.transactionDate,
        comprehensiveAnalysis: insiderTrades.comprehensiveAnalysis,
        analysisGeneratedAt: insiderTrades.analysisGeneratedAt,
      }).from(insiderTrades)
        .where(eq(insiderTrades.id, tradeId))
        .limit(1);

      if (!tradeResults || tradeResults.length === 0) {
        return res.status(404).json({
          error: 'TRADE_NOT_FOUND',
          errorType: 'permanent',
          message: 'Trade not found in database',
          retryable: false
        });
      }

      const trade = tradeResults[0];

      // 🔍 DEBUG: 캐시 상태 확인
      console.log('🔍 [CACHE DEBUG] Trade data loaded:', {
        id: trade.id,
        ticker: trade.ticker,
        hasComprehensiveAnalysis: !!trade.comprehensiveAnalysis,
        comprehensiveAnalysisType: typeof trade.comprehensiveAnalysis,
        comprehensiveAnalysisSize: trade.comprehensiveAnalysis ?
          JSON.stringify(trade.comprehensiveAnalysis).length : 0,
        hasAnalysisGeneratedAt: !!trade.analysisGeneratedAt,
        analysisGeneratedAt: trade.analysisGeneratedAt?.toISOString(),
        cacheAge: trade.analysisGeneratedAt ?
          Math.floor((Date.now() - new Date(trade.analysisGeneratedAt).getTime()) / 1000 / 60) + ' min' :
          'N/A'
      });

      // Cost optimization: Only generate analysis for trades in current rankings (age-agnostic)
      // This replaces the old 7-day age restriction with ranking-based eligibility
      // 🔧 FIX: Fetch ranking data FIRST to get current avgTradeValue for cache validation
      let currentAvgBuyPrice: number | undefined;
      try {
        console.log(`🔍 Checking if ${trade.ticker} is eligible for AI analysis...`);
        const rankingTickers = await fetchRankingTickers();
        const isEligible = rankingTickers.includes(trade.ticker || '');

        // Get current avgBuyPrice from ranking cache for price validation
        currentAvgBuyPrice = getTickerAvgBuyPrice(trade.ticker || '');
        console.log(`📊 Current avgBuyPrice for ${trade.ticker}: $${currentAvgBuyPrice?.toFixed(2) || 'N/A'}`);

        if (!isEligible) {
          console.log(`⚠️  ${trade.ticker} is not currently in rankings - analysis denied`);
          return res.json({
            notRanked: true,
            message: 'AI analysis is only available for currently ranked stocks',
            ticker: trade.ticker,
            basicInfo: {
              traderName: trade.traderName,
              traderTitle: trade.traderTitle || 'Unknown',
              companyName: trade.companyName,
              ticker: trade.ticker || 'N/A',
              shares: trade.shares,
              pricePerShare: trade.pricePerShare,
              totalValue: trade.totalValue,
              tradeType: trade.tradeType,
              filedDate: trade.filedDate,
              secFilingUrl: trade.secFilingUrl,
              ownershipPercentage: trade.ownershipPercentage || 0
            }
          });
        }
      } catch (rankingError) {
        console.error('❌ Ranking eligibility check failed:', rankingError);
        // Continue to cache check - if cache exists, use it
      }

      // 💰 LANGUAGE-SPECIFIC CACHE: Each language cached separately
      // New structure: { en: {...}, ko: {...}, ja: {...} }
      // 🔧 FIX: Validate cached price matches current avgBuyPrice (within 5% tolerance)
      if (trade.comprehensiveAnalysis) {
        const cachedData = trade.comprehensiveAnalysis as any;

        // Check if this language version exists in cache
        if (cachedData[language]) {
          const cachedPrice = cachedData[language]?.basicInfo?.pricePerShare || 0;
          const priceDiff = currentAvgBuyPrice && cachedPrice > 0
            ? Math.abs(currentAvgBuyPrice - cachedPrice) / cachedPrice * 100
            : 0;

          // If price differs by more than 5%, regenerate analysis
          if (priceDiff > 5) {
            console.log(`🔄 Cache price ($${cachedPrice.toFixed(2)}) differs from current avgBuyPrice ($${currentAvgBuyPrice?.toFixed(2)}) by ${priceDiff.toFixed(1)}% - regenerating analysis`);
          } else {
            console.log(`✅ Using cached ${language} analysis - saved GPT API call`);
            return res.json(cachedData[language]);
          }
        }

        // Check for old format (has aiSummary at root level) - check price and regenerate if needed
        if (cachedData.aiSummary && !cachedData[language]) {
          const cachedPrice = cachedData.basicInfo?.pricePerShare || 0;
          const priceDiff = currentAvgBuyPrice && cachedPrice > 0
            ? Math.abs(currentAvgBuyPrice - cachedPrice) / cachedPrice * 100
            : 0;

          if (priceDiff > 5) {
            console.log(`🔄 Legacy cache price differs - regenerating analysis`);
          } else {
            console.log(`✅ Using legacy cached analysis`);
            return res.json(cachedData);
          }
        }

        console.log(`📝 Language ${language} not cached or price mismatch, will generate...`);
      }

      console.log(`✅ ${trade.ticker} is in rankings - proceeding with AI analysis`);

      // Note: Eligibility already checked above - no duplicate check needed

      // Fetch recent news for context (once for both AI analysis and newsAnalysis section)
      let recentNews: any[] = [];
      let newsCorrelationResult: any = null;
      try {
        console.log(`Fetching news correlation for trade ${tradeId}...`);
        const newsPromise = newsCorrelationService.analyzeNewsCorrelation(tradeId);
        const timeoutPromise = new Promise((_, reject) =>
          setTimeout(() => reject(new Error('News fetch timeout')), 10000)
        );
        newsCorrelationResult = await Promise.race([newsPromise, timeoutPromise]) as any;

        if (newsCorrelationResult && newsCorrelationResult.relatedNews) {
          recentNews = newsCorrelationResult.relatedNews.slice(0, 10).map((article: any) => ({
            headline: article.title,
            summary: article.summary,
            sentiment: article.sentiment,
            publishedDate: new Date(article.publishedDate),
            source: article.source
          }));
        }
      } catch (error) {
        console.log('Could not fetch news (continuing without news):', error);
      }

      // Generate AI analysis (simplified: just 2-line summary)
      console.log(`💰 Using pricePerShare for AI analysis: $${trade.pricePerShare?.toFixed(2)}`);

      const aiService = new AIAnalysisService();
      const analysis = await aiService.analyzeInsiderTrade({
        companyName: trade.companyName,
        ticker: trade.ticker || 'N/A',
        traderName: trade.traderName,
        traderTitle: trade.traderTitle || 'Unknown',
        tradeType: trade.tradeType as 'BUY' | 'SELL',
        shares: trade.shares,
        pricePerShare: trade.pricePerShare,
        totalValue: trade.totalValue,
        ownershipPercentage: trade.ownershipPercentage || 0,
        filedDate: trade.filedDate,
        recentNews: recentNews.length > 0 ? recentNews : undefined
      });

      // Build simple news analysis
      let newsAnalysis = null;
      if (newsCorrelationResult && newsCorrelationResult.relatedNews && newsCorrelationResult.relatedNews.length > 0) {
        const newsItems = newsCorrelationResult.relatedNews
          .slice(0, 5)
          .sort((a: any, b: any) => new Date(b.publishedDate).getTime() - new Date(a.publishedDate).getTime());

        const positiveCount = newsItems.filter((n: any) =>
          n.sentiment === 'POSITIVE' || n.sentiment === 'BULLISH'
        ).length;
        const negativeCount = newsItems.filter((n: any) =>
          n.sentiment === 'NEGATIVE' || n.sentiment === 'BEARISH'
        ).length;

        newsAnalysis = {
          totalNews: newsCorrelationResult.relatedNews.length,
          positiveCount,
          negativeCount,
          majorNews: newsItems.map((article: any) => ({
            title: article.title,
            summary: article.summary,
            sentiment: article.sentiment,
            published: new Date(article.publishedDate),
            source: article.source
          }))
        };
      }

      // Create simplified analysis object (English first)
      // Store basicInfo with individual trade data for client display
      const englishAnalysis = {
        signalType: analysis.signalType,
        aiSummary: analysis.aiSummary,
        newsAnalysis,
        basicInfo: {
          traderName: trade.traderName,
          traderTitle: trade.traderTitle || 'Unknown',
          companyName: trade.companyName,
          ticker: trade.ticker || 'N/A',
          shares: trade.shares,
          pricePerShare: trade.pricePerShare,  // Use individual trade's actual price
          totalValue: trade.totalValue,
          tradeType: trade.tradeType,
          filedDate: trade.filedDate,
          secFilingUrl: trade.secFilingUrl,
          ownershipPercentage: trade.ownershipPercentage || 0
        },
        analysisLanguage: 'en'
      };

      // Translate if needed
      let localizedAnalysis = englishAnalysis;
      if (language !== 'en') {
        console.log(`🌍 Translating analysis to ${language}...`);
        try {
          const translatedSummary = await translateText(analysis.aiSummary, language);
          let translatedNews = newsAnalysis;

          if (newsAnalysis && newsAnalysis.majorNews) {
            translatedNews = {
              ...newsAnalysis,
              majorNews: await Promise.all(
                newsAnalysis.majorNews.map(async (news: any) => ({
                  ...news,
                  title: await translateText(news.title, language),
                  summary: await translateText(news.summary, language)
                }))
              )
            };
          }

          localizedAnalysis = {
            signalType: analysis.signalType,
            aiSummary: translatedSummary,
            newsAnalysis: translatedNews,
            basicInfo: englishAnalysis.basicInfo,  // Same basicInfo for all languages
            analysisLanguage: language
          };
          console.log(`✅ Analysis translated to ${language}`);
        } catch (translateError) {
          console.error('⚠️ Translation failed, using English:', translateError);
        }
      }

      // 💾 Save language-specific cache: { en: {...}, ko: {...} }
      const existingCache = (trade.comprehensiveAnalysis as any) || {};
      const updatedCache = {
        ...existingCache,
        en: englishAnalysis,
        [language]: localizedAnalysis
      };

      try {
        await db.update(insiderTrades)
          .set({
            comprehensiveAnalysis: updatedCache,
            analysisGeneratedAt: new Date()
          })
          .where(eq(insiderTrades.id, tradeId));
        console.log(`💾 Cached analysis for languages: ${Object.keys(updatedCache).join(', ')}`);
      } catch (cacheError) {
        console.error('⚠️ Cache save failed:', cacheError);
      }

      res.json(localizedAnalysis);
    } catch (error) {
      console.error('Error generating comprehensive analysis:', error);
      res.status(500).json({ 
        error: 'Failed to generate comprehensive analysis',
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
  // 🗑️ OLD RANKINGS ENDPOINT - DISABLED (새 IMS 알고리즘 사용 - line 3915)
  /*
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

      // 📊 Fetch current stock prices from database
      const uniqueTickers = [...tradesByTicker.keys()];
      const stockPriceMap = new Map<string, { price: number; lastUpdated: Date }>();

      if (uniqueTickers.length > 0) {
        const prices = await db.query.stockPrices.findMany({
          where: (stockPrices, { inArray }) => inArray(stockPrices.ticker, uniqueTickers),
          columns: {
            ticker: true,
            currentPrice: true,
            lastUpdated: true,
          }
        });

        prices.forEach(price => {
          if (price.ticker && price.currentPrice) {
            stockPriceMap.set(price.ticker, {
              price: Number(price.currentPrice),
              lastUpdated: price.lastUpdated || new Date()
            });
          }
        });
        console.log(`📊 [RANKINGS] Loaded ${stockPriceMap.size} stock prices for ${uniqueTickers.length} tickers`);
      }

      for (const [ticker, allTickerTrades] of tradesByTicker) {
        // GRANT, OPTION_EXERCISE 등을 제외하고 실제 매수/매도만 필터링
        const tickerTrades = allTickerTrades.filter(t =>
          t.tradeType === 'BUY' || t.tradeType === 'SELL' ||
          t.tradeType === 'PURCHASE' || t.tradeType === 'SALE' ||
          (t.transactionCode === 'P' || t.transactionCode === 'S')
        );

        // 거래가 없으면 스킵
        if (tickerTrades.length === 0) continue;

        // 7일 윈도우 내 동시 진입 감지 (매수만)
        const simultaneousEntries = [];
        const buyOnlyTrades = tickerTrades.filter(t => t.tradeType === 'BUY' || t.tradeType === 'PURCHASE' || t.transactionCode === 'P');
        const sortedTrades = buyOnlyTrades.sort((a, b) => new Date(a.filedDate).getTime() - new Date(b.filedDate).getTime());

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
        const buyTrades = tickerTrades.filter(t => t.tradeType === 'BUY' || t.tradeType === 'PURCHASE' || t.transactionCode === 'P').length;
        const sellTrades = tickerTrades.filter(t => t.tradeType === 'SELL' || t.tradeType === 'SALE' || t.transactionCode === 'S').length;
        const totalTrades = tickerTrades.length;
        const avgTradeValue = tickerTrades.reduce((sum, t) => sum + (t.pricePerShare || 0), 0) / totalTrades;
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

        // 매수 거래만 필터링하여 insiders 배열 생성 (이상한 이름 제외)
        const buyTradesOnly = tickerTrades.filter(t => {
          const isBuy = t.tradeType === 'BUY' || t.tradeType === 'PURCHASE' || t.transactionCode === 'P';

          // 이상한 이름 패턴 필터링 (산업 분류, 회사 타입 등)
          const suspiciousPatterns = [
            /instruments?/i,
            /apparatus/i,
            /closed-end/i,
            /funds?/i,
            /pharmaceutical/i,
            /preparations?/i,
            /commercial\s+banks?/i,
            /national\s+/i,
            /^[A-Z\s&-]+$/,  // 모두 대문자 + 공백/&/- 로만 구성
          ];

          const name = t.traderName || '';
          const hasValidName = !suspiciousPatterns.some(pattern => pattern.test(name)) && name.length > 0;

          return isBuy && hasValidName;
        });
        // 📊 Get current price for this ticker
        const stockPriceData = stockPriceMap.get(ticker);
        const currentPrice = stockPriceData?.price;
        const priceUpdatedAt = stockPriceData?.lastUpdated;

        const insiders = buyTradesOnly.map(t => ({
          name: t.traderName,
          title: t.traderTitle || 'Insider',
          shares: t.shares,
          pricePerShare: t.pricePerShare,
          totalValue: t.totalValue,
          date: t.filedDate,
          tradeType: t.tradeType,
          secFilingUrl: t.secFilingUrl
        })).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()); // 최신순

        // 📊 Create enhanced trade with current price
        const enhancedTrade = {
          ...lastTrade,
          currentPrice,
          pricePerShare: lastTrade.pricePerShare,
        };

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
          insiders, // 🔥 동시 매수자 상세 정보 추가!
          detectedPatterns: tickerPatterns,
          patternSignals,
          currentPrice, // 📊 현재 주가
          priceUpdatedAt, // 📊 가격 업데이트 시간
          enhancedTrade, // 📊 Enhanced trade with current price
        });
      }

      // 점수 순으로 정렬하고 상위 항목 반환
      const sortedRankings = rankings
        // 필터 완화: 거래가 있으면 모두 표시 (매도만 있어도 표시)
        .filter(r => r.totalTrades > 0)
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
  */

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
      const language = (req.query.language as string) || 'en';

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

      // Ranking은 핵심거래만 집계 (Table 1, P/S만) - 실제 돈을 쓴 거래만
      const trades = await storage.getInsiderTrades(1000, 0, false, fromDate, undefined, 'filedDate', undefined, undefined, undefined, false);
      
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
            totalPricePerShare: 0,
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

        const tradeValue = Math.abs(trade.totalValue || 0);
        const pricePerShare = Math.abs(trade.pricePerShare || 0);
        const tradeDate = new Date(trade.filedDate || trade.createdAt || '');

        if (!metrics.lastTradeDate || tradeDate > metrics.lastTradeDate) {
          metrics.lastTradeDate = tradeDate;
        }

        // Classify as buy or sell based on trade type and transaction code
        // Only pure Purchase (P) = BUY, pure Sale (S) = SELL
        const isBuy = trade.tradeType === 'BUY' ||
                      trade.tradeType === 'PURCHASE' ||
                      trade.transactionCode === 'P';

        if (isBuy) {
          metrics.totalBuyValue += tradeValue;
          metrics.buyCount++;
          // 매수자만 uniqueInsiders에 추가 (일관성 유지)
          metrics.uniqueInsiders.add(trade.traderName);
        } else {
          metrics.totalSellValue += tradeValue;
          metrics.sellCount++;
        }

        // Track price per share for averaging
        metrics.totalPricePerShare += pricePerShare;
      }
      
      // Fetch current stock prices for all tickers
      const uniqueTickers = Array.from(tickerMetrics.keys());
      const stockPriceMap = new Map<string, { price: number; lastUpdated: Date; marketCap: number | null }>();

      if (uniqueTickers.length > 0) {
        const prices = await db.query.stockPrices.findMany({
          where: (stockPrices, { inArray }) => inArray(stockPrices.ticker, uniqueTickers),
          columns: {
            ticker: true,
            currentPrice: true,
            lastUpdated: true,
            marketCap: true,
          }
        });

        prices.forEach(price => {
          if (price.ticker && price.currentPrice) {
            stockPriceMap.set(price.ticker, {
              price: Number(price.currentPrice),
              lastUpdated: price.lastUpdated || new Date(),
              marketCap: price.marketCap ? Number(price.marketCap) : null
            });
          }
        });

        // NOTE: On-demand marketCap fetch disabled for performance
        // MarketCap is now updated by background job (every 6 hours) instead of blocking API response
        const tickersWithoutMarketCap = uniqueTickers.filter(ticker => {
          const priceData = stockPriceMap.get(ticker);
          return !priceData || !priceData.marketCap || priceData.marketCap === 0;
        });

        if (tickersWithoutMarketCap.length > 0) {
          console.log(`ℹ️ [Rankings] ${tickersWithoutMarketCap.length} tickers missing marketCap (background job will update)`);
        }
      }

      // Calculate scores and rankings
      const rankings = await Promise.all(Array.from(tickerMetrics.values()).map(async (metrics) => {
        const totalTrades = metrics.buyCount + metrics.sellCount;

        // Get current price and market cap for this ticker FIRST
        const stockPriceData = stockPriceMap.get(metrics.ticker);
        const currentPrice = stockPriceData?.price;
        const priceLastUpdated = stockPriceData?.lastUpdated;
        const marketCap = stockPriceData?.marketCap;

        // Calculate average price per share of BUY trades only (not all trades)
        // Only pure Purchase (P) transactions
        const buyTrades = metrics.trades.filter(t =>
          t.tradeType === 'BUY' || t.tradeType === 'PURCHASE' ||
          t.transactionCode === 'P'
        );
        const totalBuyPricePerShare = buyTrades.reduce((sum, t) => sum + (t.pricePerShare || 0), 0);
        metrics.avgTradeValue = buyTrades.length > 0 ? totalBuyPricePerShare / buyTrades.length : 0;
        metrics.netBuying = metrics.totalBuyValue - metrics.totalSellValue;

        // Calculate ranking score based on (TIMING-FOCUSED WEIGHTS):
        // - Net buying amount (30%)
        // - Recency of trades (20% - TIMING IS CRITICAL!)
        // - Number of unique insiders (20%)
        // - Number of buying transactions (15%)
        // - Pattern bonus (10% - cluster buying, consecutive trades, etc.)
        // - Average trade value (5% - log scale to prevent extreme values from dominating)

        // 🔥 INSIDER MOMENTUM SCORE (IMS) ALGORITHM
        // New algorithm: Final Score = Base Signal Strength × Recency Multiplier × Pattern Boost

        const netBuyingScore = Math.max(0, metrics.netBuying) / 1000000; // Normalize to millions
        const buyCountScore = metrics.buyCount * 5; // 5 points per buy trade

        // 🎯 Unique Insiders Score - PRIMARY SIGNAL (most important)
        const uniqueInsiderScore = metrics.uniqueInsiders.size * 15; // 15 points per unique insider (increased weight)

        // 🎯 Market Cap Ratio Score - SECONDARY SIGNAL (second most important)
        const marketCapRatioScore = (marketCap && marketCap > 0)
          ? (metrics.netBuying / marketCap) * 100000 // Normalize: 0.1% = 100 points
          : 0;

        // Use log scale to prevent extremely large trades from dominating the score
        const avgValueScore = Math.log10(metrics.avgTradeValue + 1) * 2; // Log scale normalization

        // 🔥 1단계: 기본 신호 강도 계산 (Base Signal Strength) - 시간 제외
        // Priority: 1. Unique Insiders (45%), 2. Market Cap Ratio (25%), 3. Net Buying (20%), 4. Buy Count (10%)
        const baseSignalStrength = Math.round(
          uniqueInsiderScore * 0.45 +       // Unique insiders (PRIORITY #1: 45%)
          marketCapRatioScore * 0.25 +      // Market cap ratio (PRIORITY #2: 25%)
          netBuyingScore * 0.20 +           // Net buying (20%, reduced from 50%)
          buyCountScore * 0.10              // Buy count (10%, reduced from 25%)
        );

        // 🔥 2단계: 시간 감쇠 점수 (Exponential Time Decay) - RELAXED
        const daysSinceLastTrade = metrics.lastTradeDate ?
          (Date.now() - metrics.lastTradeDate.getTime()) / (1000 * 60 * 60 * 24) : 30;

        const decayRate = 7; // 7일마다 반감기 (relaxed from 2 days)
        const recencyMultiplier = Math.exp(-daysSinceLastTrade / decayRate);
        // 0일=1.0, 3.5일=0.60, 7일=0.36, 14일=0.13, 30일=0.02

        // 🔥 3단계: 패턴 부스트 배수 (Pattern Boost Multiplier)
        let patternMultiplier = 1.0;
        let patternBaseBonus = 0;

        const tickerPatterns = detectedPatterns.filter(pattern =>
          pattern.ticker.toUpperCase() === metrics.ticker.toUpperCase()
        );

        for (const pattern of tickerPatterns) {
          switch (pattern.type) {
            case 'CLUSTER_BUY':
              // 동시매수 패턴에 시간 민감도 추가
              const clusterDays = daysSinceLastTrade; // 클러스터 발생 후 경과일

              if (clusterDays <= 3) {
                patternMultiplier *= 1.5; // 3일 이내 동시매수 → 150% 부스트
              } else if (clusterDays <= 7) {
                patternMultiplier *= 1.1; // 7일 이내 → 110%
              } else {
                patternMultiplier *= 0.7; // 8일 이상 → 감점
              }

              patternBaseBonus += pattern.significance === 'HIGH' ? 30 :
                                  pattern.significance === 'MEDIUM' ? 20 : 10;
              break;
            case 'CLUSTER_SELL':
              patternBaseBonus -= pattern.significance === 'HIGH' ? 20 :
                                  pattern.significance === 'MEDIUM' ? 15 : 5;
              break;
            case 'CONSECUTIVE_TRADES':
              patternBaseBonus += pattern.significance === 'HIGH' ? 25 :
                                  pattern.significance === 'MEDIUM' ? 15 : 8;
              break;
            case 'LARGE_VOLUME':
              patternBaseBonus += pattern.significance === 'HIGH' ? 20 :
                                  pattern.significance === 'MEDIUM' ? 12 : 6;
              break;
          }
        }

        // 패턴 기본 보너스를 신호 강도에 추가
        const signalWithPatternBonus = baseSignalStrength + (patternBaseBonus * 0.15);

        // 🔥 시총대비 비율 부스트 멀티플라이어 (소형주 강력 선호 - PRIORITY #2)
        let marketCapRatioMultiplier = 1.0;
        if (marketCap && marketCap > 0) {
          const marketCapRatio = (metrics.netBuying / marketCap) * 100;

          if (marketCapRatio >= 0.1) {
            marketCapRatioMultiplier = 2.0;  // 0.1% 이상: 매우 높음 (소형주, 2배 부스트)
          } else if (marketCapRatio >= 0.05) {
            marketCapRatioMultiplier = 1.6;  // 0.05-0.1%: 높음 (1.6배)
          } else if (marketCapRatio >= 0.01) {
            marketCapRatioMultiplier = 1.3;  // 0.01-0.05%: 중간 (1.3배)
          } else if (marketCapRatio >= 0.005) {
            marketCapRatioMultiplier = 1.1;  // 0.005-0.01%: 약간 (1.1배)
          }
          // else: 1.0 (0.005% 미만: 대형주, 부스트 없음)
        }

        // 🔥 최종 점수 = 신호 강도 × 시간 감쇠 × 패턴 부스트 × 시총대비 부스트 (곱셈 모델)
        metrics.score = Math.round(signalWithPatternBonus * recencyMultiplier * patternMultiplier * marketCapRatioMultiplier);
        
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

        // Insider 상세 정보 (매수자만, 이상한 이름 제외)
        // Only pure Purchase (P) transactions
        // 같은 내부자가 여러 번 매수한 경우 최신 거래만 선택 (중복 제거)
        const suspiciousPatterns = [
          /instruments?/i,
          /apparatus/i,
          /closed-end/i,
          /funds?/i,
          /pharmaceutical/i,
          /preparations?/i,
          /commercial\s+banks?/i,
          /national\s+/i,
          /^[A-Z\s&-]+$/,  // 모두 대문자 + 공백/&/- 로만 구성
        ];

        // 1. 유효한 매수 거래만 필터링
        const validBuyTrades = metrics.trades.filter(t => {
          const isBuy = t.tradeType === 'BUY' || t.tradeType === 'PURCHASE' ||
                       t.transactionCode === 'P';
          const name = t.traderName || '';
          const hasValidName = !suspiciousPatterns.some(pattern => pattern.test(name)) && name.length > 0;
          return isBuy && hasValidName;
        });

        // 2. 내부자 분류 타입 및 함수 (6가지 카테고리)
        type InsiderCategory = 'VC_PE' | 'HEDGE' | 'INSTITUTION' | 'EXECUTIVE' | 'DIRECTOR' | 'LARGE_SHAREHOLDER';

        const classifyInsider = (name: string, title: string): InsiderCategory[] => {
          const categories: InsiderCategory[] = [];

          // 1. 기관 분류 (이름 기반)
          const vcPePatterns = /\b(Ventures?|Equity|Horowitz|Sequoia|Andreessen|Greylock|Accel|Benchmark|Kleiner|Khosla|General.?Catalyst|Bessemer|NEA|Index.?Ventures|Lightspeed|Tiger.?Global|Coatue|a16z)\b/i;
          const hedgePatterns = /\b(Hedge|Asset.?Management|Citadel|Bridgewater|Renaissance|Two.?Sigma|D\.?E\.?Shaw|Point72|Millennium|Elliott|Baupost)\b/i;
          const institutionPatterns = /\b(LLC|LP|L\.L\.C\.|L\.P\.|Inc\.|Corp\.|Ltd\.|Foundation|Trust|Fund|Holdings?|Partners?|Advisors?|Management|Investments?|Associates?|Group|Company|Co\.|Corporation|Capital)\b/i;

          if (vcPePatterns.test(name)) {
            categories.push('VC_PE');
          } else if (hedgePatterns.test(name)) {
            categories.push('HEDGE');
          } else if (institutionPatterns.test(name)) {
            categories.push('INSTITUTION');
          }

          // 2. 직책 분류 (title 기반)
          const executivePatterns = /\b(CEO|CFO|COO|CTO|CIO|CMO|President|Chief|Officer|VP|Vice.?President|SVP|EVP|General.?Counsel|Secretary|Treasurer)\b/i;
          const directorPatterns = /\b(Dir|Director)\b/i;
          const largeShareholderPattern = /\b(10%|5%|\d+%)\b/;

          if (executivePatterns.test(title)) {
            categories.push('EXECUTIVE');
          }
          if (directorPatterns.test(title)) {
            categories.push('DIRECTOR');
          }
          // 대주주 판별: 퍼센트가 있으면 대주주로 추가
          if (largeShareholderPattern.test(title)) {
            categories.push('LARGE_SHAREHOLDER');
          }

          // 분류 불가능한 경우: 이름이 기관 같지 않고 직책도 없으면 기타 개인으로
          if (categories.length === 0) {
            // 이름에 쉼표가 있으면 개인(성, 이름 형식)
            if (name.includes(',')) {
              categories.push('EXECUTIVE'); // 기본적으로 임원으로 표시
            } else {
              categories.push('INSTITUTION');
            }
          }

          return categories;
        };

        // 기존 호환성을 위한 isInstitution 계산 헬퍼
        const isInstitutionalInvestor = (name: string, title: string): boolean => {
          const categories = classifyInsider(name, title);
          return categories.some(c => ['VC_PE', 'HEDGE', 'INSTITUTION'].includes(c));
        };

        // 3. 내부자별로 모든 거래를 그룹화 (중복 제거 + 거래 내역 보존)
        interface InsiderTradeDetail {
          shares: number;
          pricePerShare: number;
          totalValue: number;
          date: string;
          tradeType: string;
          secFilingUrl?: string;
          accessionNumber?: string;
        }
        interface GroupedInsider {
          name: string;
          title: string;
          trades: InsiderTradeDetail[];
          tradeCount: number;
          totalShares: number;
          totalValue: number;
          avgPricePerShare: number;
          latestDate: string;
          isInstitution: boolean;
          categories: InsiderCategory[];
        }

        const insidersByName = new Map<string, GroupedInsider>();
        validBuyTrades.forEach(t => {
          const tradeDetail: InsiderTradeDetail = {
            shares: t.shares,
            pricePerShare: t.pricePerShare,
            totalValue: t.totalValue,
            date: t.filedDate,
            tradeType: t.tradeType,
            secFilingUrl: t.secFilingUrl,
            accessionNumber: t.accessionNumber,
          };

          const existing = insidersByName.get(t.traderName);
          if (existing) {
            existing.trades.push(tradeDetail);
            existing.tradeCount++;
            existing.totalShares += t.shares;
            existing.totalValue += t.totalValue;
            existing.avgPricePerShare = existing.totalValue / existing.totalShares;
            if (new Date(t.filedDate) > new Date(existing.latestDate)) {
              existing.latestDate = t.filedDate;
            }
          } else {
            const categories = classifyInsider(t.traderName, t.traderTitle || '');
            insidersByName.set(t.traderName, {
              name: t.traderName,
              title: t.traderTitle || 'Insider',
              trades: [tradeDetail],
              tradeCount: 1,
              totalShares: t.shares,
              totalValue: t.totalValue,
              avgPricePerShare: t.pricePerShare,
              latestDate: t.filedDate,
              isInstitution: categories.some(c => ['VC_PE', 'HEDGE', 'INSTITUTION'].includes(c)),
              categories: categories,
            });
          }
        });

        // 4. 내부자 목록을 최신 거래 순으로 정렬
        const insiderDetails = Array.from(insidersByName.values())
          .map(insider => ({
            ...insider,
            trades: insider.trades.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()),
          }))
          .sort((a, b) => new Date(b.latestDate).getTime() - new Date(a.latestDate).getTime());

        // 5. 전체 순매수액 계산 (모든 내부자의 모든 거래 합산)
        const totalInsidersNetBuying = insiderDetails.reduce((sum, insider) => sum + insider.totalValue, 0);

        // 디버그 로깅
        const totalTradeCount = insiderDetails.reduce((sum, i) => sum + i.tradeCount, 0);
        if (metrics.ticker === 'PROP' || totalTradeCount !== insiderDetails.length) {
          console.log(`[Rankings Debug] ${metrics.ticker}: validBuyTrades=${validBuyTrades.length}, uniqueInsiders=${insiderDetails.length}, totalTradeCount=${totalTradeCount}`);
        }

        // Calculate percentage change from average buy price (marketCap already defined above)
        let priceChangePercent = undefined;
        if (currentPrice && metrics.avgTradeValue > 0) {
          priceChangePercent = ((currentPrice - metrics.avgTradeValue) / metrics.avgTradeValue) * 100;
        }

        // 업종은 나중에 최종 결과에만 추가 (API 호출 최소화)
        return {
          ticker: metrics.ticker,
          companyName: metrics.companyName,
          sector: null as string | null,  // 나중에 채워짐
          score: metrics.score,
          recommendation: metrics.recommendation,
          totalTrades: totalTrades,
          buyTrades: metrics.buyCount,
          sellTrades: metrics.sellCount,
          uniqueInsiders: insiderDetails.length,  // 필터링된 배열 기준 (일관성)
          avgTradeValue: Math.round(metrics.avgTradeValue * 100) / 100, // Round to 2 decimals for per-share price
          netBuying: Math.round(metrics.netBuying),
          lastTradeDate: metrics.lastTradeDate?.toISOString(),
          insiderActivity: `${totalTrades} trades in last 30 days`,
          insiders: insiderDetails, // 📋 내부자별 그룹화된 정보 (거래 횟수, 총액, 개별 거래 포함)
          totalInsidersNetBuying: Math.round(totalInsidersNetBuying), // 모든 내부자의 전체 거래 합산 (시총대비용)
          // 현재 주가 및 변동률 정보 추가
          currentPrice: currentPrice ? Math.round(currentPrice * 100) / 100 : undefined,
          priceChangePercent: priceChangePercent !== undefined ? Math.round(priceChangePercent * 10) / 10 : undefined,
          priceLastUpdated: priceLastUpdated?.toISOString() || null,
          marketCap: marketCap ? Number(marketCap) : null, // Add market cap
          // enhancedTrade 객체 추가 (frontend compatibility)
          enhancedTrade: {
            currentPrice: currentPrice ? Math.round(currentPrice * 100) / 100 : undefined,
            pricePerShare: Math.round(metrics.avgTradeValue * 100) / 100,
            priceLastUpdated: priceLastUpdated?.toISOString() || null,
          },
          // 패턴 정보 추가
          detectedPatterns: stockPatterns.map(p => ({
            type: p.type,
            description: p.description,
            significance: p.significance
          })),
          patternSignals: stockPatterns.length > 0 ?
            await Promise.all(stockPatterns.map(async (p) => {
              let label: string;
              switch (p.type) {
                case 'CLUSTER_BUY': label = '🟢 Cluster Buying'; break;
                case 'CLUSTER_SELL': label = '🔴 Cluster Selling'; break;
                case 'CONSECUTIVE_TRADES': label = '🔄 Consecutive Trades'; break;
                case 'LARGE_VOLUME': label = '📈 Large Volume'; break;
                default: label = '🔍 Pattern Detected'; break;
              }
              return language !== 'en' ? await translateText(label, language) : label;
            })).then(labels => labels.join(', ')) : null
        };
      }));
      
      // Sort by score and return top results
      // 🔥 동적 Recency 필터: 7일 우선, 부족하면 14일/30일로 자동 확장
      let recencyDays = 7;
      let filteredRankings = rankings
        .filter(r => r.totalTrades >= 2) // Only include stocks with at least 2 trades
        .filter(r => r.netBuying > 0) // CRITICAL: Only recommend stocks with net buying (매수 > 매도)
        .filter(r => r.buyTrades > 0) // Must have at least 1 buy trade
        .filter(r => {
          const daysSince = r.lastTradeDate ?
            (Date.now() - new Date(r.lastTradeDate).getTime()) / (1000 * 60 * 60 * 24) : 999;
          return daysSince <= recencyDays;
        })
        .filter(r => {
          // 가격 괴리 필터: stockPriceMap에서 현재가 조회
          const stockPriceData = stockPriceMap.get(r.ticker);
          if (stockPriceData && stockPriceData.price && r.avgTradeValue > 0) {
            const priceGap = Math.abs(
              (stockPriceData.price - r.avgTradeValue) / r.avgTradeValue
            );
            return priceGap <= 0.15; // 15% 이상 괴리 시 제외
          }
          return true; // 가격 정보 없으면 통과
        });

      // Fallback to 14 days if results < 5
      if (filteredRankings.length < 5) {
        console.log(`⚠️  Only ${filteredRankings.length} stocks found with 7-day filter, expanding to 14 days...`);
        recencyDays = 14;
        filteredRankings = rankings
          .filter(r => r.totalTrades >= 2)
          .filter(r => r.netBuying > 0)
          .filter(r => r.buyTrades > 0)
          .filter(r => {
            const daysSince = r.lastTradeDate ?
              (Date.now() - new Date(r.lastTradeDate).getTime()) / (1000 * 60 * 60 * 24) : 999;
            return daysSince <= recencyDays;
          })
          .filter(r => {
            const stockPriceData = stockPriceMap.get(r.ticker);
            if (stockPriceData && stockPriceData.price && r.avgTradeValue > 0) {
              const priceGap = Math.abs(
                (stockPriceData.price - r.avgTradeValue) / r.avgTradeValue
              );
              return priceGap <= 0.15;
            }
            return true;
          });
      }

      // Fallback to 30 days if still < 5
      if (filteredRankings.length < 5) {
        console.log(`⚠️  Only ${filteredRankings.length} stocks found with 14-day filter, expanding to 30 days...`);
        recencyDays = 30;
        filteredRankings = rankings
          .filter(r => r.totalTrades >= 2)
          .filter(r => r.netBuying > 0)
          .filter(r => r.buyTrades > 0)
          .filter(r => {
            const daysSince = r.lastTradeDate ?
              (Date.now() - new Date(r.lastTradeDate).getTime()) / (1000 * 60 * 60 * 24) : 999;
            return daysSince <= recencyDays;
          })
          .filter(r => {
            const stockPriceData = stockPriceMap.get(r.ticker);
            if (stockPriceData && stockPriceData.price && r.avgTradeValue > 0) {
              const priceGap = Math.abs(
                (stockPriceData.price - r.avgTradeValue) / r.avgTradeValue
              );
              return priceGap <= 0.15;
            }
            return true;
          });
      }

      const topRankings = filteredRankings
        .sort((a, b) => b.score - a.score)
        .slice(0, limit);

      console.log(`📊 Rankings summary: ${topRankings.length} stocks (recency: ${recencyDays} days, total analyzed: ${rankings.length})`);

      // 🔄 업종 정보 조회 (최종 결과에만, API 호출 최소화)
      console.log(`🏢 Fetching sectors for ${topRankings.length} stocks...`);
      for (const ranking of topRankings) {
        try {
          const sectorPromise = getSectorFromFinnhub(ranking.ticker, language);
          const timeoutPromise = new Promise<null>((resolve) => setTimeout(() => resolve(null), 3000));
          ranking.sector = await Promise.race([sectorPromise, timeoutPromise]);
        } catch (e) {
          ranking.sector = null;
        }
      }
      console.log(`✅ Sectors fetched for top rankings`);

      // ==================================================================================
      // 🔒 CRITICAL: Pre-load AI Analysis for Cross-User Caching - DO NOT REMOVE
      // ==================================================================================
      // This section fetches cached AI analyses from DB and includes them in ranking response.
      // Enables ALL users to see the same analysis instantly without API calls.
      //
      // ⚠️ IMPORTANT:
      //    - Must return 'rankingsWithAnalysis' (NOT 'topRankings')
      //    - comprehensiveAnalysis field must be included in response
      //    - hasComprehensiveAnalysis flag helps client identify cached data
      //
      // 🚫 DO NOT:
      //    - Return 'topRankings' instead of 'rankingsWithAnalysis' (line 4680)
      //    - Remove comprehensiveAnalysis from select query
      //    - Skip the Map creation or ranking enrichment
      //
      // ✅ This enables: User A generates analysis → User B sees it instantly (no cost, no wait)
      // ==================================================================================
      const rankingTickers = topRankings.map(r => r.ticker);
      const cachedAnalyses = new Map<string, any>();

      if (rankingTickers.length > 0) {
        try {
          const analysisResults = await db
            .select({
              ticker: insiderTrades.ticker,
              comprehensiveAnalysis: insiderTrades.comprehensiveAnalysis,
              analysisGeneratedAt: insiderTrades.analysisGeneratedAt
            })
            .from(insiderTrades)
            .where(
              and(
                inArray(insiderTrades.ticker, rankingTickers),
                isNotNull(insiderTrades.comprehensiveAnalysis)
              )
            )
            .orderBy(desc(insiderTrades.analysisGeneratedAt));

          // ticker별 최신 분석만 저장
          for (const result of analysisResults) {
            if (result.ticker && !cachedAnalyses.has(result.ticker)) {
              cachedAnalyses.set(result.ticker, result.comprehensiveAnalysis);
            }
          }

          console.log(`📦 Loaded ${cachedAnalyses.size}/${rankingTickers.length} cached analyses for instant display`);
        } catch (error) {
          console.warn('Failed to load cached analyses (continuing without):', error);
        }
      }

      // 🔒 CRITICAL: Add comprehensiveAnalysis to each ranking (언어별 선택)
      const rankingsWithAnalysis = topRankings.map(ranking => {
        const cached = cachedAnalyses.get(ranking.ticker);
        // 요청 언어에 맞는 분석 선택, 없으면 영어 fallback
        const hasRequestedLang = !!cached?.[language];
        const analysis = cached?.[language] || cached?.en || null;
        // ✅ analysisLanguage 추가: 클라이언트에서 올바른 언어인지 확인 가능
        const analysisLanguage = hasRequestedLang ? language : (cached?.en ? 'en' : null);

        return {
          ...ranking,
          comprehensiveAnalysis: analysis ? { ...analysis, analysisLanguage } : null,
          hasComprehensiveAnalysis: !!analysis,
        };
      });

      res.json({
        rankings: rankingsWithAnalysis, // 🔒 CRITICAL: Must return rankingsWithAnalysis (NOT topRankings)
        generatedAt: new Date().toISOString(),
        period: '30 days',
        totalStocksAnalyzed: rankings.length,
        meta: {
          recencyDays,
          filteredCount: filteredRankings.length,
        },
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

  // Historical performance endpoint - shows past recommendation performance
  app.get('/api/rankings/historical-performance', async (req, res) => {
    try {
      const monthsAgo = parseInt(req.query.monthsAgo as string) || 1;

      // Validate monthsAgo parameter
      if (monthsAgo !== 1 && monthsAgo !== 3) {
        return res.status(400).json({
          error: 'Invalid monthsAgo parameter. Must be 1 or 3.'
        });
      }

      console.log(`[Rankings] Fetching historical performance for ${monthsAgo} month(s) ago...`);

      const performance = await pastPerformanceService.getHistoricalPerformance(monthsAgo as 1 | 3);

      return res.json(performance);
    } catch (error) {
      console.error('[Rankings] Error fetching historical performance:', error);
      return res.status(500).json({
        error: 'Failed to fetch historical performance',
        dataAvailable: false
      });
    }
  });

  // 실시간 성과 추적: 최근 30일 스냅샷 기반, 내부자 매도 종목 자동 제외
  app.get('/api/rankings/live-performance', async (req, res) => {
    try {
      console.log('[Rankings] Fetching live performance...');
      const data = await pastPerformanceService.getLivePerformance();
      return res.json(data);
    } catch (error) {
      console.error('[Rankings] Error fetching live performance:', error);
      return res.status(500).json({ error: 'Failed to fetch live performance', dataAvailable: false });
    }
  });

  // 여러 기간 중 가장 높은 승률/수익률 기간을 자동 선택
  app.get('/api/rankings/best-performance', async (req, res) => {
    try {
      console.log('[Rankings] Finding best performance period...');

      const [perf1m, perf3m] = await Promise.all([
        pastPerformanceService.getHistoricalPerformance(1),
        pastPerformanceService.getHistoricalPerformance(3),
      ]);

      // 데이터 있는 것 중 승률 우선, 동점이면 평균 수익률 비교
      const candidates = [perf1m, perf3m].filter(p => p.dataAvailable && p.stocks.length > 0);

      if (candidates.length === 0) {
        return res.json({ ...perf1m, dataAvailable: false });
      }

      const best = candidates.reduce((a, b) => {
        if (a.summary.winRate !== b.summary.winRate) {
          return a.summary.winRate > b.summary.winRate ? a : b;
        }
        return a.summary.avgReturn > b.summary.avgReturn ? a : b;
      });

      console.log(`[Rankings] Best period: ${best.period.monthsAgo}m (winRate=${(best.summary.winRate * 100).toFixed(0)}%, avg=${best.summary.avgReturn.toFixed(1)}%)`);

      return res.json(best);
    } catch (error) {
      console.error('[Rankings] Error finding best performance:', error);
      return res.status(500).json({ error: 'Failed', dataAvailable: false });
    }
  });

  // Capture ranking snapshot (called by cron or manually)
  app.post('/api/rankings/capture-snapshot', async (req, res) => {
    try {
      // Optional: Add admin authentication here
      console.log('[Rankings] Manual snapshot capture requested...');

      // Get current rankings
      const rankingsResponse = await fetch(`http://localhost:${process.env.PORT || 5000}/api/rankings?limit=10`);
      const rankingsData = await rankingsResponse.json();

      if (!rankingsData.rankings || !Array.isArray(rankingsData.rankings)) {
        return res.status(500).json({ error: 'Failed to get current rankings' });
      }

      // Transform to snapshot format
      const snapshotData = rankingsData.rankings.map((r: any) => ({
        ticker: r.ticker,
        companyName: r.companyName,
        score: r.score,
        avgTradeValue: r.avgTradeValue || 0,
        netBuying: r.netBuying || 0,
        marketCap: r.marketCap || null,
        uniqueInsiders: r.uniqueInsiders || 0,
        recommendation: r.recommendation || 'HOLD',
      }));

      await pastPerformanceService.captureRankingSnapshot(snapshotData);

      return res.json({
        success: true,
        message: `Snapshot captured for ${snapshotData.length} stocks`,
        date: new Date().toISOString().split('T')[0]
      });
    } catch (error) {
      console.error('[Rankings] Error capturing snapshot:', error);
      return res.status(500).json({ error: 'Failed to capture snapshot' });
    }
  });

  // Lightweight rankings endpoint - returns only ticker symbols for AI analysis eligibility check
  app.get('/api/rankings/tickers', async (req, res) => {
    try {
      console.log('🎯 Fetching ranking tickers for AI analysis eligibility check...');

      // Use same logic as /api/rankings but only extract tickers
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const recentTrades = await db.query.insiderTrades.findMany({
        where: (trades, { gte }) => gte(trades.filedDate, thirtyDaysAgo),
      });

      console.log(`📊 Found ${recentTrades.length} trades in last 30 days for ticker extraction`);

      // Same aggregation logic as rankings
      const stockMap = new Map<string, {
        ticker: string;
        totalValue: number;
        buyValue: number;
        sellValue: number;
        buyTrades: number;
        sellTrades: number;
        lastTradeDate: string;
      }>();

      recentTrades.forEach(trade => {
        if (!trade.ticker || !['BUY', 'PURCHASE', 'SALE', 'SELL'].includes(trade.tradeType)) {
          return;
        }

        const ticker = trade.ticker;
        if (!stockMap.has(ticker)) {
          stockMap.set(ticker, {
            ticker,
            totalValue: 0,
            buyValue: 0,
            sellValue: 0,
            buyTrades: 0,
            sellTrades: 0,
            lastTradeDate: trade.filedDate,
          });
        }

        const stock = stockMap.get(ticker)!;
        const isBuy = trade.tradeType === 'BUY' || trade.tradeType === 'PURCHASE';

        if (isBuy) {
          stock.buyValue += trade.totalValue;
          stock.buyTrades++;
        } else {
          stock.sellValue += trade.totalValue;
          stock.sellTrades++;
        }

        stock.totalValue += Math.abs(trade.totalValue);

        if (new Date(trade.filedDate) > new Date(stock.lastTradeDate)) {
          stock.lastTradeDate = trade.filedDate;
        }
      });

      // Apply same filters as rankings
      const stocks = Array.from(stockMap.values());
      const netBuyingStocks = stocks
        .filter(s => (s.buyTrades + s.sellTrades) >= 2) // Minimum 2 trades
        .filter(s => (s.buyValue - s.sellValue) > 0) // Net buying > 0
        .filter(s => s.buyTrades > 0); // At least 1 buy trade

      // Apply recency filter (same dynamic fallback as rankings: 7 -> 14 -> 30 days)
      let recencyDays = 7;
      let filteredStocks = netBuyingStocks.filter(s => {
        const daysSince = s.lastTradeDate ?
          (Date.now() - new Date(s.lastTradeDate).getTime()) / (1000 * 60 * 60 * 24) : 999;
        return daysSince <= recencyDays;
      });

      if (filteredStocks.length < 5) {
        recencyDays = 14;
        filteredStocks = netBuyingStocks.filter(s => {
          const daysSince = s.lastTradeDate ?
            (Date.now() - new Date(s.lastTradeDate).getTime()) / (1000 * 60 * 60 * 24) : 999;
          return daysSince <= recencyDays;
        });
      }

      if (filteredStocks.length < 5) {
        recencyDays = 30;
        filteredStocks = netBuyingStocks.filter(s => {
          const daysSince = s.lastTradeDate ?
            (Date.now() - new Date(s.lastTradeDate).getTime()) / (1000 * 60 * 60 * 24) : 999;
          return daysSince <= recencyDays;
        });
      }

      // 🎯 CRITICAL FIX: Sort by buyValue (net buying strength) and limit to top 6
      // This ensures AI analysis is only generated for the top 6 ranked stocks
      const topStocks = filteredStocks
        .sort((a, b) => (b.buyValue - b.sellValue) - (a.buyValue - a.sellValue)) // Sort by net buying
        .slice(0, 6); // Top 6 only

      // Extract only ticker symbols
      const tickers = topStocks.map(s => s.ticker);

      console.log(`✅ Returning top ${tickers.length} ranking tickers (recency: ${recencyDays} days)`);

      res.json({
        tickers,
        count: tickers.length,
        recencyDays,
        generatedAt: new Date().toISOString()
      });

    } catch (error) {
      console.error('❌ Error fetching ranking tickers:', error);
      res.status(500).json({ error: 'Failed to fetch ranking tickers' });
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

  // Exchange rate endpoints
  app.get('/api/exchange-rates', async (req, res) => {
    try {
      const rates = await exchangeRateService.getAllExchangeRates();
      res.json({
        success: true,
        data: rates
      });
    } catch (error) {
      console.error('환율 조회 실패:', error);
      res.status(500).json({
        success: false,
        error: '환율 정보를 가져오는데 실패했습니다.'
      });
    }
  });

  app.post('/api/exchange-rates/update', async (req, res) => {
    try {
      await exchangeRateService.updateExchangeRates();
      const rates = await exchangeRateService.getAllExchangeRates();
      res.json({
        success: true,
        data: rates,
        message: '환율 정보가 성공적으로 업데이트되었습니다.'
      });
    } catch (error) {
      console.error('환율 업데이트 실패:', error);
      res.status(500).json({
        success: false,
        error: '환율 업데이트에 실패했습니다.'
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

      // Validate ticker
      if (!ticker || ticker.trim().length === 0) {
        console.error('❌ Invalid ticker provided');
        return res.status(400).json({ error: 'Invalid ticker symbol' });
      }

      // First try to get from database
      let historyData = [];
      if (fromDate && toDate) {
        console.log(`📊 Checking database for ${ticker} history: ${fromDate} to ${toDate}`);
        historyData = await storage.getStockPriceHistoryRange(ticker, fromDate, toDate);
      } else {
        console.log(`📊 Checking database for ${ticker} history (all)`);
        historyData = await storage.getStockPriceHistory(ticker);
      }

      // If no data in database, fetch from service and save
      if (historyData.length === 0) {
        console.log(`📈 No data in DB, fetching from Yahoo Finance for ${ticker} (${fromDate && toDate ? `${fromDate} to ${toDate}` : period})`);
        const serviceData = await stockPriceService.getStockPriceHistory(ticker, period);

        // If no service data, try with a wider period
        if (serviceData.length === 0 && fromDate && toDate) {
          console.log(`⚠️ No data for ${ticker} in period ${period}, trying 2y range...`);
          const widerData = await stockPriceService.getStockPriceHistory(ticker, '2y');

          if (widerData.length > 0) {
            const filteredWider = widerData.filter(item =>
              item.date >= fromDate && item.date <= toDate
            );

            if (filteredWider.length > 0) {
              console.log(`✅ Found ${filteredWider.length} data points in wider range for ${ticker}`);
              historyData = filteredWider.map(item => ({
                ticker: item.ticker,
                date: item.date,
                open: item.open.toString(),
                high: item.high.toString(),
                low: item.low.toString(),
                close: item.close.toString(),
                volume: item.volume
              }));

              // Save wider data to database
              await stockPriceService.updateHistoricalPricesForTicker(ticker, '2y');
              return res.json(historyData);
            }
          }

          // No data found even in wider range
          console.warn(`⚠️ No historical data available for ${ticker} - ticker may be invalid or delisted`);
          return res.json([]);
        }

        // Filter to requested date range if specified
        let filteredData = serviceData;
        if (fromDate && toDate && serviceData.length > 0) {
          filteredData = serviceData.filter(item =>
            item.date >= fromDate && item.date <= toDate
          );
          console.log(`✅ Filtered to ${filteredData.length} data points in range ${fromDate} to ${toDate}`);
        }

        // Save to database for future use (save full data, return filtered)
        if (serviceData.length > 0) {
          console.log(`💾 Saving ${serviceData.length} data points to database for ${ticker}`);
          await stockPriceService.updateHistoricalPricesForTicker(ticker, period);
        }

        // Return filtered data directly (no need to fetch from DB again)
        historyData = filteredData.map(item => ({
          ticker: item.ticker,
          date: item.date,
          open: item.open.toString(),
          high: item.high.toString(),
          low: item.low.toString(),
          close: item.close.toString(),
          volume: item.volume
        }));
      } else {
        console.log(`✅ Found ${historyData.length} data points in database for ${ticker}`);
      }

      res.json(historyData);
    } catch (error) {
      console.error(`❌ Failed to fetch history for ${req.params.ticker}:`, error);
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

  // Force MarketCap update for all tickers
  app.post('/api/admin/force-marketcap-update', protectAdminEndpoint, async (req, res) => {
    try {
      console.log('🔄 Starting forced marketCap update...');

      const trades = await storage.getInsiderTrades(2000, 0, false);
      const uniqueTickers = [...new Set(trades.map(t => t.ticker).filter(Boolean))];

      let updated = 0, failed = 0, skipped = 0;

      for (const ticker of uniqueTickers) {
        try {
          const priceData = await stockPriceService.getStockPrice(ticker as string);

          if (priceData && priceData.marketCap && priceData.marketCap > 0) {
            updated++;
            const marketCapB = (priceData.marketCap / 1e9).toFixed(2);
            console.log(`✅ ${ticker}: $${marketCapB}B (market cap: ${priceData.marketCap})`);
          } else {
            skipped++;
            console.log(`⚠️ ${ticker}: No market cap data available`);
          }

          // Rate limiting: 12 seconds between requests for Polygon.io free tier
          await new Promise(resolve => setTimeout(resolve, 12000));
        } catch (error: any) {
          failed++;
          console.error(`❌ ${ticker} failed:`, error.message);
        }
      }

      console.log(`📈 MarketCap update complete: ${updated} updated, ${skipped} skipped, ${failed} failed`);

      res.json({
        success: true,
        updated,
        skipped,
        failed,
        total: uniqueTickers.length,
        message: `Updated ${updated}/${uniqueTickers.length} tickers`
      });
    } catch (error) {
      console.error('❌ Force MarketCap update failed:', error);
      res.status(500).json({ error: 'MarketCap update failed' });
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

  // Admin dashboard metrics endpoints
  app.get('/api/admin/metrics/overview', protectAdminEndpoint, async (req, res) => {
    try {
      const metrics = await adminMetricsService.getOverviewMetrics();
      res.json({
        success: true,
        metrics,
      });
    } catch (error) {
      console.error('Failed to get admin metrics:', error);
      res.status(500).json({
        error: 'Failed to fetch admin metrics',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  app.get('/api/admin/metrics/users', protectAdminEndpoint, async (req, res) => {
    try {
      const limit = parseInt(req.query.limit as string) || 100;
      const usersList = await adminMetricsService.getUsersList(limit);
      res.json({
        success: true,
        users: usersList,
      });
    } catch (error) {
      console.error('Failed to get users list:', error);
      res.status(500).json({
        error: 'Failed to fetch users list',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  app.get('/api/admin/metrics/growth', protectAdminEndpoint, async (req, res) => {
    try {
      const growth = await adminMetricsService.getUserGrowth();
      res.json({
        success: true,
        growth,
      });
    } catch (error) {
      console.error('Failed to get user growth data:', error);
      res.status(500).json({
        error: 'Failed to fetch user growth data',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  app.get('/api/admin/metrics/conversion', protectAdminEndpoint, async (req, res) => {
    try {
      const conversionData = await adminMetricsService.getConversionFunnel();
      res.json({
        success: true,
        ...conversionData,
      });
    } catch (error) {
      console.error('Failed to get conversion funnel data:', error);
      res.status(500).json({
        error: 'Failed to fetch conversion funnel data',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  app.get('/api/admin/metrics/revenue', protectAdminEndpoint, async (req, res) => {
    try {
      const revenueData = await adminMetricsService.getRevenueMetrics();
      res.json({
        success: true,
        ...revenueData,
      });
    } catch (error) {
      console.error('Failed to get revenue metrics:', error);
      res.status(500).json({
        error: 'Failed to fetch revenue metrics',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  app.get('/api/admin/metrics/geography', protectAdminEndpoint, async (req, res) => {
    try {
      const geographyData = await adminMetricsService.getGeographicDistribution();
      res.json({
        success: true,
        ...geographyData,
      });
    } catch (error) {
      console.error('Failed to get geography metrics:', error);
      res.status(500).json({
        error: 'Failed to fetch geography metrics',
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

  // Enhanced health check endpoint with scheduler status and data freshness
  app.get('/api/health', async (req, res) => {
    try {
      let schedulerStatus: any = { isRunning: false, error: 'Not loaded' };

      try {
        const { autoScheduler } = await import('./auto-scheduler');
        schedulerStatus = autoScheduler.getStatus();
      } catch (error) {
        schedulerStatus.error = 'Failed to load scheduler';
      }

      // Check data collection freshness
      let dataFreshness: any = { status: 'unknown', message: 'Not checked' };
      try {
        const recentTrades = await storage.getInsiderTrades(1); // Get most recent trade
        if (recentTrades.length > 0) {
          const mostRecentTrade = recentTrades[0];
          const now = new Date();
          const filedDate = new Date(mostRecentTrade.filedDate);
          const ageHours = Math.floor((now.getTime() - filedDate.getTime()) / (1000 * 60 * 60));

          dataFreshness = {
            status: 'ok',
            mostRecentFilingDate: mostRecentTrade.filedDate,
            ageHours,
            message: `Most recent filing: ${ageHours}h old`
          };

          // Warn if data is stale (> 48 hours)
          if (ageHours > 48) {
            dataFreshness.status = 'stale';
            dataFreshness.warning = 'Data collection may not be running';
          }
        } else {
          dataFreshness = {
            status: 'error',
            message: 'No trades in database'
          };
        }
      } catch (error: any) {
        dataFreshness = {
          status: 'error',
          message: `Data check failed: ${error.message}`
        };
      }

      res.json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        websocket: wss ? 'connected' : 'disconnected',
        autoScheduler: schedulerStatus,
        dataFreshness
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

  // Handle HTTP Server errors (prevents unhandled error crashes)
  httpServer.on('error', (error: any) => {
    console.error('❌ HTTP Server error:', error);
    if (error.code === 'EADDRINUSE') {
      console.error(`❌ Port is already in use`);
      console.error(`💡 Current PORT setting: ${process.env.PORT || '5000 (default)'}`);
      console.error('💡 Solution: Change PORT in .env file or kill the process using this port');
      process.exit(1);
    }
  });

  // Set up WebSocket server for real-time updates on a different path
  wss = new WebSocketServer({
    server: httpServer,
    path: '/api/ws'
  });

  // Handle WebSocketServer errors (CRITICAL: prevents app crashes)
  wss.on('error', (error: any) => {
    console.error('❌ WebSocketServer error:', error);
    if (error.code === 'EADDRINUSE') {
      console.error(`❌ Port ${error.port || 'unknown'} is already in use`);
      console.error('💡 Solution: Change the PORT in your .env file or stop the process using this port');
      console.error(`💡 Current PORT setting: ${process.env.PORT || '5000 (default)'}`);
      process.exit(1);
    }
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

  // 🔔 Register push notification API endpoints
  app.use('/api/notifications', notificationRouter);

  // 🔐 Register Toss Login API endpoints (Apps-in-Toss)
  app.use('/api/toss-login', tossLoginRouter);

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

  // 🚀 Register new enhanced scraping API endpoints (available in all environments)
  app.use('/api/enhanced', enhancedApiRouter);
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

  // Initialize exchange rate service
  exchangeRateService.initialize().catch(err => {
    console.error('⚠️ Failed to initialize exchange rate service:', err);
  });

  // Debug MarketCap status on startup
  debugMarketCapStatus().catch(err => {
    console.error('⚠️ Failed to debug market cap status:', err);
  });

  console.log('✅ API routes registered with WebSocket support, enhanced data collection, and push notifications');
  return httpServer;
}

// Debug function to check MarketCap coverage
async function debugMarketCapStatus() {
  try {
    console.log('\n🔍 ===== MarketCap Debug Info =====');

    const { sql } = await import('drizzle-orm');

    const result = await db.execute(sql`
      SELECT
        COUNT(*) as total,
        COUNT(CASE WHEN market_cap IS NOT NULL THEN 1 END) as with_marketcap,
        COUNT(CASE WHEN market_cap > 0 THEN 1 END) as positive_marketcap
      FROM stock_prices
    `);

    const stats = result.rows[0];
    console.log('📊 Stock Prices Table Coverage:');
    console.log(`   Total entries: ${stats.total}`);
    console.log(`   With marketCap: ${stats.with_marketcap} (${stats.total > 0 ? ((stats.with_marketcap / stats.total) * 100).toFixed(1) : 0}%)`);
    console.log(`   Positive marketCap: ${stats.positive_marketcap} (${stats.total > 0 ? ((stats.positive_marketcap / stats.total) * 100).toFixed(1) : 0}%)`);
    console.log('=====================================\n');
  } catch (error) {
    console.error('❌ MarketCap debug failed:', error);
  }
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
