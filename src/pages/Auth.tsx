
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { AuthForm } from "@/components/AuthForm";
import { supabase } from "@/integrations/supabase/client";

const Auth = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        navigate("/");
      }
    };

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (session) {
        navigate("/");
      }
    });

    checkAuth();

    return () => {
      subscription.unsubscribe();
    };
  }, [navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-background to-secondary/20 p-4">
      <AuthForm />
    </div>
  );
};

export default Auth;
