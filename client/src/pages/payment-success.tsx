import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle, ArrowRight, TrendingUp, Shield } from "lucide-react";
import { Link } from "wouter";

export default function PaymentSuccess() {
  const [paymentStatus, setPaymentStatus] = useState<'loading' | 'success' | 'error'>('loading');

  useEffect(() => {
    // Check URL parameters for payment confirmation
    const urlParams = new URLSearchParams(window.location.search);
    const paymentIntent = urlParams.get('payment_intent');
    const paymentIntentClientSecret = urlParams.get('payment_intent_client_secret');

    if (paymentIntent && paymentIntentClientSecret) {
      setPaymentStatus('success');
    } else {
      setPaymentStatus('error');
    }
  }, []);

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

  if (paymentStatus === 'error') {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md text-center">
          <CardHeader>
            <CardTitle className="text-destructive">Payment Error</CardTitle>
            <CardDescription>
              There was an issue processing your payment. Please try again.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/premium-checkout">
              <Button className="w-full">
                Try Again
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