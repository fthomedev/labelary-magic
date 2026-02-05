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
    const handleRecoveryFlow = async () => {
      const urlParams = new URLSearchParams(window.location.search);
      const code = urlParams.get('code');
      const tokenHash = urlParams.get('token_hash');
      const type = urlParams.get('type');
      const errorParam = urlParams.get('error');
      const errorDescription = urlParams.get('error_description');

      // Handle error from Supabase redirect
      if (errorParam) {
        console.error('❌ Auth error from redirect:', errorParam, errorDescription);
        setIsValidSession(false);
        return;
      }

      // Method 1: Try token_hash with verifyOtp (more reliable, doesn't require code_verifier)
      if (tokenHash && type === 'recovery') {
        console.log('🔐 Found token_hash, verifying with verifyOtp...');
        try {
          const { data, error } = await supabase.auth.verifyOtp({
            token_hash: tokenHash,
            type: 'recovery',
          });
          
          if (error) {
            console.error('❌ Error verifying token_hash:', error.message);
            setIsValidSession(false);
            return;
          }
          
          if (data.session) {
            console.log('✅ Session established via verifyOtp');
            setIsValidSession(true);
            window.history.replaceState({}, '', '/auth/reset-password');
            return;
          }
        } catch (error: any) {
          console.error('❌ Exception verifying token_hash:', error.message);
          setIsValidSession(false);
          return;
        }
      }

      // Method 2: Try PKCE code exchange
      if (code) {
        console.log('🔐 Found PKCE code, exchanging for session...');
        try {
          const { data, error } = await supabase.auth.exchangeCodeForSession(code);
          
          if (error) {
            console.error('❌ Error exchanging code for session:', error.message);
            
            // Check if it's a code_verifier issue (link opened in different browser/tab)
            if (error.message.includes('code verifier') || 
                error.message.includes('PKCE') ||
                error.message.includes('non-empty')) {
              console.log('⚠️ PKCE code_verifier not found - likely opened in different browser or localStorage cleared');
            }
            
            setIsValidSession(false);
            return;
          }
          
          if (data.session) {
            console.log('✅ Session established via PKCE');
            setIsValidSession(true);
            window.history.replaceState({}, '', '/auth/reset-password');
            return;
          }
        } catch (error: any) {
          console.error('❌ Exception exchanging code:', error.message);
          setIsValidSession(false);
          return;
        }
      }

      // Fallback: Check for existing session (in case user refreshes after code exchange)
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session) {
        console.log('✅ Existing session found');
        setIsValidSession(true);
        return;
      }

      // Check for hash-based tokens (legacy flow)
      const hashParams = new URLSearchParams(window.location.hash.substring(1));
      const accessToken = hashParams.get('access_token');
      const refreshToken = hashParams.get('refresh_token');
      
      if (accessToken && refreshToken) {
        console.log('🔐 Found hash-based tokens, setting session...');
        try {
          const { error } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          });
          
          if (!error) {
            console.log('✅ Session set from hash tokens');
            setIsValidSession(true);
            window.history.replaceState({}, '', '/auth/reset-password');
            return;
          }
        } catch (e) {
          console.error('❌ Error setting session from hash:', e);
        }
      }

      // Listen for auth state changes (PASSWORD_RECOVERY event)
      const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
        console.log('🔄 Auth state change:', event);
        if (event === 'PASSWORD_RECOVERY' || (event === 'SIGNED_IN' && session)) {
          setIsValidSession(true);
        }
      });

      // If no auth method found in URL, mark as invalid immediately
      if (!code && !tokenHash && !accessToken) {
        console.log('⚠️ No auth code or tokens found in URL');
        setIsValidSession(false);
        return () => subscription.unsubscribe();
      }

      // Give more time for auth state to settle (30 seconds for slow connections)
      setTimeout(() => {
        setIsValidSession(prev => {
          if (prev === null) {
            console.log('⏱️ Timeout reached (30s), no valid session found');
            return false;
          }
          return prev;
        });
      }, 30000);

      return () => subscription.unsubscribe();
    };

    handleRecoveryFlow();
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

      // IMPORTANTE: Fazer logout para forçar o usuário a logar novamente
      await supabase.auth.signOut();

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
                      t("saveNewPassword")
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
