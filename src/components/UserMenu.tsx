
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Menu, User } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { useIsMobile } from "@/hooks/use-mobile";
import { UserProfileCard } from "./user-menu/UserProfileCard";
import { NavigationButtons } from "./user-menu/NavigationButtons";
import { DeleteAccountButton } from "./user-menu/DeleteAccountButton";
import { useUserData } from "./user-menu/useUserData";

export const UserMenu = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { t } = useTranslation();
  const isMobile = useIsMobile();
  const { userData, loadUserData } = useUserData();

  const handleOpen = () => {
    loadUserData();
  };

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative flex items-center justify-center w-9 h-9"
          onClick={handleOpen}
          aria-label={t("myAccount")}
        >
          {isMobile ? (
            <User className="h-4 w-4" />
          ) : (
            <Menu className="h-5 w-5" />
          )}
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
            <UserProfileCard userData={userData} />
          </div>
          <div className="space-y-3">
            <NavigationButtons onClose={() => setIsOpen(false)} />
            <DeleteAccountButton />
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};
