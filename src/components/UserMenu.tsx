
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Menu, User, Trash2, LogOut, CreditCard, Home } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useNavigate, useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useIsMobile } from "@/hooks/use-mobile";

export const UserMenu = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { t } = useTranslation();
  const { toast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const isMobile = useIsMobile();
  const [userData, setUserData] = useState<{
    name: string | null;
    email: string | null;
  } | null>(null);

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

  const handleDeleteAccount = async () => {
    try {
      // Usando type assertion para contornar a verificação de tipo
      const result = await (supabase.rpc as any)('delete_user');
      if (result.error) throw result.error;
      
      await supabase.auth.signOut();
      navigate("/auth");
      toast({
        title: t("success"),
        description: t("accountDeleted"),
      });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: t("error"),
        description: error.message,
      });
    }
  };

  const loadUserData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('name, email')
          .eq('id', user.id)
          .single();
        
        if (profile) {
          setUserData(profile);
        }
      }
    } catch (error) {
      console.error('Error loading user data:', error);
    }
  };

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative"
          onClick={() => {
            loadUserData();
          }}
        >
          <Menu className="h-5 w-5" />
        </Button>
      </SheetTrigger>
      <SheetContent side={isMobile ? "bottom" : "right"} className="w-full sm:max-w-md">
        <SheetHeader className="space-y-2.5">
          <SheetTitle className="text-xl font-semibold">
            {t("userMenu")}
          </SheetTitle>
        </SheetHeader>
        <div className="mt-8 space-y-8">
          <div className="space-y-4">
            <div className="flex items-center gap-4 rounded-lg bg-muted/50 p-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                <User className="h-5 w-5 text-primary" />
              </div>
              <div className="space-y-1">
                <p className="text-sm font-medium">
                  {userData?.name || t("unnamed")}
                </p>
                <p className="text-sm text-muted-foreground">
                  {userData?.email}
                </p>
              </div>
            </div>
          </div>
          <div className="space-y-3">
            {location.pathname !== "/" && (
              <Button
                variant="outline"
                className="w-full justify-start gap-2 text-base font-normal"
                onClick={() => {
                  setIsOpen(false);
                  navigate("/");
                }}
              >
                <Home className="h-4 w-4" />
                {t("home")}
              </Button>
            )}

            {location.pathname !== "/subscription" && (
              <Button
                variant="outline"
                className="w-full justify-start gap-2 text-base font-normal"
                onClick={() => {
                  setIsOpen(false);
                  navigate("/subscription");
                }}
              >
                <CreditCard className="h-4 w-4" />
                {t("subscriptionPage")}
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
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  variant="destructive"
                  className="w-full justify-start gap-2 text-base font-normal"
                >
                  <Trash2 className="h-4 w-4" />
                  {t("deleteAccount")}
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle className="text-lg">
                    {t("deleteAccountConfirm")}
                  </AlertDialogTitle>
                  <AlertDialogDescription className="text-base">
                    {t("deleteAccountWarning")}
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter className="gap-2 sm:gap-0">
                  <AlertDialogCancel className="mt-0">
                    {t("cancel")}
                  </AlertDialogCancel>
                  <AlertDialogAction
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    onClick={handleDeleteAccount}
                  >
                    {t("confirm")}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};

