import { useEffect, useState, lazy, Suspense } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Header } from '@/components/landing/Header';
import { HeroSection } from '@/components/landing/HeroSection';
import { SEO } from '@/components/SEO';

// Lazy loaded sections
const StatsSection = lazy(() => import('@/components/landing/StatsSection').then(mod => ({ default: mod.StatsSection })));
const ComparisonSection = lazy(() => import('@/components/landing/ComparisonSection').then(mod => ({ default: mod.ComparisonSection })));
const HowItWorksSection = lazy(() => import('@/components/landing/HowItWorksSection').then(mod => ({ default: mod.HowItWorksSection })));
const IntegrationsSection = lazy(() => import('@/components/landing/IntegrationsSection').then(mod => ({ default: mod.IntegrationsSection })));
const BenefitsSection = lazy(() => import('@/components/landing/BenefitsSection').then(mod => ({ default: mod.BenefitsSection })));
const TestimonialsSection = lazy(() => import('@/components/landing/TestimonialsSection').then(mod => ({ default: mod.TestimonialsSection })));
const FAQSection = lazy(() => import('@/components/landing/FAQSection').then(mod => ({ default: mod.FAQSection })));
const CallToActionSection = lazy(() => import('@/components/landing/CallToActionSection').then(mod => ({ default: mod.CallToActionSection })));

const SectionLoadingFallback = () => <div className="h-32 w-full" />;

const Landing = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const [shouldRedirect, setShouldRedirect] = useState(false);
  const navigate = useNavigate();
  
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

    return () => subscription.unsubscribe();
  }, [navigate]);

  if (shouldRedirect || !isLoaded) {
    return (
      <div className="bg-background min-h-screen">
        <SEO 
          title="ZPL Easy – Conversor ZPL para PDF com IA" 
          description="Converta ZPL em PDF com qualidade HD usando inteligência artificial. 100% gratuito."
        />
        <Header isLoggedIn={isLoggedIn} />
        {!shouldRedirect && (
          <div className="flex items-center justify-center min-h-[50vh]">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="bg-background min-h-screen">
      <SEO 
        title="ZPL Easy – Conversor ZPL para PDF com IA" 
        description="Converta ZPL em PDF com qualidade HD usando inteligência artificial. 100% gratuito."
      />
      <Header isLoggedIn={isLoggedIn} />
      <HeroSection isLoggedIn={isLoggedIn} />
      
      <Suspense fallback={<SectionLoadingFallback />}>
        <StatsSection />
      </Suspense>
      
      <Suspense fallback={<SectionLoadingFallback />}>
        <ComparisonSection />
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
