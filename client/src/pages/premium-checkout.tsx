import { useState } from 'react';
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
      billingInterval: "1분 무료체험 후 자동 청구",
      description: "Test our service with a mini plan",
      features: [
        "1분 무료 체험",
        "모든 Pro 기능 이용 가능",
        "체험 후 자동 청구 $0.10",
        "언제든지 취소 가능"
      ],
      savings: null,
      discount: "💎 MINI"
    }
  };

  const currentPlan = plans[selectedPlan];

  // Trial period display text based on plan
  const trialPeriod = selectedPlan === 'test' ? '1분' : '7일';
  const trialPeriodEn = selectedPlan === 'test' ? '1 minute' : '7 days';
  const trialDuration = selectedPlan === 'test' ? '1-Minute' : '7-Day';

  const handleCheckout = async () => {
    // Double-check authentication before proceeding
    if (!user) {
      toast({
        title: "로그인 필요",
        description: "구독하려면 먼저 로그인해주세요.",
        variant: "destructive",
      });
      setLocation('/login?redirect=/premium-checkout');
      return;
    }

    setIsProcessing(true);

    try {
      const response = await apiRequest("POST", "/api/create-subscription", {
        priceId: currentPlan.priceId,
      });

      const data = await response.json();

      if (data.url) {
        // Redirect to Stripe Checkout
        window.location.href = data.url;
      } else {
        throw new Error('No checkout URL received');
      }
    } catch (error: any) {
      console.error('Error creating checkout session:', error);
      toast({
        title: "결제 오류",
        description: error.message || "결제 세션을 생성할 수 없습니다. 다시 시도해주세요.",
        variant: "destructive",
      });
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

  // Check if user should see trial page instead
  const shouldStartTrial = user && !user.hasUsedTrial && user.subscriptionStatus !== 'active' && user.subscriptionStatus !== 'trialing';

  if (shouldStartTrial) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-4">
        <div className="max-w-2xl mx-auto mt-20">
          <Card className="border-2 border-amber-500 bg-gradient-to-br from-slate-800 to-slate-900">
            <CardHeader className="text-center pb-4">
              <Badge className="mb-4 bg-amber-500 text-slate-900 font-bold mx-auto w-fit">
                <Zap className="w-4 h-4 mr-1" />
                7일 무료 체험
              </Badge>
              <CardTitle className="text-3xl text-white mb-2">
                먼저 무료 체험을 시작하세요!
              </CardTitle>
              <CardDescription className="text-slate-300 text-lg">
                Pro 기능을 7일간 무료로 체험하실 수 있습니다
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4 p-6 bg-slate-900/50 rounded-lg">
                <div className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-emerald-500 mt-1 flex-shrink-0" />
                  <div>
                    <p className="text-white font-medium">Pro 즉시 이용 가능</p>
                    <p className="text-sm text-slate-400">가입 즉시 모든 Pro 기능을 사용할 수 있습니다</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-emerald-500 mt-1 flex-shrink-0" />
                  <div>
                    <p className="text-white font-medium">오늘 청구 없음</p>
                    <p className="text-sm text-slate-400">지금은 카드 등록만, 결제는 7일 후</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-emerald-500 mt-1 flex-shrink-0" />
                  <div>
                    <p className="text-white font-medium">언제든지 취소 가능</p>
                    <p className="text-sm text-slate-400">취소 시 즉시 구독이 종료됩니다</p>
                  </div>
                </div>
              </div>

              <Button
                onClick={() => setLocation('/start-trial')}
                className="w-full h-14 text-lg font-semibold bg-gradient-to-r from-emerald-500 to-blue-500 hover:from-emerald-600 hover:to-blue-600"
              >
                7일 무료 체험 시작하기
              </Button>

              <p className="text-center text-sm text-slate-400">
                무료 체험 후 월 $14 또는 연 $112 (33% 할인)
              </p>
            </CardContent>
          </Card>
        </div>
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
                  <h3 className="font-semibold text-sm text-white">{trialPeriod} 무료체험</h3>
                  <p className="text-sm text-slate-300 mt-1">
                    오늘부터 {trialPeriod}간 무료로 모든 기능을 사용해보세요. 무료체험 기간이 끝나면 자동으로 {currentPlan.billingInterval}가 시작됩니다. 언제든지 해지 가능합니다.
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
                  Start Your Free Trial
                </CardTitle>
                <CardDescription>
                  {trialPeriod} 무료체험 후 ${currentPlan.price}{currentPlan.interval}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2 text-sm text-slate-600 dark:text-slate-400">
                  <div className="flex items-center justify-between">
                    <span>Plan:</span>
                    <span className="font-semibold">{currentPlan.name} ({selectedPlan === 'monthly' ? 'Monthly' : selectedPlan === 'yearly' ? 'Yearly' : 'Mini'})</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Free Trial:</span>
                    <span className="font-semibold text-green-600 dark:text-green-400">{trialPeriodEn}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>After Trial:</span>
                    <span className="font-semibold">${currentPlan.price}{currentPlan.interval}</span>
                  </div>
                  <div className="flex items-center justify-between text-xs text-slate-500">
                    <span>Billing:</span>
                    <span>{currentPlan.billingInterval}</span>
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
                      Start {trialDuration} Free Trial
                    </>
                  )}
                </Button>

                <p className="text-xs text-center text-slate-500">
                  You won't be charged for {trialPeriodEn}. Cancel anytime during the trial.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
