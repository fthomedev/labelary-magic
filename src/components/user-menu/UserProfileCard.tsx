
import { User } from "lucide-react";
import { useTranslation } from "react-i18next";

interface UserProfileCardProps {
  userData: {
    name: string | null;
    email: string | null;
  } | null;
}

export const UserProfileCard = ({ userData }: UserProfileCardProps) => {
  const { t } = useTranslation();

  return (
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
  );
};
