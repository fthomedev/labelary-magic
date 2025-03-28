
import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { CreditCard, ArrowLeft, LoaderCircle } from "lucide-react";
import { useStripe } from "@/hooks/useStripe";
import { UserMenu } from "@/components/UserMenu";
import { LanguageSelector } from "@/components/LanguageSelector";
import { useTranslation } from "react-i18next";

const CheckoutPage = () => {
  const { t } = useTranslation();
  const location = useLocation();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { createCheckoutSession, isLoading } = useStripe();
  const [planDetails, setPlanDetails] = useState<any>(null);

  // Extract plan info from location state
  useEffect(() => {
    console.log('Location state:', location.state);
    
    if (location.state?.plan) {
      console.log('Setting plan details from location state:', location.state.plan);
      setPlanDetails(location.state.plan);
    } else {
      // If no plan was selected, redirect back to subscription page
      console.error('No plan details found in location state');
      toast({
        variant: "destructive",
        title: t('error'),
        description: t('noPlanSelected'),
      });
      navigate("/subscription");
    }
  }, [location.state, navigate, toast, t]);

  const handleProceedToCheckout = async () => {
    if (!planDetails) {
      console.error('No plan details available');
      toast({
        variant: "destructive",
        title: t('error'),
        description: t('invalidPlanData'),
      });
      return;
    }

    console.log('Proceeding to checkout with plan:', planDetails);
    
    try {
      // Determine what ID to use for checkout
      let checkoutId;
      
      // For product objects with productId
      if (planDetails.productId) {
        checkoutId = planDetails.productId;
        console.log(`Using product ID for checkout: ${checkoutId}`);
      } 
      // For Stripe price objects
      else if (planDetails.product && planDetails.id) {
        checkoutId = planDetails.id;
        console.log(`Using price ID for checkout: ${checkoutId}`);
      } 
      // Fallback for simplified objects
      else if (planDetails.id) {
        checkoutId = planDetails.id;
        console.log(`Using ID for checkout: ${checkoutId}`);
      } else {
        throw new Error('Invalid plan data structure - no valid ID found');
      }
      
      await createCheckoutSession(checkoutId);
    } catch (error) {
      console.error('Checkout error:', error);
      toast({
        variant: "destructive",
        title: t('error'),
        description: t('errorCreatingCheckout'),
      });
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-background to-secondary/20 px-4 py-8">
      <div className="absolute top-4 right-4 z-10 flex items-center gap-4">
        <LanguageSelector />
        <UserMenu />
      </div>

      <div className="absolute top-4 left-4 z-10">
        <Button 
          variant="ghost" 
          onClick={() => navigate("/subscription")}
          className="flex items-center gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          {t('back')}
        </Button>
      </div>
      
      <div className="flex-1 container max-w-md mx-auto mt-16 flex items-center justify-center">
        <Card className="w-full">
          <CardHeader>
            <CardTitle className="text-xl flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              {t('checkoutTitle')}
            </CardTitle>
            <CardDescription>
              {t('checkoutDescription')}
            </CardDescription>
          </CardHeader>
          
          <CardContent className="space-y-4">
            {planDetails ? (
              <div className="border rounded-md p-4 space-y-2">
                <div className="flex justify-between">
                  <span className="font-medium">{t('planLabel')}:</span>
                  <span>{planDetails.name || planDetails.product?.name || '-'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium">{t('priceLabel')}:</span>
                  <span>
                    {planDetails.price ? 
                      `${planDetails.currency || 'R$'} ${planDetails.price}` : 
                      new Intl.NumberFormat('pt-BR', { 
                        style: 'currency', 
                        currency: planDetails.currency || 'BRL' 
                      }).format((planDetails.unit_amount || 0) / 100)
                    }
                    /{t('month')}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium">{t('features')}:</span>
                  <span>{planDetails.product?.metadata?.limit || planDetails.features?.[0] || '-'}</span>
                </div>
              </div>
            ) : (
              <div className="flex justify-center py-4">
                <LoaderCircle className="h-8 w-8 animate-spin" />
              </div>
            )}

            <div className="bg-muted/50 rounded-md p-4">
              <h3 className="font-medium mb-2">{t('paymentSecureNote')}</h3>
              <p className="text-sm text-muted-foreground">
                {t('stripeSecureMessage')}
              </p>
            </div>
          </CardContent>
          
          <CardFooter>
            <Button 
              onClick={handleProceedToCheckout} 
              className="w-full" 
              size="lg"
              disabled={isLoading || !planDetails}
            >
              {isLoading ? (
                <>
                  <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
                  {t('processing')}
                </>
              ) : (
                <>
                  {t('proceedToCheckout')}
                </>
              )}
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
};

export default CheckoutPage;
