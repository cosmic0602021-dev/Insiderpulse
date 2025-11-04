import { useState, useCallback } from 'react';
import { loadStripe, Stripe } from '@stripe/stripe-js';
import { apiClient } from '@/lib/api';

// Initialize Stripe
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY!);

export interface TrialSetupState {
  isLoading: boolean;
  error: string | null;
  clientSecret: string | null;
  customerId: string | null;
  isSuccess: boolean;
}

export interface UseTrialSetupReturn extends TrialSetupState {
  createSetupIntent: () => Promise<void>;
  confirmCardSetup: (planType: 'monthly' | 'yearly' | 'test') => Promise<void>;
  reset: () => void;
}

/**
 * Custom hook for handling trial signup with card collection
 */
export function useTrialSetup(): UseTrialSetupReturn {
  const [state, setState] = useState<TrialSetupState>({
    isLoading: false,
    error: null,
    clientSecret: null,
    customerId: null,
    isSuccess: false,
  });

  const reset = useCallback(() => {
    setState({
      isLoading: false,
      error: null,
      clientSecret: null,
      customerId: null,
      isSuccess: false,
    });
  }, []);

  const createSetupIntent = useCallback(async () => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      const response = await apiClient.createTrialSetupIntent();

      if (!response.success || !response.clientSecret) {
        throw new Error(response.message || 'SetupIntent 생성 실패');
      }

      setState(prev => ({
        ...prev,
        isLoading: false,
        clientSecret: response.clientSecret!,
        customerId: response.customerId || null,
      }));
    } catch (error) {
      console.error('SetupIntent creation failed:', error);
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다',
      }));
    }
  }, []);

  const confirmCardSetup = useCallback(async (planType: 'monthly' | 'yearly' | 'test') => {
    if (!state.clientSecret) {
      setState(prev => ({ ...prev, error: 'SetupIntent가 생성되지 않았습니다' }));
      return;
    }

    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      const stripe = await stripePromise;
      if (!stripe) {
        throw new Error('Stripe를 로드할 수 없습니다');
      }

      // Get card element from the page
      const cardElement = document.querySelector('.StripeElement iframe');

      // Confirm card setup (collects card details from CardElement)
      const { setupIntent, error: stripeError } = await stripe.confirmCardSetup(
        state.clientSecret,
        {
          payment_method: {
            card: cardElement as any,
          },
        }
      );

      if (stripeError) {
        throw new Error(stripeError.message);
      }

      if (!setupIntent || !setupIntent.payment_method) {
        throw new Error('결제 정보 저장 실패');
      }

      console.log('✅ Card setup confirmed:', setupIntent.id);

      // Activate trial with the saved payment method
      const response = await apiClient.activateTrialWithCard(
        setupIntent.payment_method as string,
        planType
      );

      if (!response.success) {
        throw new Error(response.message || response.error || '트라이얼 활성화 실패');
      }

      console.log('✅ Trial activated:', response);

      setState(prev => ({
        ...prev,
        isLoading: false,
        isSuccess: true,
      }));
    } catch (error) {
      console.error('Trial activation failed:', error);
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다',
      }));
    }
  }, [state.clientSecret]);

  return {
    ...state,
    createSetupIntent,
    confirmCardSetup,
    reset,
  };
}
