/**
 * Subscription utility functions
 * Centralized logic for checking premium access
 */

import type { User } from '@shared/schema';

/**
 * Check if user has active premium (Insider Pro) subscription
 * Returns true if:
 * - User subscription tier is 'insider_pro' AND
 * - User subscription status is 'active', 'trialing', OR 'canceled' (if subscriptionEndDate is in future)
 */
export function hasPremiumAccess(user: User | null): boolean {
  if (!user) {
    return false;
  }

  const isPro = user.subscriptionTier === 'insider_pro';
  const now = new Date();

  // Check if subscription status is valid (active, trialing, or canceled)
  const hasValidStatus =
    user.subscriptionStatus === 'active' ||
    user.subscriptionStatus === 'trialing' ||
    user.subscriptionStatus === 'canceled';

  // For canceled subscriptions, must have subscriptionEndDate in the future
  // For active/trialing, either no endDate or endDate in future
  const hasActiveAccess =
    hasValidStatus &&
    (!user.subscriptionEndDate || new Date(user.subscriptionEndDate) > now);

  console.log('[SUBSCRIPTION UTILS] hasPremiumAccess check:', {
    email: user.email,
    tier: user.subscriptionTier,
    status: user.subscriptionStatus,
    endDate: user.subscriptionEndDate,
    isPro,
    hasValidStatus,
    hasActiveAccess,
    result: isPro && hasActiveAccess
  });

  return isPro && hasActiveAccess;
}

/**
 * Check if user is a free user (should see upgrade prompts and locked content)
 */
export function isFreeUser(user: User | null): boolean {
  return !hasPremiumAccess(user);
}
