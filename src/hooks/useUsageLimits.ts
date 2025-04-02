
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';

// Define an interface for the subscription properties to avoid TypeScript errors
interface Subscription {
  id: string;
  user_id: string;
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
  status: string;
  price_id: string | null;
  quantity: number | null;
  cancel_at_period_end: boolean | null;
  current_period_start: string | null;
  current_period_end: string | null;
  created_at: string;
  updated_at: string;
  usage_quota: number | null;
  usage_count: number | null;
  usage_reset_date: string | null;
}

export const useUsageLimits = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [hasReachedLimit, setHasReachedLimit] = useState(false);
  const { toast } = useToast();

  // Check if user has reached their usage limit
  const checkUsageLimit = async (): Promise<boolean> => {
    setIsLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        // Users who aren't logged in will use the free plan with 10 labels/day
        return false;
      }
      
      // Get user's subscription
      const { data: subscription, error } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();
        
      if (error) {
        console.error('Error fetching subscription:', error);
        setIsLoading(false);
        return false;
      }
      
      // If no subscription, user is on free plan (10 labels/day)
      if (!subscription) {
        // Query usage directly for free tier users using the custom RPC function
        const { data: usageData, error: usageError } = await supabase.rpc<number>(
          'check_free_tier_usage', 
          { user_id_param: user.id }
        );
        
        if (usageError) {
          console.error('Error checking free tier usage:', usageError);
          return false;
        }
        
        const reachedLimit = usageData && usageData > 10;
        setHasReachedLimit(reachedLimit);
        
        if (reachedLimit) {
          toast({
            title: 'Limite de uso atingido',
            description: 'Você atingiu o limite de 10 etiquetas por dia no plano gratuito.',
            variant: 'destructive'
          });
        }
        
        return reachedLimit;
      }
      
      // Cast the subscription to our interface to access the usage properties
      const typedSubscription = subscription as unknown as Subscription;
      
      // If unlimited plan, never reached limit
      if (typedSubscription.usage_quota === -1) {
        setHasReachedLimit(false);
        return false;
      }
      
      // Check if user has reached their limit
      const hasReached = (typedSubscription.usage_count || 0) >= (typedSubscription.usage_quota || 0);
      setHasReachedLimit(hasReached);
      
      if (hasReached) {
        toast({
          title: 'Limite de uso atingido',
          description: `Você atingiu o limite de ${typedSubscription.usage_quota} etiquetas por dia no seu plano atual.`,
          variant: 'destructive'
        });
      }
      
      return hasReached;
    } catch (error) {
      console.error('Error checking usage limit:', error);
      return false;
    } finally {
      setIsLoading(false);
    }
  };
  
  // Increment usage count
  const incrementUsage = async (count: number = 1): Promise<boolean> => {
    setIsLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        return false;
      }
      
      // Call RPC function to increment usage
      const { data, error } = await supabase.rpc<boolean>(
        'increment_usage_count', 
        { user_id_param: user.id, increment_amount: count }
      );
      
      if (error) {
        console.error('Error incrementing usage:', error);
        return false;
      }
      
      return true;
    } catch (error) {
      console.error('Error incrementing usage:', error);
      return false;
    } finally {
      setIsLoading(false);
    }
  };
  
  return {
    isLoading,
    hasReachedLimit,
    checkUsageLimit,
    incrementUsage
  };
};
