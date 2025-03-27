
import { useTranslation } from "react-i18next";
import { StaticPlanCard } from "./StaticPlanCard";

export const StaticSubscriptionPlans = () => {
  const { t } = useTranslation();

  // Static plan data with real Stripe price IDs (não product IDs)
  const plans = [
    {
      id: "price_S109xhc7K0XxCU", // ID do preço (não produto) básico no Stripe
      name: t("basicPlan"),
      description: t("basicPlanDescription"),
      price: 9.90,
      currency: "BRL",
      interval: "month",
      features: [
        t("basicFeature1"),
        t("basicFeature2"),
        t("basicFeature3")
      ],
      isPopular: false
    },
    {
      id: "price_S109EaoLA02QYK", // ID do preço (não produto) avançado no Stripe
      name: t("advancedPlan"),
      description: t("advancedPlanDescription"),
      price: 15.90,
      currency: "BRL",
      interval: "month",
      features: [
        t("advancedFeature1"),
        t("advancedFeature2"),
        t("advancedFeature3"),
        t("advancedFeature4")
      ],
      isPopular: true
    }
  ];

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="text-center mb-12">
        <h2 className="text-3xl font-bold mb-4">{t("choosePlan")}</h2>
        <p className="text-muted-foreground max-w-2xl mx-auto">{t("choosePlanDescription")}</p>
      </div>

      <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
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
