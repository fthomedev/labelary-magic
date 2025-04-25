
import { useEffect, useState, lazy, Suspense, memo } from 'react';
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

// Componente de fallback leve para Suspense - otimizado para evitar layout shifts
const SectionLoadingFallback = memo(() => (
  <div className="h-40 w-full bg-gradient-to-b from-transparent to-gray-50/30 dark:from-transparent dark:to-gray-900/30" aria-hidden="true"></div>
));

// Usar memo para componentes estáticos
const MemoizedSEO = memo(SEO);

const Landing = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const [visibleSections, setVisibleSections] = useState({
    howItWorks: false,
    benefits: false,
    testimonials: false,
    cta: false,
    faq: false
  });
  
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
    
    // Otimização para não bloquear renderização
    setTimeout(() => checkAuth(), 100);

    // Configurar listener para mudanças no estado de autenticação
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsLoggedIn(!!session);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // Implementar carregamento progressivo baseado em interseção para seções
  useEffect(() => {
    if (!isLoaded) return;

    const observerOptions = {
      root: null,
      rootMargin: '100px',
      threshold: 0.1
    };

    const sectionObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const sectionId = entry.target.id;
          setVisibleSections(prev => ({ ...prev, [sectionId]: true }));
          sectionObserver.unobserve(entry.target);
        }
      });
    }, observerOptions);

    // Elementos a serem observados
    const sectionIds = ['como-funciona', 'beneficios', 'depoimentos', 'cta', 'faq'];
    sectionIds.forEach(id => {
      const element = document.getElementById(id);
      if (element) sectionObserver.observe(element);
    });

    return () => sectionObserver.disconnect();
  }, [isLoaded]);

  return (
    <div className="bg-gradient-to-b from-white to-gray-50 dark:from-gray-900 dark:to-gray-950">
      <MemoizedSEO 
        title="ZPL Easy – Gerador de ZPL em PDF" 
        description="Converta ZPL em PDF, crie etiquetas em lote e integre via API. Teste grátis."
      />
      <Header isLoggedIn={isLoggedIn} />
      <HeroSection isLoggedIn={isLoggedIn} />
      
      <div id="como-funciona" className="section-anchor"></div>
      {visibleSections.howItWorks && (
        <Suspense fallback={<SectionLoadingFallback />}>
          <HowItWorksSection />
        </Suspense>
      )}
      
      <div id="beneficios" className="section-anchor"></div>
      {visibleSections.benefits && (
        <Suspense fallback={<SectionLoadingFallback />}>
          <BenefitsSection />
        </Suspense>
      )}
      
      <div id="depoimentos" className="section-anchor"></div>
      {visibleSections.testimonials && (
        <Suspense fallback={<SectionLoadingFallback />}>
          <TestimonialsSection />
        </Suspense>
      )}
      
      <div id="cta" className="section-anchor"></div>
      {visibleSections.cta && (
        <Suspense fallback={<SectionLoadingFallback />}>
          <CallToActionSection isLoggedIn={isLoggedIn} />
        </Suspense>
      )}
      
      <div id="faq" className="section-anchor"></div>
      {visibleSections.faq && (
        <Suspense fallback={<SectionLoadingFallback />}>
          <FAQSection />
        </Suspense>
      )}
    </div>
  );
};

// Exportando como memo para evitar re-renderizações desnecessárias
export default memo(Landing);
