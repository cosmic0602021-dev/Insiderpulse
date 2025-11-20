import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
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
  Crown,
  Ban,
  Ticket
} from 'lucide-react';
import {
  formatTimeRemaining,
  getSubscriptionDisplayName,
  getStatusDisplayName,
  hasPremiumAccess
} from '@/lib/subscription-utils';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useToast } from '@/hooks/use-toast';
import { apiClient } from '@/lib/api';
import { apiRequest } from '@/lib/queryClient';

// Lightweight countdown timer component that updates independently
function CountdownTimer({ endDate }: { endDate: string | null }) {
  const [time, setTime] = useState(formatTimeRemaining(endDate));

  useEffect(() => {
    // Update every minute
    const interval = setInterval(() => {
      setTime(formatTimeRemaining(endDate));
    }, 60000);

    return () => clearInterval(interval);
  }, [endDate]);

  return <>{time}</>;
}

export default function ProfilePage() {
  const { user, refreshUser } = useAuth();
  const [, navigate] = useLocation();
  const [isLoadingPortal, setIsLoadingPortal] = useState(false);
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);
  const [couponCode, setCouponCode] = useState('');
  const [isRedeemingCoupon, setIsRedeemingCoupon] = useState(false);
  const { toast } = useToast();

  const handleManageSubscription = async () => {
    if (!user?.stripeCustomerId) return;

    setIsLoadingPortal(true);
    try {
      const response = await fetch('/api/create-portal-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
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

  const handleCancelSubscription = async () => {
    // Check if user has active subscription or trial to cancel
    if (!user?.subscriptionStatus || (user.subscriptionStatus !== 'active' && user.subscriptionStatus !== 'trialing')) {
      toast({
        title: '오류',
        description: '활성 구독이 없습니다.',
        variant: 'destructive',
      });
      return;
    }

    setIsCancelling(true);
    try {
      const response = await fetch('/api/cancel-subscription', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        },
      });

      let data;
      try {
        data = await response.json();
      } catch (parseError) {
        console.error('Error parsing response:', parseError);
        throw new Error('서버 응답을 처리할 수 없습니다.');
      }

      if (response.ok && data.success) {
        toast({
          title: '구독 해지 완료',
          description: user.subscriptionStatus === 'trialing'
            ? '무료체험 및 자동결제가 해지되었습니다. 체험 종료일까지 계속 이용하실 수 있습니다.'
            : '구독이 해지되었습니다. 현재 결제 기간 종료일까지 계속 이용하실 수 있습니다.',
        });

        // Refresh user data - don't throw error if refresh fails
        try {
          await refreshUser();
        } catch (refreshError) {
          console.error('Error refreshing user data:', refreshError);
          // Continue even if refresh fails - the cancellation was successful
        }

        setShowCancelDialog(false);
      } else {
        throw new Error(data.message || '구독 해지에 실패했습니다.');
      }
    } catch (error: any) {
      console.error('Error cancelling subscription:', error);
      toast({
        title: '구독 해지 실패',
        description: error.message || '구독 해지 중 오류가 발생했습니다.',
        variant: 'destructive',
      });
    } finally {
      setIsCancelling(false);
    }
  };

  const handleRedeemCoupon = async () => {
    if (!couponCode.trim()) {
      toast({
        title: '쿠폰 코드 입력',
        description: '쿠폰 코드를 입력해주세요.',
        variant: 'destructive',
      });
      return;
    }

    setIsRedeemingCoupon(true);
    try {
      // Use direct fetch instead of apiRequest to properly handle error responses
      const token = localStorage.getItem('authToken');
      const response = await fetch('/api/coupon/redeem', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { 'Authorization': `Bearer ${token}` })
        },
        body: JSON.stringify({ couponCode: couponCode.trim() })
      });

      const data = await response.json();

      if (data.success) {
        toast({
          title: '쿠폰 적용 성공!',
          description: data.message,
        });
        setCouponCode('');

        // Refresh user data to show updated trial end date
        await refreshUser();
      } else {
        // Show the actual error message from backend
        toast({
          title: '쿠폰 적용 실패',
          description: data.message || '쿠폰 적용에 실패했습니다.',
          variant: 'destructive',
        });
      }
    } catch (error: any) {
      console.error('Error redeeming coupon:', error);
      toast({
        title: '오류',
        description: '쿠폰 적용 중 오류가 발생했습니다.',
        variant: 'destructive',
      });
    } finally {
      setIsRedeemingCoupon(false);
    }
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
                    <CountdownTimer endDate={endDate} />
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
                {/* Cancel Subscription Button */}
                {user.subscriptionStatus !== 'canceled' && (
                  <Button
                    onClick={() => setShowCancelDialog(true)}
                    className="w-full"
                    variant="destructive"
                  >
                    <Ban className="w-4 h-4 mr-2" />
                    {user.subscriptionStatus === 'trialing' ? '무료체험 해지' : '구독 해지'}
                  </Button>
                )}

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

      {/* Coupon Redemption - only show for trialing users */}
      {user && user.subscriptionStatus === 'trialing' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Ticket className="h-5 w-5" />
              쿠폰 등록
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {user.usedCoupons && (user.usedCoupons as string[]).length > 0 ? (
              // User has already used a coupon
              <>
                <div className="rounded-lg bg-amber-50 dark:bg-amber-950 p-4 border border-amber-200 dark:border-amber-800">
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="h-5 w-5 text-amber-600 dark:text-amber-400 mt-0.5" />
                    <div className="space-y-1">
                      <p className="text-sm font-medium text-amber-900 dark:text-amber-100">
                        쿠폰 사용 완료
                      </p>
                      <p className="text-xs text-amber-800 dark:text-amber-200">
                        계정당 1개의 쿠폰만 사용 가능합니다. 이미 <strong>{(user.usedCoupons as string[])[0]}</strong> 쿠폰을 사용하셨습니다.
                      </p>
                    </div>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium">사용한 쿠폰</Label>
                  <div className="flex flex-wrap gap-2">
                    {(user.usedCoupons as string[]).map((code) => (
                      <div
                        key={code}
                        className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 text-xs font-medium"
                      >
                        <CheckCircle2 className="h-3 w-3" />
                        {code}
                      </div>
                    ))}
                  </div>
                  {user.couponExtensionDays && (
                    <p className="text-xs text-muted-foreground">
                      💡 무료체험 기간 {user.couponExtensionDays}일 연장됨
                    </p>
                  )}
                </div>
              </>
            ) : (
              // User has not used any coupon yet
              <>
                <div className="space-y-2">
                  <Label htmlFor="coupon-code">쿠폰 코드</Label>
                  <p className="text-sm text-muted-foreground">
                    쿠폰 코드를 입력하면 무료체험 기간이 3일 연장됩니다
                  </p>
                  <div className="flex gap-2">
                    <Input
                      id="coupon-code"
                      placeholder="쿠폰 코드 입력"
                      value={couponCode}
                      onChange={(e) => setCouponCode(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          handleRedeemCoupon();
                        }
                      }}
                      disabled={isRedeemingCoupon}
                      className="flex-1"
                    />
                    <Button
                      onClick={handleRedeemCoupon}
                      disabled={isRedeemingCoupon || !couponCode.trim()}
                    >
                      {isRedeemingCoupon ? (
                        <>
                          <div className="animate-spin w-4 h-4 border-2 border-current border-t-transparent rounded-full mr-2" />
                          적용 중...
                        </>
                      ) : (
                        '적용'
                      )}
                    </Button>
                  </div>
                </div>

                <div className="rounded-lg bg-blue-50 dark:bg-blue-950 p-3">
                  <p className="text-blue-900 dark:text-blue-100 text-xs">
                    💡 Tip: 계정당 1개의 쿠폰만 사용 가능합니다. 신중하게 선택하세요!
                  </p>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      )}

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

      {/* Cancel Subscription Dialog */}
      <AlertDialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {user.subscriptionStatus === 'trialing' ? '무료체험 해지' : '구독 해지'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {user.subscriptionStatus === 'trialing'
                ? '무료체험 및 자동결제가 해지됩니다. 무료체험 종료일까지는 계속 이용하실 수 있습니다. 계속하시겠습니까?'
                : '구독 및 자동결제가 해지됩니다. 현재 결제 기간 종료일까지는 계속 이용하실 수 있습니다. 계속하시겠습니까?'
              }
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>취소</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleCancelSubscription}
              disabled={isCancelling}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isCancelling ? '처리 중...' : '확인'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
