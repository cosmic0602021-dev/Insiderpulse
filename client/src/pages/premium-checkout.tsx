import { useState, useRef } from 'react';
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CreditCard, TrendingUp, Shield, Zap, CheckCircle, Clock, RefreshCw } from "lucide-react";
import { useAuth } from "@/contexts/auth-context";
import { useLocation } from 'wouter';

export default function PremiumCheckout() {
  const [selectedPlan, setSelectedPlan] = useState<'monthly' | 'yearly' | 'test'>('monthly');
  const [isProcessing, setIsProcessing] = useState(false);
  const isSubmittingRef = useRef(false);
  const { toast } = useToast();
  const { user, isLoading: authLoading } = useAuth();
  const [, setLocation] = useLocation();

  const plans = {
    monthly: {
      name: "Insider Pro",
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
      name: "Insider Pro",
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
    test: {
      name: "Mini Plan",
      price: 0.10,
      priceId: import.meta.env.VITE_STRIPE_PRICE_ID_TEST || 'price_1SPm4OQ9br8aQ59530R9Dy37',
      interval: "",
      billingInterval: "즉시 청구",
      description: "Test our service with a mini plan",
      features: [
        "즉시 $0.10 청구",
        "모든 Pro 기능 이용 가능",
        "테스트 목적 소액 플랜",
        "언제든지 취소 가능"
      ],
      savings: null,
      discount: "💎 MINI"
    }
  };

  const currentPlan = plans[selectedPlan];

  // Trial period display text based on plan
  const trialPeriod = selectedPlan === 'test' ? '즉시' : '7일';
  const trialPeriodEn = selectedPlan === 'test' ? 'immediate' : '7 days';
  const trialDuration = selectedPlan === 'test' ? 'Immediate' : '7-Day';

  const handleCheckout = async () => {
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
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-4">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-4 text-white" data-testid="text-checkout-title">
            Upgrade to Insider Pro
          </h1>
          <p className="text-slate-300 max-w-2xl mx-auto text-lg">
            Get real-time insider trading alerts and never miss a profitable opportunity
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
                <button
                  onClick={() => setSelectedPlan('test')}
                  className={`relative px-6 py-3 rounded-md font-semibold transition-all ${
                    selectedPlan === 'test'
                      ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  💎 Mini
                  {selectedPlan !== 'test' && (
                    <span className="absolute -top-2 -right-2 bg-blue-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                      $0.10
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

            {/* Free Trial Info */}
            <div className="mt-6 p-4 bg-gradient-to-r from-amber-500/10 to-emerald-500/10 rounded-lg border border-amber-500/30">
              <div className="flex items-start gap-3">
                <Clock className="w-5 h-5 text-amber-500 mt-0.5 flex-shrink-0" />
                <div>
                  <h3 className="font-semibold text-sm text-white">
                    {selectedPlan === 'test' ? '즉시 청구' : `${trialPeriod} 무료체험`}
                  </h3>
                  <p className="text-sm text-slate-300 mt-1">
                    {selectedPlan === 'test'
                      ? '테스트 목적의 소액 플랜입니다. 결제 즉시 $0.10이 청구되며 모든 Pro 기능을 이용할 수 있습니다. 언제든지 해지 가능합니다.'
                      : `오늘부터 ${trialPeriod}간 무료로 모든 기능을 사용해보세요. 무료체험 기간이 끝나면 자동으로 ${currentPlan.billingInterval}가 시작됩니다. 언제든지 해지 가능합니다.`
                    }
                  </p>
                </div>
              </div>
            </div>

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
                  {selectedPlan === 'test' ? 'Complete Payment' : 'Start Your Free Trial'}
                </CardTitle>
                <CardDescription>
                  {selectedPlan === 'test'
                    ? `즉시 ${currentPlan.price}달러 청구`
                    : `${trialPeriod} 무료체험 후 $${currentPlan.price}${currentPlan.interval}`
                  }
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2 text-sm text-slate-600 dark:text-slate-400">
                  <div className="flex items-center justify-between">
                    <span>Plan:</span>
                    <span className="font-semibold">{currentPlan.name} ({selectedPlan === 'monthly' ? 'Monthly' : selectedPlan === 'yearly' ? 'Yearly' : 'Mini'})</span>
                  </div>
                  {selectedPlan !== 'test' && (
                    <>
                      <div className="flex items-center justify-between">
                        <span>Free Trial:</span>
                        <span className="font-semibold text-green-600 dark:text-green-400">{trialPeriodEn}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span>After Trial:</span>
                        <span className="font-semibold">${currentPlan.price}{currentPlan.interval}</span>
                      </div>
                    </>
                  )}
                  <div className={`flex items-center justify-between${selectedPlan === 'test' ? '' : ' text-xs text-slate-500'}`}>
                    <span>{selectedPlan === 'test' ? 'Charge:' : 'Billing:'}</span>
                    <span className={selectedPlan === 'test' ? 'font-semibold text-green-600 dark:text-green-400' : ''}>{selectedPlan === 'test' ? `$${currentPlan.price}` : currentPlan.billingInterval}</span>
                  </div>
                </div>

                <Button
                  onClick={handleCheckout}
                  className="w-full bg-gradient-to-r from-emerald-500 to-blue-500 hover:from-emerald-600 hover:to-blue-600 text-white font-semibold py-6 text-lg"
                  disabled={isProcessing}
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
                      {selectedPlan === 'test' ? 'Complete Payment ($0.10)' : `Start ${trialDuration} Free Trial`}
                    </>
                  )}
                </Button>

                <p className="text-xs text-center text-slate-500">
                  {selectedPlan === 'test'
                    ? 'You will be charged $0.10 immediately for testing. Cancel anytime.'
                    : `You won't be charged for ${trialPeriodEn}. Cancel anytime during the trial.`
                  }
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
