import DashboardStats from '../dashboard-stats';
import type { TradingStats } from '@shared/schema';

export default function DashboardStatsExample() {
  // Mock data for prototype
  const mockStats: TradingStats = {
    todayTrades: 127,
    totalVolume: 45600000
  };

  return <DashboardStats stats={mockStats} />;
}