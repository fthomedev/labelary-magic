
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useTranslation } from "react-i18next";
import { CheckCircle2 } from "lucide-react";
import { LanguageSelector } from "@/components/LanguageSelector";

const SubscriptionSuccess = () => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();

  // Force component to re-render when language changes
  useEffect(() => {
    // This is intentionally empty, just to trigger re-render on i18n change
  }, [i18n.language]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-background to-secondary/20 px-4 py-8">
      <div className="absolute top-4 right-4 z-10">
        <LanguageSelector />
      </div>
      
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <CheckCircle2 className="h-16 w-16 text-green-500" />
          </div>
          <CardTitle className="text-2xl">{t('subscriptionSuccess')}</CardTitle>
          <CardDescription>{t('subscriptionSuccessMessage')}</CardDescription>
        </CardHeader>
        <CardContent className="text-center">
          <p className="mb-4">{t('subscriptionThankYou')}</p>
        </CardContent>
        <CardFooter className="flex justify-center">
          <Button onClick={() => navigate("/subscription")}>
            {t('viewSubscription')}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
};

export default SubscriptionSuccess;
