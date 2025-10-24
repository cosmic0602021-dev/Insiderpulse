/**
 * Subscription Service
 * Manages user subscription status, trial access, and data access control
 */

import { db } from "@db";
import { users } from "@shared/schema";
import { eq } from "drizzle-orm";

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
 * Get user's current access level
 */
export async function getUserAccessLevel(userId: string): Promise<AccessLevel> {
  const user = await db.query.users.findFirst({
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

  // Check if subscription is active
  const isSubscriptionActive =
    user.subscriptionStatus === "active" &&
    user.subscriptionTier === "insider_pro" &&
    (!user.subscriptionEndDate || now < user.subscriptionEndDate);

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
 * Activate 24-hour trial for user
 */
export async function activateTrial(userId: string): Promise<{ success: boolean; message: string; expiresAt?: Date }> {
  const user = await db.query.users.findFirst({
    where: eq(users.id, userId),
  });

  if (!user) {
    return { success: false, message: "User not found" };
  }

  // Check if user has already used trial
  if (user.hasUsedTrial) {
    return { success: false, message: "Trial already used. Please upgrade to Insider Pro." };
  }

  // Check if user already has active subscription
  if (user.subscriptionStatus === "active" && user.subscriptionTier === "insider_pro") {
    return { success: false, message: "You already have an active Insider Pro subscription" };
  }

  const now = new Date();
  const expiresAt = new Date(now.getTime() + 24 * 60 * 60 * 1000); // 24 hours from now

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
    message: "24-hour Insider trial activated! You now have full access to real-time data.",
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
  stripeSubscriptionId: string
): Promise<void> {
  const now = new Date();
  const endDate = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000); // 30 days

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

  console.log(`✅ User ${userId} upgraded to Insider Pro`);
}

/**
 * Cancel subscription
 */
export async function cancelSubscription(userId: string): Promise<void> {
  await db.update(users)
    .set({
      subscriptionStatus: "canceled",
      subscriptionEndDate: new Date(), // End immediately
    })
    .where(eq(users.id, userId));

  console.log(`❌ Subscription canceled for user ${userId}`);
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
