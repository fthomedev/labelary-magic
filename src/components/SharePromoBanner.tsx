
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Copy, Share2, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

export function SharePromoBanner() {
  const [isVisible, setIsVisible] = useState(true);
  const { t } = useTranslation();
  const { toast } = useToast();

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText('https://www.zpleasy.com');
      toast({
        title: 'Link copiado!',
        description: 'O link foi copiado para sua área de transferência.',
        duration: 3000,
      });
    } catch (error) {
      toast({
        title: 'Erro ao copiar',
        description: 'Não foi possível copiar o link.',
        variant: 'destructive',
        duration: 3000,
      });
    }
  };

  const handleDismiss = () => {
    setIsVisible(false);
  };

  if (!isVisible) return null;

  return (
    <div className="bg-gradient-to-r from-primary/10 to-primary/5 border-b border-primary/20">
      <div className="mx-auto max-w-7xl px-4">
        <div className="flex items-center justify-between py-3">
          <div className="flex items-center gap-3 flex-1">
            <Share2 className="h-5 w-5 text-primary flex-shrink-0" />
            <div className="flex-1">
              <p className="text-sm font-medium text-foreground">
                Gostou da ferramenta? Compartilhe com seus colegas!
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Button
              onClick={handleCopyLink}
              size="sm"
              variant="outline"
              className="gap-2 text-xs"
            >
              <Copy className="h-3 w-3" />
              Copiar Link
            </Button>
            
            <Button
              onClick={handleDismiss}
              size="sm"
              variant="ghost"
              className="h-8 w-8 p-0"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
