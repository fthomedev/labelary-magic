
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useTranslation } from "react-i18next";
import { Check } from "lucide-react";

interface StaticPlanProps {
  id: string;
  name: string;
  description: string;
  price: number;
  currency: string;
  interval: string;
  features: string[];
  isPopular: boolean;
}

interface StaticPlanCardProps {
  plan: StaticPlanProps;
  isPopular?: boolean;
}

export const StaticPlanCard = ({ plan, isPopular }: StaticPlanCardProps) => {
  const { t, i18n } = useTranslation();
  
  // Format currency based on language and currency code
  const formatter = new Intl.NumberFormat(i18n.language === 'pt-BR' ? 'pt-BR' : 'en-US', {
    style: 'currency',
    currency: plan.currency,
  });
  
  const formattedPrice = formatter.format(plan.price);

  // Get interval text (per month, per year, etc.)
  const getIntervalText = () => {
    if (plan.interval === 'month') {
      return t('perMonth');
    } else if (plan.interval === 'year') {
      return t('perYear');
    }
    return '';
  };
  
  // Determine background color based on plan name
  const getBgColor = () => {
    if (plan.name === 'basicPlan') {
      return "bg-[#F2FCE2] hover:bg-[#E8F8D8]";
    }
    return "bg-[#E5DEFF] hover:bg-[#DBD4F5]";
  };

  return (
    <Card className={`w-full relative overflow-hidden transition-all duration-200 ${getBgColor()} flex flex-col`}>
      {isPopular && (
        <div className="absolute top-0 right-0 bg-green-500 text-white px-4 py-1 rounded-bl-lg text-sm font-medium">
          {t('popularTag')}
        </div>
      )}
      
      <CardHeader>
        <CardTitle className="text-2xl font-bold">{t(plan.name)}</CardTitle>
        <CardDescription className="text-gray-700">{plan.description}</CardDescription>
      </CardHeader>
      
      <CardContent className="flex-grow">
        <div className="flex flex-col items-start justify-start space-y-6">
          <div className="flex items-baseline gap-1">
            <span className="text-4xl font-bold">{formattedPrice}</span>
            <span className="text-sm text-gray-600 ml-1">{getIntervalText()}</span>
          </div>
          
          <ul className="space-y-3 w-full">
            {plan.features.map((feature, index) => (
              <li key={index} className="flex items-start">
                <span className="mr-2 mt-1 flex-shrink-0">
                  <Check className="h-5 w-5 text-green-600" />
                </span>
                <span className="text-gray-700">{feature}</span>
              </li>
            ))}
          </ul>
        </div>
      </CardContent>
      
      <CardFooter className="pb-6 mt-auto">
        <Button 
          className="w-full bg-green-600 hover:bg-green-700 text-white font-medium"
        >
          {t('subscribe')}
        </Button>
      </CardFooter>
    </Card>
  );
};
