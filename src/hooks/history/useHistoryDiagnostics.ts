
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
      
      // Check RLS policies (this might fail if no policies exist)
      const { data: policies, error: policyError } = await supabase
        .rpc('get_policies_for_table', { table_name: 'processing_history' })
        .select();
        
      if (policyError) {
        console.log('⚠️ Could not check RLS policies (this is normal):', policyError);
      } else {
        console.log('🔍 RLS policies found:', policies);
      }
      
    } catch (error) {
      console.error('❌ Diagnostic error:', error);
    }
  };
  
  return { diagnoseRecord };
}
