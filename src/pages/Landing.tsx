import { useEffect, useState, lazy, Suspense } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Header } from '@/components/landing/Header';
import { HeroSection } from '@/components/landing/HeroSection';
import { SEO } from '@/components/SEO';

// Componentes carregados com lazy loading para melhorar o tempo de carregamento inicial
const FeaturesSection = lazy(() => import('@/components/landing/FeaturesSection').then(mod => ({ default: mod.FeaturesSection })));
const HowItWorksSection = lazy(() => import('@/components/landing/HowItWorksSection').then(mod => ({ default: mod.HowItWorksSection })));
const IntegrationsSection = lazy(() => import('@/components/landing/IntegrationsSection').then(mod => ({ default: mod.IntegrationsSection })));
const BenefitsSection = lazy(() => import('@/components/landing/BenefitsSection').then(mod => ({ default: mod.BenefitsSection })));
const StatsSection = lazy(() => import('@/components/landing/StatsSection').then(mod => ({ default: mod.StatsSection })));
const TestimonialsSection = lazy(() => import('@/components/landing/TestimonialsSection').then(mod => ({ default: mod.TestimonialsSection })));
const FAQSection = lazy(() => import('@/components/landing/FAQSection').then(mod => ({ default: mod.FAQSection })));
const CallToActionSection = lazy(() => import('@/components/landing/CallToActionSection').then(mod => ({ default: mod.CallToActionSection })));

// Componente de fallback leve para Suspense
const SectionLoadingFallback = () => (
  <div className="h-40 w-full animate-pulse bg-muted/20"></div>
);

const Landing = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const [shouldRedirect, setShouldRedirect] = useState(false);
  const navigate = useNavigate();
  
  // Verificar se o usuário está autenticado
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const { data } = await supabase.auth.getSession();
        
        if (data.session) {
          setIsLoggedIn(true);
          setShouldRedirect(true);
          navigate('/app', { replace: true });
          return;
        }
        
        setIsLoggedIn(false);
      } catch (error) {
        console.error("Auth check failed:", error);
        setIsLoggedIn(false);
      } finally {
        setIsLoaded(true);
      }
    };
    
    checkAuth();

    // Configurar listener para mudanças no estado de autenticação
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) {
        setIsLoggedIn(true);
        setShouldRedirect(true);
        navigate('/app', { replace: true });
      } else {
        setIsLoggedIn(false);
        setShouldRedirect(false);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [navigate]);

  // Se devemos redirecionar ou ainda estamos carregando, não renderizar os componentes lazy
  if (shouldRedirect || !isLoaded) {
    return (
      <div className="bg-gradient-to-b from-background to-muted/30 min-h-screen">
        <SEO 
          title="ZPL Easy – Gerador de ZPL em PDF" 
          description="Converta ZPL em PDF, crie etiquetas em lote e integre via API. Teste grátis."
        />
        <Header isLoggedIn={isLoggedIn} />
        {!shouldRedirect && (
          <div className="flex items-center justify-center min-h-[50vh]">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
              <p className="mt-2 text-sm text-muted-foreground">Carregando...</p>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-b from-background to-muted/30 min-h-screen">
      <SEO 
        title="ZPL Easy – Gerador de ZPL em PDF" 
        description="Converta ZPL em PDF, crie etiquetas em lote e integre via API. Teste grátis."
      />
      <Header isLoggedIn={isLoggedIn} />
      <HeroSection isLoggedIn={isLoggedIn} />
      
      <Suspense fallback={<SectionLoadingFallback />}>
        <FeaturesSection />
      </Suspense>
      
      <Suspense fallback={<SectionLoadingFallback />}>
        <HowItWorksSection />
      </Suspense>
      
      <Suspense fallback={<SectionLoadingFallback />}>
        <IntegrationsSection />
      </Suspense>
      
      <Suspense fallback={<SectionLoadingFallback />}>
        <BenefitsSection />
      </Suspense>
      
      <Suspense fallback={<SectionLoadingFallback />}>
        <StatsSection />
      </Suspense>
      
      <Suspense fallback={<SectionLoadingFallback />}>
        <TestimonialsSection />
      </Suspense>
      
      <Suspense fallback={<SectionLoadingFallback />}>
        <FAQSection />
      </Suspense>
      
      <Suspense fallback={<SectionLoadingFallback />}>
        <CallToActionSection isLoggedIn={isLoggedIn} />
      </Suspense>
    </div>
  );
};

export default Landing;
