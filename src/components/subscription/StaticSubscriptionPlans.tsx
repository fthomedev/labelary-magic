
import { useTranslation } from "react-i18next";
import { StaticPlanCard } from "./StaticPlanCard";
import { useEffect, useState } from "react";

export const StaticSubscriptionPlans = () => {
  const { t, i18n } = useTranslation();
  const [forcedRender, setForcedRender] = useState(0);

  // Pricing structure by language
  const getPlansByLanguage = () => {
    // Different pricing based on language
    const isPtBR = i18n.language === 'pt-BR';
    
    return [
      {
        id: "basic-plan",
        name: "basicPlan",
        description: isPtBR ? "Perfeito para projetos individuais e pequenos" : "Perfect for individuals and small projects",
        price: isPtBR ? 9.90 : 2,
        currency: isPtBR ? "BRL" : "USD",
        interval: "month",
        features: isPtBR 
          ? ["100 Etiquetas por mês", "Suporte por email", "Análises básicas"] 
          : ["100 Labels per month", "Email support", "Basic analytics"],
        isPopular: false
      },
      {
        id: "premium-plan",
        name: "advancedPlan",
        description: isPtBR ? "Ótimo para empresas com maior volume" : "Great for businesses with higher volume needs",
        price: isPtBR ? 15.90 : 3,
        currency: isPtBR ? "BRL" : "USD",
        interval: "month",
        features: isPtBR 
          ? ["1.000 Etiquetas por mês", "Suporte prioritário", "Análises avançadas", "Processamento em lote"] 
          : ["1,000 Labels per month", "Priority support", "Advanced analytics", "Bulk processing"],
        isPopular: true
      }
    ];
  };

  // Force re-render when language changes
  useEffect(() => {
    const handleLanguageChanged = () => {
      setForcedRender(prev => prev + 1);
    };

    i18n.on('languageChanged', handleLanguageChanged);
    
    return () => {
      i18n.off('languageChanged', handleLanguageChanged);
    };
  }, [i18n]);

  const plans = getPlansByLanguage();

  return (
    <div className="space-y-8">
      <h2 className="text-3xl font-bold text-center mb-6">{t('simplePricing')}</h2>
      
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-2 max-w-4xl mx-auto">
        {plans.map((plan) => (
          <StaticPlanCard
            key={`${plan.id}-${forcedRender}`}
            plan={plan}
            isPopular={plan.isPopular}
          />
        ))}
      </div>
    </div>
  );
};
