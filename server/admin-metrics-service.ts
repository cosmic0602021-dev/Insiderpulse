import { db } from './db-storage';
import { users } from '@shared/schema';
import { sql, gte, and, not, isNull } from 'drizzle-orm';

export class AdminMetricsService {
  /**
   * Get overview metrics for admin dashboard
   */
  async getOverviewMetrics() {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    // Get all users with their subscription info
    const allUsers = await db.select({
      id: users.id,
      email: users.email,
      createdAt: users.createdAt,
      subscriptionStatus: users.subscriptionStatus,
      subscriptionTier: users.subscriptionTier,
      trialActivatedAt: users.trialActivatedAt,
      trialExpiresAt: users.trialExpiresAt,
      hasUsedTrial: users.hasUsedTrial,
    }).from(users);

    // Calculate metrics
    const totalUsers = allUsers.length;

    // Trial users: has trial activated and not expired
    const trialUsers = allUsers.filter(user =>
      user.trialActivatedAt &&
      user.trialExpiresAt &&
      new Date(user.trialExpiresAt) > now
    ).length;

    // Paid users: subscription status is active
    const paidUsers = allUsers.filter(user =>
      user.subscriptionStatus === 'active'
    ).length;

    // Users who signed up today
    const todaySignups = allUsers.filter(user =>
      user.createdAt && new Date(user.createdAt) >= todayStart
    ).length;

    // Free users (not trial, not paid)
    const freeUsers = allUsers.filter(user => {
      const isTrial = user.trialActivatedAt &&
                      user.trialExpiresAt &&
                      new Date(user.trialExpiresAt) > now;
      const isPaid = user.subscriptionStatus === 'active';
      return !isTrial && !isPaid;
    }).length;

    return {
      totalUsers,
      trialUsers,
      paidUsers,
      freeUsers,
      todaySignups,
      calculatedAt: now.toISOString(),
    };
  }

  /**
   * Get list of users with their details
   */
  async getUsersList(limit: number = 100) {
    const usersList = await db.select({
      id: users.id,
      email: users.email,
      role: users.role,
      createdAt: users.createdAt,
      emailVerified: users.emailVerified,
      subscriptionStatus: users.subscriptionStatus,
      subscriptionTier: users.subscriptionTier,
      trialActivatedAt: users.trialActivatedAt,
      trialExpiresAt: users.trialExpiresAt,
    })
    .from(users)
    .orderBy(sql`${users.createdAt} DESC`)
    .limit(limit);

    const now = new Date();

    // Add computed status for easier display
    return usersList.map(user => {
      let status = 'free';
      if (user.subscriptionStatus === 'active') {
        status = 'paid';
      } else if (
        user.trialActivatedAt &&
        user.trialExpiresAt &&
        new Date(user.trialExpiresAt) > now
      ) {
        status = 'trial';
      }

      return {
        ...user,
        status,
      };
    });
  }

  /**
   * Get user counts by status over time (last 30 days)
   */
  async getUserGrowth() {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const usersLast30Days = await db.select({
      createdAt: users.createdAt,
    })
    .from(users)
    .where(gte(users.createdAt, thirtyDaysAgo))
    .orderBy(users.createdAt);

    // Group by date
    const dailyCounts: Record<string, number> = {};
    usersLast30Days.forEach(user => {
      if (user.createdAt) {
        const dateStr = user.createdAt.toISOString().split('T')[0];
        dailyCounts[dateStr] = (dailyCounts[dateStr] || 0) + 1;
      }
    });

    return Object.entries(dailyCounts).map(([date, count]) => ({
      date,
      signups: count,
    }));
  }
}

export const adminMetricsService = new AdminMetricsService();
