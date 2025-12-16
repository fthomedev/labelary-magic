
import { useState, useCallback, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

export function useUserData() {
  const [userData, setUserData] = useState<{
    name: string | null;
    email: string | null;
  } | null>(null);

  const loadUserData = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        // Get profile name from database, email from auth (security best practice)
        const { data: profile } = await supabase
          .from('profiles')
          .select('name')
          .eq('id', user.id)
          .single();
        
        // Email always comes from auth.users for security
        const email = user.email || null;
        
        if (profile && profile.name) {
          setUserData({ name: profile.name, email });
        } else {
          // Use metadata name if no profile name exists
          const name = user.user_metadata?.name || null;
          
          // Update profile with name if needed
          if (!profile || !profile.name) {
            await supabase.from('profiles')
              .update({ name })
              .eq('id', user.id);
          }
          
          setUserData({ name, email });
        }
      }
    } catch (error) {
      console.error('Error loading user data:', error);
    }
  }, []);

  // Carregar os dados do usuário ao inicializar o hook
  useEffect(() => {
    loadUserData();
  }, [loadUserData]);

  return { userData, loadUserData };
}
