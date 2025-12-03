
import { useState } from 'react';
import { Zap, MessageSquare, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { FeedbackModal } from '@/components/FeedbackModal';

export function SharePromoBanner() {
  const [isVisible, setIsVisible] = useState(true);

  const handleDismiss = () => {
    setIsVisible(false);
  };

  if (!isVisible) return null;

  return (
    <div className="bg-gradient-to-r from-green-500/10 to-emerald-500/5 border-b border-green-500/20">
      <div className="mx-auto max-w-7xl px-4">
        <div className="flex items-center justify-between py-3">
          <div className="flex items-center gap-3 flex-1">
            <Zap className="h-5 w-5 text-green-600 flex-shrink-0" />
            <div className="flex-1">
              <p className="text-sm font-medium text-foreground">
                🚀 Performance otimizada! Processos mais rápidos e etiquetas com maior nitidez via IA.
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Encontrou algum erro? Use o botão de feedback ao lado →
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <FeedbackModal />
            
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
