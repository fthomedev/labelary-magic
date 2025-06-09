
import { supabase } from '@/integrations/supabase/client';

export function useHistoryDiagnostics() {
  const diagnoseRecord = async (recordId: string) => {
    console.log('🔍 Starting diagnostic for record:', recordId);
    
    try {
      // Get current session
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError || !session?.user) {
        console.log('❌ Authentication issue:', sessionError);
        return;
      }
      
      console.log('✅ User authenticated:', session.user.id);
      
      // Check if record exists at all (without user filter)
      const { data: allRecords, error: allError } = await supabase
        .from('processing_history')
        .select('id, user_id')
        .eq('id', recordId);
        
      if (allError) {
        console.log('❌ Error querying all records:', allError);
        return;
      }
      
      console.log('🔍 Records found with this ID:', allRecords);
      
      // Check if record exists for current user
      const { data: userRecords, error: userError } = await supabase
        .from('processing_history')
        .select('id, user_id')
        .eq('id', recordId)
        .eq('user_id', session.user.id);
        
      if (userError) {
        console.log('❌ Error querying user records:', userError);
        return;
      }
      
      console.log('🔍 Records found for current user:', userRecords);
      
      // Additional diagnostics
      if (allRecords && allRecords.length > 0) {
        const record = allRecords[0];
        if (record.user_id !== session.user.id) {
          console.log('⚠️ Record belongs to different user:', record.user_id);
          console.log('⚠️ Current user:', session.user.id);
          console.log('⚠️ This suggests an RLS policy is correctly blocking access');
        }
      }
      
    } catch (error) {
      console.error('❌ Diagnostic error:', error);
    }
  };
  
  return { diagnoseRecord };
}
