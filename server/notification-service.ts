/**
 * Notification Service
 * Handles push notifications for both PWA (Web Push API) and Apps-in-Toss (Toss Push API)
 */

import webpush from 'web-push';
import { drizzle } from 'drizzle-orm/neon-http';
import {
  users,
  insiderTrades,
  notificationSubscriptions,
  notificationLogs,
  type NotificationSubscription,
  type InsiderTrade
} from '@shared/schema';
import { eq, and } from 'drizzle-orm';
import * as schema from '@shared/schema';

const db = drizzle(process.env.DATABASE_URL!, { schema });

// Initialize web-push with VAPID keys
webpush.setVapidDetails(
  process.env.VAPID_SUBJECT || 'mailto:admin@insiderpulse.pro',
  process.env.VAPID_PUBLIC_KEY!,
  process.env.VAPID_PRIVATE_KEY!
);

export interface NotificationPayload {
  title: string;
  body: string;
  ticker: string;
  tradeId: string;
  tradeType: 'BUY' | 'SELL';
  traderTitle: string;
  shares: number;
  totalValue: number;
  url: string;
}

export class NotificationService {
  /**
   * Main entry point: Send notifications for a new insider trade
   */
  async notifySubscribers(tradeId: string): Promise<void> {
    try {
      // 1. Get trade details
      const trade = await db.query.insiderTrades.findFirst({
        where: eq(insiderTrades.id, tradeId)
      });

      if (!trade) {
        console.error(`[Notification] Trade not found: ${tradeId}`);
        return;
      }

      if (!trade.ticker) {
        console.log(`[Notification] Trade ${tradeId} has no ticker, skipping notifications`);
        return;
      }

      console.log(`[Notification] Processing notifications for ${trade.ticker} ${trade.tradeType} trade`);

      // 2. Find all active subscriptions for this ticker
      const subscriptions = await db.query.notificationSubscriptions.findMany({
        where: and(
          eq(notificationSubscriptions.ticker, trade.ticker),
          eq(notificationSubscriptions.isActive, true)
        )
      });

      if (subscriptions.length === 0) {
        console.log(`[Notification] No active subscriptions for ${trade.ticker}`);
        return;
      }

      // 3. Filter by trade type preference
      const relevantSubs = subscriptions.filter(sub => {
        if (trade.tradeType === 'BUY' && !sub.notifyOnBuy) return false;
        if (trade.tradeType === 'SELL' && !sub.notifyOnSell) return false;
        return true;
      });

      if (relevantSubs.length === 0) {
        console.log(`[Notification] No subscribers want ${trade.tradeType} notifications for ${trade.ticker}`);
        return;
      }

      console.log(`[Notification] Sending ${relevantSubs.length} notifications for ${trade.ticker} ${trade.tradeType}`);

      // 4. Create notification payload
      const payload: NotificationPayload = {
        title: `${trade.ticker} - Insider ${trade.tradeType}`,
        body: `${trade.traderTitle || 'Insider'} ${trade.tradeType.toLowerCase()} ${this.formatNumber(trade.shares)} shares ($${this.formatValue(trade.totalValue)})`,
        ticker: trade.ticker,
        tradeId: trade.id,
        tradeType: trade.tradeType as 'BUY' | 'SELL',
        traderTitle: trade.traderTitle || 'Insider',
        shares: trade.shares,
        totalValue: trade.totalValue,
        url: `https://insiderpulse.pro/trade/${trade.id}`
      };

      // 5. Send notifications in parallel (don't block on failures)
      const results = await Promise.allSettled(
        relevantSubs.map(sub => this.sendNotification(sub, payload, trade))
      );

      const succeeded = results.filter(r => r.status === 'fulfilled').length;
      const failed = results.filter(r => r.status === 'rejected').length;

      console.log(`[Notification] ✅ ${succeeded} sent, ❌ ${failed} failed for trade ${tradeId}`);
    } catch (error) {
      console.error('[Notification] Failed to notify subscribers:', error);
    }
  }

  /**
   * Send notification to a single subscription
   */
  private async sendNotification(
    subscription: NotificationSubscription,
    payload: NotificationPayload,
    trade: InsiderTrade
  ): Promise<void> {
    try {
      if (subscription.platform === 'pwa') {
        await this.sendWebPushNotification(subscription, payload);
      } else if (subscription.platform === 'appintos') {
        await this.sendTossPushNotification(subscription, payload);
      } else {
        console.warn(`[Notification] Unknown platform: ${subscription.platform}`);
        return;
      }

      // Update subscription metadata
      await db.update(notificationSubscriptions)
        .set({
          lastNotifiedAt: new Date(),
          notificationCount: subscription.notificationCount + 1
        })
        .where(eq(notificationSubscriptions.id, subscription.id));

      // Log success
      await this.logNotification(
        subscription.id,
        trade.id,
        subscription.userId,
        subscription.platform,
        'sent',
        payload
      );
    } catch (error: any) {
      console.error(`[Notification] Failed to send to ${subscription.id}:`, error?.message || error);

      // Log failure
      await this.logNotification(
        subscription.id,
        trade.id,
        subscription.userId,
        subscription.platform,
        'failed',
        payload,
        error?.message || String(error)
      );

      // Deactivate subscription if permanently failed
      if (this.isPermanentFailure(error)) {
        console.log(`[Notification] Deactivating permanently failed subscription ${subscription.id}`);
        await db.update(notificationSubscriptions)
          .set({ isActive: false })
          .where(eq(notificationSubscriptions.id, subscription.id));
      }

      throw error; // Re-throw to be caught by Promise.allSettled
    }
  }

