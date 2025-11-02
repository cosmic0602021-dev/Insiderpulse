import { useEffect, useState } from 'react';
import { Users, UserCheck, CreditCard, TrendingUp, RefreshCw } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useLanguage } from '@/contexts/language-context';

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

export default function AdminDashboard() {
  const { t } = useLanguage();
  const [metrics, setMetrics] = useState<AdminMetrics | null>(null);
  const [users, setUsers] = useState<UserListItem[]>([]);
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
      const metricsRes = await fetch('/api/admin/metrics/overview', { headers });
      if (!metricsRes.ok) {
        throw new Error(`Failed to fetch metrics: ${metricsRes.statusText}`);
      }
      const metricsData = await metricsRes.json();
      setMetrics(metricsData.metrics);

      // Fetch users
      const usersRes = await fetch('/api/admin/metrics/users?limit=50', { headers });
      if (!usersRes.ok) {
        throw new Error(`Failed to fetch users: ${usersRes.statusText}`);
      }
      const usersData = await usersRes.json();
      setUsers(usersData.users);

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
