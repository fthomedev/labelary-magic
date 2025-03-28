
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
      console.log('Fetching subscription plans...');
      const { data, error } = await supabase.functions.invoke('stripe', {
        body: { action: 'get-prices' },
      });
      
      if (error) {
        console.error('Error fetching plans from Supabase function:', error);
        throw error;
      }
      
      console.log('Subscription plans fetched successfully:', data);
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
  const createCheckoutSession = async (priceOrProductId: string) => {
    setIsLoading(true);
    try {
      console.log(`Creating checkout session for ID: ${priceOrProductId}`);
      
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        console.error('No authenticated user found');
        toast({
          variant: 'destructive',
          title: t('error'),
          description: t('loginRequired'),
        });
        navigate('/auth');
        return;
      }

      // Get or create a customer record in the database
      try {
        const { data: subscriptionData, error: subscriptionError } = await supabase
          .from('subscriptions')
          .select('stripe_customer_id')
          .eq('user_id', user.id)
          .maybeSingle();

        if (subscriptionError) {
          console.error('Error fetching subscription data:', subscriptionError);
        }

        const customerId = subscriptionData?.stripe_customer_id;
        console.log('Retrieved customer ID from database:', customerId);
        
        // Create checkout session with clear logging
        console.log('Sending request to Stripe function with params:', {
          action: 'create-checkout-session',
          priceId: priceOrProductId,
          customerId,
          successUrl: `${window.location.origin}/subscription/success`,
          cancelUrl: `${window.location.origin}/subscription`,
        });
        
        const { data, error } = await supabase.functions.invoke('stripe', {
          body: {
            action: 'create-checkout-session',
            priceId: priceOrProductId,
            customerId,
            successUrl: `${window.location.origin}/subscription/success`,
            cancelUrl: `${window.location.origin}/subscription`,
          },
        });
        
        if (error) {
          console.error('Error from Supabase function:', error);
          throw error;
        }
        
        if (!data || !data.url) {
          console.error('No checkout URL returned from Stripe function:', data);
          throw new Error(data?.error || 'No checkout URL returned from Stripe');
        }
        
        console.log('Checkout session created successfully, redirecting to:', data.url);
        
        // Redirect to Stripe Checkout
        window.location.href = data.url;
      } catch (dbError) {
        console.error('Database or checkout operation failed:', dbError);
        throw dbError;
      }
    } catch (error) {
      console.error('Error creating checkout session:', error);
      toast({
        variant: 'destructive',
        title: t('error'),
        description: typeof error === 'object' && error !== null && 'message' in error 
          ? error.message as string
          : t('errorCreatingCheckout'),
      });
      setIsLoading(false);
    }
  };

  // Get customer subscription details
  const getCustomerSubscription = async () => {
    setIsLoading(true);
    try {
      console.log('Fetching customer subscription...');
      
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        console.error('No authenticated user found');
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
        console.log('No subscription data found for user');
        return null;
      }

      console.log('Found customer ID:', subscriptionData.stripe_customer_id);

      // Get subscription from Stripe
      const { data, error } = await supabase.functions.invoke('stripe', {
        body: {
          action: 'get-customer-subscription',
          customerId: subscriptionData.stripe_customer_id,
        },
      });
      
      if (error) {
        console.error('Error from Supabase function:', error);
        throw error;
      }
      
      console.log('Subscription data retrieved successfully:', data);
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