  /**
   * Send Web Push notification (PWA)
   */
  private async sendWebPushNotification(
    subscription: NotificationSubscription,
    payload: NotificationPayload
  ): Promise<void> {
    if (!subscription.pushEndpoint || !subscription.pushP256dh || !subscription.pushAuth) {
      throw new Error('Missing Web Push subscription details');
    }

    const pushSubscription = {
      endpoint: subscription.pushEndpoint,
      keys: {
        p256dh: subscription.pushP256dh,
        auth: subscription.pushAuth
      }
    };

    try {
      await webpush.sendNotification(
        pushSubscription,
        JSON.stringify(payload)
      );
      console.log(`[Web Push] ✅ Sent to user ${subscription.userId}`);
    } catch (error: any) {
      // Check for specific Web Push errors
      if (error.statusCode === 410 || error.statusCode === 404) {
        console.log(`[Web Push] Subscription expired or invalid (${error.statusCode})`);
        throw new Error(`EXPIRED_SUBSCRIPTION: ${error.statusCode}`);
      }
      throw error;
    }
  }

  /**
   * Send Toss Push notification (Apps-in-Toss)
   * NOTE: This will be fully implemented once mTLS certificates are received
   */
  private async sendTossPushNotification(
    subscription: NotificationSubscription,
    payload: NotificationPayload
  ): Promise<void> {
    if (!subscription.tossUserKey) {
      throw new Error('Missing Toss user key');
    }

    // Check if Toss Push API is configured
    if (!process.env.TOSS_PUSH_API_URL || !process.env.TOSS_MESSAGE_TEMPLATE_ID) {
      console.warn('[Toss Push] API not configured yet, skipping notification');
      // Don't throw error - this is expected until Toss certificates are set up
      return;
    }

    try {
      // Import mTLS config dynamically (will be created later)
      const { createTossMtlsAgent } = await import('./toss-mtls-config.js');
      const mtlsAgent = createTossMtlsAgent();

      const response = await fetch(process.env.TOSS_PUSH_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-toss-user-key': subscription.tossUserKey
        },
        body: JSON.stringify({
          templateId: process.env.TOSS_MESSAGE_TEMPLATE_ID,
          parameters: {
            ticker: payload.ticker,
            tradeType: payload.tradeType,
            traderTitle: payload.traderTitle,
            shares: this.formatNumber(payload.shares),
            totalValue: this.formatValue(payload.totalValue)
          },
          action: {
            type: 'WEB_URL',
            url: payload.url
          }
        }),
        // @ts-ignore - agent type mismatch between node-fetch and https.Agent
        agent: mtlsAgent
      });

      if (!response.ok) {
        const errorText = await response.text().catch(() => 'Unknown error');
        throw new Error(`Toss Push API error: ${response.status} ${errorText}`);
      }

      console.log(`[Toss Push] ✅ Sent to user ${subscription.userId}`);
    } catch (error: any) {
      if (error.message?.includes('Cannot find module')) {
        // mTLS config not created yet - this is expected
        console.warn('[Toss Push] mTLS config not available yet, skipping');
        return;
      }
      throw error;
    }
  }

  /**
   * Log notification attempt
   */
  private async logNotification(
    subscriptionId: string,
    tradeId: string,
    userId: string,
    platform: string,
    status: 'sent' | 'failed',
    payload: NotificationPayload,
    errorMessage?: string
  ): Promise<void> {
    try {
      await db.insert(notificationLogs).values({
        subscriptionId,
        tradeId,
        userId,
        platform,
        status,
        errorMessage,
        title: payload.title,
        body: payload.body,
        metadata: payload as any
      });
    } catch (error) {
      console.error('[Notification] Failed to log notification:', error);
      // Don't throw - logging failures shouldn't break notifications
    }
  }

  /**
   * Check if error is permanent (should deactivate subscription)
   */
  private isPermanentFailure(error: any): boolean {
    // Web Push: 410 Gone or 404 Not Found means subscription expired
    if (error.statusCode === 410 || error.statusCode === 404) return true;
    if (error.message?.includes('EXPIRED_SUBSCRIPTION')) return true;

    // Toss Push: specific error codes for invalid user
    if (error.message?.includes('INVALID_USER')) return true;

    return false;
  }

  /**
   * Format large numbers with K/M suffix
   */
  private formatNumber(num: number): string {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  }

  /**
   * Format currency values
   */
  private formatValue(value: number): string {
    if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`;
    if (value >= 1000) return `${(value / 1000).toFixed(0)}K`;
    return value.toFixed(0);
  }
}

// Export singleton instance
export const notificationService = new NotificationService();
