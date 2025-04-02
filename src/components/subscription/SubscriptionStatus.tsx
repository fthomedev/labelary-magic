
import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useStripe } from "@/hooks/useStripe";
import { Button } from "@/components/ui/button";
import { useTranslation } from "react-i18next";
import { supabase } from "@/integrations/supabase/client";
import { useUsageLimits } from "@/hooks/useUsageLimits";

export const SubscriptionStatus = () => {
  const { t, i18n } = useTranslation();
  const [subscription, setSubscription] = useState<any>(null);
  const [freeUsage, setFreeUsage] = useState<number | null>(null);
  const { getCustomerSubscription, isLoading } = useStripe();
  const { checkUsageLimit } = useUsageLimits();

  useEffect(() => {
    const loadSubscriptionData = async () => {
      // Get stripe subscription if it exists
      const data = await getCustomerSubscription();
      
      if (data && data.length > 0) {
        setSubscription(data[0]);
      } else {
        // If no stripe subscription, check usage for free plan
        await loadFreeUsage();
      }
    };
    
    const loadFreeUsage = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        
        if (user) {
          // Get free tier usage from RPC function
          const { data: usageData, error } = await (supabase.rpc as any)(
            'check_free_tier_usage', 
            { user_id_param: user.id }
          );
          
          if (error) {
            console.error('Error fetching free usage data:', error);
            return;
          }
          
          setFreeUsage(usageData as number);
        }
      } catch (error) {
        console.error('Error loading free usage data:', error);
      }
    };
    
    loadSubscriptionData();
  }, []);

  if (isLoading) {
    return (
      <div className="flex justify-center p-8">
        <p>{t('loadingSubscription')}</p>
      </div>
    );
  }

  // Render card for free plan
  if (!subscription) {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardHeader>
          <CardTitle>{t('yourSubscription')}</CardTitle>
          <CardDescription>{t('subscriptionDetails')}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1">
            <p className="text-sm font-medium">{t('planLabel')}</p>
            <p>{t('freePlan')}</p>
          </div>
          <div className="space-y-1">
            <p className="text-sm font-medium">{t('usageLimit')}</p>
            <p>{t('freeDailyLimit', { count: 10 })}</p>
          </div>
          <div className="space-y-1">
            <p className="text-sm font-medium">{t('currentUsage')}</p>
            <p>{freeUsage !== null ? `${freeUsage}/10` : t('loading')}</p>
          </div>
          <div className="space-y-1">
            <p className="text-sm font-medium">{t('status')}</p>
            <p>{t('active')}</p>
          </div>
        </CardContent>
        <CardFooter>
          <Button 
            variant="default" 
            className="w-full"
            onClick={() => document.querySelector('[value="plans"]')?.dispatchEvent(new MouseEvent('click'))}
          >
            {t('upgradePlan')}
          </Button>
        </CardFooter>
      </Card>
    );
  }

  // Format dates for paid plans
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
