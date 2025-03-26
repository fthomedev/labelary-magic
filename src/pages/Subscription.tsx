
import { useEffect, useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SubscriptionPlans } from "@/components/subscription/SubscriptionPlans";
import { SubscriptionStatus } from "@/components/subscription/SubscriptionStatus";
import { useStripe } from "@/hooks/useStripe";
import { useTranslation } from "react-i18next";
import { UserMenu } from "@/components/UserMenu";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { Home } from "lucide-react";
import { LanguageSelector } from "@/components/LanguageSelector";

const Subscription = () => {
  const { t, i18n } = useTranslation();
  const [hasSubscription, setHasSubscription] = useState(false);
  const { getCustomerSubscription } = useStripe();
  const navigate = useNavigate();
  const [forcedRender, setForcedRender] = useState(0);

  // Check if user has a subscription
  useEffect(() => {
    const checkSubscription = async () => {
      const subscription = await getCustomerSubscription();
      setHasSubscription(subscription && subscription.length > 0);
    };
    
    checkSubscription();
  }, []);

  // Force re-render when language changes
  useEffect(() => {
    const handleLanguageChanged = () => {
      setForcedRender(prev => prev + 1);
    };

    i18n.on('languageChanged', handleLanguageChanged);
    
    return () => {
      i18n.off('languageChanged', handleLanguageChanged);
    };
  }, [i18n]);

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-background to-secondary/20 px-4 py-8">
      <div className="absolute top-4 right-4 z-10 flex items-center gap-4">
        <LanguageSelector />
        <UserMenu />
      </div>
      
      <div className="absolute top-4 left-4 z-10">
        <Button 
          variant="ghost" 
          onClick={() => navigate("/")}
          className="flex items-center gap-2"
        >
          <Home className="h-4 w-4" />
          {t('home')}
        </Button>
      </div>
      
      <div className="flex-1 container max-w-6xl mx-auto mt-16">
        <h1 className="text-3xl font-bold text-center mb-8">{t('subscriptionPage')}</h1>
        
        <Tabs defaultValue={hasSubscription ? "status" : "plans"} className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-8">
            <TabsTrigger value="plans">{t('availablePlans')}</TabsTrigger>
            <TabsTrigger value="status">{t('yourSubscription')}</TabsTrigger>
          </TabsList>
          
          <TabsContent value="plans" className="mt-4">
            <SubscriptionPlans key={`plans-${forcedRender}`} />
          </TabsContent>
          
          <TabsContent value="status" className="mt-4">
            <SubscriptionStatus key={`status-${forcedRender}`} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Subscription;
