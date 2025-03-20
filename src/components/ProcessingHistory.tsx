
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

export interface ProcessingRecord {
  id: string;
  date: Date;
  labelCount: number;
  pdfUrl: string;
}

interface ProcessingHistoryProps {
  records?: ProcessingRecord[];
  localOnly?: boolean;
}

export function ProcessingHistory({ records: localRecords, localOnly = false }: ProcessingHistoryProps) {
  const { t } = useTranslation();
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
      // Use the generic query method to work around type issues
      const { data, error } = await supabase
        .from('processing_history')
        .select('*')
        .order('date', { ascending: false }) as any;
      
      if (error) {
        console.error('Error fetching processing history:', error);
      } else if (data) {
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
    if (isMobile) {
      return new Date(date).toLocaleDateString();
    }
    return `${new Date(date).toLocaleDateString()} ${new Date(date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
  };

  if (isLoading) {
    return (
      <Card className="mt-4 bg-white dark:bg-gray-800 shadow">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg font-medium">
            {t('processingHistory')} - {t('historyTitle')}
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
            {t('processingHistory')} - {t('historyTitle')}
          </CardTitle>
        </CardHeader>
        <CardContent className="text-center py-8 text-gray-500 dark:text-gray-400">
          {t('noHistory')}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="mt-4 bg-white dark:bg-gray-800 shadow">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg font-medium">
          {t('processingHistory')} - {t('historyTitle')}
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-1/3">{t('date')}</TableHead>
                <TableHead className="w-1/3">{t('labelCount')}</TableHead>
                <TableHead className="text-right w-1/3">{t('actions')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {records.map((record) => (
                <TableRow key={record.id}>
                  <TableCell className="flex items-center gap-2 py-2">
                    <Calendar className="h-4 w-4 text-gray-500 flex-shrink-0" />
                    <span className="truncate">{formatDate(record.date)}</span>
                  </TableCell>
                  <TableCell className="flex items-center gap-2 py-2">
                    <Tag className="h-4 w-4 text-cyan-500 flex-shrink-0" />
                    {record.labelCount}
                  </TableCell>
                  <TableCell className="text-right py-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="flex items-center gap-2 text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                      onClick={() => handleDownload(record.pdfUrl)}
                    >
                      <Download className="h-4 w-4" />
                      <span className={isMobile ? "sr-only" : ""}>{t('download')}</span>
                    </Button>
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
