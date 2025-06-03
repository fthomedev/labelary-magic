
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
      ...entry,
      user_id: user?.id,
      zpl_content: entry.zpl_content.substring(0, 500), // Limit ZPL content length
      validation_warnings: entry.validation_warnings ? JSON.stringify(entry.validation_warnings) : null,
      created_at: new Date().toISOString()
    };

    const { error } = await supabase
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

    const { data, error } = await supabase
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
