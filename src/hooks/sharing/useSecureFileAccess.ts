
import { supabase } from '@/integrations/supabase/client';

export const useSecureFileAccess = () => {
  const createSecureToken = async (filePath: string, expiresHours: number = 24): Promise<string | null> => {
    try {
      console.log('🔐 [DEBUG] ========== STARTING TOKEN CREATION ==========');
      console.log('🔐 [DEBUG] Creating secure token for file:', filePath);
      console.log('🔐 [DEBUG] Expires hours:', expiresHours);
      console.log('🔐 [DEBUG] Supabase client initialized:', !!supabase);
      
      // Check if user is authenticated first
      console.log('🔐 [DEBUG] Checking user authentication...');
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError) {
        console.error('🔐 [ERROR] Session error:', sessionError);
        return null;
      }
      
      if (!session) {
        console.error('🔐 [ERROR] User not authenticated - no session');
        return null;
      }
      
      console.log('🔐 [DEBUG] User authenticated:', !!session.user);
      console.log('🔐 [DEBUG] User ID:', session.user?.id);
      
      // Prepare RPC parameters
      const rpcParams = {
        p_file_path: filePath,
        p_bucket_name: 'pdfs',
        p_expires_hours: expiresHours,
        p_max_access: null
      };
      
      console.log('🔐 [DEBUG] RPC parameters:', JSON.stringify(rpcParams, null, 2));
      console.log('🔐 [DEBUG] Making RPC call to create_file_access_token...');
      
      const { data, error } = await supabase.rpc('create_file_access_token', rpcParams);

      console.log('🔐 [DEBUG] ========== RPC CALL COMPLETED ==========');
      console.log('🔐 [DEBUG] Raw response data:', data);
      console.log('🔐 [DEBUG] Raw response error:', error);
      
      if (error) {
        console.error('🔐 [ERROR] ========== DETAILED ERROR ANALYSIS ==========');
        console.error('🔐 [ERROR] Error object:', error);
        console.error('🔐 [ERROR] Error code:', error.code);
        console.error('🔐 [ERROR] Error message:', error.message);
        console.error('🔐 [ERROR] Error details:', error.details);
        console.error('🔐 [ERROR] Error hint:', error.hint);
        console.error('🔐 [ERROR] Error stringified:', JSON.stringify(error, null, 2));
        console.error('🔐 [ERROR] =======================================');
        return null;
      }

      if (!data) {
        console.error('🔐 [ERROR] No data returned from RPC call');
        console.error('🔐 [ERROR] Data is:', data);
        return null;
      }

      console.log('🔐 [SUCCESS] ========== TOKEN CREATED SUCCESSFULLY ==========');
      console.log('🔐 [SUCCESS] Token created:', data);
      console.log('🔐 [SUCCESS] Token type:', typeof data);
      console.log('🔐 [SUCCESS] Token length:', data?.length);
      console.log('🔐 [SUCCESS] ============================================');
      
      return data;
    } catch (error) {
      console.error('🔐 [EXCEPTION] ========== EXCEPTION CAUGHT ==========');
      console.error('🔐 [EXCEPTION] Exception in createSecureToken:', error);
      console.error('🔐 [EXCEPTION] Exception name:', error?.name);
      console.error('🔐 [EXCEPTION] Exception message:', error?.message);
      console.error('🔐 [EXCEPTION] Exception stack:', error?.stack);
      console.error('🔐 [EXCEPTION] Exception stringified:', JSON.stringify(error, null, 2));
      console.error('🔐 [EXCEPTION] =====================================');
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
