
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

export const AuthGuard = ({ children }: { children: React.ReactNode }) => {
  const navigate = useNavigate();
  const [isChecking, setIsChecking] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        
        if (!session) {
          console.log('🔒 [DEBUG] AuthGuard: No session found, redirecting to home');
          navigate("/", { replace: true });
          return;
        }
        
        console.log('✅ [DEBUG] AuthGuard: Session found, user authenticated');
        setIsAuthenticated(true);
      } catch (error) {
        console.error('❌ [DEBUG] AuthGuard: Error checking session:', error);
        navigate("/", { replace: true });
      } finally {
        setIsChecking(false);
      }
    };

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      console.log('🔄 [DEBUG] AuthGuard: Auth state changed, event:', event, 'session exists:', !!session);
      
      if (!session) {
        console.log('🔒 [DEBUG] AuthGuard: Session lost, redirecting to home');
        setIsAuthenticated(false);
        navigate("/", { replace: true });
      } else {
        setIsAuthenticated(true);
      }
      setIsChecking(false);
    });

    checkAuth();

    return () => {
      subscription.unsubscribe();
    };
  }, [navigate]);

  // Mostrar loading enquanto verifica autenticação
  if (isChecking) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-sm text-gray-500">Verificando autenticação...</p>
        </div>
      </div>
    );
  }

  // Só renderizar children se autenticado
  return isAuthenticated ? <>{children}</> : null;
};
