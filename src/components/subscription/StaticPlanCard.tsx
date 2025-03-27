
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Check, LoaderCircle } from "lucide-react";
import { useTranslation } from "react-i18next";

interface StaticPlanCardProps {
  plan: {
    id: string;
    name: string;
    description: string;
    price: string;
    currency: string;
    features: string[];
    isPopular?: boolean;
    productId?: string;
  };
  onSelect: () => void;
  isLoading?: boolean;
  isCurrentPlan?: boolean;
  isPopular?: boolean;
}

export function StaticPlanCard({ plan, onSelect, isLoading, isCurrentPlan, isPopular }: StaticPlanCardProps) {
  const { t } = useTranslation();
  
  return (
    <Card className={`relative flex flex-col ${isPopular ? 'border-primary shadow-lg' : ''}`}>
      {isPopular && (
        <div className="absolute -top-3 right-4 bg-primary text-primary-foreground px-3 py-1 text-xs rounded-full font-medium">
          {t('popularTag')}
        </div>
      )}
      
      <CardHeader>
        <CardTitle>{plan.name}</CardTitle>
        <CardDescription>{plan.description}</CardDescription>
      </CardHeader>
      
      <CardContent className="flex-1">
        <div className="mb-6">
          <span className="text-3xl font-bold">R$ {plan.price}</span>
          <span className="text-muted-foreground">/{t('month')}</span>
        </div>
        
        <div className="space-y-3">
          {plan.features.map((feature, index) => (
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
          onClick={onSelect}
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
            t('learnMore')
          )}
        </Button>
      </CardFooter>
    </Card>
  );
}
