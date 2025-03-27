
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Check, LoaderCircle } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { type SubscriptionPlan } from "@/hooks/useStripe";

interface PlanCardProps {
  plan: SubscriptionPlan;
  onSelect?: (priceId: string) => void;
  isLoading?: boolean;
  isCurrentPlan?: boolean;
  isPopular?: boolean;
}

export function PlanCard({ plan, onSelect, isLoading, isCurrentPlan, isPopular }: PlanCardProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  
  const features = plan.product.metadata?.features
    ? plan.product.metadata.features.split(',')
    : [];
  
  const formattedPrice = new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: plan.currency || 'BRL'
  }).format((plan.unit_amount || 0) / 100);

  const handleSelectPlan = () => {
    if (onSelect) {
      // Use the original direct checkout if provided
      onSelect(plan.id);
    } else {
      // Navigate to checkout page with plan data
      navigate('/checkout', { state: { plan } });
    }
  };

  return (
    <Card className={`relative flex flex-col ${isPopular ? 'border-primary shadow-lg' : ''}`}>
      {isPopular && (
        <div className="absolute -top-3 right-4 bg-primary text-primary-foreground px-3 py-1 text-xs rounded-full font-medium">
          {t('popular')}
        </div>
      )}
      
      <CardHeader>
        <CardTitle>{plan.product.name}</CardTitle>
        <CardDescription>{plan.product.description}</CardDescription>
      </CardHeader>
      
      <CardContent className="flex-1">
        <div className="mb-6">
          <span className="text-3xl font-bold">{formattedPrice}</span>
          <span className="text-muted-foreground">/{t('month')}</span>
        </div>
        
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Check className="h-4 w-4 text-primary" />
            <span>{plan.product.metadata?.limit || t('noLimit')}</span>
          </div>
          
          {features.map((feature, index) => (
            <div key={index} className="flex items-center gap-2">
              <Check className="h-4 w-4 text-primary" />
              <span>{feature}</span>
            </div>
          ))}
        </div>
      </CardContent>
      
      <CardFooter>
        <Button 
          className="w-full"
          onClick={handleSelectPlan}
          disabled={isLoading || isCurrentPlan}
          variant={isCurrentPlan ? "outline" : isPopular ? "default" : "secondary"}
        >
          {isLoading ? (
            <>
              <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
              {t('processing')}
            </>
          ) : isCurrentPlan ? (
            t('currentPlan')
          ) : (
            t('selectPlan')
          )}
        </Button>
      </CardFooter>
    </Card>
  );
}
