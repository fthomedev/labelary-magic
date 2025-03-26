
import { useState, useCallback } from "react";
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
        const { data: profile } = await supabase
          .from('profiles')
          .select('name, email')
          .eq('id', user.id)
          .single();
        
        if (profile) {
          setUserData(profile);
        }
      }
    } catch (error) {
      console.error('Error loading user data:', error);
    }
  }, []);

  return { userData, loadUserData };
}
