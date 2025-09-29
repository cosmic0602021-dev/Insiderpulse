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
  const [selectedPlan, setSelectedPlan] = useState<'basic' | 'pro'>('basic');

  const plans = {
    basic: {
      name: "Premium Basic",
      price: 29.99,
      description: "Enhanced insider trading insights",
      features: [
        "Real-time SEC filing alerts",
        "AI-powered trade analysis", 
        "Historical pattern detection",
        "Email notifications"
      ]
    },
    pro: {
      name: "Premium Pro",
      price: 49.99,
      description: "Complete insider trading intelligence",
      features: [
        "Everything in Basic",
        "Advanced pattern recognition",
        "Credibility scoring",
        "News correlation analysis",
        "Priority support"
      ]
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
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-4" data-testid="text-checkout-title">
            Upgrade to InsiderTrack Pro Premium
          </h1>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Get exclusive access to advanced insider trading analytics and real-time market intelligence
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-8 items-start">
          {/* Plan Selection */}
          <div className="space-y-4">
            <h2 className="text-xl font-semibold mb-4">Choose Your Plan</h2>
            
            {Object.entries(plans).map(([key, plan]) => (
              <Card 
                key={key}
                className={`cursor-pointer transition-all hover-elevate ${
                  selectedPlan === key ? 'ring-2 ring-primary' : ''
                }`}
                onClick={() => setSelectedPlan(key as 'basic' | 'pro')}
                data-testid={`card-plan-${key}`}
              >
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        {plan.name}
                        {key === 'pro' && (
                          <Badge variant="default">
                            <Zap className="w-3 h-3 mr-1" />
                            Most Popular
                          </Badge>
                        )}
                      </CardTitle>
                      <CardDescription>{plan.description}</CardDescription>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold">${plan.price}</div>
                      <div className="text-sm text-muted-foreground">one-time</div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {plan.features.map((feature, index) => (
                      <li key={index} className="flex items-center gap-2 text-sm">
                        <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            ))}

            <div className="mt-6 p-4 bg-muted rounded-lg">
              <div className="flex items-start gap-3">
                <TrendingUp className="w-5 h-5 text-primary mt-0.5" />
                <div>
                  <h3 className="font-semibold text-sm">Real Insider Trading Data</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    All data is sourced directly from SEC filings and verified market sources. 
                    No fake or simulated data - only real, actionable insider trading intelligence.
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