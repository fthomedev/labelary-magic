
import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { supabase } from '@/integrations/supabase/client';
import { ProcessingRecord } from '@/hooks/useZplConversion';

export function useHistoryData(
  localRecords?: ProcessingRecord[], 
  localOnly = false, 
  currentPage = 1, 
  recordsPerPage = 10
) {
  const [dbRecords, setDbRecords] = useState<ProcessingRecord[]>([]);
  const [isLoading, setIsLoading] = useState(!localOnly);
  const [totalRecords, setTotalRecords] = useState(0);
  
  const fetchProcessingHistory = useCallback(async () => {
    try {
      setIsLoading(true);
      
      // Check if user is authenticated
      const { data: sessionData } = await supabase.auth.getSession();
      if (!sessionData.session) {
        console.log('No active session found');
        setIsLoading(false);
        return;
      }
      
      // First get total count for pagination
      const { count, error: countError } = await supabase
        .from('processing_history')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', sessionData.session.user.id);
        
      if (countError) {
        console.error('Error counting processing history:', countError);
      } else if (count !== null) {
        setTotalRecords(count);
      }
      
      // Then get paginated records
      const { data, error } = await supabase
        .from('processing_history')
        .select('*')
        .eq('user_id', sessionData.session.user.id)
        .order('date', { ascending: false })
        .range((currentPage - 1) * recordsPerPage, currentPage * recordsPerPage - 1);
      
      if (error) {
        console.error('Error fetching processing history:', error);
      } else if (data) {
        console.log('Processing history data:', data);
        setDbRecords(
          data.map((record: any) => ({
            id: record.id,
            date: new Date(record.date),
            labelCount: record.label_count,
            pdfUrl: record.pdf_url,
            pdfPath: record.pdf_path
          }))
        );
      }
    } catch (err) {
      console.error('Failed to fetch processing history:', err);
    } finally {
      setIsLoading(false);
    }
  }, [currentPage, recordsPerPage]);
  
  useEffect(() => {
    if (!localOnly) {
      fetchProcessingHistory();
    }
  }, [localOnly, currentPage, fetchProcessingHistory]);
  
  const refreshData = useCallback(() => {
    if (!localOnly) {
      fetchProcessingHistory();
    }
  }, [localOnly, fetchProcessingHistory]);
  
  // Use local records if provided, otherwise use database records
  const records = localOnly ? localRecords || [] : dbRecords;
  
  return {
    isLoading,
    records,
    totalRecords,
    refreshData
  };
}
