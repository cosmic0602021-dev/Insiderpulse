import { useState } from 'react';
import { CardElement, useElements, useStripe } from '@stripe/react-stripe-js';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2 } from 'lucide-react';

interface TrialCardFormProps {
  planType: 'monthly' | 'yearly';
  onSuccess: () => void;
  onError: (error: string) => void;
  isLoading: boolean;
  onSubmit: () => Promise<void>;
}

/**
 * Card input form using Stripe Elements
 */
export function TrialCardForm({
  planType,
  onSuccess,
  onError,
  isLoading,
  onSubmit,
}: TrialCardFormProps) {
  const stripe = useStripe();
  const elements = useElements();
  const [cardComplete, setCardComplete] = useState(false);
  const [cardError, setCardError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) {
      onError('Stripe가 로드되지 않았습니다');
      return;
    }

    if (!cardComplete) {
      onError('카드 정보를 입력해주세요');
      return;
    }

    // Call parent onSubmit handler
    await onSubmit();
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
          카드 정보
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
        <span>안전한 결제 · Stripe 보안 처리</span>
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
            처리 중...
          </>
        ) : (
          '무료 체험 시작하기'
        )}
      </Button>

      {/* Plan Info */}
      <p className="text-center text-sm text-muted-foreground/70">
        7일 후 자동 결제: {planType === 'monthly' ? '월 $14' : '연 $112'}
      </p>
    </form>
  );
}
