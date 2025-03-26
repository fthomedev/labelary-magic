
import { useState } from 'react';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

export type SubscriptionPlan = {
  id: string;
  product: {
    id: string;
    name: string;
    description: string;
    images: string[];
    metadata: Record<string, string>;
  };
  unit_amount: number;
  currency: string;
  recurring: {
    interval: 'day' | 'week' | 'month' | 'year';
    interval_count: number;
  };
  metadata: Record<string, string>;
  nickname: string;
};

export const useStripe = () => {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();
  const { t } = useTranslation();

  // Fetch subscription plans from Stripe
  const getSubscriptionPlans = async (): Promise<SubscriptionPlan[]> => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('stripe', {
        body: { action: 'get-prices' },
      });
      
      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error fetching subscription plans:', error);
      toast({
        variant: 'destructive',
        title: t('error'),
        description: t('errorFetchingPlans'),
      });
      return [];
    } finally {
      setIsLoading(false);
    }
  };

  // Create a checkout session
  const createCheckoutSession = async (priceId: string) => {
    setIsLoading(true);
    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate('/auth');
        return;
      }

      // Get or create a customer record in the database
      let customerData;
      const { data: subscriptionData, error: subscriptionError } = await supabase
        .from('subscriptions')
        .select('stripe_customer_id')
        .eq('user_id', user.id)
        .maybeSingle();

      if (subscriptionError) {
        console.error('Error fetching subscription data:', subscriptionError);
      }

      const customerId = subscriptionData?.stripe_customer_id;

      // Create checkout session
      const { data, error } = await supabase.functions.invoke('stripe', {
        body: {
          action: 'create-checkout-session',
          priceId,
          customerId,
          successUrl: `${window.location.origin}/subscription/success`,
          cancelUrl: `${window.location.origin}/subscription`,
        },
      });
      
      if (error) throw error;
      
      // Redirect to Stripe Checkout
      window.location.href = data.url;
    } catch (error) {
      console.error('Error creating checkout session:', error);
      toast({
        variant: 'destructive',
        title: t('error'),
        description: t('errorCreatingCheckout'),
      });
      setIsLoading(false);
    }
  };

  // Get customer subscription details
  const getCustomerSubscription = async () => {
    setIsLoading(true);
    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate('/auth');
        return null;
      }

      // Get customer ID from subscriptions table
      const { data: subscriptionData, error: subscriptionError } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (subscriptionError) {
        console.error('Error fetching subscription data:', subscriptionError);
        return null;
      }

      if (!subscriptionData || !subscriptionData.stripe_customer_id) {
        return null;
      }

      // Get subscription from Stripe
      const { data, error } = await supabase.functions.invoke('stripe', {
        body: {
          action: 'get-customer-subscription',
          customerId: subscriptionData.stripe_customer_id,
        },
      });
      
      if (error) throw error;
      
      return data;
    } catch (error) {
      console.error('Error fetching customer subscription:', error);
      toast({
        variant: 'destructive',
        title: t('error'),
        description: t('errorFetchingSubscription'),
      });
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    isLoading,
    getSubscriptionPlans,
    createCheckoutSession,
    getCustomerSubscription,
  };
};
