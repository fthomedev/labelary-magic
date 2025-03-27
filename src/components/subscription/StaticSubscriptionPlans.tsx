
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { StaticPlanCard } from "./StaticPlanCard";
import { useStripe } from "@/hooks/useStripe";

export const StaticSubscriptionPlans = () => {
  const { t } = useTranslation();
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { createCheckoutSession } = useStripe();

  // Definição estática dos planos para quando não conseguimos carregar do Stripe
  const staticPlans = [
    {
      id: "basic", // Será substituído pelo ID real do produto/preço do Stripe
      name: t('basicPlan'),
      description: t('basicPlanDescription'),
      price: "9,90",
      currency: "BRL",
      features: [
        t('basicFeature1'),
        t('basicFeature2'),
        t('basicFeature3')
      ],
      isPopular: false,
      productId: "prod_S109EaoLA02QYK" // ID real do produto no Stripe
    },
    {
      id: "advanced",
      name: t('advancedPlan'),
      description: t('advancedPlanDescription'),
      price: "15,90",
      currency: "BRL",
      features: [
        t('advancedFeature1'),
        t('advancedFeature2'),
        t('advancedFeature3'),
        t('advancedFeature4')
      ],
      isPopular: true,
      productId: "prod_S109xhc7K0XxCU" // ID real do produto no Stripe
    }
  ];

  const handleSelectPlan = async (plan) => {
    console.log("Selected plan:", plan);
    setIsLoading(true);
    
    try {
      // Usar o ID do produto para checkout
      if (plan.productId) {
        console.log(`Initiating checkout with product ID: ${plan.productId}`);
        await createCheckoutSession(plan.productId);
      } else {
        // Navegação alternativa para a página de checkout
        console.log('No product ID found, navigating to checkout page');
        navigate('/checkout', { state: { plan } });
      }
    } catch (error) {
      console.error("Error selecting plan:", error);
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      <h2 className="text-3xl font-bold text-center mb-6">{t('simplePricing')}</h2>
      
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-2 max-w-4xl mx-auto">
        {staticPlans.map((plan, index) => (
          <StaticPlanCard
            key={plan.id}
            plan={plan}
            onSelect={() => handleSelectPlan(plan)}
            isLoading={isLoading}
            isPopular={plan.isPopular}
          />
        ))}
      </div>
    </div>
  );
};
