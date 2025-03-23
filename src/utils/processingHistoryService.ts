
import { supabase } from '@/integrations/supabase/client';

/**
 * Adds a processing record to the user's history
 */
export const addToProcessingHistory = async (labelCount: number, pdfUrl: string): Promise<void> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      console.log('Saving processing history for user:', user.id);
      
      // Call the RPC function to insert processing history
      const { error } = await (supabase.rpc as any)('insert_processing_history', {
        p_user_id: user.id,
        p_label_count: labelCount,
        p_pdf_url: pdfUrl
      });
      
      if (error) {
        console.error('Error saving processing history:', error);
        return;
      }
      
      console.log('Processing history saved successfully');
      
      // Force refresh session to ensure auth is still valid
      await supabase.auth.refreshSession();
    } else {
      console.log('No authenticated user found');
    }
  } catch (error) {
    console.error('Failed to save processing history to database:', error);
  }
};
