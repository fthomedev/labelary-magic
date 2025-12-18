import { useState, useRef } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Checkbox } from "@/components/ui/checkbox";
import { Turnstile, TurnstileInstance } from '@marsidev/react-turnstile';

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
  const [rememberMe, setRememberMe] = useState(false);
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);
  const [honeypot, setHoneypot] = useState("");
  const captchaRef = useRef<TurnstileInstance>(null);
  const { t } = useTranslation();
  const { toast } = useToast();

  const validatePassword = (password: string) => {
    if (password.length < 8) {
      return t("passwordTooShort");
    }
    
    const hasLowercase = /[a-z]/.test(password);
    const hasUppercase = /[A-Z]/.test(password);
    const hasDigit = /[0-9]/.test(password);
    const hasSymbol = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password);
    
    if (!hasLowercase || !hasUppercase || !hasDigit || !hasSymbol) {
      return t("passwordRequirements");
    }
    
    return null;
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Honeypot check - bots fill hidden fields
    if (isSignUp && honeypot) {
      return; // Silently fail for bots
    }
    
    if (isSignUp && !name.trim()) {
      toast({
        variant: "destructive",
        title: t("error"),
        description: t("nameRequired"),
      });
      return;
    }
    
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
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            captchaToken: captchaToken || undefined,
            data: {
              name: name,
            },
            emailRedirectTo: `${window.location.origin}/auth`,
          },
        });
        if (error) throw error;

        // Check if email already exists (Supabase returns user with empty identities)
        if (data.user && data.user.identities && data.user.identities.length === 0) {
          toast({
            variant: "destructive",
            title: t("error"),
            description: t("emailAlreadyInUse"),
          });
          return;
        }

        toast({
          title: t("signUpSuccess"),
          description: t("checkYourEmail"),
        });
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        
        if (!error && rememberMe) {
          const { data } = await supabase.auth.getSession();
          if (data.session) {
            await supabase.auth.setSession({
              access_token: data.session.access_token,
              refresh_token: data.session.refresh_token,
            });
          }
        }
        
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
      // Reset captcha after each attempt
      if (isSignUp) {
        captchaRef.current?.reset();
        setCaptchaToken(null);
      }
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
            <Label htmlFor="name">
              {t("name")} <span className="text-destructive">*</span>
            </Label>
            <Input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              minLength={2}
              placeholder={t("nameRequired")}
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
            minLength={8}
            placeholder={isSignUp ? t("passwordPlaceholder") : undefined}
          />
        </div>
        
        {!isSignUp && (
          <div className="flex items-center space-x-2">
            <Checkbox 
              id="rememberMe" 
              checked={rememberMe} 
              onCheckedChange={(checked) => setRememberMe(checked as boolean)} 
            />
            <Label htmlFor="rememberMe" className="text-sm cursor-pointer">
              {t("rememberMe")}
            </Label>
          </div>
        )}

        {/* Anti-bot protection for signup */}
        {isSignUp && (
          <>
            {/* Honeypot field - invisible to users, bots fill it */}
            <div style={{ position: 'absolute', left: '-9999px' }} aria-hidden="true">
              <input
                type="text"
                name="website"
                value={honeypot}
                onChange={(e) => setHoneypot(e.target.value)}
                tabIndex={-1}
                autoComplete="off"
              />
            </div>
            
            {/* Cloudflare Turnstile CAPTCHA */}
            <div className="flex justify-center">
              <Turnstile
                ref={captchaRef}
                siteKey={import.meta.env.VITE_TURNSTILE_SITE_KEY}
                onSuccess={setCaptchaToken}
                onError={() => setCaptchaToken(null)}
                onExpire={() => setCaptchaToken(null)}
                options={{ theme: 'light', size: 'normal' }}
              />
            </div>
          </>
        )}

        <Button type="submit" className="w-full" disabled={isLoading || (isSignUp && !captchaToken)}>
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
