
import { useTranslation } from "react-i18next";
import { StaticPlanCard } from "./StaticPlanCard";

export const StaticSubscriptionPlans = () => {
  const { t } = useTranslation();

  // Static plan data
  const plans = [
    {
      id: "basic-plan",
      name: "basicPlan",
      description: "Perfect for individuals and small projects",
      price: 9.99,
      interval: "month",
      features: ["100 Labels per month", "Email support", "Basic analytics"],
      isPopular: false
    },
    {
      id: "premium-plan",
      name: "advancedPlan",
      description: "Great for businesses with higher volume needs",
      price: 29.99,
      interval: "month",
      features: ["1,000 Labels per month", "Priority support", "Advanced analytics", "Bulk processing"],
      isPopular: true
    }
  ];

  return (
    <div className="space-y-8">
      <h2 className="text-3xl font-bold text-center mb-6">{t('simplePricing')}</h2>
      
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-2 max-w-4xl mx-auto">
        {plans.map((plan) => (
          <StaticPlanCard
            key={plan.id}
            plan={plan}
            isPopular={plan.isPopular}
          />
        ))}
      </div>
    </div>
  );
};
