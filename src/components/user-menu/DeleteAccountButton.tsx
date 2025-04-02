
import { useState } from "react";
import { Trash2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export const DeleteAccountButton = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [showFinalConfirmation, setShowFinalConfirmation] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleInitialConfirm = () => {
    setShowFinalConfirmation(true);
  };

  const handleFinalConfirmation = async () => {
    try {
      setIsDeleting(true);
      
      const { data, error } = await supabase.rpc('delete_user');
      
      if (error) throw error;
      
      await supabase.auth.signOut();
      setShowFinalConfirmation(false);
      navigate("/auth");
      toast({
        title: t("success"),
        description: t("accountDeleted"),
      });
    } catch (error: any) {
      console.error("Error deleting account:", error);
      toast({
        variant: "destructive",
        title: t("error"),
        description: error.message,
      });
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <>
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
            <AlertDialogDescription className="text-base space-y-2">
              <p>{t("deleteAccountWarning")}</p>
              <p className="font-semibold text-destructive">
                {t("deleteAccountConsequences")}
              </p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2 sm:gap-0">
            <AlertDialogCancel className="mt-0">
              {t("cancel")}
            </AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={handleInitialConfirm}
            >
              {t("confirm")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={showFinalConfirmation} onOpenChange={setShowFinalConfirmation}>
        <DialogContent hideCloseButton>
          <DialogHeader>
            <DialogTitle className="text-destructive">
              {t("finalDeleteConfirm")}
            </DialogTitle>
            <DialogDescription className="pt-2 space-y-2">
              <p>{t("finalDeleteWarning")}</p>
              <ul className="list-disc list-inside space-y-1 pt-2">
                <li>{t("deleteAccountEffect1")}</li>
                <li>{t("deleteAccountEffect2")}</li>
                <li>{t("deleteAccountEffect3")}</li>
              </ul>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowFinalConfirmation(false)}
              disabled={isDeleting}
            >
              {t("cancel")}
            </Button>
            <Button
              variant="destructive"
              onClick={handleFinalConfirmation}
              disabled={isDeleting}
            >
              {isDeleting ? t("processing") : t("deleteAccountFinal")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};
