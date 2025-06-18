
import { supabase } from '@/integrations/supabase/client';

export const useSecureFileAccess = () => {
  const createSecureToken = async (filePath: string, expiresHours: number = 24): Promise<string | null> => {
    try {
      console.log('Creating secure token for file:', filePath);
      console.log('Expires hours:', expiresHours);
      
      const { data, error } = await supabase.rpc('create_file_access_token', {
        p_file_path: filePath,
        p_bucket_name: 'pdfs',
        p_expires_hours: expiresHours,
        p_max_access: null // Unlimited access for now
      });

      if (error) {
        console.error('Error creating secure token:', error);
        console.error('Error details:', JSON.stringify(error, null, 2));
        return null;
      }

      console.log('Secure token created successfully:', data);
      return data;
    } catch (error) {
      console.error('Exception in createSecureToken:', error);
      return null;
    }
  };

  const getSecureFileUrl = (token: string): string => {
    const baseUrl = 'https://ekoakbihwprthzjyztwq.supabase.co';
    const secureUrl = `${baseUrl}/functions/v1/serve-file/${token}`;
    console.log('Generated secure URL:', secureUrl);
    return secureUrl;
  };

  return {
    createSecureToken,
    getSecureFileUrl,
  };
};
