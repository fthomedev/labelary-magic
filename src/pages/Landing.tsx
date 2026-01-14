
import { useEffect, useState, lazy, Suspense } from 'react';
import { useNavigate } from 'react-router-dom';
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
const SectionLoadingFallback = () => {
  console.log('🔄 [DEBUG] SectionLoadingFallback rendering');
  return <div className="h-40 w-full"></div>;
};

const Landing = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const [shouldRedirect, setShouldRedirect] = useState(false);
  const navigate = useNavigate();
  
  console.log('🏠 [DEBUG] Landing component rendering, isLoggedIn:', isLoggedIn, 'isLoaded:', isLoaded, 'shouldRedirect:', shouldRedirect);
  
  // Verificar se o usuário está autenticado
  useEffect(() => {
    console.log('🔐 [DEBUG] Landing useEffect - checking auth');
    const checkAuth = async () => {
      try {
        const { data } = await supabase.auth.getSession();
        console.log('✅ [DEBUG] Auth check completed, session exists:', !!data.session);
        
        if (data.session) {
          console.log('🔄 [DEBUG] User is logged in, preparing redirect to /app');
          setIsLoggedIn(true);
          setShouldRedirect(true);
          // Usar replace para evitar adicionar ao histórico e permitir volta
          navigate('/app', { replace: true });
          return;
        }
        
        setIsLoggedIn(false);
      } catch (error) {
        console.error("❌ [DEBUG] Auth check failed:", error);
        setIsLoggedIn(false);
      } finally {
        console.log('🏁 [DEBUG] Setting isLoaded to true');
        setIsLoaded(true);
      }
    };
    
    checkAuth();

    // Configurar listener para mudanças no estado de autenticação
    console.log('🔄 [DEBUG] Setting up auth state change listener');
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      console.log('🔄 [DEBUG] Auth state changed, session exists:', !!session);
      
      if (session) {
        console.log('🔄 [DEBUG] Auth state change: User logged in, redirecting to /app');
        setIsLoggedIn(true);
        setShouldRedirect(true);
        navigate('/app', { replace: true });
      } else {
        setIsLoggedIn(false);
        setShouldRedirect(false);
      }
    });

    return () => {
      console.log('🧹 [DEBUG] Cleaning up auth subscription');
      subscription.unsubscribe();
    };
  }, [navigate]);

  // Se devemos redirecionar ou ainda estamos carregando, não renderizar os componentes lazy
  if (shouldRedirect || !isLoaded) {
    console.log('⏳ [DEBUG] Landing page - showing minimal content during auth check/redirect');
    return (
      <div className="bg-gradient-to-b from-white to-gray-50 dark:from-gray-900 dark:to-gray-950 min-h-screen">
        <SEO 
          title="ZPL Easy – Gerador de ZPL em PDF" 
          description="Converta ZPL em PDF, crie etiquetas em lote e integre via API. Teste grátis."
        />
        <Header isLoggedIn={isLoggedIn} />
        {!shouldRedirect && (
          <div className="flex items-center justify-center min-h-[50vh]">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
              <p className="mt-2 text-sm text-gray-500">Carregando...</p>
            </div>
          </div>
        )}
      </div>
    );
  }

  console.log('🎨 [DEBUG] Landing page - rendering full content for non-authenticated user');

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
