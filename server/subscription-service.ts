/**
 * Subscription Service
 * Manages user subscription status, trial access, and data access control
 */

import { drizzle } from "drizzle-orm/neon-http";
import { users } from "@shared/schema";
import { eq } from "drizzle-orm";
import * as schema from "@shared/schema";
import Stripe from "stripe";

const db = drizzle(process.env.DATABASE_URL!, { schema });
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2024-11-20.acacia",
});

export type SubscriptionTier = "free" | "insider_pro";
export type SubscriptionStatus = "active" | "inactive" | "trialing" | "canceled";

export interface AccessLevel {
  canAccessRealtime: boolean;
  tier: SubscriptionTier;
  status: SubscriptionStatus;
  isTrialing: boolean;
  trialExpiresAt?: Date;
  daysUntilExpiry?: number;
}

/**
 * Check if user has access to real-time data
 */
export function canAccessRealtimeData(accessLevel: AccessLevel): boolean {
  return accessLevel.canAccessRealtime;
}

/**
 * Sync user subscription from Stripe if DB data appears stale
 */
async function syncSubscriptionFromStripe(user: any): Promise<boolean> {
  // Only sync if user has a Stripe subscription ID
  if (!user.stripeSubscriptionId) {
    return false;
  }

  try {
    console.log(`[Stripe Sync] Checking Stripe for user ${user.id} subscription ${user.stripeSubscriptionId}`);

    // Fetch subscription from Stripe
    const subscription = await stripe.subscriptions.retrieve(user.stripeSubscriptionId);

    if (!subscription) {
      console.log(`[Stripe Sync] No subscription found in Stripe for ${user.stripeSubscriptionId}`);
      return false;
    }

    console.log(`[Stripe Sync] Stripe status: ${subscription.status}, current_period_end: ${new Date(subscription.current_period_end * 1000)}`);

    // Check if Stripe says subscription is active
    const isStripeActive = subscription.status === "active" || subscription.status === "trialing";
    const stripePeriodEnd = new Date(subscription.current_period_end * 1000);
    const now = new Date();

    // If Stripe shows active but DB shows expired, sync the DB
    if (isStripeActive && stripePeriodEnd > now) {
      console.log(`[Stripe Sync] ✅ Stripe shows active subscription, updating DB for user ${user.id}`);

      await db.update(users)
        .set({
          subscriptionStatus: subscription.status as any,
          subscriptionEndDate: stripePeriodEnd,
          subscriptionTier: "insider_pro",
        })
        .where(eq(users.id, user.id));

      return true; // Synced successfully
    }

    // If Stripe shows canceled or expired
    if (!isStripeActive || stripePeriodEnd <= now) {
      console.log(`[Stripe Sync] ❌ Stripe shows inactive/expired subscription for user ${user.id}`);

      await db.update(users)
        .set({
          subscriptionStatus: subscription.status === "canceled" ? "canceled" : "inactive",
          subscriptionEndDate: stripePeriodEnd,
        })
        .where(eq(users.id, user.id));

      return false; // No active subscription
    }

    return false;
  } catch (error) {
    console.error(`[Stripe Sync] Error syncing subscription for user ${user.id}:`, error);
    return false;
  }
}

/**
 * Get user's current access level
 */
