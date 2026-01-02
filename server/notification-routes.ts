/**
 * Notification API Routes
 * Handles push notification subscription management for PWA and Apps-in-Toss
 */

import express from 'express';
import jwt from 'jsonwebtoken';
import { drizzle } from 'drizzle-orm/neon-http';
import {
  notificationSubscriptions,
  notificationLogs,
  type NotificationSubscription
} from '@shared/schema';
import { eq, and, desc } from 'drizzle-orm';
import * as schema from '@shared/schema';
import { isAppintosEnvironment } from './environment-utils';

const db = drizzle(process.env.DATABASE_URL!, { schema });
const router = express.Router();

/**
 * Middleware to verify user authentication
 * Extracts userId from JWT token in Authorization header
 */
function requireAuth(req: express.Request, res: express.Response, next: express.NextFunction) {
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (!token) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  try {
    const JWT_SECRET = process.env.JWT_SECRET;
    if (!JWT_SECRET) {
      console.error('[Notification] JWT_SECRET not configured');
      return res.status(500).json({ error: 'Server configuration error' });
    }
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string; email: string };
    (req as any).userId = decoded.userId;
    next();
  } catch (error) {
    console.error('[Notification] Token verification failed:', error);
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
}

/**
 * GET /api/notifications/vapid-public-key
 * Get VAPID public key for PWA push subscription
 */
router.get('/vapid-public-key', (req, res) => {
  const publicKey = process.env.VAPID_PUBLIC_KEY;
  if (!publicKey) {
    return res.status(500).json({ error: 'VAPID keys not configured' });
  }
  res.json({ publicKey });
});

/**
 * POST /api/notifications/subscribe
 * Subscribe to or unsubscribe from ticker notifications
 */
router.post('/subscribe', requireAuth, async (req, res) => {
  try {
    const userId = (req as any).userId;
    const { ticker, companyName, action, pushSubscription } = req.body;

    if (!ticker || !companyName) {
      return res.status(400).json({ error: 'Missing ticker or companyName' });
    }

    if (!action || !['subscribe', 'unsubscribe'].includes(action)) {
      return res.status(400).json({ error: 'Invalid action. Must be "subscribe" or "unsubscribe"' });
    }

    const isAppintos = isAppintosEnvironment(req);
    const platform = isAppintos ? 'appintos' : 'pwa';

    if (action === 'unsubscribe') {
      // Remove subscription
      const deleted = await db.delete(notificationSubscriptions)
        .where(
          and(
            eq(notificationSubscriptions.userId, userId),
            eq(notificationSubscriptions.ticker, ticker),
            eq(notificationSubscriptions.platform, platform)
          )
        )
        .returning();

      console.log(`[Notification API] User ${userId} unsubscribed from ${ticker} (${platform})`);
      return res.json({
        success: true,
        message: 'Unsubscribed successfully',
        subscription: deleted[0] || null
      });
    }

    // Subscribe
    if (platform === 'pwa') {
      // PWA requires push subscription details
      if (!pushSubscription || !pushSubscription.endpoint) {
        return res.status(400).json({
          error: 'Push subscription required for PWA'
        });
      }

      // Check if subscription already exists
      const existing = await db.query.notificationSubscriptions.findFirst({
        where: and(
          eq(notificationSubscriptions.userId, userId),
          eq(notificationSubscriptions.ticker, ticker),
          eq(notificationSubscriptions.platform, platform)
        )
      });

      if (existing) {
        // Update existing subscription with new push details
        const [updated] = await db.update(notificationSubscriptions)
          .set({
            pushEndpoint: pushSubscription.endpoint,
            pushP256dh: pushSubscription.keys.p256dh,
            pushAuth: pushSubscription.keys.auth,
            companyName,
            isActive: true
          })
          .where(eq(notificationSubscriptions.id, existing.id))
          .returning();

        console.log(`[Notification API] Updated PWA subscription for ${userId} on ${ticker}`);
        return res.json({
          success: true,
          message: 'Subscription updated',
          subscription: updated
        });
      }

      // Create new subscription
      const [newSub] = await db.insert(notificationSubscriptions)
        .values({
          userId,
          ticker,
          companyName,
          platform,
          pushEndpoint: pushSubscription.endpoint,
          pushP256dh: pushSubscription.keys.p256dh,
          pushAuth: pushSubscription.keys.auth,
          notifyOnBuy: true,
          notifyOnSell: true,
          isActive: true
        })
        .returning();

      console.log(`[Notification API] Created PWA subscription for ${userId} on ${ticker}`);
      return res.json({
        success: true,
        message: 'Subscribed successfully',
        subscription: newSub
      });
    }

    // Apps-in-Toss subscription (or web without PWA)
    if (platform === 'appintos') {
      // Get Toss user key from request header (optional - for future push notifications)
      const tossUserKey = req.headers['x-toss-user-key'] as string | undefined;

      // Check if subscription already exists
      const existing = await db.query.notificationSubscriptions.findFirst({
        where: and(
          eq(notificationSubscriptions.userId, userId),
          eq(notificationSubscriptions.ticker, ticker),
          eq(notificationSubscriptions.platform, platform)
        )
      });

      if (existing) {
        // Update existing subscription
        const updateData: any = {
          companyName,
          isActive: true
        };
        if (tossUserKey) {
          updateData.tossUserKey = tossUserKey;
        }

        const [updated] = await db.update(notificationSubscriptions)
          .set(updateData)
          .where(eq(notificationSubscriptions.id, existing.id))
          .returning();

        console.log(`[Notification API] Updated Appintos subscription for ${userId} on ${ticker}`);
        return res.json({
          success: true,
          message: 'Subscription updated',
          subscription: updated
        });
      }

      // Create new subscription
      const insertData: any = {
        userId,
        ticker,
        companyName,
        platform,
        notifyOnBuy: true,
        notifyOnSell: true,
        isActive: true
      };
      if (tossUserKey) {
        insertData.tossUserKey = tossUserKey;
      }

      const [newSub] = await db.insert(notificationSubscriptions)
        .values(insertData)
        .returning();

      console.log(`[Notification API] Created Appintos subscription for ${userId} on ${ticker}`);
      return res.json({
        success: true,
        message: 'Subscribed successfully',
        subscription: newSub
      });
    }

    res.status(400).json({ error: 'Invalid platform' });
  } catch (error: any) {
    console.error('[Notification API] Subscribe error:', error);
    res.status(500).json({ error: error.message || 'Failed to process subscription' });
  }
});

