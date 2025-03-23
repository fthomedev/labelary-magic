
import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { supabase } from '@/integrations/supabase/client';
import { ProcessingRecord } from '@/hooks/useZplConversion';
import { useToast } from '@/components/ui/use-toast';
import { useIsMobile } from '@/hooks/use-mobile';

export function useProcessingHistory(localRecords?: ProcessingRecord[], localOnly = false) {
  const { t, i18n } = useTranslation();
  const isMobile = useIsMobile();
  const [dbRecords, setDbRecords] = useState<ProcessingRecord[]>([]);
  const [isLoading, setIsLoading] = useState(!localOnly);
  const [totalRecords, setTotalRecords] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const recordsPerPage = 10;
  const { toast } = useToast();
  
  useEffect(() => {
    if (!localOnly) {
      fetchProcessingHistory();
    }
  }, [localOnly, currentPage]);

  const fetchProcessingHistory = async () => {
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
            pdfUrl: record.pdf_url
          }))
        );
      }
    } catch (err) {
      console.error('Failed to fetch processing history:', err);
    } finally {
      setIsLoading(false);
    }
  };
  
  // Use local records if provided, otherwise use database records
  const records = localOnly ? localRecords || [] : dbRecords;
  
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };
  
  const totalPages = Math.ceil(totalRecords / recordsPerPage);
  
  const handleDownload = (pdfUrl: string) => {
    const a = document.createElement('a');
    a.href = pdfUrl;
    a.download = 'etiquetas.pdf';
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(pdfUrl);
    document.body.removeChild(a);
  };

  const formatDate = (date: Date) => {
    try {
      if (isMobile) {
        // More compact date format for mobile view
        return date.toLocaleDateString(i18n.language === 'pt-BR' ? 'pt-BR' : 'en-US', { 
          day: '2-digit', 
          month: '2-digit', 
          hour: '2-digit', 
          minute: '2-digit' 
        }).replace(',', '');
      }
      
      // Format without commas
      const dateStr = date.toLocaleDateString(i18n.language === 'pt-BR' ? 'pt-BR' : 'en-US').replace(',', '');
      const timeStr = date.toLocaleTimeString(i18n.language === 'pt-BR' ? 'pt-BR' : 'en-US', { 
        hour: '2-digit', 
        minute: '2-digit' 
      }).replace(',', '');
      
      return dateStr + ' ' + timeStr;
    } catch (e) {
      console.error('Error formatting date:', e);
      return String(date);
    }
  };

  return {
    isLoading,
    records,
    formatDate,
    handleDownload,
    isMobile,
    currentPage,
    totalPages,
    handlePageChange,
    totalRecords
  };
}
