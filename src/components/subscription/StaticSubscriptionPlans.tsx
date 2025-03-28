
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

  // Static plans definition for when we can't load from Stripe
  const staticPlans = [
    {
      id: "basic",
      name: t('basicPlan'),
      description: t('basicPlanDescription'),
      price: "9,90",
      currency: "R$",
      features: [
        t('basicFeature1'),
        t('basicFeature2'),
        t('basicFeature3')
      ],
      isPopular: false,
      // Using product ID instead of price ID to avoid errors
      productId: "prod_S109EaoLA02QYK"
    },
    {
      id: "advanced",
      name: t('advancedPlan'),
      description: t('advancedPlanDescription'),
      price: "15,90",
      currency: "R$",
      features: [
        t('advancedFeature1'),
        t('advancedFeature2'),
        t('advancedFeature3'),
        t('advancedFeature4')
      ],
      isPopular: true,
      // Using product ID for advanced plan too
      productId: "prod_S109H2KiOoZULm"
    }
  ];

  const handleSelectPlan = async (plan) => {
    if (isLoading) return; // Prevent multiple clicks
    
    console.log("Selected plan:", plan);
    setIsLoading(true);
    setProcessingPlanId(plan.id);
    
    try {
      // Priorizar o uso do productId em vez do priceId
      if (plan.productId) {
        console.log(`Iniciando checkout com product ID: ${plan.productId}`);
        const result = await createCheckoutSession(plan.productId);
        console.log("Checkout session result:", result);
        
        if (!result) {
          throw new Error("Falha ao criar sessão de checkout");
        }
      } 
      // Fallback para price ID apenas se disponível
      else if (plan.priceId) {
        console.log(`Iniciando checkout com price ID: ${plan.priceId}`);
        const result = await createCheckoutSession(plan.priceId);
        console.log("Checkout session result:", result);
        
        if (!result) {
          throw new Error("Falha ao criar sessão de checkout");
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
      
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-2 max-w-4xl mx-auto">
        {staticPlans.map((plan) => (
          <StaticPlanCard
            key={plan.id}
            plan={plan}
            onSelect={() => handleSelectPlan(plan)}
            isLoading={isLoading && processingPlanId === plan.id}
            isPopular={plan.isPopular}
          />
        ))}
      </div>
    </div>
  );
};
