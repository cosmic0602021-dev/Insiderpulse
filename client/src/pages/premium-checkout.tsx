import { useStripe, Elements, PaymentElement, useElements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import { useEffect, useState } from 'react';
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CreditCard, TrendingUp, Shield, Zap, CheckCircle } from "lucide-react";

// Load Stripe with public key from environment
if (!import.meta.env.VITE_STRIPE_PUBLIC_KEY) {
  throw new Error('Missing required Stripe key: VITE_STRIPE_PUBLIC_KEY');
}
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY);

const CheckoutForm = ({ amount, description }: { amount: number; description: string }) => {
  const stripe = useStripe();
  const elements = useElements();
  const { toast } = useToast();
  const [isProcessing, setIsProcessing] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setIsProcessing(true);

    try {
      const { error } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: `${window.location.origin}/payment-success`,
        },
      });

      if (error) {
        toast({
          title: "Payment Failed",
          description: error.message,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Payment Successful",
          description: "Welcome to InsiderTrack Pro Premium!",
        });
      }
    } catch (err: any) {
      toast({
        title: "Payment Error",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CreditCard className="h-5 w-5 text-primary" />
          Complete Your Purchase
        </CardTitle>
        <CardDescription>
          {description} - ${amount}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <PaymentElement />
          <Button 
            type="submit" 
            className="w-full" 
            disabled={!stripe || !elements || isProcessing}
            data-testid="button-complete-payment"
          >
            {isProcessing ? (
              <>
                <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2" />
                Processing...
              </>
            ) : (
              <>
                <Shield className="w-4 h-4 mr-2" />
                Pay ${amount} Securely
              </>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

export default function PremiumCheckout() {
  const [clientSecret, setClientSecret] = useState("");
  const [selectedPlan] = useState<'monthly'>('monthly');

  const plans = {
    monthly: {
      name: "Insider Pro",
      price: 29,
      interval: "/month",
      description: "Real-time insider trading data & AI analysis",
      features: [
        "✨ Real-time insider trade alerts (no 48h delay)",
        "🚀 AI-powered trade analysis & predictions",
        "📊 Advanced pattern detection & signals",
        "🎯 Executive trade tracking (CEO, CFO, etc.)",
        "⚡ Live data updates & push notifications",
        "📈 Historical insider performance analytics",
        "💎 Exclusive market intelligence reports"
      ],
      savings: "Save $120/year vs. competitors"
    }
  };

  const currentPlan = plans[selectedPlan];

  useEffect(() => {
    // Create PaymentIntent when plan changes
    if (selectedPlan) {
      apiRequest("POST", "/api/create-payment-intent", { 
        amount: currentPlan.price 
      })
        .then((res) => res.json())
        .then((data) => {
          setClientSecret(data.clientSecret);
        })
        .catch((error) => {
          console.error('Error creating payment intent:', error);
        });
    }
  }, [selectedPlan, currentPlan.price]);

  if (!clientSecret) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="text-center space-y-4">
          <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mx-auto" />
          <p className="text-muted-foreground">Setting up secure payment...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-4">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-8">
          <Badge className="mb-4 bg-amber-500 text-slate-900 font-bold">
            <Zap className="w-3 h-3 mr-1" />
            LIMITED TIME OFFER
          </Badge>
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
            <Card className="border-2 border-amber-500 bg-gradient-to-br from-slate-800 to-slate-900">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2 text-white text-2xl">
                      {currentPlan.name}
                      <Badge variant="default" className="bg-amber-500 text-slate-900">
                        <Zap className="w-3 h-3 mr-1" />
                        Most Popular
                      </Badge>
                    </CardTitle>
                    <CardDescription className="text-slate-300 text-base mt-2">
                      {currentPlan.description}
                    </CardDescription>
                  </div>
                </div>
                <div className="mt-4">
                  <div className="flex items-baseline gap-2">
                    <span className="text-5xl font-bold text-amber-500">${currentPlan.price}</span>
                    <span className="text-xl text-slate-400">{currentPlan.interval}</span>
                  </div>
                  <p className="text-sm text-green-400 mt-2 font-semibold">{currentPlan.savings}</p>
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

            <div className="mt-6 p-4 bg-slate-800 rounded-lg border border-slate-700">
              <div className="flex items-start gap-3">
                <Shield className="w-5 h-5 text-amber-500 mt-0.5 flex-shrink-0" />
                <div>
                  <h3 className="font-semibold text-sm text-white">Secure Payment</h3>
                  <p className="text-sm text-slate-300 mt-1">
                    All transactions are encrypted and processed securely through Stripe.
                    Cancel anytime with one click.
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

          {/* Payment Form */}
          <div className="flex justify-center">
            <Elements 
              stripe={stripePromise} 
              options={{ 
                clientSecret,
                appearance: {
                  theme: 'stripe',
                  variables: {
                    colorPrimary: 'hsl(var(--primary))',
                  }
                }
              }}
            >
              <CheckoutForm 
                amount={currentPlan.price} 
                description={currentPlan.name}
              />
            </Elements>
          </div>
        </div>
      </div>
    </div>
  );
}