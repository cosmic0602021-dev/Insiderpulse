/**
 * Subscription utility functions
 * Centralized logic for checking premium access
 */

import type { User } from '@shared/schema';

/**
 * Check if user has active premium (Insider Pro) subscription
 * Returns true if:
 * - User subscription tier is 'insider_pro' AND
 * - User subscription status is 'active' OR 'trialing'
 */
export function hasPremiumAccess(user: User | null): boolean {
  if (!user) {
    return false;
  }

  const isPro = user.subscriptionTier === 'insider_pro';
  const isActive = user.subscriptionStatus === 'active' || user.subscriptionStatus === 'trialing';

  console.log('[SUBSCRIPTION UTILS] hasPremiumAccess check:', {
    email: user.email,
    tier: user.subscriptionTier,
    status: user.subscriptionStatus,
    isPro,
    isActive,
    result: isPro && isActive
  });

  return isPro && isActive;
}

/**
 * Check if user is a free user (should see upgrade prompts and locked content)
 */
export function isFreeUser(user: User | null): boolean {
  return !hasPremiumAccess(user);
}
