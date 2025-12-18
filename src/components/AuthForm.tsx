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
import { Eye, EyeOff, Check, X } from "lucide-react";
import { cn } from "@/lib/utils";

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
  const [showPassword, setShowPassword] = useState(false);
  
  // Validation states
  const [nameError, setNameError] = useState<string | null>(null);
  const [emailError, setEmailError] = useState<string | null>(null);
  const [nameTouched, setNameTouched] = useState(false);
  const [emailTouched, setEmailTouched] = useState(false);
  const [passwordTouched, setPasswordTouched] = useState(false);
  
  const captchaRef = useRef<TurnstileInstance>(null);
  const { t } = useTranslation();
  const { toast } = useToast();

  // Password requirements check
  const passwordChecks = {
    minLength: password.length >= 8,
    hasLowercase: /[a-z]/.test(password),
    hasUppercase: /[A-Z]/.test(password),
    hasDigit: /[0-9]/.test(password),
    hasSymbol: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password),
  };

  const isPasswordValid = Object.values(passwordChecks).every(Boolean);

  const validateName = (value: string): string | null => {
    if (value.length > 0 && value.length < 2) {
      return t("nameTooShort");
    }
    return null;
  };

  const validateEmail = (value: string): string | null => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (value.length > 0 && !emailRegex.test(value)) {
      return t("invalidEmail");
    }
    return null;
  };

  const validatePassword = (password: string) => {
    if (password.length < 8) {
      return t("passwordTooShort");
    }
    
    if (!passwordChecks.hasLowercase || !passwordChecks.hasUppercase || !passwordChecks.hasDigit || !passwordChecks.hasSymbol) {
      return t("passwordRequirements");
    }
    
    return null;
  };

  // Handlers
  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setName(value);
    if (nameTouched) {
      setNameError(validateName(value));
    }
  };

  const handleNameBlur = () => {
    setNameTouched(true);
    setNameError(validateName(name));
  };

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setEmail(value);
    if (emailTouched) {
      setEmailError(validateEmail(value));
    }
  };

  const handleEmailBlur = () => {
    setEmailTouched(true);
    setEmailError(validateEmail(email));
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPassword(e.target.value);
    if (!passwordTouched) {
      setPasswordTouched(true);
    }
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

  // Password strength indicator component
  const PasswordStrengthIndicator = () => {
    if (!isSignUp || !passwordTouched || password.length === 0) return null;
    
    return (
      <div className="mt-2 space-y-1 text-xs">
        <div className={cn("flex items-center gap-1.5", passwordChecks.minLength ? "text-green-600" : "text-muted-foreground")}>
          {passwordChecks.minLength ? <Check className="h-3 w-3" /> : <X className="h-3 w-3" />}
          {t("pwReqMinLength")}
        </div>
        <div className={cn("flex items-center gap-1.5", passwordChecks.hasLowercase ? "text-green-600" : "text-muted-foreground")}>
          {passwordChecks.hasLowercase ? <Check className="h-3 w-3" /> : <X className="h-3 w-3" />}
          {t("pwReqLowercase")}
        </div>
        <div className={cn("flex items-center gap-1.5", passwordChecks.hasUppercase ? "text-green-600" : "text-muted-foreground")}>
          {passwordChecks.hasUppercase ? <Check className="h-3 w-3" /> : <X className="h-3 w-3" />}
          {t("pwReqUppercase")}
        </div>
        <div className={cn("flex items-center gap-1.5", passwordChecks.hasDigit ? "text-green-600" : "text-muted-foreground")}>
          {passwordChecks.hasDigit ? <Check className="h-3 w-3" /> : <X className="h-3 w-3" />}
          {t("pwReqNumber")}
        </div>
        <div className={cn("flex items-center gap-1.5", passwordChecks.hasSymbol ? "text-green-600" : "text-muted-foreground")}>
          {passwordChecks.hasSymbol ? <Check className="h-3 w-3" /> : <X className="h-3 w-3" />}
          {t("pwReqSymbol")}
        </div>
      </div>
    );
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
              onChange={handleNameChange}
              onBlur={handleNameBlur}
              required
              minLength={2}
              placeholder={t("nameRequired")}
              className={cn(nameError && nameTouched && "border-destructive")}
            />
            {nameError && nameTouched && (
              <p className="text-sm text-destructive">{nameError}</p>
            )}
          </div>
        )}
        <div className="space-y-2">
          <Label htmlFor="email">
            {t("email")} {isSignUp && <span className="text-destructive">*</span>}
          </Label>
          <Input
            id="email"
            type="email"
            value={email}
            onChange={handleEmailChange}
            onBlur={handleEmailBlur}
            required
            className={cn(emailError && emailTouched && "border-destructive")}
          />
          {emailError && emailTouched && (
            <p className="text-sm text-destructive">{emailError}</p>
          )}
        </div>
        <div className="space-y-2">
          <Label htmlFor="password">
            {t("password")} {isSignUp && <span className="text-destructive">*</span>}
          </Label>
          <div className="relative">
            <Input
              id="password"
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={handlePasswordChange}
              required
              minLength={8}
              placeholder={isSignUp ? t("passwordPlaceholder") : undefined}
              className={cn(
                "pr-10",
                isSignUp && passwordTouched && !isPasswordValid && password.length > 0 && "border-destructive"
              )}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
              tabIndex={-1}
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          <PasswordStrengthIndicator />
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