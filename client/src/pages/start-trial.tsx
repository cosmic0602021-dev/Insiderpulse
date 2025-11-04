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
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
        <Card className="max-w-md w-full">
          <CardContent className="pt-6 text-center">
            <CheckCircle2 className="w-16 h-16 text-green-600 mx-auto mb-4" />
            <h2 className="text-2xl font-bold mb-2">{t('trial.success.title')}</h2>
            <p className="text-gray-600 mb-4">
              {t('trial.success.message')}
            </p>
            <p className="text-sm text-gray-500">{t('trial.success.redirecting')}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-12 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            {t('trial.heading')}
          </h1>
          <p className="text-xl text-gray-600">
            {t('trial.description')}
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Left: Benefits */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-yellow-500" />
                  {t('trial.benefits.title')}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-start gap-3">
                  <TrendingUp className="w-5 h-5 text-blue-600 mt-1 flex-shrink-0" />
                  <div>
                    <h3 className="font-semibold">{t('trial.benefits.realtime')}</h3>
                    <p className="text-sm text-gray-600">{t('trial.benefits.realtimeDesc')}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Brain className="w-5 h-5 text-purple-600 mt-1 flex-shrink-0" />
                  <div>
                    <h3 className="font-semibold">{t('trial.benefits.ai')}</h3>
                    <p className="text-sm text-gray-600">{t('trial.benefits.aiDesc')}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Bell className="w-5 h-5 text-red-600 mt-1 flex-shrink-0" />
                  <div>
                    <h3 className="font-semibold">{t('trial.benefits.alerts')}</h3>
                    <p className="text-sm text-gray-600">{t('trial.benefits.alertsDesc')}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Shield className="w-5 h-5 text-green-600 mt-1 flex-shrink-0" />
                  <div>
                    <h3 className="font-semibold">{t('trial.benefits.filter')}</h3>
                    <p className="text-sm text-gray-600">{t('trial.benefits.filterDesc')}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* User-requested messaging */}
            <Card className="border-2 border-green-500 bg-green-50">
              <CardHeader>
                <CardTitle className="text-green-900">{t('trial.terms.title')}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                  <p className="text-sm text-green-900 font-medium">{t('trial.terms.instant')}</p>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                  <p className="text-sm text-green-900 font-medium">{t('trial.terms.noBilling')}</p>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                  <p className="text-sm text-green-900 font-medium">{t('trial.terms.noChargeUntilEnd')}</p>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                  <p className="text-sm text-green-900 font-medium">
                    {t('trial.terms.cancel')}
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right: Payment Form */}
          <div>
            <Card>
              <CardHeader>
                <CardTitle>{t('trial.form.title')}</CardTitle>
                <CardDescription>
                  {t('trial.form.description')}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Plan Selection */}
                <div className="space-y-3">
                  <label className="text-sm font-medium text-gray-700">
                    {t('trial.form.selectPlan')}
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setPlanType('monthly')}
                      className={`p-4 border-2 rounded-lg text-left transition ${
                        planType === 'monthly'
                          ? 'border-blue-600 bg-blue-50'
                          : 'border-gray-300 hover:border-gray-400'
                      }`}
                    >
                      <div className="font-semibold">{t('trial.form.monthly')}</div>
                      <div className="text-2xl font-bold mt-1">$14</div>
                      <div className="text-sm text-gray-600">{t('trial.form.perMonth')}</div>
                    </button>
                    <button
                      type="button"
                      onClick={() => setPlanType('yearly')}
                      className={`p-4 border-2 rounded-lg text-left transition ${
                        planType === 'yearly'
                          ? 'border-blue-600 bg-blue-50'
                          : 'border-gray-300 hover:border-gray-400'
                      }`}
                    >
                      <div className="font-semibold">{t('trial.form.yearly')}</div>
                      <div className="text-2xl font-bold mt-1">$112</div>
                      <div className="text-sm text-gray-600">
                        {t('trial.form.perYear')} <span className="text-green-600 font-semibold">{t('trial.form.discount')}</span>
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
                <div className="text-xs text-gray-500 space-y-2 pt-4 border-t">
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
