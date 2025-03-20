
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
  const [dialogOpen, setDialogOpen] = useState(false);
  const [recordToDelete, setRecordToDelete] = useState<string | null>(null);
  const { toast } = useToast();
  
  useEffect(() => {
    if (!localOnly) {
      fetchProcessingHistory();
    }
  }, [localOnly]);

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
      
      const { data, error } = await supabase
        .from('processing_history')
        .select('*')
        .eq('user_id', sessionData.session.user.id)
        .order('date', { ascending: false });
      
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
  
  const handleDownload = (pdfUrl: string) => {
    const a = document.createElement('a');
    a.href = pdfUrl;
    a.download = 'etiquetas.pdf';
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(pdfUrl);
    document.body.removeChild(a);
  };

  const confirmDelete = (id: string) => {
    setRecordToDelete(id);
    setDialogOpen(true);
  };

  const handleDelete = async () => {
    if (!recordToDelete) return;
    
    try {
      // Make sure to properly delete from the database
      const { error } = await supabase
        .from('processing_history')
        .delete()
        .eq('id', recordToDelete);
      
      if (error) {
        console.error('Error deleting record:', error);
        toast({
          variant: "destructive",
          title: t('error'),
          description: t('deleteRecordError'),
        });
      } else {
        // Remove the deleted record from the local state only after successful deletion
        setDbRecords(prevRecords => prevRecords.filter(record => record.id !== recordToDelete));
        toast({
          title: t('success'),
          description: t('deleteRecordSuccess'),
        });
        
        // Fetch updated records to ensure UI is in sync with database
        // Adding a slight delay to allow the database to process the deletion
        if (!localOnly) {
          setTimeout(async () => {
            await fetchProcessingHistory();
          }, 300);
        }
      }
    } catch (err) {
      console.error('Failed to delete record:', err);
      toast({
        variant: "destructive",
        title: t('error'),
        description: t('deleteRecordError'),
      });
    } finally {
      setDialogOpen(false);
      setRecordToDelete(null);
    }
  };

  const formatDate = (date: Date) => {
    try {
      if (isMobile) {
        return date.toLocaleDateString(i18n.language === 'pt-BR' ? 'pt-BR' : 'en-US');
      }
      return date.toLocaleDateString(i18n.language === 'pt-BR' ? 'pt-BR' : 'en-US') + ' ' + 
             date.toLocaleTimeString(i18n.language === 'pt-BR' ? 'pt-BR' : 'en-US', { hour: '2-digit', minute: '2-digit' });
    } catch (e) {
      console.error('Error formatting date:', e);
      return String(date);
    }
  };

  return {
    isLoading,
    records,
    dialogOpen,
    setDialogOpen,
    formatDate,
    handleDownload,
    confirmDelete,
    handleDelete,
    isMobile
  };
}
