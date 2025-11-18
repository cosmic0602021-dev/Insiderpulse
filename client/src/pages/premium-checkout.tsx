import { useState, useRef, useEffect } from 'react';
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from "@/components/ui/checkbox";
import { CreditCard, TrendingUp, Shield, Zap, CheckCircle, Clock, RefreshCw, ArrowRight, Check, Sparkles, AlertTriangle } from "lucide-react";
import { StripeMeshGradient } from "@/components/stripe-mesh-gradient";
import { GlassCard } from "@/components/glass-card";
import { useAuth } from "@/contexts/auth-context";
import { useLocation } from 'wouter';

export default function PremiumCheckout() {
  const [selectedPlan, setSelectedPlan] = useState<'monthly' | 'yearly'>('monthly');
  const [isProcessing, setIsProcessing] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const isSubmittingRef = useRef(false);
  const { toast } = useToast();
  const { user, isLoading: authLoading } = useAuth();
  const [, setLocation] = useLocation();

  // Redirect if user already has active subscription
  useEffect(() => {
    if (user && (user.subscriptionTier === 'insider_pro' || user.subscriptionTier === 'insider') &&
       (user.subscriptionStatus === 'active' || user.subscriptionStatus === 'trialing')) {
      toast({
        title: "이미 Insider 구독 중입니다",
        description: "트레이딩 페이지로 이동합니다.",
      });
      setTimeout(() => setLocation('/trades'), 1500);
    }
  }, [user, setLocation, toast]);

  const plans = {
    monthly: {
      name: "Insider",
      price: 14,
      priceId: import.meta.env.VITE_STRIPE_PRICE_ID_MONTHLY || 'price_1SPBb1Q9br8aQ595KTOAcBfO',
      interval: "/month",
      billingInterval: "월간 자동결제",
      description: "Real-time insider trading data & AI analysis",
      features: [
        "Real-time insider trade alerts (no 48h delay)",
        "Pure buy/sell signals only (no grants, options, awards)",
        "AI-powered trade analysis & predictions",
        "Advanced pattern detection & signals",
        "Executive trade tracking (CEO, CFO, etc.)",
        "Live data updates & push notifications",
        "Historical insider performance analytics",
        "Exclusive market intelligence reports"
      ],
      savings: null
    },
    yearly: {
      name: "Insider",
      price: 112,
      originalPrice: 168,
      priceId: import.meta.env.VITE_STRIPE_PRICE_ID_YEARLY || 'price_1SPBdLQ9br8aQ595n0dKEOLv',
      interval: "/year",
      billingInterval: "연간 자동결제",
      pricePerMonth: 9.33,
      description: "Real-time insider trading data & AI analysis",
      features: [
        "Real-time insider trade alerts (no 48h delay)",
        "Pure buy/sell signals only (no grants, options, awards)",
        "AI-powered trade analysis & predictions",
        "Advanced pattern detection & signals",
        "Executive trade tracking (CEO, CFO, etc.)",
        "Live data updates & push notifications",
        "Historical insider performance analytics",
        "Exclusive market intelligence reports"
      ],
      savings: "Save 33% with annual billing",
      discount: "33% OFF"
    },
  };

  const currentPlan = plans[selectedPlan];

  // Trial periods by plan
  const trialDays = selectedPlan === 'yearly' ? 7 : 3;
  const trialPeriodKo = selectedPlan === 'yearly' ? '7일' : '3일';
  const trialPeriodEn = selectedPlan === 'yearly' ? '7 days' : '3 days';

  // Check if user has already used trial
  const hasUsedTrial = user?.hasUsedTrial || false;
  const showTrialInfo = !hasUsedTrial;

  const handleCheckout = async () => {
    // Check if user agreed to terms (only required if trial available)
    if (showTrialInfo && !agreedToTerms) {
      toast({
        title: "약관 동의 필요",
        description: "자동결제 및 환불 정책에 동의해주세요.",
        variant: "destructive",
      });
      return;
    }

    // Prevent double-clicks and concurrent requests
    if (isSubmittingRef.current) {
      console.log('⚠️ Already submitting, ignoring duplicate click');
      return;
    }

    // Double-check authentication before proceeding
    if (!user) {
      console.error('❌ No user found when attempting checkout');
      toast({
        title: "로그인 필요",
        description: "구독하려면 먼저 로그인해주세요.",
        variant: "destructive",
      });
      setLocation('/login?redirect=/premium-checkout');
      return;
    }

    // Verify auth token exists
    const token = localStorage.getItem('authToken');
    if (!token) {
      console.error('❌ No auth token found in localStorage');
      toast({
        title: "세션 만료",
        description: "로그인 세션이 만료되었습니다. 다시 로그인해주세요.",
        variant: "destructive",
      });
      setLocation('/login?redirect=/premium-checkout');
      return;
    }

    isSubmittingRef.current = true;
    setIsProcessing(true);

    console.log('🚀 Starting checkout process', {
      userId: user.id,
      email: user.email,
      plan: selectedPlan,
      priceId: currentPlan.priceId
    });

    try {
      const response = await apiRequest("POST", "/api/create-subscription", {
        priceId: currentPlan.priceId,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `서버 오류: ${response.status}`);
      }

      const data = await response.json();
      console.log('✅ Checkout session created:', data);

      if (data.url) {
        console.log('🔗 Redirecting to Stripe Checkout:', data.url);
        // Redirect to Stripe Checkout
        // Note: Don't reset isSubmittingRef or isProcessing here since we're redirecting
        window.location.href = data.url;
      } else {
        throw new Error('No checkout URL received');
      }
    } catch (error: any) {
      console.error('❌ Error creating checkout session:', error);

      // Handle specific error for duplicate subscriptions
      if (error.message && error.message.includes('이미 활성 구독이 있습니다')) {
        toast({
          title: "이미 구독 중입니다",
          description: "이미 활성 구독이 있습니다. 대시보드로 이동합니다.",
          variant: "default",
        });
        setTimeout(() => setLocation('/dashboard'), 2000);
      } else {
        toast({
          title: "결제 오류",
          description: error.message || "결제 세션을 생성할 수 없습니다. 다시 시도해주세요.",
          variant: "destructive",
        });
      }

      isSubmittingRef.current = false;
      setIsProcessing(false);
    }
  };

  // Redirect to login if not authenticated
  if (!authLoading && !user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-4 flex items-center justify-center">
        <Card className="max-w-md w-full">
          <CardHeader>
            <CardTitle className="text-center">로그인 필요</CardTitle>
            <CardDescription className="text-center">
              구독하려면 먼저 로그인해주세요
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              onClick={() => setLocation('/login?redirect=/premium-checkout')}
              className="w-full"
            >
              로그인 페이지로 이동
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0f] p-4 relative overflow-hidden">
      {/* Stripe Mesh Gradient */}
      <StripeMeshGradient variant="purple" opacity={0.4} animate={true} />

      <div className="max-w-5xl mx-auto relative z-10">
        <div className="text-center mb-16 mt-8">
          <Badge className="mb-8 px-4 py-2 text-xs font-medium
                           bg-white/10 text-white border border-white/20
                           backdrop-blur-xl rounded-full shadow-lg shadow-purple-500/10">
            <Sparkles className="inline-block w-3 h-3 mr-2" />
            Premium Subscription
          </Badge>
          <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold mb-6 text-white tracking-tight
                        bg-clip-text text-transparent bg-gradient-to-b from-white via-white to-white/40" data-testid="text-checkout-title">
            Upgrade to Insider
          </h1>
          <p className="text-slate-400 max-w-2xl mx-auto text-lg md:text-xl leading-relaxed">
            {showTrialInfo
              ? `Get ${trialPeriodEn} free trial + real-time insider trading alerts`
              : 'Get real-time insider trading alerts and never miss a profitable opportunity'}
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-8 items-start">
          {/* Plan Card */}
          <div className="space-y-4">
            {/* Plan Toggle */}
            <div className="flex justify-center mb-6">
              <div className="inline-flex rounded-lg bg-slate-800 p-1 border border-slate-700">
                <button
                  onClick={() => setSelectedPlan('monthly')}
                  className={`px-6 py-3 rounded-md font-semibold transition-all ${
                    selectedPlan === 'monthly'
                      ? 'bg-gradient-to-r from-emerald-500 to-blue-500 text-white shadow-lg'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Monthly
                </button>
                <button
                  onClick={() => setSelectedPlan('yearly')}
                  className={`relative px-6 py-3 rounded-md font-semibold transition-all ${
                    selectedPlan === 'yearly'
                      ? 'bg-gradient-to-r from-emerald-500 to-blue-500 text-white shadow-lg'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Yearly
                  {selectedPlan !== 'yearly' && (
                    <span className="absolute -top-2 -right-2 bg-amber-500 text-slate-900 text-xs font-bold px-2 py-0.5 rounded-full">
                      -33%
                    </span>
                  )}
                </button>
              </div>
            </div>

            <Card className="border-2 border-amber-500 bg-gradient-to-br from-slate-800 to-slate-900">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <CardTitle className="text-white text-2xl">
                        {currentPlan.name}
                      </CardTitle>
                      {selectedPlan === 'yearly' && (
                        <Badge variant="default" className="bg-amber-500 text-slate-900 font-bold">
                          <Zap className="w-3 h-3 mr-1" />
                          {plans.yearly.discount}
                        </Badge>
                      )}
                    </div>
                    <CardDescription className="text-slate-300 text-base">
                      {currentPlan.description}
                    </CardDescription>
                  </div>
                </div>
                <div className="mt-4">
                  {selectedPlan === 'yearly' && (
                    <div className="flex items-baseline gap-2 mb-2">
                      <span className="text-2xl font-bold text-slate-500 line-through">${plans.yearly.originalPrice}</span>
                      <span className="text-sm text-slate-400">/year</span>
                    </div>
                  )}
                  <div className="flex items-baseline gap-2">
                    <span className="text-5xl font-bold text-amber-500">${currentPlan.price}</span>
                    <span className="text-xl text-slate-400">{currentPlan.interval}</span>
                  </div>
                  {selectedPlan === 'yearly' && (
                    <div className="mt-3 p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-lg">
                      <p className="text-emerald-400 font-bold text-lg">
                        ≈ $9/month
                      </p>
                      <p className="text-xs text-emerald-300 mt-1">
                        Save $56 compared to monthly billing
                      </p>
                    </div>
                  )}
                  <div className="mt-3 flex items-center gap-2 text-sm text-slate-400">
                    <RefreshCw className="w-4 h-4" />
                    <span>{currentPlan.billingInterval}</span>
                  </div>
                  {currentPlan.savings && (
                    <div className="mt-3 flex items-center gap-2">
                      <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
                        {currentPlan.savings}
                      </Badge>
                    </div>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3">
                  {currentPlan.features.map((feature, index) => (
                    <li key={index} className="flex items-start gap-3 text-sm text-slate-200">
                      <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>

            {/* Free Trial Info - only show if user hasn't used trial */}
            {showTrialInfo && (
              <div className="mt-6 p-4 bg-gradient-to-r from-amber-500/10 to-emerald-500/10 rounded-lg border border-amber-500/30">
                <div className="flex items-start gap-3">
                  <Clock className="w-5 h-5 text-amber-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <h3 className="font-semibold text-sm text-white">
                      {trialPeriodKo} 무료체험
                    </h3>
                    <p className="text-sm text-slate-300 mt-1">
                      오늘부터 {trialPeriodKo}간 무료로 모든 Insider 기능을 사용해보세요. 무료체험 기간이 끝나면 자동으로 ${currentPlan.price}{currentPlan.interval} 결제가 시작됩니다. 언제든지 해지 가능합니다.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* No Trial - Direct Billing Info */}
            {!showTrialInfo && (
              <div className="mt-6 p-4 bg-gradient-to-r from-blue-500/10 to-purple-500/10 rounded-lg border border-blue-500/30">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 text-blue-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <h3 className="font-semibold text-sm text-white">
                      무료체험 이미 사용됨
                    </h3>
                    <p className="text-sm text-slate-300 mt-1">
                      무료체험은 계정당 1회만 제공됩니다. 결제 즉시 ${currentPlan.price}{currentPlan.interval} 자동결제가 시작됩니다.
                    </p>
                  </div>
                </div>
              </div>
            )}

            <div className="mt-4 p-4 bg-slate-800 rounded-lg border border-slate-700">
              <div className="flex items-start gap-3">
                <Shield className="w-5 h-5 text-amber-500 mt-0.5 flex-shrink-0" />
                <div>
                  <h3 className="font-semibold text-sm text-white">Secure Payment & Auto-Renewal</h3>
                  <p className="text-sm text-slate-300 mt-1">
                    All transactions are encrypted and processed securely through Stripe.
                    Your subscription will automatically renew {selectedPlan === 'monthly' ? 'every month' : 'every year'} until you cancel.
                    Cancel anytime with one click - you'll keep access until the end of your billing period.
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-4 p-4 bg-slate-800 rounded-lg border border-slate-700">
              <div className="flex items-start gap-3">
                <TrendingUp className="w-5 h-5 text-green-400 mt-0.5 flex-shrink-0" />
                <div>
                  <h3 className="font-semibold text-sm text-white">Real SEC Data</h3>
                  <p className="text-sm text-slate-300 mt-1">
                    All data sourced directly from SEC filings. No fake data - only real, actionable intelligence.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Checkout Button */}
          <div className="flex flex-col items-center justify-start lg:pt-16">
            <Card className="w-full max-w-md">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="h-5 w-5 text-primary" />
                  {showTrialInfo ? 'Start Free Trial' : 'Subscribe Now'}
                </CardTitle>
                <CardDescription>
                  {showTrialInfo
                    ? `${trialPeriodKo} 무료체험 후 $${currentPlan.price}${currentPlan.interval}`
                    : `즉시 $${currentPlan.price}${currentPlan.interval} 결제 시작`}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2 text-sm text-slate-600 dark:text-slate-400">
                  <div className="flex items-center justify-between">
                    <span>Plan:</span>
                    <span className="font-semibold">{currentPlan.name} ({selectedPlan === 'monthly' ? 'Monthly' : 'Yearly'})</span>
                  </div>
                  {showTrialInfo && (
                    <div className="flex items-center justify-between">
                      <span>Free Trial:</span>
                      <span className="font-semibold text-green-600 dark:text-green-400">{trialPeriodEn}</span>
                    </div>
                  )}
                  <div className="flex items-center justify-between">
                    <span>{showTrialInfo ? 'After Trial:' : 'Price:'}</span>
                    <span className="font-semibold">${currentPlan.price}{currentPlan.interval} (세금별도)</span>
                  </div>
                  <div className="flex items-center justify-between text-xs text-slate-500">
                    <span>Billing Cycle:</span>
                    <span>{currentPlan.billingInterval}</span>
                  </div>
                </div>

                {/* Terms Agreement Checkbox */}
                {showTrialInfo && (
                  <div className="flex items-start gap-3 p-3 rounded-lg border bg-muted/50">
                    <Checkbox
                      id="terms"
                      checked={agreedToTerms}
                      onCheckedChange={(checked) => setAgreedToTerms(checked === true)}
                      className="mt-0.5"
                    />
                    <label
                      htmlFor="terms"
                      className="text-xs text-muted-foreground leading-relaxed cursor-pointer"
                    >
                      무료체험 종료 후 자동으로 결제가 진행됩니다. 원치 않으시면 카드사에서 자동결제를 직접 취소해주세요. 자동결제 이후에는 환불이 불가함을 이해했습니다.
                    </label>
                  </div>
                )}

                <Button
                  onClick={handleCheckout}
                  className="w-full bg-gradient-to-r from-emerald-500 to-blue-500 hover:from-emerald-600 hover:to-blue-600 text-white font-semibold py-6 text-lg"
                  disabled={isProcessing || (showTrialInfo && !agreedToTerms)}
                  data-testid="button-complete-payment"
                >
                  {isProcessing ? (
                    <>
                      <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <Shield className="w-5 h-5 mr-2" />
                      {showTrialInfo ? `Start ${trialPeriodEn} Free Trial` : 'Subscribe Now'}
                    </>
                  )}
                </Button>

                <p className="text-xs text-center text-slate-500">
                  {showTrialInfo
                    ? `You won't be charged for ${trialPeriodEn}. Cancel anytime during the trial.`
                    : '안전한 Stripe 결제 시스템을 통해 처리됩니다.'}
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
