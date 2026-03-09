import { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { FileUpload, FileUploadRef } from '@/components/FileUpload';
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
import { DonationButton } from '@/components/DonationButton';
import { PrintFormat } from '@/components/format/FormatSelector';
import { SharePromoBanner } from '@/components/SharePromoBanner';
import { useUserAccessLog } from '@/hooks/useUserAccessLog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Info } from 'lucide-react';
import { PdfViewerModal } from '@/components/history/PdfViewerModal';
import { useToast } from '@/hooks/use-toast';
const Index = () => {
  const [zplContent, setZplContent] = useState<string>('');
  const [sourceType, setSourceType] = useState<'file' | 'zip'>('file');
  const [fileCount, setFileCount] = useState(1);
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);
  const [selectedFormat, setSelectedFormat] = useState<PrintFormat>('standard');
  const [fileUploadKey, setFileUploadKey] = useState(0);
  const [isPdfModalOpen, setIsPdfModalOpen] = useState(false);
  const { t } = useTranslation();
  const isMobile = useIsMobile();
  const processingHistoryRef = useRef<HTMLDivElement>(null);
  const fileUploadRef = useRef<FileUploadRef>(null);
  
  // Log user access for analytics
  useUserAccessLog();
  
  const { toast } = useToast();
  
  // Standard conversion hook
  const {
    isConverting: isStandardConverting,
    progress: standardProgress,
    progressInfo: standardProgressInfo,
    isProcessingComplete: isStandardComplete,
    lastPdfUrl: standardPdfUrl,
    convertToPDF,
    historyRefreshTrigger: standardHistoryRefresh,
    resetProcessingStatus: resetStandardStatus,
    resetPdfState: resetStandardPdfState
  } = useZplConversion();

  // HD conversion hook (always uses upscaling)
  const {
    isConverting: isHdConverting,
    progress: hdProgress,
    progressInfo: hdProgressInfo,
    isProcessingComplete: isHdComplete,
    lastPdfUrl: hdPdfUrl,
    convertToA4PDF: convertToHdPDF,
    historyRefreshTrigger: hdHistoryRefresh,
    resetProcessingStatus: resetHdStatus,
    resetPdfState: resetHdPdfState
  } = useA4ZplConversion();

  // Determine which conversion is active
  const isConverting = isStandardConverting || isHdConverting;
  const progress = isStandardConverting ? standardProgress : hdProgress;
  const progressInfo = isStandardConverting ? standardProgressInfo : hdProgressInfo;
  const isProcessingComplete = isStandardComplete || isHdComplete;
  const lastPdfUrl = standardPdfUrl || hdPdfUrl;
  // Sum both triggers to ensure any update from either hook triggers a refresh
  const historyRefreshTrigger = standardHistoryRefresh + hdHistoryRefresh;

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
    resetHdStatus();
  };

  const handleFormatChange = (format: PrintFormat) => {
    setSelectedFormat(format);
  };

  const handleConvert = async () => {
    console.log(`🔧 DEBUG: handleConvert called - selectedFormat: ${selectedFormat}`);
    
    // Reset BOTH PDF states before starting any new conversion
    // This ensures print/download buttons reference the new file, not the old one
    resetStandardPdfState();
    resetHdPdfState();
    
    // Reset both processing statuses before starting new conversion
    resetStandardStatus();
    resetHdStatus();
    
    if (selectedFormat === 'hd') {
      console.log(`🔧 DEBUG: Calling convertToHdPDF with upscaling enabled`);
      // HD mode always uses upscaling (enhanceLabels = true)
      await convertToHdPDF(zplContent, true);
    } else {
      await convertToPDF(zplContent);
    }
  };

  const handleDownload = () => {
    if (lastPdfUrl) {
      const a = document.createElement('a');
      a.href = lastPdfUrl;
      a.download = selectedFormat === 'hd' ? 'etiquetas-hd.pdf' : 'etiquetas.pdf';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      
      toast({
        title: t('downloadStarted'),
        description: t('downloadStartedDesc'),
        duration: 3000,
      });
    }
  };

  const handlePrint = () => {
    if (lastPdfUrl) {
      setIsPdfModalOpen(true);
    }
  };

  const closePdfModal = () => {
    setIsPdfModalOpen(false);
  };

  const handleNewProcess = () => {
    // Clear the content and reset all processing states
    setZplContent('');
    setSourceType('file');
    setFileCount(1);
    resetStandardStatus();
    resetHdStatus();
    // Force FileUpload to remount and reset its internal state
    setFileUploadKey(prev => prev + 1);
    // Open file selector after a brief delay to allow component to remount
    setTimeout(() => {
      fileUploadRef.current?.openFileSelector();
    }, 100);
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
              <DonationButton variant="header" />
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
                  <FileUpload key={fileUploadKey} ref={fileUploadRef} onFileSelect={handleFileSelect} />
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
                        onNewProcess={handleNewProcess}
                        onPrint={handlePrint}
                        currentLabel={progressInfo.currentLabel}
                        totalLabels={progressInfo.totalLabels}
                        stage={progressInfo.stage}
                        conversionMode={selectedFormat}
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

      <PdfViewerModal
        pdfUrl={lastPdfUrl}
        isOpen={isPdfModalOpen}
        onClose={closePdfModal}
        onDownload={handleDownload}
      />
    </div>
  );
};

export default Index;
