
import { useState } from 'react';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { StripeSubscription } from './types';

export const useCustomerSubscription = () => {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();
  const { t } = useTranslation();

  // Get customer subscription details
  const getCustomerSubscription = async (): Promise<{ 
    subscription: StripeSubscription[] | null; 
    hasSubscriptionData: boolean; 
  }> => {
    setIsLoading(true);
    try {
      console.log('Fetching customer subscription...');
      
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        console.error('No authenticated user found');
        navigate('/auth');
        return { subscription: null, hasSubscriptionData: false };
      }

      // Get customer ID from subscriptions table
      const { data: subscriptionData, error: subscriptionError } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (subscriptionError) {
        console.error('Error fetching subscription data:', subscriptionError);
        return { subscription: null, hasSubscriptionData: false };
      }

      if (!subscriptionData || !subscriptionData.stripe_customer_id) {
        console.log('No subscription data found for user');
        return { subscription: null, hasSubscriptionData: false };
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
      return { subscription: data, hasSubscriptionData: true };
    } catch (error) {
      console.error('Error fetching customer subscription:', error);
      toast({
        variant: 'destructive',
        title: t('error'),
        description: t('errorFetchingSubscription'),
      });
      return { subscription: null, hasSubscriptionData: false };
    } finally {
      setIsLoading(false);
    }
  };

  return {
    isLoading,
    getCustomerSubscription,
  };
};
