
import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useStripe } from "@/hooks/useStripe";
import { Button } from "@/components/ui/button";
import { useTranslation } from "react-i18next";

export const SubscriptionStatus = () => {
  const { t, i18n } = useTranslation();
  const [subscription, setSubscription] = useState<any>(null);
  const { getCustomerSubscription, isLoading } = useStripe();

  useEffect(() => {
    const loadSubscription = async () => {
      const data = await getCustomerSubscription();
      if (data && data.length > 0) {
        setSubscription(data[0]);
      }
    };
    
    loadSubscription();
  }, []);

  if (isLoading) {
    return (
      <div className="flex justify-center p-8">
        <p>{t('loadingSubscription')}</p>
      </div>
    );
  }

  if (!subscription) {
    return (
      <div className="flex justify-center p-8">
        <p>{t('noActiveSubscription')}</p>
      </div>
    );
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
