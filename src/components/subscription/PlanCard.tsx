
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { type SubscriptionPlan } from "@/hooks/useStripe";
import { useTranslation } from "react-i18next";
import { Check, Infinity } from "lucide-react";

interface PlanCardProps {
  plan: SubscriptionPlan;
  onSelect: (priceId: string) => void;
  isLoading: boolean;
  isCurrentPlan?: boolean;
  isPopular?: boolean;
}

export const PlanCard = ({ plan, onSelect, isLoading, isCurrentPlan, isPopular }: PlanCardProps) => {
  const { t } = useTranslation();
  const { unit_amount, currency, recurring } = plan;
  
  // Format currency
  const formatter = new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: currency.toUpperCase(),
  });
  
  const formattedPrice = formatter.format(unit_amount / 100);

  // Get interval text for the "per month" label
  const getIntervalText = () => {
    if (recurring.interval === 'month' && recurring.interval_count === 1) {
      return t('perMonth');
    }
    return '';
  };
  
  // Determine background color based on plan name
  const getBgColor = () => {
    if (plan.product.name.toLowerCase().includes('básico') || 
        plan.product.name.toLowerCase().includes('basico')) {
      return "bg-[#F2FCE2] hover:bg-[#E8F8D8]";
    }
    return "bg-[#E5DEFF] hover:bg-[#DBD4F5]";
  };

  return (
    <Card className={`w-full relative overflow-hidden transition-all duration-200 ${getBgColor()}`}>
      {isPopular && (
        <div className="absolute top-0 right-0 bg-green-500 text-white px-4 py-1 rounded-bl-lg text-sm font-medium">
          {t('popular')}
        </div>
      )}
      
      <CardHeader>
        <CardTitle className="text-2xl font-bold">{plan.product.name}</CardTitle>
        <CardDescription className="text-gray-700">{plan.product.description}</CardDescription>
      </CardHeader>
      
      <CardContent>
        <div className="flex flex-col items-start justify-start space-y-6">
          <div className="flex items-baseline gap-1">
            <span className="text-4xl font-bold">{formattedPrice}</span>
            <span className="text-sm text-gray-600 ml-1">{getIntervalText()}</span>
          </div>
          
          {plan.product.metadata && (
            <ul className="space-y-3 w-full">
              {plan.product.metadata.limit && (
                <li className="flex items-start">
                  <span className="mr-2 mt-1 flex-shrink-0">
                    {plan.product.metadata.limit.toLowerCase().includes('ilimitado') ? (
                      <Infinity className="h-5 w-5 text-green-600" />
                    ) : (
                      <Check className="h-5 w-5 text-green-600" />
                    )}
                  </span>
                  <span className="text-gray-700">{plan.product.metadata.limit}</span>
                </li>
              )}
              
              {plan.product.metadata.features && 
                plan.product.metadata.features.split(',').map((feature, index) => (
                  <li key={index} className="flex items-start">
                    <span className="mr-2 mt-1 flex-shrink-0">
                      <Check className="h-5 w-5 text-green-600" />
                    </span>
                    <span className="text-gray-700">{feature.trim()}</span>
                  </li>
                ))
              }
            </ul>
          )}
        </div>
      </CardContent>
      
      <CardFooter className="pb-6 mt-auto">
        <Button 
          onClick={() => onSelect(plan.id)} 
          className="w-full bg-green-600 hover:bg-green-700 text-white font-medium"
          disabled={isLoading || isCurrentPlan}
        >
          {isCurrentPlan ? t('currentPlan') : t('learnMore')}
        </Button>
      </CardFooter>
    </Card>
  );
};
