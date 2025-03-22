
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
import { PDFBlocksList } from '@/components/PDFBlocksList';

const Index = () => {
  const [zplContent, setZplContent] = useState<string>('');
  const [sourceType, setSourceType] = useState<'file' | 'zip'>('file');
  const [fileCount, setFileCount] = useState(1);
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);
  const [refreshHistory, setRefreshHistory] = useState<number>(0);
  const { t } = useTranslation();
  const isMobile = useIsMobile();
  const processingHistoryRef = useRef<HTMLDivElement>(null);
  
  const {
    isConverting,
    progress,
    isProcessingComplete,
    lastPdfUrl,
    pdfUrls,
    convertToPDF
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

  // Watch for processing completion to refresh history
  useEffect(() => {
    if (isProcessingComplete) {
      // Refresh history by incrementing the state value
      setRefreshHistory(prev => prev + 1);
    }
  }, [isProcessingComplete]);

  const handleFileSelect = (content: string, type: 'file' | 'zip' = 'file', count: number = 1) => {
    setZplContent(content);
    setSourceType(type);
    setFileCount(count);
  };

  const handleConvert = async () => {
    await convertToPDF(zplContent);
    // Force refresh of processing history
    setRefreshHistory(prev => prev + 1);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <header className="bg-white dark:bg-gray-800 shadow-sm">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 justify-between items-center">
            <h1 className="text-xl md:text-2xl font-semibold text-gray-900 dark:text-white truncate mr-2">
              {t('title')}
            </h1>
            <div className="flex items-center gap-2 md:gap-4">
              <LanguageSelector />
              <UserMenu />
            </div>
          </div>
        </div>
      </header>

      <main className="py-6 md:py-10">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="px-0 sm:px-0">
            <h2 className="text-sm md:text-base font-semibold leading-7 text-gray-900 dark:text-gray-100">
              {t('subtitle')}
            </h2>
          </div>

          <div className="mt-4 md:mt-6 grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-8">
            <div className="space-y-4 md:space-y-6">
              <div className="overflow-hidden rounded-lg bg-white dark:bg-gray-800 shadow">
                <div className="p-4 md:p-6">
                  <FileUpload onFileSelect={handleFileSelect} />
                </div>
              </div>
              
              {zplContent && (
                <div className="overflow-hidden rounded-lg bg-white dark:bg-gray-800 shadow">
                  <div className="p-4 md:p-6">
                    <ZPLPreview 
                      content={zplContent} 
                      sourceType={sourceType}
                      fileCount={fileCount}
                      isProcessingComplete={isProcessingComplete}
                      lastPdfUrl={lastPdfUrl}
                    />
                  </div>
                </div>
              )}
              
              {pdfUrls.length > 0 && (
                <div className="overflow-hidden rounded-lg bg-white dark:bg-gray-800 shadow">
                  <div className="p-4 md:p-6">
                    <PDFBlocksList pdfUrls={pdfUrls} />
                  </div>
                </div>
              )}
            </div>

            {zplContent && (
              <div className="overflow-hidden rounded-lg bg-white dark:bg-gray-800 shadow">
                <div className="p-4 md:p-6">
                  <ConversionProgress 
                    isConverting={isConverting}
                    progress={progress}
                    onConvert={handleConvert}
                  />
                </div>
              </div>
            )}
          </div>
          
          <div className="mt-6 md:mt-8" ref={processingHistoryRef}>
            <ProcessingHistory key={refreshHistory} />
          </div>
        </div>
      </main>
    </div>
  );
};

export default Index;
