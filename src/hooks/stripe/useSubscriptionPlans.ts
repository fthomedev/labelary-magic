
import { useState } from 'react';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useTranslation } from 'react-i18next';
import { SubscriptionPlan } from './types';

export const useSubscriptionPlans = () => {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
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

  return {
    isLoading,
    getSubscriptionPlans,
  };
};
