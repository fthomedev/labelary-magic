
import { useState, useEffect, useCallback } from 'react';
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
  }, [currentPage]);
  
  useEffect(() => {
    if (!localOnly) {
      fetchProcessingHistory();
    }
  }, [localOnly, currentPage, fetchProcessingHistory]);
  
  // Add a manual refresh function
  const refreshData = useCallback(() => {
    if (!localOnly) {
      fetchProcessingHistory();
    }
  }, [localOnly, fetchProcessingHistory]);
  
  // Use local records if provided, otherwise use database records
  const records = localOnly ? localRecords || [] : dbRecords;
  
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };
  
  const totalPages = Math.ceil(totalRecords / recordsPerPage);
  
  const handleDownload = async (record: ProcessingRecord) => {
    try {
      // If we have a storage path, download from Supabase storage
      if (record.pdfPath) {
        console.log('Downloading from storage path:', record.pdfPath);
        
        // Get direct download URL with proper authorization
        const { data, error } = await supabase.storage
          .from('pdfs')
          .createSignedUrl(record.pdfPath, 60); // 60 seconds expiration
          
        if (error || !data?.signedUrl) {
          console.error('Error creating signed URL:', error);
          throw new Error('Failed to create download URL');
        }
        
        console.log('Signed URL:', data.signedUrl);
        
        // Create download link with the signed URL
        const a = document.createElement('a');
        a.href = data.signedUrl;
        a.download = 'etiquetas.pdf';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
      } 
      // Fallback to blob URL if available (for newly created PDFs)
      else if (record.pdfUrl && record.pdfUrl.startsWith('blob:')) {
        console.log('Trying to use blob URL:', record.pdfUrl);
        const a = document.createElement('a');
        a.href = record.pdfUrl;
        a.download = 'etiquetas.pdf';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
      } else {
        // For records that don't have a valid URL or path
        console.error('No valid PDF URL or path available:', record);
        throw new Error('No PDF URL or path available');
      }
    } catch (error) {
      console.error('Error downloading PDF:', error);
      toast({
        variant: "destructive",
        title: t('error'),
        description: t('downloadError'),
        duration: 3000,
      });
    }
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
    totalRecords,
    refreshData
  };
}
