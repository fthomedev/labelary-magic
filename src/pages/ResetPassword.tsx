import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";
import { LanguageSelector } from "@/components/LanguageSelector";
import { ArrowLeft, Eye, EyeOff, Check, X, KeyRound, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

const ResetPassword = () => {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordTouched, setPasswordTouched] = useState(false);
  const [isValidSession, setIsValidSession] = useState<boolean | null>(null);
  
  const navigate = useNavigate();
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
  const passwordsMatch = password === confirmPassword && confirmPassword.length > 0;

  useEffect(() => {
    // Check if we have a valid recovery session
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      // Listen for auth state changes (recovery event)
      const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
        if (event === 'PASSWORD_RECOVERY') {
          setIsValidSession(true);
        } else if (session) {
          setIsValidSession(true);
        }
      });

      // If there's already a session, we can proceed
      if (session) {
        setIsValidSession(true);
      } else {
        // Give a moment for the auth state to update
        setTimeout(() => {
          if (isValidSession === null) {
            setIsValidSession(false);
          }
        }, 2000);
      }

      return () => subscription.unsubscribe();
    };

    checkSession();
  }, []);

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isPasswordValid) {
      toast({
        variant: "destructive",
        title: t("error"),
        description: t("passwordRequirements"),
      });
      return;
    }

    if (!passwordsMatch) {
      toast({
        variant: "destructive",
        title: t("error"),
        description: t("passwordsDontMatch"),
      });
      return;
    }

    setIsLoading(true);

    try {
      const { error } = await supabase.auth.updateUser({
        password: password,
      });

      if (error) throw error;

      toast({
        title: t("passwordResetSuccess"),
        description: t("passwordResetSuccessDesc"),
      });

      // Redirect to login after successful password reset
      setTimeout(() => {
        navigate("/auth");
      }, 2000);
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

  // Password strength indicator component
  const PasswordStrengthIndicator = () => {
    if (!passwordTouched || password.length === 0) return null;

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

  // Loading state while checking session
  if (isValidSession === null) {
    return (
      <div className="flex flex-col items-center justify-center bg-gradient-to-b from-background to-secondary/20 px-4 py-8 flex-grow">
        <div className="flex items-center gap-2">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span>{t("loading")}</span>
        </div>
      </div>
    );
  }

  // Invalid or expired link
  if (isValidSession === false) {
    return (
      <div className="flex flex-col items-center justify-center bg-gradient-to-b from-background to-secondary/20 px-4 py-8 flex-grow">
        <div className="w-full max-w-screen-xl mx-auto">
          <div className="grid grid-cols-1 gap-8">
            <div className="w-full flex justify-between items-center mb-6">
              <Button variant="ghost" size="sm" asChild className="z-10">
                <Link to="/auth" className="flex items-center gap-1">
                  <ArrowLeft className="h-4 w-4" />
                  {t("backToLogin")}
                </Link>
              </Button>
              <LanguageSelector />
            </div>

            <div className="flex justify-center w-full">
              <Card className="w-full max-w-sm p-6 text-center">
                <CardHeader>
                  <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10">
                    <X className="h-8 w-8 text-destructive" />
                  </div>
                  <CardTitle>{t("linkExpiredTitle")}</CardTitle>
                  <CardDescription>{t("linkExpiredDescription")}</CardDescription>
                </CardHeader>
                <CardContent>
                  <Button asChild className="w-full">
                    <Link to="/auth">{t("requestNewLink")}</Link>
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center bg-gradient-to-b from-background to-secondary/20 px-4 py-8 flex-grow">
      <div className="w-full max-w-screen-xl mx-auto">
        <div className="grid grid-cols-1 gap-8">
          <div className="w-full flex justify-between items-center mb-6">
            <Button variant="ghost" size="sm" asChild className="z-10">
              <Link to="/auth" className="flex items-center gap-1">
                <ArrowLeft className="h-4 w-4" />
                {t("backToLogin")}
              </Link>
            </Button>
            <LanguageSelector />
          </div>

          <div className="flex justify-center w-full">
            <Card className="w-full max-w-sm">
              <CardHeader className="text-center">
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                  <KeyRound className="h-8 w-8 text-primary" />
                </div>
                <CardTitle>{t("createNewPassword")}</CardTitle>
                <CardDescription>{t("createNewPasswordDesc")}</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleResetPassword} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="password">{t("newPassword")}</Label>
                    <div className="relative">
                      <Input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        value={password}
                        onChange={(e) => {
                          setPassword(e.target.value);
                          if (!passwordTouched) setPasswordTouched(true);
                        }}
                        required
                        minLength={8}
                        placeholder={t("passwordPlaceholder")}
                        className={cn(
                          "pr-10",
                          passwordTouched && !isPasswordValid && password.length > 0 && "border-destructive"
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

                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword">{t("confirmPassword")}</Label>
                    <div className="relative">
                      <Input
                        id="confirmPassword"
                        type={showConfirmPassword ? "text" : "password"}
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        required
                        minLength={8}
                        className={cn(
                          "pr-10",
                          confirmPassword.length > 0 && !passwordsMatch && "border-destructive"
                        )}
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                        tabIndex={-1}
                      >
                        {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                    {confirmPassword.length > 0 && !passwordsMatch && (
                      <p className="text-sm text-destructive">{t("passwordsDontMatch")}</p>
                    )}
                    {passwordsMatch && (
                      <p className="text-sm text-green-600 flex items-center gap-1">
                        <Check className="h-3 w-3" />
                        {t("passwordsMatch")}
                      </p>
                    )}
                  </div>

                  <Button 
                    type="submit" 
                    className="w-full" 
                    disabled={isLoading || !isPasswordValid || !passwordsMatch}
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        {t("loading")}
                      </>
                    ) : (
                      t("resetPassword")
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResetPassword;
