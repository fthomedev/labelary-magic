import { useState } from 'react';
import { Heart, Coffee, Loader2 } from 'lucide-react';
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
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';

const DONATION_OPTIONS = [
  { amount: 500, label: 'R$ 5' },
  { amount: 1000, label: 'R$ 10' },
  { amount: 2500, label: 'R$ 25' },
  { amount: 5000, label: 'R$ 50' },
];

interface DonationButtonProps {
  variant?: 'default' | 'compact' | 'success';
  className?: string;
}

export const DonationButton = ({ variant = 'default', className = '' }: DonationButtonProps) => {
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
          <Button className={`gap-2 bg-primary hover:bg-primary/90 text-primary-foreground animate-pulse ${className}`}>
            <Coffee className="h-4 w-4" />
            {t('supportProject')}
          </Button>
        ) : (
          <Button variant="outline" className={`gap-2 ${className}`}>
            <Heart className="h-4 w-4 text-red-500" />
            {t('supportProject')}
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Heart className="h-5 w-5 text-red-500" />
            {t('supportProject')}
          </DialogTitle>
          <DialogDescription>
            {t('donationDescription')}
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid grid-cols-2 gap-3 py-4">
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
          className="w-full"
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
              <Heart className="mr-2 h-4 w-4" />
              {t('donateNow')}
            </>
          )}
        </Button>
      </DialogContent>
    </Dialog>
  );
};
