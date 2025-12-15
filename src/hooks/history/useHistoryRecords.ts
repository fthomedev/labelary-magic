
import { supabase } from '@/integrations/supabase/client';

export type ProcessingType = 'standard' | 'a4';

export const useHistoryRecords = () => {
  const addToProcessingHistory = async (
    labelCount: number, 
    pdfPath: string, 
    processingTime?: number,
    processingType: ProcessingType = 'standard'
  ) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        console.log(`📝 Saving processing history for user: ${user.id}`);
        console.log(`🏷️ Label count being saved: ${labelCount}`);
        console.log(`⏱️ Processing time being saved: ${processingTime}ms`);
        console.log(`📄 Processing type: ${processingType}`);
        
        // Store the path - use signed URLs when accessing the file later
        // The bucket is private so getPublicUrl() won't work
        const { error } = await supabase.from('processing_history').insert({
          user_id: user.id,
          label_count: labelCount,
          pdf_url: pdfPath, // Store path instead of public URL (bucket is private)
          pdf_path: pdfPath,
          processing_time: processingTime,
          processing_type: processingType
        });
        
        if (error) {
          console.error('Error saving processing history:', error);
        } else {
          console.log(`✅ Processing history saved successfully with ${labelCount} labels and ${processingTime}ms processing time`);
        }
      } else {
        console.log('No authenticated user found');
      }
    } catch (error) {
      console.error('Failed to save processing history to database:', error);
    }
  };

  return {
    addToProcessingHistory
  };
};
