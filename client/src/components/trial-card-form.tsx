import { useState } from 'react';
import { CardElement, useElements, useStripe } from '@stripe/react-stripe-js';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2 } from 'lucide-react';
import { apiClient } from '@/lib/api';
import { useLanguage } from '@/contexts/language-context';

interface TrialCardFormProps {
  planType: 'monthly' | 'yearly' | 'test';
  onSuccess: () => void;
  onError: (error: string) => void;
  isLoading: boolean;
  onSubmit: () => Promise<void>;
  clientSecret: string;
}

/**
 * Card input form using Stripe Elements
 */
export function TrialCardForm({
  planType,
  onSuccess,
  onError,
  isLoading: externalLoading,
  onSubmit,
  clientSecret,
}: TrialCardFormProps) {
  const stripe = useStripe();
  const elements = useElements();
  const { t } = useLanguage();
  const [cardComplete, setCardComplete] = useState(false);
  const [cardError, setCardError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isLoading = externalLoading || isSubmitting;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) {
      onError(t('trial.errors.stripeNotLoaded'));
      return;
    }

    if (!cardComplete) {
      onError(t('trial.errors.enterCard'));
      return;
    }

    const cardElement = elements.getElement(CardElement);
    if (!cardElement) {
      onError(t('trial.errors.cardNotFound'));
      return;
    }

    setIsSubmitting(true);

    try {
      // Confirm card setup with Stripe
      const { setupIntent, error: stripeError } = await stripe.confirmCardSetup(
        clientSecret,
        {
          payment_method: {
            card: cardElement,
          },
        }
      );

      if (stripeError) {
        onError(stripeError.message || t('trial.errors.cardVerificationFailed'));
        setIsSubmitting(false);
        return;
      }

      if (!setupIntent || !setupIntent.payment_method) {
        onError(t('trial.errors.paymentSaveFailed'));
        setIsSubmitting(false);
        return;
      }

      console.log('✅ Card setup confirmed:', setupIntent.id);

      // Activate trial with the saved payment method
      const response = await apiClient.activateTrialWithCard(
        setupIntent.payment_method as string,
        planType
      );

      if (!response.success) {
        onError(response.message || response.error || t('trial.errors.activationFailed'));
        setIsSubmitting(false);
        return;
      }

      console.log('✅ Trial activated:', response);
      setIsSubmitting(false);
      onSuccess();
    } catch (error) {
      console.error('Trial activation failed:', error);
      onError(error instanceof Error ? error.message : t('trial.errors.unknown'));
      setIsSubmitting(false);
    }
  };

  const cardElementOptions = {
    style: {
      base: {
        fontSize: '16px',
        color: '#E4E5E8',
        backgroundColor: 'transparent',
        fontFamily: '"Plus Jakarta Sans", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        fontSmoothing: 'antialiased',
        fontWeight: '400',
        letterSpacing: '-0.01em',
        '::placeholder': {
          color: '#6B7280',
        },
        ':-webkit-autofill': {
          color: '#E4E5E8',
          backgroundColor: 'transparent',
        },
      },
      invalid: {
        color: '#EF5B6B',
        iconColor: '#EF5B6B',
      },
      complete: {
        color: '#1FB57A',
        iconColor: '#1FB57A',
      },
    },
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Card Input */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-foreground">
          {t('trial.form.cardInfo')}
        </label>
        <div className="group p-4 border border-card-border rounded-lg bg-card/50 backdrop-blur-sm
                      transition-all duration-200
                      focus-within:border-emerald-500/50
                      focus-within:ring-2
                      focus-within:ring-emerald-500/20
                      focus-within:shadow-lg
                      focus-within:shadow-emerald-500/10">
          <CardElement
            options={cardElementOptions}
            onChange={(e) => {
              setCardComplete(e.complete);
              setCardError(e.error?.message || null);
            }}
          />
        </div>
        {cardError && (
          <p className="text-sm text-red-400">{cardError}</p>
        )}
      </div>

      {/* Security Badge */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <svg
          className="w-5 h-5 text-emerald-400"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
          />
        </svg>
        <span>{t('trial.form.securePayment')}</span>
      </div>

      {/* Submit Button */}
      <Button
        type="submit"
        className="w-full h-12 text-lg font-semibold bg-gradient-to-r from-emerald-500 to-blue-500 hover:from-emerald-600 hover:to-blue-600 shadow-lg shadow-emerald-500/20 transition-all duration-200"
        disabled={!stripe || !cardComplete || isLoading}
      >
        {isLoading ? (
          <>
            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
            {t('trial.form.processing')}
          </>
        ) : (
          t('trial.form.startTrial')
        )}
      </Button>

      {/* Plan Info */}
      <p className="text-center text-sm text-muted-foreground/70">
        {planType === 'monthly' ? t('trial.form.afterTrialMonthly') : t('trial.form.afterTrialYearly')}
      </p>
    </form>
  );
}
