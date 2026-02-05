import { supabase } from '@/integrations/supabase/client';

export type ErrorType = 
  | 'api_error'        // Falha na API do Labelary
  | 'upload_error'     // Falha no upload do PDF
  | 'conversion_error' // Erro genérico de conversão
  | 'validation_error'; // ZPL inválido

interface ErrorDetails {
  errorType: ErrorType;
  errorMessage: string;
  errorStack?: string;
  processingType: 'standard' | 'a4' | 'hd';
  labelCountAttempted?: number;
  processingTimeMs?: number;
  metadata?: Record<string, unknown>;
}

export const useErrorRecords = () => {
  const logFatalError = async (details: ErrorDetails) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        console.warn('Cannot log error: no authenticated user');
        return;
      }

      const { error } = await supabase.from('processing_errors' as any).insert({
        user_id: user.id,
        error_type: details.errorType,
        error_message: details.errorMessage,
        error_stack: details.errorStack,
        processing_type: details.processingType,
        label_count_attempted: details.labelCountAttempted,
        processing_time_ms: details.processingTimeMs,
        metadata: details.metadata,
      });

      if (error) {
        console.error('Failed to log error to database:', error);
      } else {
        console.log('💥 Fatal error logged successfully:', details.errorType);
      }
    } catch (err) {
      // Silently fail - we don't want error logging to break the app
      console.error('Exception logging error:', err);
    }
  };

  return { logFatalError };
};
