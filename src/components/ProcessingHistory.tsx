
import React from 'react';
import { useTranslation } from 'react-i18next';
import { Download, Calendar, Tag } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';

export interface ProcessingRecord {
  id: string;
  date: Date;
  labelCount: number;
  pdfUrl: string;
}

interface ProcessingHistoryProps {
  records: ProcessingRecord[];
}

export function ProcessingHistory({ records }: ProcessingHistoryProps) {
  const { t } = useTranslation();
  
  const handleDownload = (pdfUrl: string) => {
    const a = document.createElement('a');
    a.href = pdfUrl;
    a.download = 'etiquetas.pdf';
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(pdfUrl);
    document.body.removeChild(a);
  };

  if (records.length === 0) {
    return null;
  }

  return (
    <div className="rounded-lg bg-white dark:bg-gray-800 shadow">
      <div className="p-4 md:p-6">
        <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">
          {t('processingHistory')}
        </h3>
        <div className="overflow-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t('date')}</TableHead>
                <TableHead>{t('labelCount')}</TableHead>
                <TableHead className="text-right">{t('actions')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {records.map((record) => (
                <TableRow key={record.id}>
                  <TableCell className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-gray-500" />
                    {new Date(record.date).toLocaleDateString()} {new Date(record.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </TableCell>
                  <TableCell className="flex items-center gap-2">
                    <Tag className="h-4 w-4 text-cyan-500" />
                    {record.labelCount}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="flex items-center gap-2 text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                      onClick={() => handleDownload(record.pdfUrl)}
                    >
                      <Download className="h-4 w-4" />
                      {t('download')}
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}
