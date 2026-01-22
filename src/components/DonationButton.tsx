import { useState } from 'react';
import { Heart, Coffee, Loader2, CreditCard } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';
import qrCodePix from '@/assets/qrcode-pix.png';

const DONATION_OPTIONS = [
  { amount: 500, label: 'R$ 5' },
  { amount: 1000, label: 'R$ 10' },
  { amount: 2500, label: 'R$ 25' },
  { amount: 5000, label: 'R$ 50' },
];

interface DonationButtonProps {
  variant?: 'default' | 'compact' | 'success' | 'header' | 'link' | 'card';
  className?: string;
  children?: React.ReactNode;
  defaultTab?: 'pix' | 'card';
}

export const DonationButton = ({ variant = 'default', className = '', children, defaultTab }: DonationButtonProps) => {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedAmount, setSelectedAmount] = useState<number | null>(null);

  const handleDonate = async () => {
    if (!selectedAmount) return;

    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('stripe', {
        body: {
          action: 'create-donation-session',
          amount: selectedAmount,
          successUrl: `${window.location.origin}/donation/success`,
          cancelUrl: `${window.location.origin}/app`,
        },
      });

      if (error) throw error;

      if (data?.url) {
        window.location.href = data.url;
      }
    } catch (error) {
      console.error('Error creating donation session:', error);
      toast({
        variant: 'destructive',
        title: t('error'),
        description: t('errorProcessingRequest'),
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {variant === 'compact' ? (
          <Button variant="ghost" size="sm" className={`gap-2 ${className}`}>
            <Coffee className="h-4 w-4" />
            {t('supportProject')}
          </Button>
        ) : variant === 'success' ? (
          <Button className={`gap-2 bg-primary hover:bg-primary/90 text-primary-foreground animate-pulse-slow ${className}`}>
            <Coffee className="h-4 w-4" />
            {t('supportProject')}
          </Button>
        ) : variant === 'header' ? (
          <Button 
            variant="outline" 
            size="sm" 
            className={`gap-1.5 border-emerald-200 bg-emerald-50/50 hover:bg-emerald-100 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950/30 dark:hover:bg-emerald-900/50 dark:text-emerald-400 ${className}`}
          >
            <Heart className="h-4 w-4 text-red-500 animate-pulse" />
            <span className="hidden sm:inline font-medium">{t('support')}</span>
            <span className="bg-emerald-500 text-white text-[10px] px-1.5 py-0.5 rounded font-bold">PIX</span>
            <span className="bg-blue-500 text-white text-[10px] px-1.5 py-0.5 rounded font-bold hidden sm:inline">CC</span>
          </Button>
        ) : variant === 'card' ? (
          <Button 
            variant="outline" 
            size="sm" 
            className={`gap-2 border-blue-200 bg-blue-50/50 hover:bg-blue-100 text-blue-700 dark:border-blue-800 dark:bg-blue-950/30 dark:hover:bg-blue-900/50 dark:text-blue-400 ${className}`}
          >
            <CreditCard className="h-4 w-4" />
            <span className="font-medium">{children || t('donateWithCard')}</span>
          </Button>
        ) : variant === 'link' ? (
          <button type="button" className={`underline-offset-4 hover:underline ${className}`}>
            {children || t('supportProject')}
          </button>
        ) : (
          <Button variant="outline" className={`gap-2 ${className}`}>
            <Heart className="h-4 w-4 text-red-500" />
            {t('supportProject')}
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Heart className="h-5 w-5 text-red-500" />
            {t('supportProject')}
          </DialogTitle>
          <DialogDescription className="text-center">
            {t('donationHelpMessage')}
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue={defaultTab || 'pix'} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="pix" className="gap-2">
              <span className="font-bold text-primary">PIX</span>
            </TabsTrigger>
            <TabsTrigger value="card" className="gap-2">
              <CreditCard className="h-4 w-4" />
              {t('card')}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="pix" className="mt-4">
            <div className="flex flex-col items-center gap-4">
              <div className="bg-white p-3 rounded-lg shadow-sm">
                <img 
                  src={qrCodePix} 
                  alt="QR Code PIX" 
                  className="w-48 h-48 object-contain"
                />
              </div>
              <p className="text-sm text-muted-foreground text-center">
                {t('scanPixQrCode')}
              </p>
            </div>
          </TabsContent>

          <TabsContent value="card" className="mt-4">
            <div className="grid grid-cols-2 gap-3">
              {DONATION_OPTIONS.map((option) => (
                <Button
                  key={option.amount}
                  variant={selectedAmount === option.amount ? 'default' : 'outline'}
                  className="h-14 text-lg font-semibold"
                  onClick={() => setSelectedAmount(option.amount)}
                >
                  {option.label}
                </Button>
              ))}
            </div>

            <Button
              className="w-full mt-4"
              size="lg"
              disabled={!selectedAmount || isLoading}
              onClick={handleDonate}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {t('processing')}
                </>
              ) : (
                <>
                  <CreditCard className="mr-2 h-4 w-4" />
                  {t('donateWithCard')}
                </>
              )}
            </Button>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};
