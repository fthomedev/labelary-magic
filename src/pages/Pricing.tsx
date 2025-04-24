
import { SEO } from "@/components/SEO";
import { StaticSubscriptionPlans } from "@/components/subscription/StaticSubscriptionPlans";

const Pricing = () => {
  return (
    <div className="bg-gradient-to-b from-white to-gray-50 dark:from-gray-900 dark:to-gray-950">
      <SEO 
        title="Planos e Preços do ZPL Easy"
        description="Escolha o plano ideal para imprimir etiquetas ZPL em nuvem."
      />
      
      <div className="container mx-auto px-4 py-16">
        <h1 className="text-4xl md:text-5xl font-bold mb-6 text-center">
          Planos e Preços
        </h1>
        <p className="text-xl mb-12 text-center text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
          Escolha o plano ideal para suas necessidades de conversão de etiquetas ZPL
        </p>
        
        <StaticSubscriptionPlans />
      </div>
    </div>
  );
};

export default Pricing;
