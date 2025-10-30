/**
 * Subscription Service
 * Manages user subscription status, trial access, and data access control
 */

import { drizzle } from "drizzle-orm/neon-http";
import { users } from "@shared/schema";
import { eq } from "drizzle-orm";
import * as schema from "@shared/schema";

const db = drizzle(process.env.DATABASE_URL!, { schema });

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
