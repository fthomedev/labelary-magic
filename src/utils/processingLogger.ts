
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
    const { data: { user } } = await supabase.auth.getUser();
    
    const logEntry = {
      user_id: user?.id,
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

    // Use a workaround for the TypeScript issue by casting the table name
    const { error } = await (supabase as any)
      .from('processing_logs')
      .insert([logEntry]);

    if (error) {
      console.error('Failed to save processing log:', error);
    } else {
      console.log(`📝 Processing log saved for label ${entry.label_number}`);
    }
  } catch (error) {
    console.error('Error creating processing log:', error);
  }
};

export const getProcessingLogs = async (limit: number = 100) => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) return [];

    // Use a workaround for the TypeScript issue by casting
    const { data, error } = await (supabase as any)
      .from('processing_logs')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Failed to fetch processing logs:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Error fetching processing logs:', error);
    return [];
  }
};
