import React from 'react';
import { useTranslation } from 'react-i18next';
import { Star, Quote } from 'lucide-react';

interface TestimonialCardProps {
  quote: string;
  author: string;
  company: string;
  segment: string;
  metric?: string;
}

const TestimonialCard: React.FC<TestimonialCardProps> = ({ quote, author, company, segment, metric }) => (
  <div className="relative bg-card border border-border/50 p-8 rounded-2xl hover:shadow-xl transition-all duration-300">
    {/* Quote icon */}
    <div className="absolute -top-4 -left-2 w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
      <Quote className="w-5 h-5 text-primary" />
    </div>
    
    {/* Stars */}
    <div className="flex gap-1 mb-4">
      {[...Array(5)].map((_, i) => (
        <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
      ))}
    </div>
    
    {/* Quote text */}
    <blockquote className="text-lg mb-6 leading-relaxed">"{quote}"</blockquote>
    
    {/* Metric badge */}
    {metric && (
      <div className="inline-block px-3 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded-full text-sm font-medium mb-4">
        {metric}
      </div>
    )}
    
    {/* Author info */}
    <div className="flex items-center gap-4">
      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary/30 to-primary/10 flex items-center justify-center text-primary font-bold">
        {author.charAt(0)}
      </div>
      <div>
        <p className="font-semibold">{author}</p>
        <p className="text-sm text-muted-foreground">{company} • {segment}</p>
      </div>
    </div>
  </div>
);

export const TestimonialsSection: React.FC = () => {
  const { i18n } = useTranslation();
  const isPt = i18n.language === 'pt-BR';
  
  const testimonials = [
    {
      quote: isPt 
        ? 'Economizamos horas por semana com a conversão automática de etiquetas. A interface é super simples e a qualidade impressiona!' 
        : 'We save hours per week with automatic label conversion. The interface is super simple and the quality is impressive!',
      author: 'Carlos M.',
      company: 'LogisTech Solutions',
      segment: isPt ? 'E-commerce Logística' : 'E-commerce Logistics',
      metric: isPt ? '5h economizadas/semana' : '5h saved/week'
    },
    {
      quote: isPt 
        ? 'Antes precisávamos de uma impressora Zebra cara. Agora convertemos para PDF e usamos qualquer impressora comum.' 
        : 'Before we needed an expensive Zebra printer. Now we convert to PDF and use any regular printer.',
      author: 'Ana L.',
      company: 'Boutique Fashion',
      segment: 'Shopee & ML Seller',
      metric: isPt ? 'R$2.000 economizados' : '$400 saved'
    },
    {
      quote: isPt 
        ? 'O modo Nitidez+ fez toda diferença para nossos códigos de barras. Menos erros de leitura no armazém!' 
        : 'Sharpness+ mode made all the difference for our barcodes. Fewer reading errors in the warehouse!',
      author: 'Roberto S.',
      company: 'Fast Delivery BR',
      segment: isPt ? 'Transportadora' : 'Carrier',
      metric: isPt ? '-80% erros de leitura' : '-80% reading errors'
    }
  ];
  
  return (
    <section className="py-20 bg-muted/30" id="depoimentos">
      <div className="container mx-auto px-4">
        <div className="text-center mb-14">
          <span className="inline-block px-4 py-2 bg-primary/10 text-primary rounded-full text-sm font-medium mb-4">
            {isPt ? 'Depoimentos' : 'Testimonials'}
          </span>
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            {isPt ? 'O Que Nossos Usuários Dizem' : 'What Our Users Say'}
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            {isPt 
              ? 'Veja como estamos ajudando vendedores e empresas a simplificar seu fluxo de etiquetas.' 
              : 'See how we\'re helping sellers and businesses simplify their label workflow.'}
          </p>
        </div>
        
        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {testimonials.map((testimonial, index) => (
            <TestimonialCard key={index} {...testimonial} />
          ))}
        </div>
      </div>
    </section>
  );
};

export default TestimonialsSection;
