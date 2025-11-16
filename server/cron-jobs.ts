/**
 * Cron Jobs for scheduled tasks
 * Handles subscription syncing, trial expiration checks, etc.
 */

import cron from "node-cron";
import Stripe from "stripe";
import { drizzle } from "drizzle-orm/neon-http";
import { users } from "@shared/schema";
import { eq } from "drizzle-orm";
import * as schema from "@shared/schema";

const db = drizzle(process.env.DATABASE_URL!, { schema });
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2024-11-20.acacia",
});

/**
 * Sync all Insider Pro subscriptions with Stripe
 * Runs daily at 2 AM
 */
export function startSubscriptionSyncJob() {
  // Run every day at 2 AM
  cron.schedule("0 2 * * *", async () => {
    console.log("[Cron] Starting daily subscription sync...");

    try {
      // Get all users with Insider Pro tier
      const insiderProUsers = await db.query.users.findMany({
        where: eq(users.subscriptionTier, "insider_pro"),
      });

      console.log(`[Cron] Found ${insiderProUsers.length} Insider Pro users to check`);

      let syncedCount = 0;
      let errorCount = 0;

      for (const user of insiderProUsers) {
        // Skip users without Stripe subscription ID
        if (!user.stripeSubscriptionId) {
          console.log(`[Cron] User ${user.id} (${user.email}) has no Stripe subscription ID, skipping`);
          continue;
        }

        try {
          // Fetch subscription from Stripe
          const subscription = await stripe.subscriptions.retrieve(user.stripeSubscriptionId);
          const stripePeriodEnd = new Date(subscription.current_period_end * 1000);
          const isStripeActive = subscription.status === "active" || subscription.status === "trialing";
          const now = new Date();

          // Check if DB and Stripe are out of sync
          const dbShowsExpired = user.subscriptionEndDate && user.subscriptionEndDate < now;
          const dbStatusMismatch = user.subscriptionStatus !== subscription.status;
          const dbEndDateMismatch = !user.subscriptionEndDate || Math.abs(user.subscriptionEndDate.getTime() - stripePeriodEnd.getTime()) > 60000; // 1 minute tolerance

          if (dbShowsExpired && isStripeActive) {
            console.log(`[Cron] ⚠️  MISMATCH: User ${user.id} (${user.email}) - DB expired but Stripe active`);
            console.log(`[Cron]     DB: status=${user.subscriptionStatus}, end=${user.subscriptionEndDate}`);
            console.log(`[Cron]     Stripe: status=${subscription.status}, end=${stripePeriodEnd}`);

            // CRITICAL FIX: Don't blindly copy "canceled" status from Stripe
            // If subscription is "canceled" in Stripe but period_end is in the future,
            // keep status as "active" in our DB because user still has paid access
            const now = new Date();
            let dbStatus = subscription.status;
            if (subscription.status === 'canceled' && stripePeriodEnd > now) {
              dbStatus = 'active';
              console.log(`[Cron]     ⚠️ Stripe says "canceled" but period_end is ${stripePeriodEnd}, keeping "active"`);
            }

            // Update DB with correct status
            await db.update(users)
              .set({
                subscriptionStatus: dbStatus as any,
                subscriptionEndDate: stripePeriodEnd,
              })
              .where(eq(users.id, user.id));

            console.log(`[Cron] ✅ Synced user ${user.id} (${user.email})`);
            syncedCount++;
          } else if (dbStatusMismatch || dbEndDateMismatch) {
            console.log(`[Cron] 🔄 Minor sync for user ${user.id} (${user.email})`);

            // CRITICAL FIX: Same logic for minor sync
            const now = new Date();
            let dbStatus = subscription.status;
            if (subscription.status === 'canceled' && stripePeriodEnd > now) {
              dbStatus = 'active';
              console.log(`[Cron]     ⚠️ Stripe says "canceled" but period_end is ${stripePeriodEnd}, keeping "active"`);
            }

            await db.update(users)
              .set({
                subscriptionStatus: dbStatus as any,
                subscriptionEndDate: stripePeriodEnd,
              })
              .where(eq(users.id, user.id));

            syncedCount++;
          } else {
            console.log(`[Cron] ✓ User ${user.id} (${user.email}) is in sync`);
          }
        } catch (error: any) {
          if (error.type === "StripeInvalidRequestError" && error.code === "resource_missing") {
            console.log(`[Cron] ⚠️  Subscription ${user.stripeSubscriptionId} not found in Stripe for user ${user.id} (${user.email})`);
            // Don't update DB - might be temporary Stripe issue
          } else {
            console.error(`[Cron] ❌ Error syncing user ${user.id} (${user.email}):`, error.message);
            errorCount++;
          }
        }

        // Add small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      console.log(`[Cron] Subscription sync complete: ${syncedCount} synced, ${errorCount} errors`);
    } catch (error) {
      console.error("[Cron] Fatal error in subscription sync:", error);
    }
  });

  console.log("✅ Subscription sync cron job scheduled (daily at 2 AM)");
}

/**
 * Check for expired trials and update status
 * Runs every hour
 */
export function startTrialExpirationCheckJob() {
  // Run every hour at minute 0
  cron.schedule("0 * * * *", async () => {
    console.log("[Cron] Checking for expired trials...");

    try {
      const now = new Date();

      // Find users with expired trials that still have "trialing" status
      const expiredTrialUsers = await db.query.users.findMany({
        where: (users, { and, lt, eq, isNotNull }) => and(
          eq(users.subscriptionStatus, "trialing"),
          isNotNull(users.trialExpiresAt),
          lt(users.trialExpiresAt, now)
        ),
      });

      if (expiredTrialUsers.length > 0) {
        console.log(`[Cron] Found ${expiredTrialUsers.length} expired trials`);

        for (const user of expiredTrialUsers) {
          // Update status to inactive
          await db.update(users)
            .set({
              subscriptionStatus: "inactive",
            })
            .where(eq(users.id, user.id));

          console.log(`[Cron] Updated user ${user.id} (${user.email}) trial status to inactive`);
        }
      }
    } catch (error) {
      console.error("[Cron] Error checking expired trials:", error);
    }
  });

  console.log("✅ Trial expiration check cron job scheduled (hourly)");
}

/**
 * Check for expired paid subscriptions and update status
 * NEW CRON JOB: Handles subscriptions that were "active" but have now passed their endDate
 * Runs every hour
 */
export function startSubscriptionExpirationCheckJob() {
  // Run every hour at minute 30
  cron.schedule("30 * * * *", async () => {
    console.log("[Cron] Checking for expired subscriptions...");

    try {
      const now = new Date();

      // Find users with "active" status but subscriptionEndDate in the past
      const expiredSubscriptions = await db.query.users.findMany({
        where: (users, { and, lt, eq, isNotNull }) => and(
          eq(users.subscriptionStatus, "active"),
          isNotNull(users.subscriptionEndDate),
          lt(users.subscriptionEndDate, now)
        ),
      });

      if (expiredSubscriptions.length > 0) {
        console.log(`[Cron] Found ${expiredSubscriptions.length} expired subscriptions`);

        for (const user of expiredSubscriptions) {
          // Update status to inactive
          await db.update(users)
            .set({
              subscriptionStatus: "inactive",
            })
            .where(eq(users.id, user.id));

          console.log(`[Cron] Updated user ${user.id} (${user.email}) subscription status to inactive (endDate: ${user.subscriptionEndDate})`);
        }
      }
    } catch (error) {
      console.error("[Cron] Error checking expired subscriptions:", error);
    }
  });

  console.log("✅ Subscription expiration check cron job scheduled (hourly at :30)");
}

/**
 * Start all cron jobs
 */
export function startAllCronJobs() {
  startSubscriptionSyncJob();
  startTrialExpirationCheckJob();
  startSubscriptionExpirationCheckJob();
  console.log("🕐 All cron jobs started");
}
