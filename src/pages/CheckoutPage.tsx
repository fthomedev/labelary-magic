
import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useStripe } from "@/hooks/useStripe";
import { Loader2, AlertCircle } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { Alert, AlertDescription } from "@/components/ui/alert";

const CheckoutPage = () => {
  const { t } = useTranslation();
  const location = useLocation();
  const navigate = useNavigate();
  const [plan, setPlan] = useState<any>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const { createCheckoutSession } = useStripe();
  const { toast } = useToast();

  useEffect(() => {
    if (location.state && location.state.plan) {
      setPlan(location.state.plan);
    } else {
      // Redirect to subscription page if no plan is available
      navigate('/subscription');
    }
  }, [location.state, navigate]);

  if (!plan) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Card>
          <CardContent className="flex flex-col items-center justify-center">
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            <p>{t('redirecting')}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Process the checkout using the provided plan
  const processCheckout = async () => {
    setIsProcessing(true);
    try {
      // Determine which ID to use for checkout
      let checkoutId = null;
      
      // Prioritize using the productId
      if (plan?.productId) {
        console.log('Using product ID for checkout:', plan.productId);
        checkoutId = plan.productId;
      }
      // Fall back to priceId if productId is not available
      else if (plan?.priceId) {
        console.log('Using price ID for checkout:', plan.priceId);
        checkoutId = plan.priceId;
      }
      // As a last resort, use the plan ID
      else if (plan?.id) {
        console.log('Using plan ID for checkout:', plan.id);
        checkoutId = plan.id;
      }
      
      if (!checkoutId) {
        throw new Error('Invalid plan data structure - no valid ID found');
      }
      
      // Call the checkout session creation function
      // The actual redirect now happens in the useCheckoutSession hook
      await createCheckoutSession(checkoutId);
      setIsProcessing(false);
      
    } catch (error) {
      console.error('Checkout error:', error);
      toast({
        variant: 'destructive',
        title: t('error'),
        description: t('errorProcessingCheckout')
      });
      setIsProcessing(false);
    }
  };

  return (
    <div className="flex justify-center items-center h-screen bg-gray-100">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>{t('checkout')}</CardTitle>
          <CardDescription>{t('confirmSubscription')}</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4">
          <div className="space-y-2">
            <h3 className="text-lg font-semibold">{plan.name}</h3>
            <p className="text-gray-500">{plan.description}</p>
            <p className="text-gray-700">{t('price')}: {plan.price} {plan.currency}</p>
          </div>
          
          <Alert variant="warning" className="bg-amber-50 border-amber-200">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Ambiente de teste Stripe - Use apenas cartões de teste. 
              Ex: 4242 4242 4242 4242 (Visa) ou 5555 5555 5555 4444 (Mastercard)
            </AlertDescription>
          </Alert>
        </CardContent>
        <CardFooter>
          <Button 
            className="w-full" 
            onClick={processCheckout} 
            disabled={isProcessing}
          >
            {isProcessing ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {t('processing')}
              </>
            ) : (
              t('confirmAndPay')
            )}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
};

export default CheckoutPage;
