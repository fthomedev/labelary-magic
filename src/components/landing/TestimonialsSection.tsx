import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ChevronLeft, ChevronRight, Quote, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Testimonial {
  id: number;
  quotePt: string;
  quoteEn: string;
  author: string;
  role: string;
  company: string;
  avatar: string;
}

const testimonials: Testimonial[] = [
  {
    id: 1,
    quotePt: 'Economizamos horas de trabalho por semana ao migrar nosso fluxo de impressão para o ZPL Easy. A qualidade HD fez toda diferença nas etiquetas de códigos de barras.',
    quoteEn: 'We save hours of work per week by migrating our printing workflow to ZPL Easy. The HD quality made all the difference in barcode labels.',
    author: 'Ricardo S.',
    role: 'Gerente de Logística',
    company: 'E-commerce SP',
    avatar: 'RS'
  },
  {
    id: 2,
    quotePt: 'Finalmente uma ferramenta gratuita que funciona! Processei mais de 500 etiquetas da Shopee sem nenhum problema. Interface super intuitiva.',
    quoteEn: 'Finally a free tool that works! I processed over 500 Shopee labels without any issues. Super intuitive interface.',
    author: 'Fernanda M.',
    role: 'Vendedora',
    company: 'Marketplace',
    avatar: 'FM'
  },
  {
    id: 3,
    quotePt: 'O modo HD com IA é incrível. Minhas etiquetas agora imprimem com qualidade perfeita, especialmente os QR codes que antes ficavam borrados.',
    quoteEn: 'The HD mode with AI is amazing. My labels now print with perfect quality, especially the QR codes that used to be blurry.',
    author: 'João P.',
    role: 'Dono de Loja',
    company: 'Mercado Livre',
    avatar: 'JP'
  }
];

export const TestimonialsSection: React.FC = () => {
  const { i18n } = useTranslation();
  const isPortuguese = i18n.language === 'pt-BR';
  const [currentIndex, setCurrentIndex] = useState(0);

  const nextTestimonial = () => {
    setCurrentIndex((prev) => (prev + 1) % testimonials.length);
  };

  const prevTestimonial = () => {
    setCurrentIndex((prev) => (prev - 1 + testimonials.length) % testimonials.length);
  };

  const currentTestimonial = testimonials[currentIndex];
  
  return (
    <section className="py-20 bg-card" id="depoimentos">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            {isPortuguese ? 'O que Nossos Usuários Dizem' : 'What Our Users Say'}
          </h2>
          <p className="text-lg text-muted-foreground">
            {isPortuguese ? 'Histórias de sucesso de quem já usa o ZPL Easy' : 'Success stories from ZPL Easy users'}
          </p>
        </div>
        
        <div className="max-w-4xl mx-auto">
          {/* Main testimonial card */}
          <div className="relative bg-gradient-to-br from-primary/5 to-transparent border border-border rounded-3xl p-8 md:p-12">
            <Quote className="absolute top-6 left-6 h-12 w-12 text-primary/20" />
            
            <div className="relative z-10">
              {/* Stars */}
              <div className="flex gap-1 mb-6">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="h-5 w-5 fill-primary text-primary" />
                ))}
              </div>

              {/* Quote */}
              <blockquote className="text-xl md:text-2xl text-foreground mb-8 leading-relaxed">
                "{isPortuguese ? currentTestimonial.quotePt : currentTestimonial.quoteEn}"
              </blockquote>

              {/* Author */}
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-full bg-primary/10 text-primary flex items-center justify-center text-lg font-bold">
                  {currentTestimonial.avatar}
                </div>
                <div>
                  <p className="font-bold text-foreground">{currentTestimonial.author}</p>
                  <p className="text-muted-foreground text-sm">
                    {currentTestimonial.role} • {currentTestimonial.company}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <div className="flex items-center justify-center gap-4 mt-8">
            <Button
              variant="outline"
              size="icon"
              onClick={prevTestimonial}
              className="rounded-full"
              aria-label="Previous testimonial"
            >
              <ChevronLeft className="h-5 w-5" />
            </Button>

            {/* Dots */}
            <div className="flex gap-2">
              {testimonials.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentIndex(index)}
                  className={`w-2.5 h-2.5 rounded-full transition-all ${
                    index === currentIndex ? 'bg-primary w-8' : 'bg-border hover:bg-muted-foreground'
                  }`}
                  aria-label={`Go to testimonial ${index + 1}`}
                />
              ))}
            </div>

            <Button
              variant="outline"
              size="icon"
              onClick={nextTestimonial}
              className="rounded-full"
              aria-label="Next testimonial"
            >
              <ChevronRight className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
};
