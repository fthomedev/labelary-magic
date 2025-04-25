
import { useEffect, useState, lazy, Suspense } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Header } from '@/components/landing/Header';
import { HeroSection } from '@/components/landing/HeroSection';
import { SEO } from '@/components/SEO';

// Componentes carregados com lazy loading para melhorar o tempo de carregamento inicial
const HowItWorksSection = lazy(() => import('@/components/landing/HowItWorksSection').then(mod => ({ default: mod.HowItWorksSection })));
const BenefitsSection = lazy(() => import('@/components/landing/BenefitsSection').then(mod => ({ default: mod.BenefitsSection })));
const TestimonialsSection = lazy(() => import('@/components/landing/TestimonialsSection').then(mod => ({ default: mod.TestimonialsSection })));
const CallToActionSection = lazy(() => import('@/components/landing/CallToActionSection').then(mod => ({ default: mod.CallToActionSection })));
const FAQSection = lazy(() => import('@/components/landing/FAQSection').then(mod => ({ default: mod.FAQSection })));

// Componente de fallback leve para Suspense
const SectionLoadingFallback = () => <div className="h-40 w-full"></div>;

const Landing = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  
  // Verificar se o usuário está autenticado
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const { data } = await supabase.auth.getSession();
        setIsLoggedIn(!!data.session);
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
      setIsLoggedIn(!!session);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  return (
    <div className="bg-gradient-to-b from-white to-gray-50 dark:from-gray-900 dark:to-gray-950">
      <SEO 
        title="ZPL Easy – Gerador de ZPL em PDF" 
        description="Converta ZPL em PDF, crie etiquetas em lote e integre via API. Teste grátis."
      />
      <Header isLoggedIn={isLoggedIn} />
      <HeroSection isLoggedIn={isLoggedIn} />
      
      <Suspense fallback={<SectionLoadingFallback />}>
        <HowItWorksSection />
      </Suspense>
      
      <Suspense fallback={<SectionLoadingFallback />}>
        <BenefitsSection />
      </Suspense>
      
      <Suspense fallback={<SectionLoadingFallback />}>
        <TestimonialsSection />
      </Suspense>
      
      <Suspense fallback={<SectionLoadingFallback />}>
        <CallToActionSection isLoggedIn={isLoggedIn} />
      </Suspense>
      
      <Suspense fallback={<SectionLoadingFallback />}>
        <FAQSection />
      </Suspense>
    </div>
  );
};

export default Landing;
