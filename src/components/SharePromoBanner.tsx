import { useState, useEffect } from 'react';
import { BarChart3, X, Share2, Copy } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

type SurveyResponse = 'useful' | 'used_once' | 'never_used';
type BannerMode = 'survey' | 'share' | 'hidden';

export function SharePromoBanner() {
  const [mode, setMode] = useState<BannerMode>('hidden');
  const [isLoading, setIsLoading] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const checkAuth = async () => {
      const { data } = await supabase.auth.getSession();
      const loggedIn = !!data.session;
      setIsLoggedIn(loggedIn);

      if (loggedIn) {
        // Check if user has already responded to the survey
        const { data: surveyData } = await supabase
          .from('history_usage_survey')
          .select('id')
          .single();

        // Show survey if user hasn't responded, otherwise show share banner
        setMode(!surveyData ? 'survey' : 'share');
      }
    };

    checkAuth();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      const loggedIn = !!session;
      setIsLoggedIn(loggedIn);

      if (loggedIn) {
        const { data: surveyData } = await supabase
          .from('history_usage_survey')
          .select('id')
          .single();

        setMode(!surveyData ? 'survey' : 'share');
      } else {
        setMode('hidden');
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleSurveyResponse = async (response: SurveyResponse) => {
    if (!isLoggedIn) return;

    setIsLoading(true);
    try {
      const { error } = await supabase
        .from('history_usage_survey')
        .insert({
          user_id: (await supabase.auth.getSession()).data.session?.user.id,
          response
        });

      if (error) throw error;

      toast({
        title: 'Obrigado pela sua opinião!',
        description: 'Sua resposta foi registrada com sucesso.',
        duration: 3000,
      });

      // Switch to share mode after successful survey response
      setMode('share');
    } catch (error) {
      console.error('Error saving survey response:', error);
      toast({
        title: 'Erro ao salvar resposta',
        description: 'Tente novamente mais tarde.',
        variant: 'destructive',
        duration: 3000,
      });
    } finally {
      setIsLoading(false);
    }
  };

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
    setMode('hidden');
  };

  if (mode === 'hidden' || !isLoggedIn) return null;

  return (
    <div className="bg-gradient-to-r from-primary/10 to-primary/5 border-b border-primary/20">
      <div className="mx-auto max-w-7xl px-4">
        <div className="flex items-center justify-between py-3">
          {mode === 'survey' ? (
            <>
              <div className="flex items-center gap-3 flex-1">
                <BarChart3 className="h-5 w-5 text-primary flex-shrink-0" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-foreground mb-2">
                    O histórico de conversões é útil para você?
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <Button
                      onClick={() => handleSurveyResponse('useful')}
                      size="sm"
                      variant="outline"
                      className="text-xs"
                      disabled={isLoading}
                    >
                      Muito útil
                    </Button>
                    <Button
                      onClick={() => handleSurveyResponse('used_once')}
                      size="sm"
                      variant="outline"
                      className="text-xs"
                      disabled={isLoading}
                    >
                      Usei uma vez
                    </Button>
                    <Button
                      onClick={() => handleSurveyResponse('never_used')}
                      size="sm"
                      variant="outline"
                      className="text-xs"
                      disabled={isLoading}
                    >
                      Nunca uso
                    </Button>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <>
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
              </div>
            </>
          )}
          
          <div className="flex items-center ml-2">
            <Button
              onClick={handleDismiss}
              size="sm"
              variant="ghost"
              className="h-8 w-8 p-0"
              disabled={isLoading}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}