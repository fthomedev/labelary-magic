
import { CreditCard, Home, LogOut, HelpCircle } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface NavigationButtonsProps {
  onClose: () => void;
  onStartTour?: () => void;
}

export const NavigationButtons = ({ onClose, onStartTour }: NavigationButtonsProps) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();

  const handleLogout = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      navigate("/auth");
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: t("error"),
        description: error.message,
      });
    }
  };

  // Prevent default behavior and navigate using React Router
  const handleNavigation = (path: string) => {
    onClose();
    navigate(path);
  };

  return (
    <div className="space-y-3">
      {location.pathname !== "/" && (
        <Button
          variant="outline"
          className="w-full justify-start gap-2 text-base font-normal"
          onClick={() => handleNavigation("/")}
        >
          <Home className="h-4 w-4" />
          {t("home")}
        </Button>
      )}

      {/* Commented out the subscription link */}
      {/* {location.pathname !== "/subscription" && (
        <Button
          variant="outline"
          className="w-full justify-start gap-2 text-base font-normal"
          onClick={() => handleNavigation("/subscription")}
        >
          <CreditCard className="h-4 w-4" />
          {t("subscriptionPage")}
        </Button>
      )} */}

      {location.pathname === "/app" && onStartTour && (
        <Button
          variant="outline"
          className="w-full justify-start gap-2 text-base font-normal"
          onClick={() => {
            onClose();
            onStartTour();
          }}
        >
          <HelpCircle className="h-4 w-4" />
          {t("onboarding.reviewTour")}
        </Button>
      )}

      <Button
        variant="outline"
        className="w-full justify-start gap-2 text-base font-normal"
        onClick={handleLogout}
      >
        <LogOut className="h-4 w-4" />
        {t("logout")}
      </Button>
    </div>
  );
};
