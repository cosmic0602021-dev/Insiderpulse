import { db } from './db-storage';
import { users, userEvents, userSessions } from '@shared/schema';
import { sql, gte, and, not, isNull, eq } from 'drizzle-orm';

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

  /**
   * Get conversion funnel: Signup → Trial → Paid
   */
  async getConversionFunnel() {
    const now = new Date();

    // Get all users
    const allUsers = await db.select({
      id: users.id,
      createdAt: users.createdAt,
      trialActivatedAt: users.trialActivatedAt,
      trialExpiresAt: users.trialExpiresAt,
      subscriptionStatus: users.subscriptionStatus,
      subscriptionStartDate: users.subscriptionStartDate,
    }).from(users);

    const totalSignups = allUsers.length;

    // Users who started trial
    const trialStarted = allUsers.filter(user => user.trialActivatedAt !== null).length;

    // Users who completed trial (trial expired)
    const trialCompleted = allUsers.filter(user =>
      user.trialExpiresAt && new Date(user.trialExpiresAt) < now
    ).length;

    // Users who converted to paid
    const convertedToPaid = allUsers.filter(user =>
      user.subscriptionStatus === 'active' || user.subscriptionStartDate !== null
    ).length;

    // Calculate conversion rates
    const signupToTrialRate = totalSignups > 0 ? (trialStarted / totalSignups) * 100 : 0;
    const trialToPaidRate = trialStarted > 0 ? (convertedToPaid / trialStarted) * 100 : 0;
    const overallConversionRate = totalSignups > 0 ? (convertedToPaid / totalSignups) * 100 : 0;

    return {
      funnel: [
        {
          stage: 'Signups',
          count: totalSignups,
          percentage: 100,
        },
        {
          stage: 'Trial Started',
          count: trialStarted,
          percentage: signupToTrialRate,
        },
        {
          stage: 'Trial Completed',
          count: trialCompleted,
          percentage: totalSignups > 0 ? (trialCompleted / totalSignups) * 100 : 0,
        },
        {
          stage: 'Paid Subscribers',
          count: convertedToPaid,
          percentage: overallConversionRate,
        },
      ],
      metrics: {
        signupToTrialRate: Math.round(signupToTrialRate * 10) / 10,
        trialToPaidRate: Math.round(trialToPaidRate * 10) / 10,
        overallConversionRate: Math.round(overallConversionRate * 10) / 10,
      },
    };
  }

  /**
   * Get revenue metrics: MRR, ARR, etc.
   */
  async getRevenueMetrics() {
    const now = new Date();
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    // Get all paid users with subscription info
    const paidUsers = await db.select({
      id: users.id,
      email: users.email,
      subscriptionStatus: users.subscriptionStatus,
      subscriptionTier: users.subscriptionTier,
      subscriptionStartDate: users.subscriptionStartDate,
      createdAt: users.createdAt,
    }).from(users).where(eq(users.subscriptionStatus, 'active'));

    const totalPaidUsers = paidUsers.length;

    // Calculate MRR based on subscription tier
    // InsiderPulse Pro: $14/month, $112/year (33% discount)
    const INSIDER_PRO_MONTHLY_PRICE = 14;
    const mrr = totalPaidUsers * INSIDER_PRO_MONTHLY_PRICE;
    const arr = mrr * 12;

    // Calculate ARPU (Average Revenue Per User)
    const totalUsers = await db.select({ id: users.id }).from(users);
    const arpu = totalUsers.length > 0 ? mrr / totalUsers.length : 0;

    // New subscriptions in last 30 days
    const newSubscriptionsLast30Days = paidUsers.filter(user =>
      user.subscriptionStartDate && new Date(user.subscriptionStartDate) >= thirtyDaysAgo
    ).length;

    // Revenue trend (last 30 days, daily)
    const revenueTrend: Array<{ date: string; revenue: number; newSubscribers: number }> = [];
    for (let i = 29; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];

      const newSubsOnDate = paidUsers.filter(user => {
        if (!user.subscriptionStartDate) return false;
        const subDate = new Date(user.subscriptionStartDate).toISOString().split('T')[0];
        return subDate === dateStr;
      }).length;

      revenueTrend.push({
        date: dateStr,
        revenue: newSubsOnDate * INSIDER_PRO_MONTHLY_PRICE,
        newSubscribers: newSubsOnDate,
      });
    }

    return {
      mrr: Math.round(mrr * 100) / 100,
      arr: Math.round(arr * 100) / 100,
      totalPaidUsers,
      arpu: Math.round(arpu * 100) / 100,
      newSubscriptionsLast30Days,
      revenueTrend,
      calculatedAt: now.toISOString(),
    };
  }

  /**
   * Get geographic distribution of users
   */
  async getGeographicDistribution() {
    const now = new Date();

    // Get all sessions
    const sessions = await db.select({
      country: userSessions.country,
      countryName: userSessions.countryName,
      region: userSessions.region,
      city: userSessions.city,
      userId: userSessions.userId,
      createdAt: userSessions.createdAt,
    }).from(userSessions);

    // Count unique users by country
    const countryMap = new Map<string, { count: number; name: string }>();
    const uniqueUsers = new Set<string>();

    sessions.forEach(session => {
      uniqueUsers.add(session.userId);
      const country = session.country || 'Unknown';
      const countryName = session.countryName || 'Unknown';

      if (countryMap.has(country)) {
        countryMap.get(country)!.count++;
      } else {
        countryMap.set(country, { count: 1, name: countryName });
      }
    });

    // Convert to array and sort by count
    const countryDistribution = Array.from(countryMap.entries())
      .map(([code, data]) => ({
        country: code,
        countryName: data.name,
        sessions: data.count,
      }))
      .sort((a, b) => b.sessions - a.sessions);

    // Get top cities
    const cityMap = new Map<string, { count: number; country: string }>();
    sessions.forEach(session => {
      const city = session.city || 'Unknown';
      const country = session.countryName || 'Unknown';

      if (cityMap.has(city)) {
        cityMap.get(city)!.count++;
      } else {
        cityMap.set(city, { count: 1, country });
      }
    });

    const topCities = Array.from(cityMap.entries())
      .map(([city, data]) => ({
        city,
        country: data.country,
        sessions: data.count,
      }))
      .sort((a, b) => b.sessions - a.sessions)
      .slice(0, 10); // Top 10 cities

    return {
      totalSessions: sessions.length,
      uniqueUsers: uniqueUsers.size,
      countries: countryDistribution,
      topCities,
      calculatedAt: now.toISOString(),
    };
  }
}

export const adminMetricsService = new AdminMetricsService();
