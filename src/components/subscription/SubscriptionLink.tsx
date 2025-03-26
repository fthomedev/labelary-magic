
import { Button } from "@/components/ui/button";
import { CreditCard } from "lucide-react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";

export const SubscriptionLink = () => {
  const { t } = useTranslation();
  
  return (
    <Button variant="outline" asChild>
      <Link to="/subscription" className="flex items-center gap-2">
        <CreditCard className="h-4 w-4" />
        {t('subscriptionPage')}
      </Link>
    </Button>
  );
};
