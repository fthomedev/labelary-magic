
import { supabase } from '@/integrations/supabase/client';

export const useSecureFileAccess = () => {
  const createSecureToken = async (filePath: string, expiresHours: number = 24): Promise<string | null> => {
    try {
      console.log('🔐 [DEBUG] Creating secure token for file:', filePath);
      console.log('🔐 [DEBUG] Expires hours:', expiresHours);
      console.log('🔐 [DEBUG] Supabase client initialized:', !!supabase);
      
      const { data, error } = await supabase.rpc('create_file_access_token', {
        p_file_path: filePath,
        p_bucket_name: 'pdfs',
        p_expires_hours: expiresHours,
        p_max_access: null // Unlimited access for now
      });

      console.log('🔐 [DEBUG] RPC call completed');
      console.log('🔐 [DEBUG] Data received:', data);
      console.log('🔐 [DEBUG] Error received:', error);

      if (error) {
        console.error('🔐 [ERROR] Error creating secure token:', error);
        console.error('🔐 [ERROR] Error code:', error.code);
        console.error('🔐 [ERROR] Error message:', error.message);
        console.error('🔐 [ERROR] Error details:', JSON.stringify(error, null, 2));
        console.error('🔐 [ERROR] Error hint:', error.hint);
        return null;
      }

      if (!data) {
        console.error('🔐 [ERROR] No data returned from RPC call');
        return null;
      }

      console.log('🔐 [SUCCESS] Secure token created successfully:', data);
      return data;
    } catch (error) {
      console.error('🔐 [EXCEPTION] Exception in createSecureToken:', error);
      console.error('🔐 [EXCEPTION] Exception name:', error?.name);
      console.error('🔐 [EXCEPTION] Exception message:', error?.message);
      console.error('🔐 [EXCEPTION] Exception stack:', error?.stack);
      return null;
    }
  };

  const getSecureFileUrl = (token: string): string => {
    console.log('🔗 [DEBUG] Generating secure URL for token:', token);
    const baseUrl = 'https://ekoakbihwprthzjyztwq.supabase.co';
    const secureUrl = `${baseUrl}/functions/v1/serve-file/${token}`;
    console.log('🔗 [DEBUG] Generated secure URL:', secureUrl);
    return secureUrl;
  };

  return {
    createSecureToken,
    getSecureFileUrl,
  };
};
