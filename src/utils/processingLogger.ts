
import { supabase } from '@/integrations/supabase/client';

export interface ProcessingLogEntry {
  id?: string;
  user_id?: string;
  label_number: number;
  zpl_content: string;
  status: 'success' | 'failed' | 'skipped';
  error_message?: string;
  validation_warnings?: string[];
  api_response_status?: number;
  api_response_body?: string;
  processing_time_ms: number;
  created_at?: string;
}

export const createProcessingLog = async (entry: ProcessingLogEntry): Promise<void> => {
  try {
    console.log(`🔍 Attempting to create processing log for label ${entry.label_number}...`);
    
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError) {
      console.error('❌ Error getting user for logging:', userError);
      return;
    }
    
    if (!user) {
      console.warn('⚠️ No authenticated user found, skipping log creation');
      return;
    }
    
    console.log(`👤 User authenticated: ${user.id}`);
    
    const logEntry = {
      user_id: user.id,
      label_number: entry.label_number,
      zpl_content: entry.zpl_content.substring(0, 500), // Limit ZPL content length
      status: entry.status,
      error_message: entry.error_message || null,
      validation_warnings: entry.validation_warnings ? JSON.stringify(entry.validation_warnings) : null,
      api_response_status: entry.api_response_status || null,
      api_response_body: entry.api_response_body ? entry.api_response_body.substring(0, 500) : null,
      processing_time_ms: entry.processing_time_ms,
      created_at: new Date().toISOString()
    };

    console.log('📋 Log entry to be inserted:', {
      ...logEntry,
      zpl_content: logEntry.zpl_content.substring(0, 50) + '...',
      validation_warnings: logEntry.validation_warnings ? 'present' : 'null'
    });

    // Insert the log entry
    const { data, error } = await supabase
      .from('processing_logs')
      .insert([logEntry])
      .select();

    if (error) {
      console.error('❌ Failed to save processing log:', error);
      console.error('❌ Error details:', {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code
      });
    } else {
      console.log(`✅ Processing log saved successfully for label ${entry.label_number}`);
      console.log('✅ Inserted data:', data);
    }
  } catch (error) {
    console.error('💥 Exception in createProcessingLog:', error);
  }
};

export const getProcessingLogs = async (limit: number = 100) => {
  try {
    console.log('🔍 Fetching processing logs...');
    
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError) {
      console.error('❌ Error getting user for log retrieval:', userError);
      return [];
    }
    
    if (!user) {
      console.warn('⚠️ No authenticated user found for log retrieval');
      return [];
    }

    const { data, error } = await supabase
      .from('processing_logs')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('❌ Failed to fetch processing logs:', error);
      return [];
    }

    console.log(`✅ Retrieved ${data?.length || 0} processing logs`);
    return data || [];
  } catch (error) {
    console.error('💥 Exception in getProcessingLogs:', error);
    return [];
  }
};
