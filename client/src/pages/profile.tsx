import { useState } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Label } from '@/components/ui/label';
import { useLocation } from 'wouter';
import {
  User,
  CreditCard,
  ExternalLink,
  Calendar,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Crown
} from 'lucide-react';
import {
  formatTimeRemaining,
  getSubscriptionDisplayName,
  getStatusDisplayName,
  hasPremiumAccess
} from '@/lib/subscription-utils';
import { RefreshAccountButton } from '@/components/refresh-account-button';

export default function ProfilePage() {
  const { user } = useAuth();
  const [, navigate] = useLocation();
  const [isLoadingPortal, setIsLoadingPortal] = useState(false);

  const handleManageSubscription = async () => {
    if (!user?.stripeCustomerId) return;

    setIsLoadingPortal(true);
    try {
      const response = await fetch('/api/create-portal-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      const data = await response.json();
      if (data.url) {
        window.location.href = data.url;
      }
    } catch (error) {
      console.error('Error creating portal session:', error);
    } finally {
      setIsLoadingPortal(false);
    }
  };

  const handleUpgradeToInsider = () => {
    navigate('/premium-checkout');
  };

  if (!user) {
    return (
      <div className="container max-w-4xl mx-auto p-6">
        <p className="text-center text-muted-foreground">Loading...</p>
      </div>
    );
  }

  const isPremium = hasPremiumAccess(user);
  const tierDisplayName = getSubscriptionDisplayName(user.subscriptionTier);
  const statusDisplayName = getStatusDisplayName(user.subscriptionStatus);

  // Determine which end date to show
  let endDate: string | null = null;
  let endDateLabel = '';

  if (user.subscriptionStatus === 'trialing') {
    endDate = user.subscriptionEndDate;
    endDateLabel = '무료체험 종료까지';
  } else if (user.subscriptionStatus === 'active') {
    endDate = user.subscriptionEndDate;
    endDateLabel = user.subscriptionStatus === 'canceled' ? '구독 종료까지' : '다음 결제까지';
  } else if (user.subscriptionStatus === 'canceled' && user.subscriptionEndDate) {
    endDate = user.subscriptionEndDate;
    endDateLabel = '구독 종료까지';
  }

  const timeRemaining = formatTimeRemaining(endDate);
  const formattedEndDate = endDate ? new Date(endDate).toLocaleString('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }) : null;

  return (
    <div className="container max-w-4xl mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">프로필</h1>
        <p className="text-muted-foreground mt-2">
          계정 정보 및 구독 상태를 관리하세요
        </p>
      </div>

      {/* Account Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            계정 정보
          </CardTitle>
          <CardDescription>
            기본 계정 정보
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label className="text-sm text-muted-foreground">이메일</Label>
              <p className="text-sm font-medium">{user.email}</p>
            </div>
            <div className="space-y-2">
              <Label className="text-sm text-muted-foreground">가입일</Label>
              <p className="text-sm font-medium">
                {user.createdAt ? new Date(user.createdAt).toLocaleDateString('ko-KR') : 'N/A'}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Subscription Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Crown className="h-5 w-5" />
            구독 상태
          </CardTitle>
          <CardDescription>
            현재 플랜 및 구독 정보
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Current Plan */}
          <div className="flex items-center justify-between p-4 rounded-lg border bg-card">
            <div className="space-y-1">
              <Label className="text-sm text-muted-foreground">현재 플랜</Label>
              <p className="text-2xl font-bold flex items-center gap-2">
                {tierDisplayName}
                {isPremium && <Crown className="h-5 w-5 text-yellow-500" />}
              </p>
            </div>
            <div className="text-right">
              <p className={`text-sm font-medium px-3 py-1 rounded-full ${
                user.subscriptionStatus === 'active' ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300' :
                user.subscriptionStatus === 'trialing' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300' :
                user.subscriptionStatus === 'canceled' ? 'bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300' :
                'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
              }`}>
                {statusDisplayName}
              </p>
            </div>
          </div>

          <Separator />

          {/* Trial Status */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-medium">무료체험 사용 여부</Label>
              <div className="flex items-center gap-2">
                {user.hasUsedTrial ? (
                  <>
                    <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" />
                    <span className="text-sm text-muted-foreground">사용 완료</span>
                  </>
                ) : (
                  <>
                    <XCircle className="h-4 w-4 text-slate-600 dark:text-slate-400" />
                    <span className="text-sm text-muted-foreground">미사용 (사용 가능)</span>
                  </>
                )}
              </div>
            </div>

            {/* Time Remaining */}
            {endDate && (
              <div className="space-y-2 p-4 rounded-lg bg-muted">
                <div className="flex items-center gap-2 text-sm font-medium">
                  <Clock className="h-4 w-4" />
                  {endDateLabel}
                </div>
                <div className="flex items-center justify-between">
                  <div className="text-3xl font-bold font-mono">
                    {timeRemaining}
                  </div>
                  <div className="text-right text-xs text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {formattedEndDate}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          <Separator />

          {/* Action Buttons */}
          <div className="space-y-3">
            {!isPremium ? (
              <>
                <Button
                  onClick={handleUpgradeToInsider}
                  className="w-full"
                  size="lg"
                >
                  <Crown className="w-4 h-4 mr-2" />
                  Upgrade to Insider
                </Button>
                <p className="text-xs text-center text-muted-foreground">
                  실시간 insider 거래 데이터 및 고급 기능에 액세스하세요
                </p>
              </>
            ) : (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <Button
                    onClick={handleManageSubscription}
                    disabled={isLoadingPortal}
                    className="w-full"
                    variant="outline"
                  >
                    {isLoadingPortal ? (
                      <>
                        <div className="animate-spin w-4 h-4 border-2 border-current border-t-transparent rounded-full mr-2" />
                        Loading...
                      </>
                    ) : (
                      <>
                        <ExternalLink className="w-4 h-4 mr-2" />
                        구독 관리
                      </>
                    )}
                  </Button>
                  <RefreshAccountButton className="w-full" />
                </div>
                <p className="text-xs text-muted-foreground text-center">
                  💡 구독 상태가 자동으로 업데이트되지 않으면 "계정 새로고침"을 클릭하세요
                </p>
              </>
            )}
          </div>

          {/* Info Box */}
          {isPremium && user.subscriptionStatus === 'trialing' && (
            <div className="rounded-lg bg-blue-50 dark:bg-blue-950 p-4">
              <div className="flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5" />
                <div className="space-y-1">
                  <p className="text-sm font-medium text-blue-900 dark:text-blue-100">
                    무료체험 이용 중
                  </p>
                  <p className="text-xs text-blue-800 dark:text-blue-200">
                    무료체험 종료 시 자동으로 결제가 진행됩니다. 자동결제를 원하지 않으시면 카드사를 통해 자동결제를 취소하세요. 단, 무료체험 기간은 계속 유지되며 종료 시까지 서비스를 이용하실 수 있습니다.
                  </p>
                </div>
              </div>
            </div>
          )}

          {isPremium && user.subscriptionStatus === 'canceled' && (
            <div className="rounded-lg bg-orange-50 dark:bg-orange-950 p-4">
              <div className="flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-orange-600 dark:text-orange-400 mt-0.5" />
                <div className="space-y-1">
                  <p className="text-sm font-medium text-orange-900 dark:text-orange-100">
                    구독이 취소되었습니다
                  </p>
                  <p className="text-xs text-orange-800 dark:text-orange-200">
                    구독 종료일까지 Insider 기능을 계속 이용하실 수 있습니다. 종료 후 다시 구독하시려면 "Upgrade to Insider" 버튼을 클릭하세요.
                  </p>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Subscription Details (only for premium users) */}
      {isPremium && user.stripeCustomerId && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              결제 정보
            </CardTitle>
            <CardDescription>
              Stripe를 통한 안전한 결제 관리
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-muted-foreground">
              결제 수단 변경, 영수증 확인, 구독 취소 등은 Stripe 고객 포털에서 관리하실 수 있습니다.
            </p>
            <Button
              onClick={handleManageSubscription}
              disabled={isLoadingPortal}
              variant="outline"
              className="w-full"
            >
              {isLoadingPortal ? (
                <>
                  <div className="animate-spin w-4 h-4 border-2 border-current border-t-transparent rounded-full mr-2" />
                  Loading...
                </>
              ) : (
                <>
                  <ExternalLink className="w-4 h-4 mr-2" />
                  Stripe 고객 포털 열기
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
