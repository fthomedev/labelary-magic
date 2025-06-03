
import { supabase } from '@/integrations/supabase/client';

export const useHistoryRecords = () => {
  const addToProcessingHistory = async (labelCount: number, pdfPath: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        console.log(`📝 Saving processing history for user: ${user.id}`);
        console.log(`🏷️ Label count being saved: ${labelCount}`);
        
        // Get the public URL for the PDF from Supabase storage
        const { data: publicUrlData } = await supabase.storage
          .from('pdfs')
          .getPublicUrl(pdfPath);
          
        if (!publicUrlData || !publicUrlData.publicUrl) {
          console.error('Failed to get public URL for PDF');
          return;
        }
        
        const pdfUrl = publicUrlData.publicUrl;
        console.log('Public URL for PDF:', pdfUrl);
        
        const { error } = await supabase.from('processing_history').insert({
          user_id: user.id,
          label_count: labelCount,
          pdf_url: pdfUrl,
          pdf_path: pdfPath
        });
        
        if (error) {
          console.error('Error saving processing history:', error);
        } else {
          console.log(`✅ Processing history saved successfully with ${labelCount} labels`);
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
