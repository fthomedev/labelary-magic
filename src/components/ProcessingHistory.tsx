
import React from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Download, RefreshCw, AlertCircle } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ptBR, enUS } from 'date-fns/locale';
import { toast } from '@/hooks/use-toast';

const ProcessingHistory = () => {
  const { t, i18n } = useTranslation();
  
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['processingHistory'],
    queryFn: async () => {
      const { data: session } = await supabase.auth.getSession();
      if (!session.session) {
        throw new Error('Not authenticated');
      }
      
      const { data, error } = await supabase
        .from('processing_history')
        .select('*')
        .order('date', { ascending: false })
        .limit(10);
        
      if (error) throw error;
      return data;
    },
    retry: 1,
    staleTime: 60000, // 1 minute
  });
  
  const handleDownload = (url: string) => {
    window.open(url, '_blank');
    
    // Show toast notification
    toast({
      title: t('downloadStarted'),
      description: t('downloadStartedDesc'),
      duration: 3000,
    });
  };
  
  const getLocale = () => {
    return i18n.language.startsWith('pt') ? ptBR : enUS;
  };
  
  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return formatDistanceToNow(date, { 
        addSuffix: true,
        locale: getLocale()
      });
    } catch (e) {
      console.error('Date formatting error:', e);
      return dateString;
    }
  };

  if (error) {
    return (
      <div className="p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium">{t('processingHistory')}</h3>
          <Button variant="outline" size="sm" onClick={() => refetch()}>
            <RefreshCw className="h-4 w-4 mr-2" />
            {t('refresh')}
          </Button>
        </div>
        <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-md flex items-start">
          <AlertCircle className="h-5 w-5 text-red-500 mr-2 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm text-red-600 dark:text-red-400">
              {t('errorLoadingHistory')}
            </p>
            <p className="text-xs text-red-500 dark:text-red-300 mt-1">
              {error instanceof Error ? error.message : String(error)}
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-medium">{t('processingHistory')}</h3>
        <Button variant="outline" size="sm" onClick={() => refetch()}>
          <RefreshCw className="h-4 w-4 mr-2" />
          {t('refresh')}
        </Button>
      </div>
      
      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-center justify-between p-3 border rounded-md">
              <div className="space-y-2">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-3 w-24" />
              </div>
              <Skeleton className="h-8 w-8 rounded-md" />
            </div>
          ))}
        </div>
      ) : data && data.length > 0 ? (
        <div className="space-y-2">
          {data.map((item) => (
            <div 
              key={item.id} 
              className="flex items-center justify-between p-3 border rounded-md hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
            >
              <div>
                <p className="font-medium truncate max-w-[200px] sm:max-w-xs">
                  {t('zplConversion')} ({item.label_count} {t('labels')})
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {formatDate(item.date)}
                </p>
              </div>
              {item.pdf_url && (
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => handleDownload(item.pdf_url)}
                  aria-label={t('download')}
                >
                  <Download className="h-4 w-4" />
                </Button>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-8">
          <p className="text-gray-500 dark:text-gray-400">
            {t('noConversionsYet')}
          </p>
        </div>
      )}
    </div>
  );
};

export default ProcessingHistory;
