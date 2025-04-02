
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { StaticPlanCard } from "./StaticPlanCard";
import { useStripe } from "@/hooks/useStripe";
import { useToast } from "@/components/ui/use-toast";

export const StaticSubscriptionPlans = () => {
  const { t } = useTranslation();
  const [isLoading, setIsLoading] = useState(false);
  const [processingPlanId, setProcessingPlanId] = useState<string | null>(null);
  const navigate = useNavigate();
  const { createCheckoutSession } = useStripe();
  const { toast } = useToast();

  // Updated static plans with new values and limits
  const staticPlans = [
    {
      id: "free",
      name: t('freePlan'),
      description: t('freePlanDescription'),
      price: "0",
      currency: "R$",
      features: [
        t('freeFeature1'),
        t('freeFeature2'),
        t('freeFeature3')
      ],
      isPopular: false,
      isFree: true,
      productId: "free_plan"  // Free plan has no product ID in Stripe
    },
    {
      id: "basic",
      name: t('basicPlan'),
      description: t('basicPlanDescription'),
      price: "4,99",
      currency: "R$",
      features: [
        t('basicFeature1'),
        t('basicFeature2'),
        t('basicFeature3')
      ],
      isPopular: false,
      productId: "prod_basic_plan"
    },
    {
      id: "advanced",
      name: t('advancedPlan'),
      description: t('advancedPlanDescription'),
      price: "9,99",
      currency: "R$",
      features: [
        t('advancedFeature1'),
        t('advancedFeature2'),
        t('advancedFeature3'),
        t('advancedFeature4')
      ],
      isPopular: true,
      productId: "prod_advanced_plan"
    },
    {
      id: "unlimited",
      name: t('unlimitedPlan'),
      description: t('unlimitedPlanDescription'),
      price: "19,99",
      currency: "R$",
      features: [
        t('unlimitedFeature1'),
        t('unlimitedFeature2'),
        t('unlimitedFeature3'),
        t('unlimitedFeature4')
      ],
      isPopular: false,
      productId: "prod_unlimited_plan"
    }
  ];

  const handleSelectPlan = async (plan) => {
    // Don't process free plan
    if (plan.isFree) {
      toast({
        title: t('freePlanSelected'),
        description: t('freePlanSelectedDescription'),
      });
      return;
    }
    
    if (isLoading) return; // Prevent multiple clicks
    
    console.log("Selected plan:", plan);
    setIsLoading(true);
    setProcessingPlanId(plan.id);
    
    try {
      // Prioritize using the productId
      if (plan.productId) {
        console.log(`Starting checkout with product ID: ${plan.productId}`);
        const result = await createCheckoutSession(plan.productId);
        console.log("Checkout session result:", result);
        
        if (!result) {
          throw new Error("Failed to create checkout session");
        }
      } 
      // Fallback to price ID if available
      else if (plan.priceId) {
        console.log(`Starting checkout with price ID: ${plan.priceId}`);
        const result = await createCheckoutSession(plan.priceId);
        console.log("Checkout session result:", result);
        
        if (!result) {
          throw new Error("Failed to create checkout session");
        }
      }
      // Alternative navigation to checkout page if no IDs are found
      else {
        console.log('No price or product ID found, navigating to checkout page');
        navigate('/checkout', { state: { plan } });
      }
    } catch (error) {
      console.error("Error selecting plan:", error);
      toast({
        variant: 'destructive',
        title: t('error'),
        description: t('errorProcessingRequest')
      });
    } finally {
      setIsLoading(false);
      setProcessingPlanId(null);
    }
  };

  return (
    <div className="space-y-8">
      <h2 className="text-3xl font-bold text-center mb-6">{t('simplePricing')}</h2>
      
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 max-w-6xl mx-auto">
        {staticPlans.map((plan) => (
          <StaticPlanCard
            key={plan.id}
            plan={plan}
            onSelect={() => handleSelectPlan(plan)}
            isLoading={isLoading && processingPlanId === plan.id}
            isPopular={plan.isPopular}
            isFree={plan.isFree}
          />
        ))}
      </div>
    </div>
  );
};
