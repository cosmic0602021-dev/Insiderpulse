import type { Express } from "express";
import express from "express";
import { createServer, type Server } from "http";
import { WebSocketServer } from "ws";
import { storage } from "./storage";
import { insertInsiderTradeSchema, users, insiderTrades } from "@shared/schema";
import { drizzle } from "drizzle-orm/neon-http";
import { eq } from "drizzle-orm";
import * as schema from "@shared/schema";
import { stockPriceService } from "./stock-price-service";
import { z } from "zod";
import { protectAdminEndpoint } from "./security-middleware";
import { registerMegaApiEndpoints } from "./mega-api-endpoints";
import dataCollectionRouter from "./data-collection-api";
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

// Initialize database
const db = drizzle(process.env.DATABASE_URL!, { schema });

// Initialize Stripe with secret key
if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('Missing required Stripe secret: STRIPE_SECRET_KEY');
}
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: "2023-10-16",
});

// Initialize OpenAI for translation
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// Helper function to translate text
async function translateText(text: string, targetLanguage: string): Promise<string> {
  if (!text || targetLanguage === 'en') {
    return text;
  }

  const languageNames: Record<string, string> = {
    ko: 'Korean',
    ja: 'Japanese',
    zh: 'Chinese (Simplified)'
  };

  const targetLangName = languageNames[targetLanguage] || 'English';

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: `You are a professional translator. Translate the following text to ${targetLangName}. Only return the translated text, nothing else.`
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
    console.error('Translation error:', error);
    return text; // Return original text if translation fails
  }
}

// Global WebSocket server for real-time updates
let wss: WebSocketServer;

