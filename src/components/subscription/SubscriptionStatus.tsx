
import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useStripe } from "@/hooks/useStripe";
import { Button } from "@/components/ui/button";
import { useTranslation } from "react-i18next";
import { AlertCircle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export const SubscriptionStatus = () => {
  const { t, i18n } = useTranslation();
  const [subscription, setSubscription] = useState<any>(null);
  const [isChecked, setIsChecked] = useState(false);
  const { getCustomerSubscription, isLoading } = useStripe();

  useEffect(() => {
    const loadSubscription = async () => {
      const data = await getCustomerSubscription();
      if (data && data.length > 0) {
        setSubscription(data[0]);
      }
      setIsChecked(true);
    };
    
    loadSubscription();
  }, [getCustomerSubscription]);

  if (isLoading) {
    return (
      <div className="flex justify-center p-8">
        <p>{t('loadingSubscription')}</p>
      </div>
    );
  }

  if (isChecked && !subscription) {
    return (
      <div className="flex flex-col items-center gap-6 p-8">
        <Alert variant="default">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>{t('noActiveSubscription')}</AlertTitle>
          <AlertDescription>
            {t('noActiveSubscriptionDescription')}
          </AlertDescription>
        </Alert>
        <Button 
          onClick={() => {
            const plansTab = document.querySelector('[value="plans"]') as HTMLButtonElement;
            if (plansTab) {
              plansTab.click();
            }
          }}
          className="w-full max-w-md"
        >
          {t('viewAvailablePlans')}
        </Button>
      </div>
    );
  }

  // Only try to format and display information if we have a subscription
  if (!subscription) {
    return null;
  }

  // Format dates
  const formatDate = (timestamp: number) => {
    return new Date(timestamp * 1000).toLocaleDateString(i18n.language);
  };

  const currentPeriodEnd = formatDate(subscription.current_period_end);
  const currentPeriodStart = formatDate(subscription.current_period_start);

  // Get price details
  const price = subscription.items.data[0].price;
  const productName = price.product.name;
  const amount = price.unit_amount / 100;
  const currency = price.currency.toUpperCase();
  const interval = price.recurring.interval;

  // Format currency
  const formatter = new Intl.NumberFormat(i18n.language === 'pt-BR' ? 'pt-BR' : 'en-US', {
    style: 'currency',
    currency: currency,
  });

  const formattedAmount = formatter.format(amount);

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle>{t('yourSubscription')}</CardTitle>
        <CardDescription>{t('subscriptionDetails')}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-1">
          <p className="text-sm font-medium">{t('planLabel')}</p>
          <p>{productName}</p>
        </div>
        <div className="space-y-1">
          <p className="text-sm font-medium">{t('priceLabel')}</p>
          <p>{formattedAmount} / {interval}</p>
        </div>
        <div className="space-y-1">
          <p className="text-sm font-medium">{t('currentPeriod')}</p>
          <p>{currentPeriodStart} - {currentPeriodEnd}</p>
        </div>
        <div className="space-y-1">
          <p className="text-sm font-medium">{t('status')}</p>
          <p className="capitalize">{subscription.status}</p>
        </div>
      </CardContent>
      <CardFooter>
        <Button variant="outline" className="w-full">
          {t('manageSubscription')}
        </Button>
      </CardFooter>
    </Card>
  );
};
