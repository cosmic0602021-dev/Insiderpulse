import { useState, useRef, useEffect } from 'react';
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { X, ShieldCheck, Check, Zap, Lock, CreditCard, TrendingUp, Loader2 } from "lucide-react";
import { useAuth } from "@/contexts/auth-context";
import { useLocation } from 'wouter';
import { useLanguage } from "@/contexts/language-context";
import { TRANSLATIONS } from '@/lib/translations';

export default function PremiumCheckout() {
  const [selectedPlan, setSelectedPlan] = useState<'monthly' | 'yearly'>('monthly');
  const [isProcessing, setIsProcessing] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(true);
  const isSubmittingRef = useRef(false);
  const { toast } = useToast();
  const { user, isLoading: authLoading } = useAuth();
  const [, setLocation] = useLocation();
  const { language } = useLanguage();

  const langKey = language.toLowerCase() as 'en' | 'ko' | 'ja' | 'zh';
  const t = TRANSLATIONS[langKey].upgrade;
  const common = TRANSLATIONS[langKey].common;

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

  // Plan pricing
  const plans = {
    monthly: {
      price: 14,
      priceId: import.meta.env.VITE_STRIPE_PRICE_ID_MONTHLY || 'price_1SPBb1Q9br8aQ595KTOAcBfO',
      trialDays: 3,
    },
    yearly: {
      price: 112,
      priceId: import.meta.env.VITE_STRIPE_PRICE_ID_YEARLY || 'price_1SPBdLQ9br8aQ595n0dKEOLv',
      trialDays: 7,
    },
  };

  const currentPlan = plans[selectedPlan];
  const hasUsedTrial = user?.hasUsedTrial || false;
  const showTrialInfo = !hasUsedTrial;

  const handleCheckout = async () => {
    if (showTrialInfo && !agreedToTerms) {
      toast({
        title: "약관 동의 필요",
        description: "자동결제 및 환불 정책에 동의해주세요.",
        variant: "destructive",
      });
      return;
    }

    if (isSubmittingRef.current) {
      return;
    }

    if (!user) {
      toast({
        title: "로그인 필요",
        description: "구독하려면 먼저 로그인해주세요.",
        variant: "destructive",
      });
      setLocation('/login?redirect=/premium-checkout');
      return;
    }

    const token = localStorage.getItem('authToken');
    if (!token) {
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

    try {
      const response = await apiRequest("POST", "/api/create-subscription", {
        priceId: currentPlan.priceId,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `서버 오류: ${response.status}`);
      }

      const data = await response.json();

      if (data.url) {
        window.location.href = data.url;
      } else {
        throw new Error('No checkout URL received');
      }
    } catch (error: any) {
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
      <div className="min-h-screen bg-[#030303] flex items-center justify-center p-4">
        <div className="bg-[#080808] border border-neutral-800 p-8 max-w-md w-full text-center">
          <ShieldCheck size={48} className="text-neutral-600 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-white mb-2">로그인 필요</h2>
          <p className="text-neutral-500 text-sm mb-6">구독하려면 먼저 로그인해주세요</p>
          <button
            onClick={() => setLocation('/login?redirect=/premium-checkout')}
            className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-black font-bold uppercase tracking-widest text-xs transition-all"
          >
            로그인 페이지로 이동
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[60] overflow-y-auto bg-black/95 backdrop-blur-sm">
      <div className="flex min-h-screen items-center justify-center p-4 md:p-6 py-10">
        {/* Modal Container */}
        <div className="relative w-full max-w-4xl bg-[#080808] border border-neutral-800 shadow-[0_0_50px_rgba(0,0,0,0.9)] flex flex-col overflow-hidden rounded-sm my-auto">

          {/* Close Button */}
          <button
            onClick={() => setLocation('/trades')}
            className="absolute top-4 right-4 text-neutral-500 hover:text-white transition-colors z-30 p-2 bg-black/50 rounded-full"
          >
            <X size={20} />
          </button>

          {/* Header Section */}
          <div className="p-8 border-b border-neutral-900 text-center bg-[#0a0a0a]">
            <div className="flex justify-center mb-4">
              <div className="w-12 h-12 bg-neutral-900 rounded-full flex items-center justify-center border border-neutral-800 relative">
                <div className="absolute inset-0 rounded-full border border-emerald-900 animate-ping opacity-20"></div>
                <ShieldCheck size={24} className="text-emerald-500" />
              </div>
            </div>
            <h2 className="text-3xl md:text-4xl font-bold text-white tracking-tight uppercase mb-2">
              {t.header}
            </h2>
            <p className="text-sm text-neutral-500 font-mono">
              {t.subHeader}
            </p>
          </div>

          {/* Billing Toggle */}
          <div className="flex justify-center py-6 bg-[#080808]">
            <div className="bg-neutral-900 p-1 flex border border-neutral-800 relative">
              <button
                onClick={() => setSelectedPlan('monthly')}
                className={`px-8 py-2.5 text-xs font-bold uppercase tracking-wider transition-all ${selectedPlan === 'monthly' ? 'bg-neutral-700 text-white' : 'text-neutral-500 hover:text-neutral-300'}`}
              >
                {t.monthly}
              </button>
              <button
                onClick={() => setSelectedPlan('yearly')}
                className={`px-8 py-2.5 text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-2 ${selectedPlan === 'yearly' ? 'bg-emerald-900 text-emerald-100' : 'text-neutral-500 hover:text-neutral-300'}`}
              >
                {t.yearly}
                <span className="text-[9px] bg-emerald-500 text-black px-1.5 py-0.5 font-bold uppercase">{t.save}</span>
              </button>
            </div>
          </div>

          <div className="flex flex-col md:flex-row border-t border-neutral-900">

            {/* Left Column: The Offering */}
            <div className="w-full md:w-1/2 p-8 border-r-0 md:border-r border-b md:border-b-0 border-neutral-900 bg-[#080808]">
              <div className="mb-8">
                <div className="text-xs text-neutral-500 uppercase tracking-wider mb-2 font-bold flex items-center gap-2">
                  <Zap size={12} className="text-emerald-500" />
                  {common.tierPro} {t.secData}
                </div>
                <div className="flex items-end gap-2">
                  <span className="text-5xl font-black tracking-tighter text-emerald-500">
                    {selectedPlan === 'monthly' ? t.priceMonthly : t.priceYearly}
                  </span>
                  <span className="text-neutral-500 text-sm font-mono mb-1">
                    {selectedPlan === 'monthly' ? t.periodMonthly : t.periodYearly}
                  </span>
                </div>
                {selectedPlan === 'yearly' && (
                  <div className="text-[10px] text-neutral-500 mt-2 font-mono border-l-2 border-neutral-800 pl-2">
                    ≈ $9/month (Save $56 annually)
                  </div>
                )}
              </div>

              <div className="space-y-4">
                {t.features.map((feat: string, i: number) => (
                  <div key={i} className="flex items-start gap-3 text-sm text-neutral-300 group">
                    <div className="mt-0.5 w-4 h-4 rounded-full bg-neutral-900 border border-neutral-800 flex items-center justify-center group-hover:border-emerald-800 transition-colors">
                      <Check size={10} className="text-emerald-500" />
                    </div>
                    <span className="text-neutral-400 group-hover:text-neutral-200 transition-colors text-xs leading-relaxed">{feat}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Right Column: The Checkout Summary */}
            <div className="w-full md:w-1/2 p-8 bg-[#050505] flex flex-col">
              <div className="flex items-center gap-2 mb-6">
                <CreditCard size={16} className="text-neutral-500" />
                <span className="text-sm font-bold text-neutral-300 uppercase tracking-wide">
                  {showTrialInfo ? t.trial : '즉시 결제'}
                </span>
              </div>

              <div className="bg-neutral-900/30 border border-neutral-800 p-6 rounded-sm mb-6 space-y-3">
                <div className="flex justify-between text-xs">
                  <span className="text-neutral-500">{t.secData}</span>
                  <span className="text-white font-bold">{common.tierPro} ({selectedPlan === 'monthly' ? t.monthly : t.yearly})</span>
                </div>
                {showTrialInfo ? (
                  <>
                    <div className="flex justify-between text-xs">
                      <span className="text-neutral-500">Free Trial</span>
                      <span className="text-emerald-500 font-bold">{selectedPlan === 'monthly' ? t.trial3Badge : t.trial7Badge}</span>
                    </div>
                    <div className="h-[1px] bg-neutral-800 my-2"></div>
                    <div className="flex justify-between text-xs">
                      <span className="text-neutral-500">After Trial</span>
                      <span className="text-white font-mono">{selectedPlan === 'monthly' ? t.afterTrial3 : t.afterTrial7}</span>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="h-[1px] bg-neutral-800 my-2"></div>
                    <div className="flex justify-between text-xs">
                      <span className="text-neutral-500">결제 금액</span>
                      <span className="text-white font-mono">${currentPlan.price}{selectedPlan === 'monthly' ? '/월' : '/년'}</span>
                    </div>
                    <div className="text-[10px] text-amber-500 mt-2">
                      * 무료체험 이미 사용됨 - 즉시 결제가 시작됩니다
                    </div>
                  </>
                )}
              </div>

              {showTrialInfo && (
                <div className="flex items-start gap-3 mb-6 p-3 bg-neutral-900/20 border border-neutral-900 rounded">
                  <div className="mt-0.5">
                    <input
                      type="checkbox"
                      checked={agreedToTerms}
                      onChange={(e) => setAgreedToTerms(e.target.checked)}
                      className="accent-emerald-600 bg-neutral-900 border-neutral-700"
                    />
                  </div>
                  <p className="text-[10px] text-neutral-500 leading-relaxed">
                    {t.terms}
                  </p>
                </div>
              )}

              <button
                onClick={handleCheckout}
                disabled={isProcessing || (showTrialInfo && !agreedToTerms)}
                className="w-full py-4 bg-emerald-600 hover:bg-emerald-500 disabled:bg-neutral-800 disabled:text-neutral-600 text-black font-bold uppercase tracking-widest text-xs transition-all shadow-[0_0_20px_rgba(16,185,129,0.2)] hover:shadow-[0_0_30px_rgba(16,185,129,0.4)] disabled:shadow-none flex items-center justify-center gap-2 mt-auto"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Processing...
                  </>
                ) : (
                  showTrialInfo
                    ? (selectedPlan === 'monthly' ? t.trial3 : t.trial7)
                    : '지금 구독하기'
                )}
              </button>

              <div className="mt-4 flex items-center justify-center gap-2 text-[10px] text-neutral-600">
                <Lock size={10} />
                {t.secure}
              </div>
            </div>
          </div>

          {/* Footer Strip */}
          <div className="bg-[#050505] border-t border-neutral-900 p-3 flex justify-center md:justify-between items-center text-[9px] text-neutral-600 uppercase tracking-wider px-8">
            <div className="flex items-center gap-2">
              <TrendingUp size={10} />
              {t.secDesc}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
