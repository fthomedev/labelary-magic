
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";

type AuthFormProps = {
  initialTab?: 'login' | 'signup';
}

export const AuthForm = ({ initialTab = 'login' }: AuthFormProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const [isSignUp, setIsSignUp] = useState(initialTab === 'signup');
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [isResetPassword, setIsResetPassword] = useState(false);
  const { t } = useTranslation();
  const { toast } = useToast();

  const validatePassword = (password: string) => {
    if (password.length < 6) {
      return t("passwordTooShort");
    }
    return null;
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (isSignUp || !isResetPassword) {
      const passwordError = validatePassword(password);
      if (passwordError) {
        toast({
          variant: "destructive",
          title: t("error"),
          description: passwordError,
        });
        return;
      }
    }

    setIsLoading(true);

    try {
      if (isResetPassword) {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/auth/reset-password`,
        });
        if (error) throw error;
        toast({
          title: t("resetPasswordEmailSent"),
          description: t("checkYourEmail"),
        });
      } else if (isSignUp) {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              name,
            },
          },
        });
        if (error) throw error;
        toast({
          title: t("signUpSuccess"),
          description: t("checkYourEmail"),
        });
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
      }
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: t("error"),
        description: error.message,
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (isResetPassword) {
    return (
      <Card className="w-full max-w-sm p-6">
        <form onSubmit={handleAuth} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">{t("email")}</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? t("sending") : t("sendResetLink")}
          </Button>
          <Button
            type="button"
            variant="ghost"
            className="w-full"
            onClick={() => setIsResetPassword(false)}
          >
            {t("backToLogin")}
          </Button>
        </form>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-sm p-6">
      <form onSubmit={handleAuth} className="space-y-4">
        {isSignUp && (
          <div className="space-y-2">
            <Label htmlFor="name">{t("name")}</Label>
            <Input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>
        )}
        <div className="space-y-2">
          <Label htmlFor="email">{t("email")}</Label>
          <Input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="password">{t("password")}</Label>
          <Input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={6}
          />
        </div>
        <Button type="submit" className="w-full" disabled={isLoading}>
          {isLoading ? t("loading") : isSignUp ? t("signUp") : t("login")}
        </Button>
        <div className="flex flex-col gap-2 pt-2">
          <Button
            type="button"
            variant="ghost"
            className="text-sm px-0 hover:bg-transparent h-auto py-0"
            onClick={() => setIsSignUp(!isSignUp)}
          >
            {isSignUp ? t("alreadyHaveAccount") : t("needAccount")}
          </Button>
          {!isSignUp && (
            <Button
              type="button"
              variant="ghost"
              className="text-sm px-0 hover:bg-transparent h-auto py-0"
              onClick={() => setIsResetPassword(true)}
            >
              {t("forgotPassword")}
            </Button>
          )}
        </div>
      </form>
    </Card>
  );
};
