
import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { supabase } from '@/integrations/supabase/client';
import { ProcessingRecord } from '@/hooks/useZplConversion';

export function useHistoryData(
  localRecords?: ProcessingRecord[], 
  localOnly = false, 
  currentPage = 1, 
  recordsPerPage = 8 // Changed from 10 to 8
) {
  const [dbRecords, setDbRecords] = useState<ProcessingRecord[]>([]);
  const [isLoading, setIsLoading] = useState(!localOnly);
  const [totalRecords, setTotalRecords] = useState(0);
  const [totalLabels, setTotalLabels] = useState(0);
  const [isInitialized, setIsInitialized] = useState(false);
  
  const fetchProcessingHistory = useCallback(async () => {
    try {
      if (!isInitialized) {
        setIsLoading(true);
      }
      
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
      
      // Get total labels count from ALL records (not just current page)
      const { data: allLabelsData, error: labelsError } = await supabase
        .from('processing_history')
        .select('label_count')
        .eq('user_id', sessionData.session.user.id);
        
      if (labelsError) {
        console.error('Error fetching total labels:', labelsError);
      } else if (allLabelsData) {
        const labelsSum = allLabelsData.reduce((sum, r) => sum + (r.label_count || 0), 0);
        setTotalLabels(labelsSum);
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
            pdfPath: record.pdf_path,
            processingTime: record.processing_time,
            processingType: record.processing_type || 'standard'
          }))
        );
      }
    } catch (err) {
      console.error('Failed to fetch processing history:', err);
    } finally {
      setIsLoading(false);
      setIsInitialized(true);
    }
  }, [currentPage, recordsPerPage, isInitialized]);
  
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
    totalLabels,
    refreshData
  };
}
