import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle, ArrowRight, TrendingUp, Shield } from "lucide-react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/contexts/auth-context";
import { apiClient } from "@/lib/api";

export default function PaymentSuccess() {
  const [paymentStatus, setPaymentStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const { user, login, refreshUser } = useAuth();
  const [, setLocation] = useLocation();

  useEffect(() => {
    const refreshUserData = async () => {
      // Check URL parameters for payment confirmation
      const urlParams = new URLSearchParams(window.location.search);
      // For subscription checkout, Stripe returns session_id (not payment_intent)
      const sessionId = urlParams.get('session_id');

      // Redirect to home if no session_id (prevents direct URL access)
      if (!sessionId) {
        console.log('❌ No session_id found in URL - redirecting to home');
        setLocation('/');
        return;
      }

      console.log('✅ Subscription checkout successful, session:', sessionId);

      // Wait longer for webhook to process (Stripe webhooks can take a few seconds)
      // Increased from 3s to 5s to ensure webhook has time to complete
      await new Promise(resolve => setTimeout(resolve, 5000));

      // Refresh user data from server with retry logic
      try {
        const token = localStorage.getItem('authToken');
        if (!token) {
          console.log('❌ No auth token found - redirecting to login');
          setLocation('/login');
          return;
        }

        apiClient.setToken(token);

        // Retry logic: try up to 3 times to verify subscription was activated
        let retries = 0;
        const maxRetries = 3;
        let userUpdated = false;

        while (retries < maxRetries && !userUpdated) {
          console.log(`🔄 Attempt ${retries + 1}/${maxRetries} to verify user subscription status`);

          const response = await apiClient.verifyToken();
          if (response.success && response.user) {
            console.log('🔄 User data received:', {
              tier: response.user.subscriptionTier,
              status: response.user.subscriptionStatus
            });

            // Check if user is now premium
            if (response.user.subscriptionTier === 'insider_pro') {
              console.log('✅ User successfully upgraded to premium!');
              login(response.user, token);
              setPaymentStatus('success');
              userUpdated = true;
            } else {
              console.log(`⚠️ User still shows tier: ${response.user.subscriptionTier}, will retry...`);
              retries++;
              if (retries < maxRetries) {
                // Wait 2 more seconds before retrying
                await new Promise(resolve => setTimeout(resolve, 2000));
              }
            }
          } else {
            console.log('❌ Failed to verify user token');
            retries++;
            if (retries < maxRetries) {
              await new Promise(resolve => setTimeout(resolve, 2000));
            }
          }
        }

        if (!userUpdated) {
          console.log('❌ User subscription status did not update after retries');
          setPaymentStatus('error');
        }
      } catch (error) {
        console.error('Failed to refresh user data:', error);
        setPaymentStatus('error');
      }
    };

    refreshUserData();
  }, [login, setLocation]);

  if (paymentStatus === 'loading') {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="text-center space-y-4">
          <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mx-auto" />
          <p className="text-muted-foreground">Confirming your payment...</p>
        </div>
      </div>
    );
  }

  const handleManualRefresh = async () => {
    setIsRefreshing(true);
    console.log('🔄 User manually triggered refresh...');
    const success = await refreshUser();

    if (success && user && user.subscriptionTier === 'insider_pro') {
      console.log('✅ Manual refresh successful, subscription activated!');
      setPaymentStatus('success');
    } else {
      console.log('❌ Manual refresh failed or subscription not active yet');
      alert('Subscription not activated yet. Please wait a moment and try again, or contact support.');
    }
    setIsRefreshing(false);
  };

  if (paymentStatus === 'error') {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md text-center">
          <CardHeader>
            <CardTitle className="text-destructive">Subscription Activation Delayed</CardTitle>
            <CardDescription>
              Your payment was successful, but we're still activating your subscription. This can take a few moments.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button
              className="w-full"
              onClick={handleManualRefresh}
              disabled={isRefreshing}
            >
              {isRefreshing ? 'Checking...' : 'Check Subscription Status'}
            </Button>
            <p className="text-sm text-muted-foreground">
              If the issue persists, please contact support with your payment confirmation.
            </p>
            <Link href="/premium-checkout">
              <Button variant="outline" className="w-full">
                Return to Checkout
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-900 via-slate-900 to-slate-800 flex items-center justify-center p-4">
      <div className="max-w-2xl mx-auto text-center space-y-8">
        <div className="space-y-4">
          <div className="mx-auto w-20 h-20 bg-green-500 rounded-full flex items-center justify-center animate-pulse">
            <CheckCircle className="w-12 h-12 text-white" />
          </div>

          <h1 className="text-4xl font-bold text-white" data-testid="text-success-title">
            🎉 Welcome to Insider Pro!
          </h1>

          <p className="text-green-300 text-xl">
            Your subscription is now active. Start tracking insider trades in real-time!
          </p>
        </div>

        <Card className="text-left bg-slate-800 border-green-500 border-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-white text-2xl">
              <Shield className="h-6 w-6 text-green-400" />
              All Premium Features Unlocked
            </CardTitle>
            <CardDescription className="text-slate-300">
              You now have full access to real-time insider trading intelligence
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-3">
              <div className="flex items-center gap-3">
                <CheckCircle className="w-5 h-5 text-green-400" />
                <span className="text-sm text-slate-200">✨ Real-time insider trade alerts (no 48h delay)</span>
              </div>
              <div className="flex items-center gap-3">
                <CheckCircle className="w-5 h-5 text-green-400" />
                <span className="text-sm text-slate-200">🚀 AI-powered trade analysis & predictions</span>
              </div>
              <div className="flex items-center gap-3">
                <CheckCircle className="w-5 h-5 text-green-400" />
                <span className="text-sm text-slate-200">📊 Advanced pattern detection & signals</span>
              </div>
              <div className="flex items-center gap-3">
                <CheckCircle className="w-5 h-5 text-green-400" />
                <span className="text-sm text-slate-200">🎯 Executive trade tracking (CEO, CFO, etc.)</span>
              </div>
              <div className="flex items-center gap-3">
                <CheckCircle className="w-5 h-5 text-green-400" />
                <span className="text-sm text-slate-200">⚡ Live data updates & push notifications</span>
              </div>
              <div className="flex items-center gap-3">
                <CheckCircle className="w-5 h-5 text-green-400" />
                <span className="text-sm text-slate-200">📈 Historical insider performance analytics</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-3">
          <Link href="/">
            <Button size="lg" className="w-full bg-green-500 hover:bg-green-600 text-white" data-testid="button-start-exploring">
              <TrendingUp className="w-5 h-5 mr-2" />
              Start Tracking Insider Trades
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
          </Link>

          <p className="text-sm text-slate-300">
            🎯 Your Insider Pro subscription is active. Cancel anytime from your account settings.
          </p>
        </div>
      </div>
    </div>
  );
}