export async function getUserAccessLevel(userId: string): Promise<AccessLevel> {
  let user = await db.query.users.findFirst({
    where: eq(users.id, userId),
  });

  if (!user) {
    return {
      canAccessRealtime: false,
      tier: "free",
      status: "inactive",
      isTrialing: false,
    };
  }

  const now = new Date();

  // Check if trial is active
  const isTrialActive =
    user.trialActivatedAt &&
    user.trialExpiresAt &&
    now < user.trialExpiresAt;

  // Check if subscription is active based on DB data
  // Allow 'canceled' status as long as subscriptionEndDate is in the future
  let isSubscriptionActive =
    user.subscriptionTier === "insider_pro" &&
    (user.subscriptionStatus === "active" ||
     user.subscriptionStatus === "trialing" ||
     user.subscriptionStatus === "canceled") &&
    user.subscriptionStatus !== "inactive" &&
    (!user.subscriptionEndDate || now < user.subscriptionEndDate);

  // If DB shows subscription as expired/inactive BUT user has Stripe subscription ID,
  // check Stripe directly to see if it's actually still active
  const hasStripeSubscription = user.stripeSubscriptionId && user.subscriptionTier === "insider_pro";
  const dbShowsExpired = !isSubscriptionActive && hasStripeSubscription;

  if (dbShowsExpired) {
    console.log(`[Access Check] DB shows expired for user ${userId}, checking Stripe...`);
    const syncedSuccessfully = await syncSubscriptionFromStripe(user);

    if (syncedSuccessfully) {
      // Re-fetch user data after sync
      const updatedUser = await db.query.users.findFirst({
        where: eq(users.id, userId),
      });

      if (updatedUser) {
        user = updatedUser;
        // Recalculate subscription status with updated data
        // Allow 'canceled' status as long as subscriptionEndDate is in the future
        isSubscriptionActive =
          user.subscriptionTier === "insider_pro" &&
          (user.subscriptionStatus === "active" ||
           user.subscriptionStatus === "trialing" ||
           user.subscriptionStatus === "canceled") &&
          user.subscriptionStatus !== "inactive" &&
          (!user.subscriptionEndDate || now < user.subscriptionEndDate);

        console.log(`[Access Check] ✅ After Stripe sync, user ${userId} subscription active: ${isSubscriptionActive}`);
      }
    }
  }

  // Log unexpected subscription states for monitoring
  if (isSubscriptionActive && user.subscriptionStatus !== "active" && user.subscriptionStatus !== "trialing") {
    console.log(`[INFO] User ${userId} has Insider Pro access with status: ${user.subscriptionStatus}`);
  }

  const canAccessRealtime = isTrialActive || isSubscriptionActive;

  return {
    canAccessRealtime,
    tier: user.subscriptionTier as SubscriptionTier,
    status: user.subscriptionStatus as SubscriptionStatus,
    isTrialing: isTrialActive || false,
    trialExpiresAt: user.trialExpiresAt || undefined,
    daysUntilExpiry: user.subscriptionEndDate
      ? Math.ceil((user.subscriptionEndDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
      : undefined,
  };
}

/**
 * Activate 7-day trial for user
 */
export async function activateTrial(userId: string): Promise<{ success: boolean; message: string; expiresAt?: Date }> {
  const user = await db.query.users.findFirst({
    where: eq(users.id, userId),
  });

  if (!user) {
    return { success: false, message: "사용자를 찾을 수 없습니다" };
  }

  // Check if user already has active trial
  const now = new Date();
  const isTrialActive = user.trialActivatedAt && user.trialExpiresAt && now < user.trialExpiresAt;

  if (isTrialActive) {
    return {
      success: false,
      message: "Trial is already active",
      expiresAt: user.trialExpiresAt
    };
  }

  // Check if user already has active subscription
  if (user.subscriptionStatus === "active" && user.subscriptionTier === "insider_pro") {
    return { success: false, message: "이미 Insider Pro 구독이 활성화되어 있습니다" };
  }

  // Check if they've already used trial
  if (user.hasUsedTrial) {
    return { success: false, message: "무료 체험은 한 번만 사용할 수 있습니다. Insider Pro로 업그레이드하세요." };
  }

  const expiresAt = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000); // 7 days from now

  await db.update(users)
    .set({
      trialActivatedAt: now,
      trialExpiresAt: expiresAt,
      hasUsedTrial: true,
      subscriptionStatus: "trialing",
    })
    .where(eq(users.id, userId));

  console.log(`✅ Trial activated for user ${userId}, expires at ${expiresAt}`);

  return {
    success: true,
    message: "7-day Insider trial activated! You now have full access to real-time data.",
    expiresAt,
  };
}

/**
 * Check if user's trial has expired and needs notification
 */
export async function checkExpiredTrials(): Promise<string[]> {
  const now = new Date();

  const expiredTrialUsers = await db.query.users.findMany({
    where: (users, { and, lt, isNotNull, or, isNull }) => and(
      lt(users.trialExpiresAt, now),
      isNotNull(users.trialExpiresAt),
      or(
        isNull(users.lastTrialNotificationSent),
        lt(users.lastTrialNotificationSent, new Date(now.getTime() - 24 * 60 * 60 * 1000)) // 24 hours ago
      )
    ),
  });

  return expiredTrialUsers.map(u => u.id);
}

/**
 * Mark trial notification as sent
 */
export async function markTrialNotificationSent(userId: string): Promise<void> {
  await db.update(users)
    .set({
      lastTrialNotificationSent: new Date(),
      subscriptionStatus: "inactive", // Move back to inactive after trial
    })
    .where(eq(users.id, userId));
}

/**
 * Upgrade user to Insider Pro (called after Stripe payment)
 */
export async function upgradeToInsiderPro(
  userId: string,
  stripeCustomerId: string,
  stripeSubscriptionId: string,
  subscriptionEndDate?: Date
): Promise<void> {
  const now = new Date();
  const endDate = subscriptionEndDate || new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000); // Use provided or default 30 days

  await db.update(users)
    .set({
      subscriptionTier: "insider_pro",
      subscriptionStatus: "active",
      stripeCustomerId,
      stripeSubscriptionId,
      subscriptionStartDate: now,
      subscriptionEndDate: endDate,
    })
    .where(eq(users.id, userId));

  console.log(`✅ User ${userId} upgraded to Insider Pro until ${endDate}`);
}

/**
 * Cancel subscription - keeps access until period end
 */
export async function cancelSubscription(userId: string, periodEndDate?: Date): Promise<void> {
  await db.update(users)
    .set({
      subscriptionStatus: "canceled",
      subscriptionEndDate: periodEndDate || new Date(), // Use provided end date or now
    })
    .where(eq(users.id, userId));

  if (periodEndDate) {
    console.log(`❌ Subscription canceled for user ${userId}, access until ${periodEndDate}`);
  } else {
    console.log(`❌ Subscription canceled for user ${userId}, access ended immediately`);
  }
}

export const subscriptionService = {
  getUserAccessLevel,
  canAccessRealtimeData,
  activateTrial,
  checkExpiredTrials,
  markTrialNotificationSent,
  upgradeToInsiderPro,
  cancelSubscription,
};
