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
import { useA4ZplConversion } from '@/hooks/conversion/useA4ZplConversion';
import { supabase } from '@/integrations/supabase/client';
import { SEO } from '@/components/SEO';
import { FeedbackModal } from '@/components/FeedbackModal';
import { PrintFormat } from '@/components/format/FormatSelector';
import { SharePromoBanner } from '@/components/SharePromoBanner';
import { useUserAccessLog } from '@/hooks/useUserAccessLog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Info } from 'lucide-react';

const Index = () => {
  const [zplContent, setZplContent] = useState<string>('');
  const [sourceType, setSourceType] = useState<'file' | 'zip'>('file');
  const [fileCount, setFileCount] = useState(1);
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);
  const [selectedFormat, setSelectedFormat] = useState<PrintFormat>('standard');
  const [enhanceLabels, setEnhanceLabels] = useState<boolean>(false);
  const { t } = useTranslation();
  const isMobile = useIsMobile();
  const processingHistoryRef = useRef<HTMLDivElement>(null);
  
  // Log user access for analytics
  useUserAccessLog();
  
  // Standard conversion hook
  const {
    isConverting: isStandardConverting,
    progress: standardProgress,
    progressInfo: standardProgressInfo,
    isProcessingComplete: isStandardComplete,
    lastPdfUrl: standardPdfUrl,
    convertToPDF,
    historyRefreshTrigger: standardHistoryRefresh,
    resetProcessingStatus: resetStandardStatus
  } = useZplConversion();

  // A4 conversion hook
  const {
    isConverting: isA4Converting,
    progress: a4Progress,
    progressInfo: a4ProgressInfo,
    isProcessingComplete: isA4Complete,
    lastPdfUrl: a4PdfUrl,
    convertToA4PDF,
    historyRefreshTrigger: a4HistoryRefresh,
    resetProcessingStatus: resetA4Status
  } = useA4ZplConversion();

  // Determine which conversion is active
  const isConverting = isStandardConverting || isA4Converting;
  const progress = isStandardConverting ? standardProgress : a4Progress;
  const progressInfo = isStandardConverting ? standardProgressInfo : a4ProgressInfo;
  const isProcessingComplete = isStandardComplete || isA4Complete;
  const lastPdfUrl = standardPdfUrl || a4PdfUrl;
  const historyRefreshTrigger = Math.max(standardHistoryRefresh, a4HistoryRefresh);

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
    // Reset both processing statuses when a new file is selected
    resetStandardStatus();
    resetA4Status();
  };

  const handleFormatChange = (format: PrintFormat) => {
    setSelectedFormat(format);
  };

  const handleConvert = async () => {
    console.log(`🔧 DEBUG: handleConvert called - selectedFormat: ${selectedFormat}, enhanceLabels: ${enhanceLabels}`);
    if (selectedFormat === 'a4') {
      console.log(`🔧 DEBUG: Calling convertToA4PDF with enhanceLabels = ${enhanceLabels}`);
      await convertToA4PDF(zplContent, enhanceLabels);
    } else {
      await convertToPDF(zplContent);
    }
  };

  const handleDownload = () => {
    if (lastPdfUrl) {
      const a = document.createElement('a');
      a.href = lastPdfUrl;
      a.download = selectedFormat === 'a4' ? 'etiquetas-a4.pdf' : 'etiquetas.pdf';
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
      <SEO 
        title="Conversor ZPL Online – ZPL Easy"
        description="Cole seu código ZPL e baixe o PDF instantâneo. Sem instalar drivers."
      />
      
      <header className="bg-white dark:bg-gray-800 shadow-sm">
        <div className="mx-auto max-w-7xl px-4">
          <div className="flex h-14 justify-between items-center">
            <h1 className="text-lg md:text-xl font-semibold text-gray-900 dark:text-white truncate max-w-[180px] sm:max-w-none">
              {t('title')}
            </h1>
            <div className="flex items-center gap-1 sm:gap-2">
              <FeedbackModal />
              <LanguageSelector />
              <UserMenu />
            </div>
          </div>
        </div>
      </header>

      <SharePromoBanner />

      <div className="mx-auto max-w-7xl px-4 mt-3">
        <Alert className="bg-gradient-to-r from-amber-50 to-yellow-50 border-2 border-amber-400 dark:from-amber-950/50 dark:to-yellow-950/50 dark:border-amber-600 shadow-md animate-pulse-slow">
          <Info className="h-5 w-5 text-amber-600 dark:text-amber-400 flex-shrink-0" />
          <AlertDescription className="text-amber-900 dark:text-amber-100 text-sm font-medium">
            {t('betaNotice')}
          </AlertDescription>
        </Alert>
      </div>

      <main className="py-3 md:py-5">
        <div className="mx-auto max-w-7xl px-4">
          <div>
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
                        selectedFormat={selectedFormat}
                        onFormatChange={handleFormatChange}
                        enhanceLabels={enhanceLabels}
                        onEnhanceLabelsChange={setEnhanceLabels}
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
                        currentLabel={progressInfo.currentLabel}
                        totalLabels={progressInfo.totalLabels}
                        stage={progressInfo.stage}
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
