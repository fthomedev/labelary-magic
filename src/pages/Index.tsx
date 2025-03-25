
import { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { FileUpload } from '@/components/FileUpload';
import { ZPLPreview } from '@/components/ZPLPreview';
import { ConversionProgress } from '@/components/ConversionProgress';
import { LanguageSelector } from '@/components/LanguageSelector';
import { UserMenu } from '@/components/UserMenu';
import { useIsMobile } from '@/hooks/use-mobile';
import { ProcessingHistory } from '@/components/ProcessingHistory';
import { useZplConversion } from '@/hooks/useZplConversion';
import { supabase } from '@/integrations/supabase/client';

const Index = () => {
  const [zplContent, setZplContent] = useState<string>('');
  const [sourceType, setSourceType] = useState<'file' | 'zip'>('file');
  const [fileCount, setFileCount] = useState(1);
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);
  const { t } = useTranslation();
  const isMobile = useIsMobile();
  const processingHistoryRef = useRef<HTMLDivElement>(null);
  
  const {
    isConverting,
    progress,
    isProcessingComplete,
    lastPdfUrl,
    convertToPDF,
    historyRefreshTrigger,
    resetProcessingStatus
  } = useZplConversion();

  useEffect(() => {
    // Check if user is logged in
    const checkAuth = async () => {
      const { data } = await supabase.auth.getSession();
      setIsLoggedIn(!!data.session);
      
      // Set up auth state change listener
      supabase.auth.onAuthStateChange((event, session) => {
        setIsLoggedIn(!!session);
      });
    };
    
    checkAuth();
  }, []);

  const handleFileSelect = (content: string, type: 'file' | 'zip' = 'file', count: number = 1) => {
    setZplContent(content);
    setSourceType(type);
    setFileCount(count);
    // Reset processing status when a new file is selected
    resetProcessingStatus();
  };

  const handleConvert = async () => {
    await convertToPDF(zplContent);
  };

  const handleDownload = () => {
    if (lastPdfUrl) {
      const a = document.createElement('a');
      a.href = lastPdfUrl;
      a.download = 'etiquetas.pdf';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      
      // Show toast notification
      const { toast } = require('@/hooks/use-toast');
      toast({
        title: t('downloadStarted'),
        description: t('downloadStartedDesc'),
        duration: 3000,
      });
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <header className="bg-white dark:bg-gray-800 shadow-sm">
        <div className="mx-auto max-w-7xl px-3 sm:px-4 lg:px-6">
          <div className="flex h-12 justify-between items-center">
            <h1 className="text-lg md:text-xl font-semibold text-gray-900 dark:text-white truncate mr-2">
              {t('title')}
            </h1>
            <div className="flex items-center gap-2">
              <LanguageSelector />
              <UserMenu />
            </div>
          </div>
        </div>
      </header>

      <main className="py-3 md:py-5">
        <div className="mx-auto max-w-7xl px-3 sm:px-4 lg:px-6">
          <div className="px-0 sm:px-0">
            <h2 className="text-xs md:text-sm font-semibold leading-6 text-gray-900 dark:text-gray-100">
              {t('subtitle')}
            </h2>
          </div>

          <div className="mt-3 grid grid-cols-1 lg:grid-cols-2 gap-3">
            <div className="space-y-3">
              <div className="overflow-hidden rounded-lg bg-white dark:bg-gray-800 shadow">
                <div className="p-3">
                  <FileUpload onFileSelect={handleFileSelect} />
                </div>
              </div>
              
              {zplContent && (
                <div className="space-y-3">
                  <div className="overflow-hidden rounded-lg bg-white dark:bg-gray-800 shadow">
                    <div className="p-3">
                      <ZPLPreview 
                        content={zplContent} 
                        sourceType={sourceType}
                        fileCount={fileCount}
                        isProcessingComplete={isProcessingComplete}
                        lastPdfUrl={lastPdfUrl}
                        onDownload={handleDownload}
                      />
                    </div>
                  </div>
                  
                  <div className="overflow-hidden rounded-lg bg-white dark:bg-gray-800 shadow">
                    <div className="p-3">
                      <ConversionProgress 
                        isConverting={isConverting}
                        progress={progress}
                        onConvert={handleConvert}
                        isProcessingComplete={isProcessingComplete}
                        onDownload={handleDownload}
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="overflow-hidden rounded-lg bg-white dark:bg-gray-800 shadow" ref={processingHistoryRef}>
              <ProcessingHistory key={historyRefreshTrigger} />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Index;
