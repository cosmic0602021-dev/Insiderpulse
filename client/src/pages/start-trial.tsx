import { useEffect, useState } from 'react';
import { useLocation } from 'wouter';
import { Elements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle2, Sparkles, TrendingUp, Bell, Brain, Shield } from 'lucide-react';
import { TrialCardForm } from '@/components/trial-card-form';
import { useTrialSetup } from '@/hooks/use-trial-setup';
import { useAuth } from '@/contexts/auth-context';
import { useLanguage } from '@/contexts/language-context';

// Initialize Stripe
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY!);

export default function StartTrialPage() {
  const [, navigate] = useLocation();
  const { user } = useAuth();
  const { t } = useLanguage();
  const [planType, setPlanType] = useState<'monthly' | 'yearly'>('monthly');
  const { createSetupIntent, confirmCardSetup, isLoading, error, isSuccess, clientSecret } = useTrialSetup();

  useEffect(() => {
    // Redirect if not logged in
    if (!user) {
      navigate('/login?redirect=/start-trial');
      return;
    }

    // Redirect if already has trial or subscription
    if (user.hasUsedTrial || user.subscriptionStatus === 'active' || user.subscriptionStatus === 'trialing') {
      navigate('/live-trading');
      return;
    }

    // Create SetupIntent on mount
    createSetupIntent();
  }, [user]);

  useEffect(() => {
    // Redirect to live trading on success
    if (isSuccess) {
      // Reload the page to refresh auth state from server
      setTimeout(() => {
        window.location.href = '/live-trading';
      }, 2000);
    }
  }, [isSuccess]);

  const handleSubmit = async () => {
    await confirmCardSetup(planType);
  };

  if (isSuccess) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-4">
        <Card className="max-w-md w-full border-emerald-500/30 bg-gradient-to-br from-card to-slate-900/50 backdrop-blur-sm shadow-2xl shadow-emerald-500/10">
          <CardContent className="pt-6 text-center">
            <div className="relative">
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-20 h-20 bg-emerald-500/20 rounded-full blur-xl"></div>
              </div>
              <CheckCircle2 className="relative w-16 h-16 text-emerald-500 mx-auto mb-4" />
            </div>
            <h2 className="text-2xl font-bold mb-2 text-foreground">{t('trial.success.title')}</h2>
            <p className="text-muted-foreground mb-4">
              {t('trial.success.message')}
            </p>
            <p className="text-sm text-muted-foreground/70">{t('trial.success.redirecting')}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 py-12 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-4 bg-gradient-to-r from-white via-emerald-100 to-blue-100 bg-clip-text text-transparent">
            {t('trial.heading')}
          </h1>
          <p className="text-xl text-muted-foreground">
            {t('trial.description')}
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Left: Benefits */}
          <div className="space-y-6">
            <Card className="border-card-border bg-gradient-to-br from-card to-slate-900/50 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-foreground">
                  <Sparkles className="w-5 h-5 text-amber-400" />
                  {t('trial.benefits.title')}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-lg bg-blue-500/10 border border-blue-500/20">
                    <TrendingUp className="w-5 h-5 text-blue-400 flex-shrink-0" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground">{t('trial.benefits.realtime')}</h3>
                    <p className="text-sm text-muted-foreground">{t('trial.benefits.realtimeDesc')}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-lg bg-purple-500/10 border border-purple-500/20">
                    <Brain className="w-5 h-5 text-purple-400 flex-shrink-0" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground">{t('trial.benefits.ai')}</h3>
                    <p className="text-sm text-muted-foreground">{t('trial.benefits.aiDesc')}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-lg bg-red-500/10 border border-red-500/20">
                    <Bell className="w-5 h-5 text-red-400 flex-shrink-0" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground">{t('trial.benefits.alerts')}</h3>
                    <p className="text-sm text-muted-foreground">{t('trial.benefits.alertsDesc')}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                    <Shield className="w-5 h-5 text-emerald-400 flex-shrink-0" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground">{t('trial.benefits.filter')}</h3>
                    <p className="text-sm text-muted-foreground">{t('trial.benefits.filterDesc')}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* User-requested messaging */}
            <Card className="border border-emerald-500/30 bg-emerald-500/5 backdrop-blur-sm shadow-lg shadow-emerald-500/10">
              <CardHeader>
                <CardTitle className="text-emerald-400">{t('trial.terms.title')}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="w-5 h-5 text-emerald-400 mt-0.5 flex-shrink-0" />
                  <p className="text-sm text-foreground font-medium">{t('trial.terms.instant')}</p>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="w-5 h-5 text-emerald-400 mt-0.5 flex-shrink-0" />
                  <p className="text-sm text-foreground font-medium">{t('trial.terms.noBilling')}</p>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="w-5 h-5 text-emerald-400 mt-0.5 flex-shrink-0" />
                  <p className="text-sm text-foreground font-medium">{t('trial.terms.noChargeUntilEnd')}</p>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="w-5 h-5 text-emerald-400 mt-0.5 flex-shrink-0" />
                  <p className="text-sm text-foreground font-medium">
                    {t('trial.terms.cancel')}
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right: Payment Form */}
          <div>
            <Card className="border-card-border bg-gradient-to-br from-card to-slate-900/50 shadow-lg">
              <CardHeader>
                <CardTitle className="text-foreground">{t('trial.form.title')}</CardTitle>
                <CardDescription className="text-muted-foreground">
                  {t('trial.form.description')}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Plan Selection */}
                <div className="space-y-3">
                  <label className="text-sm font-medium text-foreground">
                    {t('trial.form.selectPlan')}
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setPlanType('monthly')}
                      className={`p-4 rounded-lg text-left transition-all duration-200 ${
                        planType === 'monthly'
                          ? 'bg-gradient-to-br from-emerald-500 to-blue-500 shadow-lg shadow-emerald-500/20 border border-emerald-400/50'
                          : 'bg-slate-800/50 border border-card-border hover:border-emerald-500/30 hover:bg-slate-800/70'
                      }`}
                    >
                      <div className="font-semibold text-white">{t('trial.form.monthly')}</div>
                      <div className="text-2xl font-bold mt-1 text-white">$14</div>
                      <div className="text-sm text-white/80">{t('trial.form.perMonth')}</div>
                    </button>
                    <button
                      type="button"
                      onClick={() => setPlanType('yearly')}
                      className={`p-4 rounded-lg text-left transition-all duration-200 relative ${
                        planType === 'yearly'
                          ? 'bg-gradient-to-br from-emerald-500 to-blue-500 shadow-lg shadow-emerald-500/20 border border-emerald-400/50'
                          : 'bg-slate-800/50 border border-card-border hover:border-emerald-500/30 hover:bg-slate-800/70'
                      }`}
                    >
                      <div className="font-semibold text-white">{t('trial.form.yearly')}</div>
                      <div className="text-2xl font-bold mt-1 text-white">$112</div>
                      <div className="text-sm text-white/80">
                        {t('trial.form.perYear')} <span className="text-amber-300 font-semibold">{t('trial.form.discount')}</span>
                      </div>
                    </button>
                  </div>
                </div>

                {/* Stripe Elements Form */}
                {clientSecret && (
                  <Elements stripe={stripePromise}>
                    <TrialCardForm
                      planType={planType}
                      onSuccess={() => {}}
                      onError={() => {}}
                      isLoading={isLoading}
                      onSubmit={handleSubmit}
                    />
                  </Elements>
                )}

                {error && (
                  <Alert variant="destructive">
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

                {/* Additional Info */}
                <div className="text-xs text-muted-foreground/70 space-y-2 pt-4 border-t border-card-border">
                  <p>
                    {t('trial.form.info1')}
                  </p>
                  <p>
                    {t('trial.form.info2')}
                  </p>
                  <p>
                    {t('trial.form.info3')}
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
