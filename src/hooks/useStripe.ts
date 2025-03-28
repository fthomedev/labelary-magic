
import { useState } from 'react';
import { useSubscriptionPlans } from './stripe/useSubscriptionPlans';
import { useCheckoutSession } from './stripe/useCheckoutSession';
import { useCustomerSubscription } from './stripe/useCustomerSubscription';
import type { SubscriptionPlan } from './stripe/types';

export type { SubscriptionPlan };

export const useStripe = () => {
  const [isLoading, setIsLoading] = useState(false);
  
  const subscriptionPlansHook = useSubscriptionPlans();
  const checkoutSessionHook = useCheckoutSession();
  const customerSubscriptionHook = useCustomerSubscription();
  
  // Combine loading states
  const combinedIsLoading = 
    isLoading || 
    subscriptionPlansHook.isLoading || 
    checkoutSessionHook.isLoading || 
    customerSubscriptionHook.isLoading;

  return {
    isLoading: combinedIsLoading,
    getSubscriptionPlans: subscriptionPlansHook.getSubscriptionPlans,
    createCheckoutSession: checkoutSessionHook.createCheckoutSession,
    getCustomerSubscription: customerSubscriptionHook.getCustomerSubscription,
  };
};
