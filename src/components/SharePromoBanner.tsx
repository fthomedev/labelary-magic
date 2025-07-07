import { useState, useEffect } from 'react';
import { BarChart3, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

type SurveyResponse = 'useful' | 'used_once' | 'never_used';

export function SharePromoBanner() {
  const [isVisible, setIsVisible] = useState(false);
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

        // Only show banner if user hasn't responded yet
        setIsVisible(!surveyData);
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

        setIsVisible(!surveyData);
      } else {
        setIsVisible(false);
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

      setIsVisible(false);
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

  const handleDismiss = () => {
    setIsVisible(false);
  };

  if (!isVisible || !isLoggedIn) return null;

  return (
    <div className="bg-gradient-to-r from-primary/10 to-primary/5 border-b border-primary/20">
      <div className="mx-auto max-w-7xl px-4">
        <div className="flex items-center justify-between py-3">
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
          
          <div className="flex items-center">
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