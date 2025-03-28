
import { useState } from 'react';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

export const useCheckoutSession = () => {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();
  const { t } = useTranslation();

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
        setIsLoading(false);
        return null;
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
        
        // Create checkout session with optimized caching and test mode indicator
        console.log('Sending request to Stripe function with params:', {
          action: 'create-checkout-session',
          priceId: priceOrProductId,
          customerId,
          successUrl: `${window.location.origin}/subscription/success`,
          cancelUrl: `${window.location.origin}/subscription`,
          testMode: true // Explicitly mark as test mode
        });
        
        // Add cache busting parameter to avoid Edge Function caching
        const { data, error } = await supabase.functions.invoke('stripe', {
          body: {
            action: 'create-checkout-session',
            priceId: priceOrProductId,
            customerId,
            successUrl: `${window.location.origin}/subscription/success`,
            cancelUrl: `${window.location.origin}/subscription`,
            timestamp: Date.now(), // Add timestamp to prevent caching
            testMode: true // Explicitly mark as test mode
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
        
        // Fix: Instead of directly changing window.location.href, use window.open to open in a new tab
        // This prevents iframe loading issues and third-party cookie problems
        const checkoutWindow = window.open(data.url, '_blank');
        
        // If popup was blocked, fall back to redirect
        if (!checkoutWindow) {
          console.warn('Popup blocked. Falling back to redirect.');
          window.location.href = data.url;
        }
        
        setIsLoading(false);
        return data;
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
          ? (error.message as string) + ' (Certifique-se de usar cartões de teste no ambiente de teste Stripe)'
          : t('errorCreatingCheckout') + ' (Certifique-se de usar cartões de teste no ambiente de teste Stripe)',
      });
      setIsLoading(false);
      return null;
    }
  };

  return {
    isLoading,
    createCheckoutSession,
  };
};