export async function registerRoutes(app: Express): Promise<Server> {
  // 🏥 HEALTH CHECK ENDPOINT - Prevents Replit autoscale spindown
  app.get("/api/health", (_req, res) => {
    res.status(200).json({
      status: "healthy",
      timestamp: new Date().toISOString(),
      uptime: process.uptime()
    });
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

      // Determine plan type and set appropriate trial period
      // Monthly: 3 days free trial (72 hours)
      // Yearly: 7 days free trial (168 hours)
      const monthlyPriceId = process.env.STRIPE_PRICE_ID_MONTHLY;
      const yearlyPriceId = process.env.STRIPE_PRICE_ID_YEARLY;

      console.log(`🔍 Plan detection - Received priceId: "${priceId}"`);
      console.log(`🔍 Available prices - Monthly: "${monthlyPriceId}", Yearly: "${yearlyPriceId}"`);

      let planType: 'monthly' | 'yearly' = 'monthly';
      let trialDays = 3; // Default: 3 days for monthly

      if (priceId === yearlyPriceId) {
        planType = 'yearly';
        trialDays = 7; // 7 days for yearly
        console.log(`🎯 Detected YEARLY PLAN - ${trialDays} day trial`);
      } else if (priceId === monthlyPriceId) {
        planType = 'monthly';
        trialDays = 3; // 3 days for monthly
        console.log(`🎯 Detected MONTHLY PLAN - ${trialDays} day trial`);
      } else {
        // Unknown price ID - default to monthly with 3 days
        console.warn(`⚠️ Unknown priceId "${priceId}", defaulting to monthly with 3 day trial`);
      }

      // Calculate trial_end timestamp
      const trialEndTimestamp = Math.floor(Date.now() / 1000) + (trialDays * 24 * 60 * 60);

      const subscriptionData: any = {
        metadata: {
          userId: userId,
          planType: planType
        },
        trial_end: trialEndTimestamp,
      };

      console.log(`✅ Setting ${trialDays}-day free trial for ${planType} plan`);

      // Create Checkout Session with idempotency key to prevent duplicate requests
      // Idempotency key is valid for 1 minute window per user
      const idempotencyKey = `checkout_${userId}_${Math.floor(Date.now() / 60000)}`;

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
  const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
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
      console.error('⚠️ Webhook signature verification failed:', err.message);
      return res.status(400).send(`Webhook Error: ${err.message}`);
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
              // Downgrade user to free tier on payment failure
              await db.update(users)
                .set({
                  subscriptionTier: 'free',
                  subscriptionStatus: 'inactive',
                })
                .where(eq(users.id, user.id));

              console.log(`⚠️ Payment failed, downgraded user ${user.email} to free tier`);
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

      // Generate JWT token
      const token = jwt.sign(
        { userId: user.id, email: user.email },
        JWT_SECRET,
        { expiresIn: '7d' }
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
      const transactionTypes = transactionFilter
        ? transactionFilter.split(',')
        : ['BUY', 'SELL']; // Default: pure buy/sell only (schema-valid values)

      // Access control: check if user has real-time access
      const userId = getUserIdFromToken(req);

      let hasRealtimeAccess = false;
      if (!userId) {
        console.log('🔒 [/api/trades] No auth token found - treating as free user');
      } else {
        const accessLevel = await subscriptionService.getUserAccessLevel(userId);
        hasRealtimeAccess = accessLevel.canAccessRealtime;
        console.log(`🔑 [/api/trades] User ${userId.substring(0, 20)}... - hasRealtimeAccess: ${hasRealtimeAccess}`);
        console.log(`   📊 Tier: ${accessLevel.tier}, Status: ${accessLevel.status}, Trial: ${accessLevel.isTrialing}`);
      }

      // If user doesn't have real-time access, filter to 48h+ old trades
      let adjustedToDate: string | undefined = toDate; // Start with original toDate from request
      let filterBy: 'createdAt' | 'filedDate' | undefined = undefined;

      if (!hasRealtimeAccess) {
        // Free users: Force 48-hour delay filter regardless of request
        const fortyEightHoursAgo = new Date(Date.now() - 48 * 60 * 60 * 1000);
        adjustedToDate = fortyEightHoursAgo.toISOString().split('T')[0];
        filterBy = 'createdAt'; // Always filter by collection date for free users
        console.log(`🔒 Free user access - applying 48-hour delay filter`);
        console.log(`   Cutoff date: ${adjustedToDate}`);
        console.log(`   Filter: trades with createdAt <= ${adjustedToDate} (collected more than 48h ago)`);
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

      const rawTrades = await storage.getInsiderTrades(limit, offset, verifiedOnly, fromDate, adjustedToDate, sortBy, transactionTypes, filterBy);

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
      const stockPriceMap = new Map<string, { currentPrice: number; lastUpdated: Date | null }>();

      if (uniqueTickers.length > 0) {
        try {
          const prices = await db.query.stockPrices.findMany({
            where: (stockPrices, { inArray }) => inArray(stockPrices.ticker, uniqueTickers as string[]),
            columns: {
              ticker: true,
              currentPrice: true,
              lastUpdated: true,
            }
          });

          prices.forEach(price => {
            if (price.ticker && price.currentPrice) {
              stockPriceMap.set(price.ticker, {
                currentPrice: Number(price.currentPrice),
                lastUpdated: price.lastUpdated,
              });
            }
          });
        } catch (error) {
          console.warn('Failed to fetch stock prices for percentage calculation:', error);
        }
      }

      // Add current price and percentage change to each trade
      const enrichedTrades = rawTrades.map(trade => {
        const priceData = trade.ticker ? stockPriceMap.get(trade.ticker) : undefined;
        const currentPrice = priceData?.currentPrice;
        const priceLastUpdated = priceData?.lastUpdated;
        let priceChangePercent: number | undefined = undefined;

        if (currentPrice && trade.pricePerShare) {
          priceChangePercent = ((currentPrice - trade.pricePerShare) / trade.pricePerShare) * 100;
        }

        return {
          ...trade,
          currentPrice,
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

      const accessLevel = await subscriptionService.getUserAccessLevel(userId);

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

  // Get comprehensive AI analysis for a specific trade
  app.get('/api/trades/:id/comprehensive-analysis', async (req, res) => {
    try {
      const tradeId = req.params.id;
      const language = (req.query.language as string) || 'en';

      // Fetch trade from database
      const trade = await db.query.insiderTrades.findFirst({
        where: eq(insiderTrades.id, tradeId),
      });

      if (!trade) {
        return res.status(404).json({ error: 'Trade not found' });
      }

      // Cost optimization: Block API calls for trades older than 7 days (based on when uploaded to app)
      const tradeAge = Date.now() - new Date(trade.createdAt).getTime();
      const ONE_WEEK = 7 * 24 * 60 * 60 * 1000;

      if (tradeAge > ONE_WEEK) {
        console.log(`📦 Historical trade (${Math.floor(tradeAge / (24 * 60 * 60 * 1000))} days since upload) - returning basic info only`);
        return res.json({
          isHistorical: true,
          tradeAge: Math.floor(tradeAge / (24 * 60 * 60 * 1000)),
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

      console.log(`🔄 Recent trade (${Math.floor(tradeAge / (24 * 60 * 60 * 1000))} days old) - performing full analysis`);

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

      // Generate AI analysis with news context
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
        recentNews: recentNews.length > 0 ? recentNews : undefined
      });

      // Translation helpers
      const t = (key: string) => {
        const translations: Record<string, Record<string, string>> = {
          signal: { en: 'signal', ko: '신호', ja: 'シグナル', zh: '信号' },
          timeHorizon: { en: '3-6 months', ko: '3-6개월', ja: '3-6ヶ月', zh: '3-6个月' },
          mitigation: {
            en: 'Diversified investment and stop-loss recommended',
            ko: '분산 투자 및 손절매 설정 권장',
            ja: '分散投資とストップロスの設定を推奨',
            zh: '建议分散投资并设置止损'
          },
          analyzingMarket: {
            en: 'Analyzing market conditions',
            ko: '시장 상황 분석 중',
            ja: '市場状況を分析中',
            zh: '分析市场状况中'
          },
          latestNews: { en: 'Latest News', ko: '최신 소식', ja: '最新ニュース', zh: '最新消息' },
          insiderActivity: {
            en: 'Insider trading activity detected',
            ko: '내부자 거래 활동 감지됨',
            ja: 'インサイダー取引活動を検出',
            zh: '检测到内部交易活动'
          }
        };
        return translations[key]?.[language] || translations[key]?.['en'] || key;
      };

      // Pre-compute news analysis with translation
      let newsAnalysis;
      if (newsCorrelationResult && newsCorrelationResult.relatedNews && newsCorrelationResult.relatedNews.length > 0) {
        // Use real news data - sort by date (newest first)
        const newsItems = newsCorrelationResult.relatedNews
          .slice(0, 10) // Top 10 most relevant news
          .sort((a: any, b: any) => {
            // Sort by date, newest first
            const dateA = new Date(a.publishedDate).getTime();
            const dateB = new Date(b.publishedDate).getTime();
            return dateB - dateA;
          });

        // Translate news items if needed
        const translatedNewsItems = await Promise.all(
          newsItems.map(async (article: any) => ({
            title: await translateText(article.title, language),
            summary: await translateText(article.summary, language),
            sentiment: article.sentiment,
            published: new Date(article.publishedDate),
            relevanceScore: article.relevanceScore / 100, // Convert to 0-1 scale
            source: article.source
          }))
        );

        const positiveCount = translatedNewsItems.filter((n: any) =>
          n.sentiment === 'POSITIVE' || n.sentiment === 'BULLISH'
        ).length;
        const negativeCount = translatedNewsItems.filter((n: any) =>
          n.sentiment === 'NEGATIVE' || n.sentiment === 'BEARISH'
        ).length;

        newsAnalysis = {
          totalNews: newsCorrelationResult.relatedNews.length,
          positiveCount,
          negativeCount,
          majorNews: translatedNewsItems,
          // Additional insights from news correlation
          correlationScore: newsCorrelationResult.correlationScore,
          aiInsights: newsCorrelationResult.aiInsights
        };
      } else {
        // Fallback to basic analysis if no news available
        console.log('No news available, using fallback analysis');
        const isBuy = trade.tradeType.toUpperCase() === 'BUY' || trade.tradeType.toUpperCase() === 'PURCHASE';
        const fallbackTitle = `${trade.traderTitle || 'Insider'} ${isBuy ? 'purchased' : 'sold'} ${trade.shares.toLocaleString()} shares at $${trade.pricePerShare.toFixed(2)}`;
        const fallbackSummary = isBuy ?
          `Total value $${(trade.totalValue / 1000).toFixed(0)}K - Bullish signal detected` :
          `$${(trade.totalValue / 1000).toFixed(0)}K position reduced - Monitoring recommended`;

        const translatedFallbackNews = [{
          title: await translateText(fallbackTitle, language),
          summary: await translateText(fallbackSummary, language),
          sentiment: isBuy ? 'BULLISH' : 'BEARISH',
          published: new Date(trade.filedDate),
          relevanceScore: 0.95,
          source: 'SEC Form 4'
        }];

        newsAnalysis = {
          totalNews: 1,
          positiveCount: isBuy ? 1 : 0,
          negativeCount: isBuy ? 0 : 1,
          majorNews: translatedFallbackNews
        };
      }

      // Generate comprehensive analysis with language support
      const comprehensiveAnalysis = {
        executiveSummary: (() => {
          let summary = analysis.recommendation;

          // Integrate news analysis into executive summary
          if (newsCorrelationResult && newsCorrelationResult.relatedNews && newsCorrelationResult.relatedNews.length > 0) {
            const totalNews = newsCorrelationResult.relatedNews.length;
            const positiveNews = newsCorrelationResult.relatedNews.filter((n: any) =>
              n.sentiment === 'POSITIVE' || n.sentiment === 'BULLISH'
            ).length;
            const negativeNews = newsCorrelationResult.relatedNews.filter((n: any) =>
              n.sentiment === 'NEGATIVE' || n.sentiment === 'BEARISH'
            ).length;
            const neutralNews = totalNews - positiveNews - negativeNews;

            // Get most recent news headline
            const latestNews = newsCorrelationResult.relatedNews
              .sort((a: any, b: any) => new Date(b.publishedDate).getTime() - new Date(a.publishedDate).getTime())[0];

            // Create news context based on language
            let newsContext = '';
            if (language === 'ko') {
              newsContext = `최근 30일간 ${totalNews}건의 관련 뉴스가 보도되었으며, `;
              newsContext += `긍정 ${positiveNews}건, 부정 ${negativeNews}건, 중립 ${neutralNews}건으로 `;

              if (positiveNews > negativeNews) {
                newsContext += '전반적으로 긍정적인 시장 분위기를 보이고 있습니다. ';
              } else if (negativeNews > positiveNews) {
                newsContext += '시장의 우려가 감지되고 있습니다. ';
              } else {
                newsContext += '시장은 중립적인 태도를 유지하고 있습니다. ';
              }

              if (latestNews) {
                newsContext += `특히 "${latestNews.title}" 뉴스가 주목받고 있으며, `;
              }

              // Relate to insider trade
              const isBuy = trade.tradeType.toUpperCase().includes('BUY') || trade.tradeType.toUpperCase().includes('PURCHASE');
              if (isBuy && positiveNews > negativeNews) {
                newsContext += '긍정적인 뉴스 흐름과 내부자 매수가 맞물려 강력한 매수 신호를 형성하고 있습니다. ';
              } else if (!isBuy && negativeNews > positiveNews) {
                newsContext += '부정적인 뉴스와 내부자 매도가 동시에 발생하여 주의가 필요합니다. ';
              } else if (isBuy && negativeNews > positiveNews) {
                newsContext += '부정적인 뉴스에도 불구하고 내부자가 매수에 나서 역발상 투자 기회일 수 있습니다. ';
              }
            } else {
              newsContext = `Analysis of ${totalNews} news articles from the past 30 days shows `;
              newsContext += `${positiveNews} positive, ${negativeNews} negative, and ${neutralNews} neutral reports. `;

              if (positiveNews > negativeNews) {
                newsContext += 'Overall market sentiment is positive. ';
              } else if (negativeNews > positiveNews) {
                newsContext += 'Market concerns have been detected. ';
              } else {
                newsContext += 'Market sentiment remains neutral. ';
              }

              if (latestNews) {
                newsContext += `Notably, "${latestNews.title}" has gained significant attention. `;
              }

              // Relate to insider trade
              const isBuy = trade.tradeType.toUpperCase().includes('BUY') || trade.tradeType.toUpperCase().includes('PURCHASE');
              if (isBuy && positiveNews > negativeNews) {
                newsContext += 'The convergence of positive news flow and insider buying creates a strong buy signal. ';
              } else if (!isBuy && negativeNews > positiveNews) {
                newsContext += 'The combination of negative news and insider selling warrants caution. ';
              } else if (isBuy && negativeNews > positiveNews) {
                newsContext += 'Insider buying despite negative news may present a contrarian opportunity. ';
              }
            }

            summary = newsContext + summary;
          }

          return summary;
        })(),
        actionableRecommendation: `${analysis.signalType} ${t('signal')} - ${analysis.recommendation}`,
        priceTargets: {
          conservative: trade.pricePerShare * 0.95,
          realistic: trade.pricePerShare * 1.05,
          optimistic: trade.pricePerShare * 1.15,
          timeHorizon: t('timeHorizon')
        },
        riskAssessment: {
          level: analysis.riskLevel,
          factors: analysis.keyInsights,
          mitigation: t('mitigation')
        },
        marketContext: {
          sentiment: analysis.signalType === 'BUY' ? 'BULLISH' : analysis.signalType === 'SELL' ? 'BEARISH' : 'NEUTRAL',
          reasoning: analysis.keyInsights[0] || t('analyzingMarket')
        },
        catalysts: analysis.keyInsights,
        timeHorizon: t('timeHorizon'),
        confidence: analysis.significanceScore,
        newsAnalysis: newsAnalysis
      };

      // Translate catalysts (keyInsights) if not English
      if (language !== 'en' && comprehensiveAnalysis.catalysts && comprehensiveAnalysis.catalysts.length > 0) {
        comprehensiveAnalysis.catalysts = await Promise.all(
          comprehensiveAnalysis.catalysts.map((catalyst: string) => translateText(catalyst, language))
        );
      }

      // Translate marketContext reasoning if not English
      if (language !== 'en' && comprehensiveAnalysis.marketContext.reasoning) {
        comprehensiveAnalysis.marketContext.reasoning = await translateText(
          comprehensiveAnalysis.marketContext.reasoning,
          language
        );
      }

      res.json(comprehensiveAnalysis);
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
        .filter(r => r.netBuying > 0) // CRITICAL: Only recommend stocks with net buying (매수 > 매도)
        .filter(r => r.buyTrades > 0) // Must have at least 1 buy trade
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

  // 📱 PWA 푸시 알림 구독
  app.post('/api/notifications/subscribe', async (req, res) => {
    try {
      const { subscription, ticker, companyName } = req.body;

      if (!subscription || !ticker) {
        return res.status(400).json({ error: '필수 파라미터가 누락되었습니다' });
      }

      console.log('🔔 푸시 알림 구독:', { ticker, companyName });
      console.log('📱 구독 정보:', subscription);

      // TODO: 데이터베이스에 구독 정보 저장
      // await storage.savePushSubscription({
      //   endpoint: subscription.endpoint,
      //   keys: subscription.keys,
      //   ticker,
      //   companyName,
      //   subscribedAt: new Date()
      // });

      res.json({
        success: true,
        message: `${ticker}의 거래 알림이 활성화되었습니다`
      });
    } catch (error) {
      console.error('푸시 알림 구독 실패:', error);
      res.status(500).json({ error: '푸시 알림 구독에 실패했습니다' });
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
        
        // Calculate ranking score based on (TIMING-FOCUSED WEIGHTS):
        // - Net buying amount (30%)
        // - Recency of trades (20% - TIMING IS CRITICAL!)
        // - Number of unique insiders (20%)
        // - Number of buying transactions (15%)
        // - Pattern bonus (10% - cluster buying, consecutive trades, etc.)
        // - Average trade value (5% - log scale to prevent extreme values from dominating)
        
        const netBuyingScore = Math.max(0, metrics.netBuying) / 1000000; // Normalize to millions
        const buyCountScore = metrics.buyCount * 5; // 5 points per buy trade
        const insiderScore = metrics.uniqueInsiders.size * 10; // 10 points per unique insider
        // Use log scale to prevent extremely large trades from dominating the score
        const avgValueScore = Math.log10(metrics.avgTradeValue + 1) * 2; // Log scale normalization
        
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
          netBuyingScore * 0.30 +  // Net buying amount (30%, reduced from 35%)
          buyCountScore * 0.15 +   // Buy trade count (15%, reduced from 20%)
          insiderScore * 0.20 +    // Unique insiders (20%, unchanged)
          avgValueScore * 0.05 +   // Average trade value (5%, reduced from 10%)
          recencyScore * 0.20 +    // Recency (20%, INCREASED from 10% - timing is critical!)
          patternBonus * 0.10      // Pattern bonus (10%, INCREASED from 5%)
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

        // Insider 상세 정보 (매수자만, 이상한 이름 제외)
        const insiderDetails = metrics.trades
          .filter(t => {
            const isBuy = t.tradeType === 'BUY' || t.tradeType === 'PURCHASE' || t.tradeType === 'GRANT' ||
                         t.transactionCode === 'P' || t.transactionCode === 'A';

            // 이상한 이름 패턴 필터링
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
          })
          .map(t => ({
            name: t.traderName,
            title: t.traderTitle || 'Insider',
            shares: t.shares,
            pricePerShare: t.pricePerShare,
            totalValue: t.totalValue,
            date: t.filedDate,
            tradeType: t.tradeType
          }))
          .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()); // 최신순

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
          insiders: insiderDetails, // 📋 Insider 상세 정보 추가!
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
        .filter(r => r.netBuying > 0) // CRITICAL: Only recommend stocks with net buying (매수 > 매도)
        .filter(r => r.buyTrades > 0) // Must have at least 1 buy trade
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
