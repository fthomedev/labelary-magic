
import { useEffect, useState } from "react";
import { useStripe, type SubscriptionPlan } from "@/hooks/useStripe";
import { PlanCard } from "./PlanCard";
import { useTranslation } from "react-i18next";

export const SubscriptionPlans = () => {
  const { t } = useTranslation();
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [currentSubscription, setCurrentSubscription] = useState<any>(null);
  const { getSubscriptionPlans, createCheckoutSession, getCustomerSubscription, isLoading } = useStripe();

  useEffect(() => {
    const loadPlans = async () => {
      const fetchedPlans = await getSubscriptionPlans();
      setPlans(fetchedPlans);
      
      const subscription = await getCustomerSubscription();
      setCurrentSubscription(subscription && subscription.length > 0 ? subscription[0] : null);
    };
    
    loadPlans();
  }, []);

  const isCurrentPlan = (priceId: string) => {
    if (!currentSubscription) return false;
    return currentSubscription.items.data.some((item: any) => item.price.id === priceId);
  };

  const handleSelectPlan = (priceId: string) => {
    createCheckoutSession(priceId);
  };

  if (plans.length === 0 && isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[300px]">
        <p>{t('loadingPlans')}</p>
      </div>
    );
  }

  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      {plans.map((plan) => (
        <PlanCard
          key={plan.id}
          plan={plan}
          onSelect={handleSelectPlan}
          isLoading={isLoading}
          isCurrentPlan={isCurrentPlan(plan.id)}
        />
      ))}
    </div>
  );
};
