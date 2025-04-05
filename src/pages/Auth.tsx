
import { useEffect } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { AuthForm } from "@/components/AuthForm";
import { supabase } from "@/integrations/supabase/client";
import { LanguageSelector } from "@/components/LanguageSelector";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { useTranslation } from "react-i18next";

const Auth = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const showSignUp = searchParams.get('signup') === 'true';
  const { t } = useTranslation();

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        navigate("/app");
      }
    };

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (session) {
        navigate("/app");
      }
    });

    checkAuth();

    return () => {
      subscription.unsubscribe();
    };
  }, [navigate]);

  return (
    <div className="flex flex-col items-center justify-center bg-gradient-to-b from-background to-secondary/20 px-4 py-8 flex-grow">
      <div className="w-full max-w-screen-xl mx-auto">
        <div className="grid grid-cols-1 gap-8">
          {/* Navigation row - fixed at top with proper spacing */}
          <div className="w-full flex justify-between items-center mb-6">
            <Button variant="ghost" size="sm" asChild className="z-10">
              <Link to="/" className="flex items-center gap-1">
                <ArrowLeft className="h-4 w-4" />
                {t('back')}
              </Link>
            </Button>
            
            <LanguageSelector />
          </div>
          
          {/* Auth form - centered in the page */}
          <div className="flex justify-center w-full">
            <AuthForm initialTab={showSignUp ? 'signup' : 'login'} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Auth;
