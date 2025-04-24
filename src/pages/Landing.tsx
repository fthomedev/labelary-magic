
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Header } from '@/components/landing/Header';
import { HeroSection } from '@/components/landing/HeroSection';
import { HowItWorksSection } from '@/components/landing/HowItWorksSection';
import { BenefitsSection } from '@/components/landing/BenefitsSection';
import { TestimonialsSection } from '@/components/landing/TestimonialsSection';
import { CallToActionSection } from '@/components/landing/CallToActionSection';
import { FAQSection } from '@/components/landing/FAQSection';
import { SEO } from '@/components/SEO';

const Landing = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  
  // Verificar se o usuário está autenticado
  useEffect(() => {
    const checkAuth = async () => {
      const { data } = await supabase.auth.getSession();
      if (data.session) {
        setIsLoggedIn(true);
      } else {
        setIsLoggedIn(false);
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
      <HowItWorksSection />
      <BenefitsSection />
      <TestimonialsSection />
      <CallToActionSection isLoggedIn={isLoggedIn} />
      <FAQSection />
    </div>
  );
};

export default Landing;