/**
 * GET /api/notifications/subscriptions
 * Get user's active subscriptions
 * Query params: ticker (optional) - check subscription for specific ticker
 */
router.get('/subscriptions', requireAuth, async (req, res) => {
  try {
    const userId = (req as any).userId;
    const ticker = req.query.ticker as string | undefined;

    if (ticker) {
      // Check subscription for specific ticker
      const subscription = await db.query.notificationSubscriptions.findFirst({
        where: and(
          eq(notificationSubscriptions.userId, userId),
          eq(notificationSubscriptions.ticker, ticker),
          eq(notificationSubscriptions.isActive, true)
        )
      });

      return res.json({
        ticker,
        isSubscribed: !!subscription,
        subscription: subscription || null
      });
    }

    // Get all user subscriptions
    const subscriptions = await db.query.notificationSubscriptions.findMany({
      where: and(
        eq(notificationSubscriptions.userId, userId),
        eq(notificationSubscriptions.isActive, true)
      ),
      orderBy: desc(notificationSubscriptions.createdAt)
    });

    res.json({
      subscriptions,
      count: subscriptions.length
    });
  } catch (error: any) {
    console.error('[Notification API] Get subscriptions error:', error);
    res.status(500).json({ error: error.message || 'Failed to get subscriptions' });
  }
});

/**
 * GET /api/notifications/history
 * Get notification history for user
 */
router.get('/history', requireAuth, async (req, res) => {
  try {
    const userId = (req as any).userId;
    const limit = parseInt(req.query.limit as string) || 50;
    const offset = parseInt(req.query.offset as string) || 0;

    const logs = await db.query.notificationLogs.findMany({
      where: eq(notificationLogs.userId, userId),
      orderBy: desc(notificationLogs.sentAt),
      limit,
      offset
    });

    res.json({
      logs,
      count: logs.length,
      limit,
      offset
    });
  } catch (error: any) {
    console.error('[Notification API] Get history error:', error);
    res.status(500).json({ error: error.message || 'Failed to get notification history' });
  }
});

/**
 * PUT /api/notifications/preferences/:subscriptionId
 * Update notification preferences (notify_on_buy, notify_on_sell)
 */
router.put('/preferences/:subscriptionId', requireAuth, async (req, res) => {
  try {
    const userId = (req as any).userId;
    const { subscriptionId } = req.params;
    const { notifyOnBuy, notifyOnSell } = req.body;

    // Verify subscription belongs to user
    const subscription = await db.query.notificationSubscriptions.findFirst({
      where: and(
        eq(notificationSubscriptions.id, subscriptionId),
        eq(notificationSubscriptions.userId, userId)
      )
    });

    if (!subscription) {
      return res.status(404).json({ error: 'Subscription not found' });
    }

    // Update preferences
    const [updated] = await db.update(notificationSubscriptions)
      .set({
        notifyOnBuy: notifyOnBuy !== undefined ? notifyOnBuy : subscription.notifyOnBuy,
        notifyOnSell: notifyOnSell !== undefined ? notifyOnSell : subscription.notifyOnSell
      })
      .where(eq(notificationSubscriptions.id, subscriptionId))
      .returning();

    console.log(`[Notification API] Updated preferences for subscription ${subscriptionId}`);
    res.json({
      success: true,
      subscription: updated
    });
  } catch (error: any) {
    console.error('[Notification API] Update preferences error:', error);
    res.status(500).json({ error: error.message || 'Failed to update preferences' });
  }
});

export default router;
