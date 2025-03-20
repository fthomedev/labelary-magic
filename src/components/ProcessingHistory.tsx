
import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Download, Calendar, Tag, Loader2 } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { useIsMobile } from '@/hooks/use-mobile';
import { supabase } from '@/integrations/supabase/client';
import { ProcessingRecord } from '@/hooks/useZplConversion';

interface ProcessingHistoryProps {
  records?: ProcessingRecord[];
  localOnly?: boolean;
}

export function ProcessingHistory({ records: localRecords, localOnly = false }: ProcessingHistoryProps) {
  const { t, i18n } = useTranslation();
  const isMobile = useIsMobile();
  const [dbRecords, setDbRecords] = useState<ProcessingRecord[]>([]);
  const [isLoading, setIsLoading] = useState(!localOnly);
  
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
      
      // Use explicit type assertion with unknown intermediate type
      const { data, error } = await (supabase
        .from('processing_history' as any) as any)
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

  if (isLoading) {
    return (
      <Card className="mt-4 bg-white dark:bg-gray-800 shadow">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg font-medium">
            {t('processingHistory')}
          </CardTitle>
        </CardHeader>
        <CardContent className="text-center py-8 flex flex-col items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-primary mb-2" />
          <span className="text-gray-500 dark:text-gray-400">{t('loadingHistory')}</span>
        </CardContent>
      </Card>
    );
  }

  if (!records || records.length === 0) {
    return (
      <Card className="mt-4 bg-white dark:bg-gray-800 shadow">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg font-medium">
            {t('processingHistory')}
          </CardTitle>
        </CardHeader>
        <CardContent className="text-center py-8 text-gray-500 dark:text-gray-400">
          {t('noHistory')}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="mt-4 bg-white dark:bg-gray-800 shadow overflow-hidden">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg font-medium">
          {t('processingHistory')}
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[40%]">{isMobile ? t('date').substring(0, 4) : t('date')}</TableHead>
                <TableHead className="w-[40%]">{isMobile ? t('labelCount').split(' ')[0] : t('labelCount')}</TableHead>
                <TableHead className="w-[20%] text-right">{isMobile ? '' : t('actions')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {records.map((record) => (
                <TableRow key={record.id}>
                  <TableCell className="py-2">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-gray-500 flex-shrink-0" />
                      <span>{formatDate(record.date)}</span>
                    </div>
                  </TableCell>
                  <TableCell className="py-2">
                    <div className="flex items-center gap-2">
                      <Tag className="h-4 w-4 text-cyan-500 flex-shrink-0" />
                      <span>{record.labelCount}</span>
                    </div>
                  </TableCell>
                  <TableCell className="py-2">
                    <div className="flex justify-end">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="p-0 h-8 w-8 rounded-full flex items-center justify-center text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                        onClick={() => handleDownload(record.pdfUrl)}
                        title={t('download')}
                      >
                        <Download className="h-4 w-4" />
                        <span className="sr-only">{t('download')}</span>
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
