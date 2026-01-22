import { useState, useEffect } from 'react';
import { resolveApiUrl } from '@/lib/queryClient';
import { useAuth } from '@/contexts/auth-context';
import { useLocation } from 'wouter';
import { disconnectTossLogin } from '@/lib/toss-login';
import { ENV_CONFIG } from '@/lib/environment';
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
  Ticket,
  LogOut
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

// Lightweight countdown timer component that updates independently
function CountdownTimer({ endDate }: { endDate: string | null }) {
  const [timeLeft, setTimeLeft] = useState({ hours: 0, minutes: 0 });

  useEffect(() => {
    const calculateTime = () => {
      if (!endDate) return { hours: 0, minutes: 0 };
      const now = new Date();
      const end = new Date(endDate);
      const diffMs = end.getTime() - now.getTime();

      if (diffMs > 0) {
        const hours = Math.floor(diffMs / (1000 * 60 * 60));
        const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
        return { hours, minutes };
      }
      return { hours: 0, minutes: 0 };
    };

    setTimeLeft(calculateTime());

    const interval = setInterval(() => {
      setTimeLeft(calculateTime());
    }, 60000);

    return () => clearInterval(interval);
  }, [endDate]);

  return (
    <>
      {timeLeft.hours}<span className="text-neutral-600">:</span>{timeLeft.minutes.toString().padStart(2, '0')}
      <span className="text-sm text-neutral-600 ml-2">hours</span>
    </>
  );
}

