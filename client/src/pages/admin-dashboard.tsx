import { useEffect, useState } from 'react';
import { Users, UserCheck, CreditCard, TrendingUp, RefreshCw } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useLanguage } from '@/contexts/language-context';
import { resolveApiUrl } from '@/lib/queryClient';
import { LineChart, Line, PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface AdminMetrics {
  totalUsers: number;
  trialUsers: number;
  paidUsers: number;
  freeUsers: number;
  todaySignups: number;
  calculatedAt: string;
}

interface UserListItem {
  id: string;
  email: string;
  role: string;
  createdAt: string;
  emailVerified: boolean;
  subscriptionStatus: string;
  subscriptionTier: string;
  status: 'free' | 'trial' | 'paid';
}

interface GrowthDataPoint {
  date: string;
  signups: number;
}

interface FunnelStage {
  stage: string;
  count: number;
  percentage: number;
}

interface ConversionData {
  funnel: FunnelStage[];
  metrics: {
    signupToTrialRate: number;
    trialToPaidRate: number;
    overallConversionRate: number;
  };
}

interface RevenueTrendPoint {
  date: string;
  revenue: number;
  newSubscribers: number;
}

interface RevenueData {
  mrr: number;
  arr: number;
  totalPaidUsers: number;
  arpu: number;
  newSubscriptionsLast30Days: number;
  revenueTrend: RevenueTrendPoint[];
  calculatedAt: string;
}

interface CountryData {
  country: string;
  countryName: string;
  sessions: number;
}

interface CityData {
  city: string;
  country: string;
  sessions: number;
}

interface GeographyData {
  totalSessions: number;
  uniqueUsers: number;
  countries: CountryData[];
  topCities: CityData[];
  calculatedAt: string;
}

export default function AdminDashboard() {
  const { t } = useLanguage();
  const [metrics, setMetrics] = useState<AdminMetrics | null>(null);
  const [users, setUsers] = useState<UserListItem[]>([]);
  const [growthData, setGrowthData] = useState<GrowthDataPoint[]>([]);
  const [conversionData, setConversionData] = useState<ConversionData | null>(null);
  const [revenueData, setRevenueData] = useState<RevenueData | null>(null);
  const [geographyData, setGeographyData] = useState<GeographyData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [adminKey, setAdminKey] = useState('');
  const [showKeyInput, setShowKeyInput] = useState(false);

  useEffect(() => {
    // Check for stored admin key
    const stored = localStorage.getItem('adminKey');
    if (stored) {
      setAdminKey(stored);
      loadAdminData(stored);
    } else {
      setShowKeyInput(true);
      setLoading(false);
    }
  }, []);

  const handleKeySubmit = () => {
    if (adminKey.trim()) {
      localStorage.setItem('adminKey', adminKey.trim());
      setShowKeyInput(false);
      loadAdminData(adminKey.trim());
    }
  };

  const loadAdminData = async (key: string) => {
    try {
      setLoading(true);
      setError(null);

      const headers = { 'x-admin-key': key };

      // Fetch metrics
      const metricsRes = await fetch(resolveApiUrl('/api/admin/metrics/overview'), { headers });
      if (!metricsRes.ok) {
        throw new Error(`Failed to fetch metrics: ${metricsRes.statusText}`);
      }
      const metricsData = await metricsRes.json();
      setMetrics(metricsData.metrics);

      // Fetch users
      const usersRes = await fetch(resolveApiUrl('/api/admin/metrics/users?limit=50'), { headers });
      if (!usersRes.ok) {
        throw new Error(`Failed to fetch users: ${usersRes.statusText}`);
      }
      const usersData = await usersRes.json();
      setUsers(usersData.users);

      // Fetch growth data
      const growthRes = await fetch(resolveApiUrl('/api/admin/metrics/growth'), { headers });
      if (!growthRes.ok) {
        throw new Error(`Failed to fetch growth: ${growthRes.statusText}`);
      }
      const growthDataRes = await growthRes.json();
      setGrowthData(growthDataRes.growth || []);

      // Fetch conversion data
      const conversionRes = await fetch(resolveApiUrl('/api/admin/metrics/conversion'), { headers });
      if (!conversionRes.ok) {
        throw new Error(`Failed to fetch conversion: ${conversionRes.statusText}`);
      }
      const conversionDataRes = await conversionRes.json();
      setConversionData({
        funnel: conversionDataRes.funnel || [],
        metrics: conversionDataRes.metrics || { signupToTrialRate: 0, trialToPaidRate: 0, overallConversionRate: 0 },
      });

      // Fetch revenue data
      const revenueRes = await fetch(resolveApiUrl('/api/admin/metrics/revenue'), { headers });
      if (!revenueRes.ok) {
        throw new Error(`Failed to fetch revenue: ${revenueRes.statusText}`);
      }
      const revenueDataRes = await revenueRes.json();
      setRevenueData({
        mrr: revenueDataRes.mrr || 0,
        arr: revenueDataRes.arr || 0,
        totalPaidUsers: revenueDataRes.totalPaidUsers || 0,
        arpu: revenueDataRes.arpu || 0,
        newSubscriptionsLast30Days: revenueDataRes.newSubscriptionsLast30Days || 0,
        revenueTrend: revenueDataRes.revenueTrend || [],
        calculatedAt: revenueDataRes.calculatedAt || new Date().toISOString(),
      });

      // Fetch geography data
      const geographyRes = await fetch(resolveApiUrl('/api/admin/metrics/geography'), { headers });
      if (!geographyRes.ok) {
        throw new Error(`Failed to fetch geography: ${geographyRes.statusText}`);
      }
      const geographyDataRes = await geographyRes.json();
      setGeographyData({
        totalSessions: geographyDataRes.totalSessions || 0,
        uniqueUsers: geographyDataRes.uniqueUsers || 0,
        countries: geographyDataRes.countries || [],
        topCities: geographyDataRes.topCities || [],
        calculatedAt: geographyDataRes.calculatedAt || new Date().toISOString(),
      });

    } catch (err) {
      console.error('Failed to load admin data:', err);
      setError(err instanceof Error ? err.message : 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      paid: 'default',
      trial: 'secondary',
      free: 'outline'
    } as const;

    const labels = {
      paid: '유료',
      trial: '무료체험',
      free: '무료'
    };

    return (
      <Badge variant={variants[status as keyof typeof variants] || 'outline'}>
        {labels[status as keyof typeof labels] || status}
      </Badge>
    );
  };

  if (showKeyInput) {
    return (
      <div className="container mx-auto p-8 max-w-md">
        <Card>
          <CardHeader>
            <CardTitle>Admin Access</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">Admin API Key</label>
                <Input
                  type="password"
                  value={adminKey}
                  onChange={(e) => setAdminKey(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleKeySubmit()}
                  placeholder="Enter admin API key"
                  className="mt-2"
                />
              </div>
              <Button onClick={handleKeySubmit} className="w-full">
                Access Dashboard
              </Button>
              <p className="text-xs text-muted-foreground">
                Find your admin key in Replit Secrets (ADMIN_API_KEY or SESSION_SECRET)
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="container mx-auto p-8">
        <Card>
          <CardContent className="flex items-center justify-center py-12">
            <RefreshCw className="h-8 w-8 animate-spin text-primary" />
            <span className="ml-3">Loading admin dashboard...</span>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto p-8 max-w-md">
        <Card className="border-destructive">
          <CardHeader>
            <CardTitle className="text-destructive">Error</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm">{error}</p>
            <div className="flex gap-2">
              <Button onClick={() => loadAdminData(adminKey)} variant="outline">
                Retry
              </Button>
              <Button
                onClick={() => {
                  localStorage.removeItem('adminKey');
                  setShowKeyInput(true);
                  setError(null);
                }}
                variant="ghost"
              >
                Reset Key
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!metrics) return null;

  return (
    <div className="container mx-auto p-4 md:p-8 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Admin Dashboard</h1>
          <p className="text-muted-foreground">SaaS metrics overview</p>
        </div>
        <Button onClick={() => loadAdminData(adminKey)} variant="outline" size="sm">
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.totalUsers}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Free Trial</CardTitle>
            <UserCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.trialUsers}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Paid Users</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.paidUsers}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Today's Signups</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.todaySignups}</div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Signup Growth Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Signup Growth (Last 30 Days)</CardTitle>
          </CardHeader>
          <CardContent>
            {growthData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={growthData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    dataKey="date"
                    tick={{ fontSize: 12 }}
                    tickFormatter={(value) => {
                      const date = new Date(value);
                      return `${date.getMonth() + 1}/${date.getDate()}`;
                    }}
                  />
                  <YAxis />
                  <Tooltip
                    labelFormatter={(value) => new Date(value).toLocaleDateString('ko-KR')}
                  />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="signups"
                    stroke="#8884d8"
                    strokeWidth={2}
                    name="New Signups"
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-[300px] text-muted-foreground">
                No signup data available
              </div>
            )}
          </CardContent>
        </Card>

        {/* User Composition Chart */}
        <Card>
          <CardHeader>
            <CardTitle>User Composition</CardTitle>
          </CardHeader>
          <CardContent>
            {metrics && (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={[
                      { name: 'Free Users', value: metrics.freeUsers, color: '#94a3b8' },
                      { name: 'Trial Users', value: metrics.trialUsers, color: '#60a5fa' },
                      { name: 'Paid Users', value: metrics.paidUsers, color: '#34d399' }
                    ]}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {[
                      { name: 'Free Users', value: metrics.freeUsers, color: '#94a3b8' },
                      { name: 'Trial Users', value: metrics.trialUsers, color: '#60a5fa' },
                      { name: 'Paid Users', value: metrics.paidUsers, color: '#34d399' }
                    ].map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Conversion Funnel */}
      {conversionData && (
        <Card>
          <CardHeader>
            <CardTitle>Conversion Funnel</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                  <div className="text-sm text-muted-foreground">Signup → Trial</div>
                  <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                    {conversionData.metrics.signupToTrialRate}%
                  </div>
                </div>
                <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                  <div className="text-sm text-muted-foreground">Trial → Paid</div>
                  <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                    {conversionData.metrics.trialToPaidRate}%
                  </div>
                </div>
                <div className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                  <div className="text-sm text-muted-foreground">Overall Conversion</div>
                  <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                    {conversionData.metrics.overallConversionRate}%
                  </div>
                </div>
              </div>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={conversionData.funnel} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" />
                  <YAxis dataKey="stage" type="category" width={150} />
                  <Tooltip
                    formatter={(value: number, name: string) => {
                      if (name === 'count') return [value, 'Users'];
                      if (name === 'percentage') return [`${value.toFixed(1)}%`, 'Percentage'];
                      return [value, name];
                    }}
                  />
                  <Legend />
                  <Bar dataKey="count" fill="#8884d8" name="Users" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Revenue Metrics */}
      {revenueData && (
        <div className="space-y-6">
          {/* Revenue Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">MRR</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">${revenueData.mrr.toLocaleString()}</div>
                <p className="text-xs text-muted-foreground mt-1">Monthly Recurring Revenue</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">ARR</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">${revenueData.arr.toLocaleString()}</div>
                <p className="text-xs text-muted-foreground mt-1">Annual Recurring Revenue</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">ARPU</CardTitle>
                <CreditCard className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">${revenueData.arpu.toFixed(2)}</div>
                <p className="text-xs text-muted-foreground mt-1">Average Revenue Per User</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">New Subs (30d)</CardTitle>
                <UserCheck className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{revenueData.newSubscriptionsLast30Days}</div>
                <p className="text-xs text-muted-foreground mt-1">Last 30 days</p>
              </CardContent>
            </Card>
          </div>

          {/* Revenue Trend Chart */}
          <Card>
            <CardHeader>
              <CardTitle>Revenue Trend (Last 30 Days)</CardTitle>
            </CardHeader>
            <CardContent>
              {revenueData.revenueTrend.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={revenueData.revenueTrend}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis
                      dataKey="date"
                      tick={{ fontSize: 12 }}
                      tickFormatter={(value) => {
                        const date = new Date(value);
                        return `${date.getMonth() + 1}/${date.getDate()}`;
                      }}
                    />
                    <YAxis />
                    <Tooltip
                      labelFormatter={(value) => new Date(value).toLocaleDateString('ko-KR')}
                      formatter={(value: number, name: string) => {
                        if (name === 'revenue') return [`$${value}`, 'Revenue'];
                        return [value, 'New Subscribers'];
                      }}
                    />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="revenue"
                      stroke="#10b981"
                      strokeWidth={2}
                      name="Revenue"
                    />
                    <Line
                      type="monotone"
                      dataKey="newSubscribers"
                      stroke="#3b82f6"
                      strokeWidth={2}
                      name="New Subscribers"
                    />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-[300px] text-muted-foreground">
                  No revenue data available
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Geographic Distribution */}
      {geographyData && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Geographic Distribution</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="text-sm font-medium mb-4">Sessions by Country</h4>
                  {geographyData.countries.length > 0 ? (
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={geographyData.countries.slice(0, 10)} layout="vertical">
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis type="number" />
                        <YAxis dataKey="countryName" type="category" width={100} tick={{ fontSize: 12 }} />
                        <Tooltip />
                        <Legend />
                        <Bar dataKey="sessions" fill="#8b5cf6" name="Sessions" />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="flex items-center justify-center h-[300px] text-muted-foreground">
                      No geographic data available yet
                    </div>
                  )}
                </div>
                <div>
                  <h4 className="text-sm font-medium mb-4">Top Cities</h4>
                  <div className="space-y-2">
                    {geographyData.topCities.length > 0 ? (
                      geographyData.topCities.map((city, index) => (
                        <div key={index} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                          <div>
                            <div className="font-medium text-sm">{city.city}</div>
                            <div className="text-xs text-muted-foreground">{city.country}</div>
                          </div>
                          <Badge>{city.sessions} sessions</Badge>
                        </div>
                      ))
                    ) : (
                      <div className="flex items-center justify-center h-[300px] text-muted-foreground">
                        No city data available yet
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Users Table */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Users ({users.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2 px-4 font-medium">Email</th>
                  <th className="text-left py-2 px-4 font-medium">Status</th>
                  <th className="text-left py-2 px-4 font-medium">Verified</th>
                  <th className="text-left py-2 px-4 font-medium">Joined</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user.id} className="border-b hover:bg-muted/50">
                    <td className="py-3 px-4">
                      <div className="font-medium">{user.email}</div>
                      {user.role === 'admin' && (
                        <Badge variant="destructive" className="text-xs mt-1">Admin</Badge>
                      )}
                    </td>
                    <td className="py-3 px-4">{getStatusBadge(user.status)}</td>
                    <td className="py-3 px-4">
                      {user.emailVerified ? (
                        <Badge variant="default">✓ Yes</Badge>
                      ) : (
                        <Badge variant="outline">✗ No</Badge>
                      )}
                    </td>
                    <td className="py-3 px-4 text-sm text-muted-foreground">
                      {formatDate(user.createdAt)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Footer */}
      <div className="text-center text-sm text-muted-foreground">
        Last updated: {formatDate(metrics.calculatedAt)}
      </div>
    </div>
  );
}
