/**
 * Market Hours Utility
 * Helps determine if US stock market is open and if operations should run
 * This prevents unnecessary costs on weekends/holidays/after-hours
 */

/**
 * Check if current time is during US weekend (Saturday or Sunday)
 * Uses toLocaleString for accurate EST/EDT conversion
 */
export function isUSWeekend(): boolean {
  const now = new Date();

  // Get day of week in US Eastern Time (handles EST/EDT automatically)
  const estTime = new Date(now.toLocaleString('en-US', { timeZone: 'America/New_York' }));
  const dayOfWeek = estTime.getDay();

  // 0 = Sunday, 6 = Saturday
  return dayOfWeek === 0 || dayOfWeek === 6;
}

/**
 * Check if current time is during US market hours
 * Market is open Monday-Friday, 9:30 AM - 4:00 PM ET
 * (Does not account for holidays - see isUSHoliday for that)
 */
export function isMarketHours(): boolean {
  if (isUSWeekend()) {
    return false;
  }

  const now = new Date();

  // Get current time in US Eastern Time (handles EST/EDT automatically)
  const estTime = new Date(now.toLocaleString('en-US', { timeZone: 'America/New_York' }));

  const hours = estTime.getHours();
  const minutes = estTime.getMinutes();
  const currentTimeInMinutes = hours * 60 + minutes;

  // Market hours: 9:30 AM - 4:00 PM ET
  const marketOpenMinutes = 9 * 60 + 30;  // 9:30 AM
  const marketCloseMinutes = 16 * 60;      // 4:00 PM

  return currentTimeInMinutes >= marketOpenMinutes &&
         currentTimeInMinutes < marketCloseMinutes;
}

/**
 * Check if current date is a US stock market holiday
 * Basic implementation - covers major holidays
 */
export function isUSHoliday(): boolean {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1; // JavaScript months are 0-indexed
  const date = now.getDate();

  // Fixed date holidays
  const fixedHolidays = [
    { month: 1, date: 1 },   // New Year's Day
    { month: 7, date: 4 },   // Independence Day
    { month: 12, date: 25 }, // Christmas
  ];

  for (const holiday of fixedHolidays) {
    if (month === holiday.month && date === holiday.date) {
      return true;
    }
  }

  // TODO: Add floating holidays (Thanksgiving, Memorial Day, etc.)
  // For now, weekend check covers most cases

  return false;
}

/**
 * Check if data collection should run
 * Returns true only during weekdays when market is open or recently closed
 */
export function shouldRunDataCollection(): boolean {
  // Don't run on weekends
  if (isUSWeekend()) {
    console.log('⏸️ Skipping data collection - Weekend');
    return false;
  }

  // Don't run on holidays
  if (isUSHoliday()) {
    console.log('⏸️ Skipping data collection - Holiday');
    return false;
  }

  // Run during weekdays (even after hours, to catch after-hours filings)
  return true;
}

/**
 * Check if stock price updates should run
 * Only runs during market hours on weekdays
 */
export function shouldUpdateStockPrices(): boolean {
  // Don't run on weekends
  if (isUSWeekend()) {
    console.log('⏸️ Skipping stock price update - Weekend');
    return false;
  }

  // Don't run on holidays
  if (isUSHoliday()) {
    console.log('⏸️ Skipping stock price update - Holiday');
    return false;
  }

  // Only run during market hours or shortly after (prices are still relevant)
  // We'll allow updates on weekdays regardless of time to keep data fresh
  return true;
}

/**
 * Check if monitoring/alerting should run
 * Runs on weekdays only (no need to monitor on weekends)
 */
export function shouldRunMonitoring(): boolean {
  if (isUSWeekend()) {
    console.log('⏸️ Skipping monitoring - Weekend');
    return false;
  }

  return true;
}

/**
 * Get recommended interval for data collection based on current time
 * Returns interval in milliseconds
 */
export function getRecommendedCollectionInterval(): number {
  const HOUR = 60 * 60 * 1000;

  // Keep consistent 6-hour interval for all weekdays
  // The key is to SKIP execution on weekends, not change the interval
  return 6 * HOUR; // Every 6 hours
}

export const marketHours = {
  isUSWeekend,
  isMarketHours,
  isUSHoliday,
  shouldRunDataCollection,
  shouldUpdateStockPrices,
  shouldRunMonitoring,
  getRecommendedCollectionInterval,
};