export default function ProfilePage() {
  const { user, refreshUser } = useAuth();
  const [, navigate] = useLocation();
  const [isLoadingPortal, setIsLoadingPortal] = useState(false);
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);
  const [cancelFeedback, setCancelFeedback] = useState('');
  const [couponCode, setCouponCode] = useState('');
  const [isRedeemingCoupon, setIsRedeemingCoupon] = useState(false);
  const [couponStatus, setCouponStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const { toast } = useToast();

  const handleManageSubscription = async () => {
    if (!user?.stripeCustomerId) return;

    setIsLoadingPortal(true);
    try {
      const response = await fetch(resolveApiUrl('/api/create-portal-session'), {
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
      const response = await fetch(resolveApiUrl('/api/cancel-subscription'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        },
        body: JSON.stringify({ feedback: cancelFeedback }),
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

        try {
          await refreshUser();
        } catch (refreshError) {
          console.error('Error refreshing user data:', refreshError);
        }

        setShowCancelDialog(false);
        setCancelFeedback('');
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
      setCouponStatus('error');
      return;
    }

    setIsRedeemingCoupon(true);
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch(resolveApiUrl('/api/coupon/redeem'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { 'Authorization': `Bearer ${token}` })
        },
        body: JSON.stringify({ couponCode: couponCode.trim() })
      });

      const data = await response.json();

      if (data.success) {
        setCouponStatus('success');
        setCouponCode('');
        await refreshUser();

        setTimeout(() => setCouponStatus('idle'), 3000);
      } else {
        setCouponStatus('error');
        toast({
          title: '쿠폰 적용 실패',
          description: data.message || '쿠폰 적용에 실패했습니다.',
          variant: 'destructive',
        });
        setTimeout(() => setCouponStatus('idle'), 3000);
      }
    } catch (error: any) {
      console.error('Error redeeming coupon:', error);
      setCouponStatus('error');
      setTimeout(() => setCouponStatus('idle'), 3000);
    } finally {
      setIsRedeemingCoupon(false);
    }
  };

  const handleLogout = async () => {
    console.log('[Profile] 로그아웃 시작...');

    // 토스 로그인 연결 해제
    if (ENV_CONFIG.isAppintos) {
      await disconnectTossLogin();
    }

    // 모든 로그인 정보 삭제
    localStorage.removeItem('toss_access_token');
    localStorage.removeItem('toss_refresh_token');
    localStorage.removeItem('appintos_user_id');
    localStorage.removeItem('authUser');
    localStorage.removeItem('authToken');
    localStorage.removeItem('toss_user_key');

    console.log('[Profile] ✅ 로그아웃 완료, 홈으로 이동');

    // 홈으로 이동
    window.location.href = '/';
  };

  if (!user) {
    return (
      <div className="flex-1 flex items-center justify-center bg-[#050505]">
        <p className="text-neutral-600 font-mono">Loading...</p>
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
    endDateLabel = '무료체험 종료';
  } else if (user.subscriptionStatus === 'active') {
    endDate = user.subscriptionEndDate;
    endDateLabel = '다음 결제';
  } else if (user.subscriptionStatus === 'canceled' && user.subscriptionEndDate) {
    endDate = user.subscriptionEndDate;
    endDateLabel = '구독 종료';
  }

  const formattedEndDate = endDate ? new Date(endDate).toLocaleString('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }) : null;

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-[#050505]">
      {/* Header */}
      <div className="p-6 border-b border-neutral-900">
        <h1 className="text-3xl font-light text-neutral-200 tracking-tight uppercase">Profile</h1>
        <p className="text-xs text-neutral-600 mt-1 font-mono uppercase tracking-widest">Account & Subscription Management</p>
      </div>

      <div className="flex-1 overflow-y-auto p-6 max-w-4xl mx-auto w-full space-y-6">
        {/* Account Info */}
        <div className="bg-[#0a0a0a] border border-neutral-900 p-6 rounded-sm">
          <div className="flex items-center gap-3 mb-6 border-b border-neutral-800 pb-4">
            <User className="text-neutral-500" size={20} />
            <h2 className="text-lg font-bold text-neutral-300">계정 정보</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-6">
            <div>
              <div className="text-xs text-neutral-600 uppercase tracking-wider mb-1">이메일</div>
              <div className="text-neutral-300 font-mono font-medium">{user.email}</div>
            </div>
            <div>
              <div className="text-xs text-neutral-600 uppercase tracking-wider mb-1">가입일</div>
              <div className="text-neutral-300 font-mono font-medium">
                {user.createdAt ? new Date(user.createdAt).toLocaleDateString('ko-KR') : 'N/A'}
              </div>
            </div>
          </div>

          {/* 로그아웃 버튼 */}
          <button
            onClick={handleLogout}
            className="w-full py-3 border border-neutral-800 text-neutral-400 hover:bg-neutral-900 hover:text-neutral-200 transition-colors text-xs font-bold uppercase tracking-widest flex items-center justify-center gap-2"
          >
            <LogOut size={14} />
            로그아웃
          </button>
          {ENV_CONFIG.isAppintos && (
            <div className="mt-2 text-center text-[10px] text-neutral-600">
              로그아웃 후 다시 로그인하면 토스 동의 화면이 표시됩니다
            </div>
          )}
        </div>

        {/* Subscription Info */}
        <div className="bg-[#0a0a0a] border border-neutral-900 p-6 rounded-sm">
          <div className="flex items-center gap-3 mb-6 border-b border-neutral-800 pb-4">
            <Crown className="text-neutral-500" size={20} />
            <h2 className="text-lg font-bold text-neutral-300">구독 상태</h2>
          </div>

          {/* Current Plan */}
          <div className="bg-neutral-900/30 border border-neutral-800 p-4 flex justify-between items-center mb-6">
            <div>
              <div className="text-xs text-neutral-600 uppercase tracking-wider mb-1">현재 플랜</div>
              <div className="text-xl font-bold text-white flex items-center gap-2">
                {tierDisplayName}
                <span className={isPremium ? "text-emerald-500" : "text-amber-500"}>
                  {isPremium ? '♛' : '♙'}
                </span>
              </div>
            </div>
            <span className={`px-3 py-1 text-xs font-bold uppercase tracking-wider border rounded-full ${
              user.subscriptionStatus === 'active'
                ? 'bg-emerald-900/30 text-emerald-500 border-emerald-900/50'
                : user.subscriptionStatus === 'trialing'
                ? 'bg-blue-900/30 text-blue-500 border-blue-900/50'
                : user.subscriptionStatus === 'canceled'
                ? 'bg-orange-900/30 text-orange-500 border-orange-900/50'
                : 'bg-neutral-800 text-neutral-400 border-neutral-700'
            }`}>
              {statusDisplayName}
            </span>
          </div>

          {/* Trial Status */}
          <div className="flex justify-end mb-4">
            <div className="flex items-center gap-2 text-xs text-neutral-500">
              {user.hasUsedTrial ? (
                <>
                  <CheckCircle2 size={12} />
                  <span>무료체험 사용 완료</span>
                </>
              ) : (
                <>
                  <XCircle size={12} />
                  <span>무료체험 미사용</span>
                </>
              )}
            </div>
          </div>

          {/* Time Remaining */}
          {endDate && (
            <div className="bg-neutral-900/50 p-6 rounded text-center border border-neutral-800 relative overflow-hidden group mb-6">
              <div className="relative z-10">
                <div className="flex items-center justify-center gap-2 text-neutral-500 mb-2">
                  <Clock size={14} />
                  <span className="text-xs uppercase tracking-wider">{endDateLabel}</span>
                </div>
                <div className="text-4xl md:text-5xl font-mono font-bold text-neutral-200 mb-2 transition-all duration-500">
                  <CountdownTimer endDate={endDate} />
                </div>
                <div className="text-xs text-neutral-600 font-mono flex items-center justify-center gap-1">
                  <Calendar size={12} />
                  {formattedEndDate}
                </div>
              </div>
              {/* Progress Bar */}
              <div className="absolute bottom-0 left-0 h-1 bg-emerald-900/50 w-full">
                <div className="h-full bg-emerald-500/50 w-[80%]"></div>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          {!isPremium ? (
            <>
              <button
                onClick={handleUpgradeToInsider}
                className="w-full py-3 bg-amber-600 hover:bg-amber-500 text-black text-xs font-bold uppercase tracking-widest flex items-center justify-center gap-2 transition-colors"
              >
                <Crown size={14} />
                Upgrade to Insider
              </button>
              <div className="mt-4 flex justify-center text-[10px] text-neutral-600 items-center gap-1.5">
                <AlertCircle size={10} className="text-amber-600" />
                <span>Upgrade to activate real-time signals</span>
              </div>
            </>
          ) : (
            <>
              {/* Cancel Subscription Button */}
              {user.subscriptionStatus !== 'canceled' && (
                <button
                  onClick={() => setShowCancelDialog(true)}
                  className="w-full py-3 border border-rose-900/50 text-rose-500 bg-rose-900/10 hover:bg-rose-900/20 transition-colors text-xs font-bold uppercase tracking-widest flex items-center justify-center gap-2"
                >
                  <XCircle size={14} />
                  {user.subscriptionStatus === 'trialing' ? '무료체험 해지' : '구독 해지'}
                </button>
              )}

              {/* Info Box for trialing */}
              {user.subscriptionStatus === 'trialing' && (
                <div className="mt-4 p-4 bg-blue-900/20 border border-blue-900/50 rounded">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="h-4 w-4 text-blue-500 mt-0.5" />
                    <div className="space-y-1">
                      <p className="text-xs font-medium text-blue-400">무료체험 이용 중</p>
                      <p className="text-[10px] text-blue-300/70">
                        무료체험 종료 시 자동으로 결제가 진행됩니다.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Info Box for canceled */}
              {user.subscriptionStatus === 'canceled' && (
                <div className="mt-4 p-4 bg-orange-900/20 border border-orange-900/50 rounded">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="h-4 w-4 text-orange-500 mt-0.5" />
                    <div className="space-y-1">
                      <p className="text-xs font-medium text-orange-400">구독이 취소되었습니다</p>
                      <p className="text-[10px] text-orange-300/70">
                        구독 종료일까지 Insider 기능을 계속 이용하실 수 있습니다.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Coupon Redemption - only show for trialing users */}
        {user && user.subscriptionStatus === 'trialing' && (
          <div className="bg-[#0a0a0a] border border-neutral-900 p-6 rounded-sm relative overflow-hidden">
            <div className="flex items-center gap-3 mb-6 border-b border-neutral-800 pb-4">
              <Ticket className="text-neutral-500" size={20} />
              <h2 className="text-lg font-bold text-neutral-300">Redeem Code</h2>
            </div>

            {user.usedCoupons && (user.usedCoupons as string[]).length > 0 ? (
              // User has already used a coupon
              <div className="p-4 bg-amber-900/20 border border-amber-900/50 rounded">
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="h-4 w-4 text-amber-500 mt-0.5" />
                  <div className="space-y-1">
                    <p className="text-xs font-medium text-amber-400">쿠폰 사용 완료</p>
                    <p className="text-[10px] text-amber-300/70">
                      계정당 1개의 쿠폰만 사용 가능합니다. 사용한 쿠폰: <strong>{(user.usedCoupons as string[])[0]}</strong>
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              // User has not used any coupon yet
              <>
                <div className="flex flex-col md:flex-row gap-4">
                  <input
                    type="text"
                    value={couponCode}
                    onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                    placeholder="ENTER COUPON CODE"
                    className="flex-1 bg-[#050505] border border-neutral-800 p-4 text-sm text-neutral-200 focus:outline-none focus:border-emerald-700 font-mono tracking-widest uppercase"
                    disabled={isRedeemingCoupon}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        handleRedeemCoupon();
                      }
                    }}
                  />
                  <button
                    onClick={handleRedeemCoupon}
                    className="bg-neutral-100 hover:bg-white text-black px-8 py-4 text-xs font-bold uppercase tracking-widest transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    disabled={couponStatus === 'success' || isRedeemingCoupon}
                  >
                    {isRedeemingCoupon ? 'APPLYING...' : couponStatus === 'success' ? 'APPLIED' : 'REDEEM'}
                  </button>
                </div>

                {couponStatus === 'success' && (
                  <div className="mt-4 p-3 bg-emerald-900/20 border border-emerald-900/50 text-emerald-500 text-xs font-mono flex items-center gap-2">
                    <CheckCircle2 size={14} />
                    SUCCESS: TRIAL EXTENDED BY +72 HOURS
                  </div>
                )}
                {couponStatus === 'error' && (
                  <div className="mt-4 p-3 bg-rose-900/20 border border-rose-900/50 text-rose-500 text-xs font-mono flex items-center gap-2">
                    <AlertCircle size={14} />
                    ERROR: INVALID CODE OR INPUT EMPTY
                  </div>
                )}

                <p className="text-[10px] text-neutral-600 mt-4 flex items-center gap-2">
                  <Ticket size={10} />
                  Enter promotional code to extend your free trial duration.
                </p>
              </>
            )}
          </div>
        )}

        {/* Payment Info */}
        {isPremium && user.stripeCustomerId && (
          <div className="bg-[#0a0a0a] border border-neutral-900 p-6 rounded-sm">
            <div className="flex items-center gap-3 mb-4 border-b border-neutral-800 pb-4">
              <CreditCard className="text-neutral-500" size={20} />
              <h2 className="text-lg font-bold text-neutral-300">결제 정보</h2>
            </div>
            <p className="text-xs text-neutral-500 mb-6">Secure payment management via Stripe</p>

            <button
              onClick={handleManageSubscription}
              disabled={isLoadingPortal}
              className="w-full py-3 border border-neutral-800 text-neutral-300 hover:bg-neutral-900 transition-colors text-xs font-bold uppercase tracking-widest flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {isLoadingPortal ? (
                <>
                  <div className="animate-spin w-4 h-4 border-2 border-current border-t-transparent rounded-full" />
                  Loading...
                </>
              ) : (
                <>
                  <ExternalLink size={14} />
                  Stripe 고객 포털 열기
                </>
              )}
            </button>
          </div>
        )}
      </div>

      {/* Cancel Subscription Dialog */}
      <AlertDialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
        <AlertDialogContent className="bg-[#0a0a0a] border-neutral-800">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-neutral-200">
              {user.subscriptionStatus === 'trialing' ? '무료체험 해지' : '구독 해지'}
            </AlertDialogTitle>
            <AlertDialogDescription className="text-neutral-500">
              {user.subscriptionStatus === 'trialing'
                ? '무료체험 및 자동결제가 해지됩니다. 무료체험 종료일까지는 계속 이용하실 수 있습니다. 계속하시겠습니까?'
                : '구독 및 자동결제가 해지됩니다. 현재 결제 기간 종료일까지는 계속 이용하실 수 있습니다. 계속하시겠습니까?'
              }
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="my-4">
            <label className="block text-xs text-neutral-400 mb-2">
              해지 사유를 알려주시면 서비스 개선에 도움이 됩니다 (선택)
            </label>
            <textarea
              value={cancelFeedback}
              onChange={(e) => setCancelFeedback(e.target.value)}
              placeholder="해지 사유를 입력해주세요..."
              className="w-full h-24 px-3 py-2 bg-neutral-900 border border-neutral-800 rounded-sm text-neutral-300 text-sm placeholder-neutral-600 resize-none focus:outline-none focus:border-neutral-700"
              data-testid="input-cancel-feedback"
            />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-neutral-900 border-neutral-800 text-neutral-300 hover:bg-neutral-800">
              취소
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleCancelSubscription}
              disabled={isCancelling}
              className="bg-rose-900/50 text-rose-500 hover:bg-rose-900/70 border border-rose-900/50"
            >
              {isCancelling ? '처리 중...' : '확인'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
