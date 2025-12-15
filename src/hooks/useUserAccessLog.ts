import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export const useUserAccessLog = () => {
  useEffect(() => {
    const logAccess = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          await supabase.rpc('log_user_access');
          console.log('📊 User access logged');
        }
      } catch (error) {
        // Silent fail - don't interrupt user experience
        console.error('Failed to log user access:', error);
      }
    };

    logAccess();
  }, []);
};
