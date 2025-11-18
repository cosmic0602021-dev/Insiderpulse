/**
 * Subscription utility functions
 * Centralized logic for checking premium access
 */

import type { User } from '@shared/schema';

/**
 * Check if user has active premium (Insider) subscription
 * Returns true if:
 * - User subscription tier is 'insider' (or legacy 'insider_pro') AND
 * - User subscription status is 'active', 'trialing', OR 'canceled' (if subscriptionEndDate is in future)
 */
export function hasPremiumAccess(user: User | null): boolean {
  if (!user) {
    return false;
  }

  const isPro = user.subscriptionTier === 'insider' || user.subscriptionTier === 'insider_pro';
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

/**
 * Format time remaining until a specific date in HH:MM format
 * @param endDate - ISO date string of the end date
 * @returns Formatted string like "23:45" or "168:00" for 7 days
 */
export function formatTimeRemaining(endDate: string | null): string {
  if (!endDate) {
    return '00:00';
  }

  const now = new Date();
  const end = new Date(endDate);
  const diffMs = end.getTime() - now.getTime();

  if (diffMs <= 0) {
    return '00:00';
  }

  const totalMinutes = Math.floor(diffMs / (1000 * 60));
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
}

/**
 * Get subscription display name
 * @param tier - Subscription tier
 * @returns Display name for the tier
 */
export function getSubscriptionDisplayName(tier: string | null): string {
  if (!tier || tier === 'free' || tier === 'outsider') {
    return 'Outsider';
  }
  if (tier === 'insider' || tier === 'insider_pro') {
    return 'Insider';
  }
  return 'Outsider';
}

/**
 * Get status display name
 * @param status - Subscription status
 * @returns Korean display name for the status
 */
export function getStatusDisplayName(status: string | null): string {
  switch (status) {
    case 'active':
      return '활성';
    case 'trialing':
      return '무료체험 중';
    case 'canceled':
      return '취소됨 (기간 내 사용 가능)';
    case 'inactive':
      return '비활성';
    default:
      return '비활성';
  }
}
