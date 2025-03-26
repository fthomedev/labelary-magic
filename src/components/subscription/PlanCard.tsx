
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { type SubscriptionPlan } from "@/hooks/useStripe";
import { useTranslation } from "react-i18next";

interface PlanCardProps {
  plan: SubscriptionPlan;
  onSelect: (priceId: string) => void;
  isLoading: boolean;
  isCurrentPlan?: boolean;
}

export const PlanCard = ({ plan, onSelect, isLoading, isCurrentPlan }: PlanCardProps) => {
  const { t } = useTranslation();
  const { unit_amount, currency, recurring } = plan;
  
  // Format currency
  const formatter = new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: currency.toUpperCase(),
  });
  
  const formattedPrice = formatter.format(unit_amount / 100);
  
  // Get interval text
  const getIntervalText = () => {
    const { interval, interval_count } = recurring;
    
    if (interval_count === 1) {
      switch (interval) {
        case 'day': return t('perDay');
        case 'week': return t('perWeek');
        case 'month': return t('perMonth');
        case 'year': return t('perYear');
        default: return '';
      }
    } else {
      switch (interval) {
        case 'day': return t('perXDays', { count: interval_count });
        case 'week': return t('perXWeeks', { count: interval_count });
        case 'month': return t('perXMonths', { count: interval_count });
        case 'year': return t('perXYears', { count: interval_count });
        default: return '';
      }
    }
  };

  return (
    <Card className="w-full max-w-sm">
      <CardHeader>
        <CardTitle>{plan.product.name}</CardTitle>
        <CardDescription>{plan.product.description}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col items-center justify-center space-y-2">
          <span className="text-3xl font-bold">{formattedPrice}</span>
          <span className="text-sm text-muted-foreground">{getIntervalText()}</span>
          
          {plan.product.metadata && plan.product.metadata.features && (
            <ul className="mt-4 space-y-2">
              {plan.product.metadata.features.split(',').map((feature, index) => (
                <li key={index} className="flex items-center">
                  <span className="mr-2">✓</span>
                  <span>{feature.trim()}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </CardContent>
      <CardFooter>
        <Button 
          onClick={() => onSelect(plan.id)} 
          className="w-full" 
          disabled={isLoading || isCurrentPlan}
        >
          {isCurrentPlan ? t('currentPlan') : t('subscribe')}
        </Button>
      </CardFooter>
    </Card>
  );
};
