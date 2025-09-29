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
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="max-w-2xl mx-auto text-center space-y-8">
        <div className="space-y-4">
          <div className="mx-auto w-16 h-16 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center">
            <CheckCircle className="w-8 h-8 text-green-600 dark:text-green-400" />
          </div>
          
          <h1 className="text-3xl font-bold" data-testid="text-success-title">
            Payment Successful!
          </h1>
          
          <p className="text-muted-foreground text-lg">
            Welcome to InsiderTrack Pro Premium. Your payment has been processed successfully.
          </p>
        </div>

        <Card className="text-left">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-primary" />
              Premium Features Unlocked
            </CardTitle>
            <CardDescription>
              You now have access to all premium insider trading analytics
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-3">
              <div className="flex items-center gap-3">
                <CheckCircle className="w-4 h-4 text-green-500" />
                <span className="text-sm">Real-time SEC filing alerts</span>
              </div>
              <div className="flex items-center gap-3">
                <CheckCircle className="w-4 h-4 text-green-500" />
                <span className="text-sm">AI-powered trade analysis</span>
              </div>
              <div className="flex items-center gap-3">
                <CheckCircle className="w-4 h-4 text-green-500" />
                <span className="text-sm">Advanced pattern detection</span>
              </div>
              <div className="flex items-center gap-3">
                <CheckCircle className="w-4 h-4 text-green-500" />
                <span className="text-sm">Insider credibility scoring</span>
              </div>
              <div className="flex items-center gap-3">
                <CheckCircle className="w-4 h-4 text-green-500" />
                <span className="text-sm">Priority email notifications</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-3">
          <Link href="/">
            <Button size="lg" className="w-full" data-testid="button-start-exploring">
              <TrendingUp className="w-4 h-4 mr-2" />
              Start Exploring Premium Features
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </Link>
          
          <p className="text-sm text-muted-foreground">
            Your premium access is now active. Start analyzing real insider trading data with enhanced AI insights.
          </p>
        </div>
      </div>
    </div>
  );
}