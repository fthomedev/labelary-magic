
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useTranslation } from "react-i18next";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";

export const LogoutButton = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
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

  return (
    <Button variant="ghost" onClick={handleLogout}>
      {t("logout")}
    </Button>
  );
};
