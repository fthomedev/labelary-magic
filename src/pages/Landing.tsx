
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { supabase } from '@/integrations/supabase/client';
import { Check, FileText, ArrowRight, BarChart, Lock, Zap, LogIn } from 'lucide-react';
import { LanguageSelector } from '@/components/LanguageSelector';

const Landing = () => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  
  // Verificar se o usuário já está autenticado
  useEffect(() => {
    const checkAuth = async () => {
      const { data } = await supabase.auth.getSession();
      if (data.session) {
        navigate('/');
      }
    };
    
    checkAuth();
  }, [navigate]);

  const handleGetStarted = () => {
    navigate('/auth');
  };

  const handleLogin = () => {
    navigate('/auth');
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-gray-50 dark:from-gray-900 dark:to-gray-950">
      {/* Header/Navigation */}
      <header className="sticky top-0 z-50 w-full border-b bg-white/95 backdrop-blur dark:bg-gray-900/95 dark:border-gray-800">
        <div className="container mx-auto flex h-16 items-center justify-between">
          <div className="flex items-center gap-2">
            <FileText className="h-6 w-6 text-primary" />
            <span className="text-xl font-semibold">ZPL Magic</span>
          </div>
          <div className="flex items-center gap-4">
            <Button 
              variant="ghost" 
              onClick={() => navigate('/auth')}
              className="hidden sm:flex"
            >
              {t('login')}
            </Button>
            <Button 
              onClick={() => navigate('/auth?signup=true')}
              className="hidden sm:flex"
            >
              {t('register')}
            </Button>
            <LanguageSelector />
          </div>
        </div>
      </header>

      {/* Hero Section with Login Button */}
      <section className="relative py-20 md:py-32 overflow-hidden">
        <div className="container mx-auto px-4">
          <div className="text-center max-w-4xl mx-auto">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 bg-clip-text text-transparent bg-gradient-to-r from-primary to-primary/70">
              {i18n.language === 'pt-BR' ? 'Converta ZPL para PDF de Forma Rápida e Segura' : 'Convert ZPL to PDF Quickly and Securely'}
            </h1>
            <p className="text-xl mb-10 text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
              {i18n.language === 'pt-BR' 
                ? 'Simplifique o seu fluxo de impressão de etiquetas e ganhe tempo com a nossa solução online confiável'
                : 'Simplify your label printing workflow and save time with our reliable online solution'}
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-6">
              <Button 
                size="lg" 
                onClick={handleGetStarted} 
                className="px-8 py-6 text-lg rounded-full shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 w-full sm:w-auto"
              >
                {i18n.language === 'pt-BR' ? 'Crie sua Conta Gratuitamente' : 'Create Your Free Account'}
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
              <Button 
                size="lg" 
                variant="outline" 
                onClick={handleLogin} 
                className="px-8 py-6 text-lg rounded-full shadow-md hover:shadow-lg transition-all duration-300 w-full sm:w-auto"
              >
                <LogIn className="mr-2 h-5 w-5" />
                {i18n.language === 'pt-BR' ? 'Entrar na Conta' : 'Log In'}
              </Button>
            </div>
          </div>
        </div>
        
        {/* Background decoration */}
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-primary/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-primary/10 rounded-full blur-3xl" />
      </section>

      {/* How It Works */}
      <section className="py-20 bg-white dark:bg-gray-900" id="como-funciona">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-16">
            {i18n.language === 'pt-BR' 
              ? 'Como Converter ZPL em PDF em 3 Passos Simples' 
              : 'How to Convert ZPL to PDF in 3 Simple Steps'}
          </h2>
          
          <div className="grid md:grid-cols-3 gap-10 max-w-5xl mx-auto">
            <div className="bg-gray-50 dark:bg-gray-800 p-8 rounded-xl text-center relative">
              <div className="w-12 h-12 bg-primary/20 text-primary flex items-center justify-center rounded-full mx-auto mb-6 text-xl font-bold">1</div>
              <h3 className="text-xl font-semibold mb-4">
                {i18n.language === 'pt-BR' ? 'Faça login ou crie sua conta' : 'Log in or create your account'}
              </h3>
              <p className="text-gray-600 dark:text-gray-300">
                {i18n.language === 'pt-BR' 
                  ? 'Acesse nossa plataforma e autentique-se em segundos.' 
                  : 'Access our platform and authenticate in seconds.'}
              </p>
            </div>
            
            <div className="bg-gray-50 dark:bg-gray-800 p-8 rounded-xl text-center">
              <div className="w-12 h-12 bg-primary/20 text-primary flex items-center justify-center rounded-full mx-auto mb-6 text-xl font-bold">2</div>
              <h3 className="text-xl font-semibold mb-4">
                {i18n.language === 'pt-BR' ? 'Envie seu arquivo ZPL' : 'Upload your ZPL file'}
              </h3>
              <p className="text-gray-600 dark:text-gray-300">
                {i18n.language === 'pt-BR' 
                  ? 'Arraste e solte o arquivo ou selecione-o diretamente do seu computador.' 
                  : 'Drag and drop the file or select it directly from your computer.'}
              </p>
            </div>
            
            <div className="bg-gray-50 dark:bg-gray-800 p-8 rounded-xl text-center">
              <div className="w-12 h-12 bg-primary/20 text-primary flex items-center justify-center rounded-full mx-auto mb-6 text-xl font-bold">3</div>
              <h3 className="text-xl font-semibold mb-4">
                {i18n.language === 'pt-BR' ? 'Baixe seu PDF' : 'Download your PDF'}
              </h3>
              <p className="text-gray-600 dark:text-gray-300">
                {i18n.language === 'pt-BR' 
                  ? 'Em poucos segundos, receba o PDF pronto para impressão.' 
                  : 'In seconds, receive the PDF ready for printing.'}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section className="py-20 bg-gray-50 dark:bg-gray-800" id="beneficios">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-16">
            {i18n.language === 'pt-BR' ? 'Por que Escolher Nossa Ferramenta?' : 'Why Choose Our Tool?'}
          </h2>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-5xl mx-auto">
            <div className="bg-white dark:bg-gray-900 p-6 rounded-xl shadow-sm hover:shadow-md transition-shadow duration-300">
              <div className="mb-4 text-primary">
                <Zap className="h-8 w-8" />
              </div>
              <h3 className="text-xl font-semibold mb-2">
                {i18n.language === 'pt-BR' ? 'Conversão Instantânea' : 'Instant Conversion'}
              </h3>
              <p className="text-gray-600 dark:text-gray-300">
                {i18n.language === 'pt-BR' 
                  ? 'Processamento em nuvem, sem necessidade de instalar softwares adicionais.' 
                  : 'Cloud processing, no need to install additional software.'}
              </p>
            </div>
            
            <div className="bg-white dark:bg-gray-900 p-6 rounded-xl shadow-sm hover:shadow-md transition-shadow duration-300">
              <div className="mb-4 text-primary">
                <FileText className="h-8 w-8" />
              </div>
              <h3 className="text-xl font-semibold mb-2">
                {i18n.language === 'pt-BR' ? 'Suporte a Múltiplos Formatos' : 'Support for Multiple Formats'}
              </h3>
              <p className="text-gray-600 dark:text-gray-300">
                {i18n.language === 'pt-BR' 
                  ? 'Compatível com versões diferentes de ZPL e gera PDFs de alta qualidade.' 
                  : 'Compatible with different ZPL versions and generates high-quality PDFs.'}
              </p>
            </div>
            
            <div className="bg-white dark:bg-gray-900 p-6 rounded-xl shadow-sm hover:shadow-md transition-shadow duration-300">
              <div className="mb-4 text-primary">
                <Check className="h-8 w-8" />
              </div>
              <h3 className="text-xl font-semibold mb-2">
                {i18n.language === 'pt-BR' ? 'Interface Intuitiva' : 'Intuitive Interface'}
              </h3>
              <p className="text-gray-600 dark:text-gray-300">
                {i18n.language === 'pt-BR' 
                  ? 'Basta arrastar, soltar e converter. Sem curva de aprendizado.' 
                  : 'Just drag, drop and convert. No learning curve.'}
              </p>
            </div>
            
            <div className="bg-white dark:bg-gray-900 p-6 rounded-xl shadow-sm hover:shadow-md transition-shadow duration-300">
              <div className="mb-4 text-primary">
                <Lock className="h-8 w-8" />
              </div>
              <h3 className="text-xl font-semibold mb-2">
                {i18n.language === 'pt-BR' ? 'Segurança Garantida' : 'Guaranteed Security'}
              </h3>
              <p className="text-gray-600 dark:text-gray-300">
                {i18n.language === 'pt-BR' 
                  ? 'Proteção dos seus dados e arquivos, com infraestrutura segura e confiável.' 
                  : 'Protection of your data and files, with secure and reliable infrastructure.'}
              </p>
            </div>
            
            <div className="bg-white dark:bg-gray-900 p-6 rounded-xl shadow-sm hover:shadow-md transition-shadow duration-300">
              <div className="mb-4 text-primary">
                <BarChart className="h-8 w-8" />
              </div>
              <h3 className="text-xl font-semibold mb-2">
                {i18n.language === 'pt-BR' ? 'Escalabilidade' : 'Scalability'}
              </h3>
              <p className="text-gray-600 dark:text-gray-300">
                {i18n.language === 'pt-BR' 
                  ? 'Perfeito para uso individual ou em grandes volumes de etiquetas.' 
                  : 'Perfect for individual use or large volumes of labels.'}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20 bg-white dark:bg-gray-900" id="depoimentos">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-16">
            {i18n.language === 'pt-BR' ? 'Histórias de Sucesso' : 'Success Stories'}
          </h2>
          
          <div className="max-w-3xl mx-auto bg-gray-50 dark:bg-gray-800 p-8 rounded-xl relative">
            <div className="text-5xl text-primary/20 absolute top-4 left-4">"</div>
            <blockquote className="text-lg mb-6 relative z-10">
              {i18n.language === 'pt-BR' 
                ? '"Economizamos horas de trabalho por semana ao migrar nosso fluxo de impressão para a ferramenta de conversão ZPL para PDF. A interface é simples e a velocidade impressiona!"' 
                : '"We save hours of work per week by migrating our printing workflow to the ZPL to PDF conversion tool. The interface is simple and the speed is impressive!"'}
            </blockquote>
            <div className="flex items-center">
              <div className="w-12 h-12 rounded-full bg-gray-300 dark:bg-gray-700 mr-4"></div>
              <div>
                <p className="font-semibold">LogisTech Solutions</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">E-commerce Logistics</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Sign Up / Login Section */}
      <section className="py-20 bg-gradient-to-br from-primary/20 to-primary/5" id="cadastro">
        <div className="container mx-auto px-4">
          <div className="text-center max-w-3xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-bold mb-6">
              {i18n.language === 'pt-BR' ? 'Crie Sua Conta Agora Mesmo' : 'Create Your Account Right Now'}
            </h2>
            <p className="text-xl mb-10 text-gray-600 dark:text-gray-300">
              {i18n.language === 'pt-BR' 
                ? 'Faça parte de uma comunidade que já converteu milhares de etiquetas ZPL com apenas alguns cliques.' 
                : 'Join a community that has already converted thousands of ZPL labels with just a few clicks.'}
            </p>
            <Button 
              size="lg" 
              onClick={handleGetStarted}
              className="px-8 py-6 text-lg"
            >
              {i18n.language === 'pt-BR' ? 'Cadastrar / Login' : 'Register / Login'}
            </Button>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-20 bg-white dark:bg-gray-900" id="faq">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-16">
            {i18n.language === 'pt-BR' ? 'Perguntas Frequentes' : 'Frequently Asked Questions'}
          </h2>
          
          <div className="max-w-3xl mx-auto">
            <Accordion type="single" collapsible className="w-full">
              <AccordionItem value="item-1">
                <AccordionTrigger>
                  {i18n.language === 'pt-BR' ? 'Preciso pagar algo para começar?' : 'Do I need to pay anything to start?'}
                </AccordionTrigger>
                <AccordionContent>
                  {i18n.language === 'pt-BR' 
                    ? 'Você pode criar uma conta gratuita para testar a conversão. Consulte nossos planos premium para maior volume.' 
                    : 'You can create a free account to test the conversion. Check our premium plans for higher volume.'}
                </AccordionContent>
              </AccordionItem>
              
              <AccordionItem value="item-2">
                <AccordionTrigger>
                  {i18n.language === 'pt-BR' ? 'É seguro enviar meus arquivos ZPL?' : 'Is it safe to upload my ZPL files?'}
                </AccordionTrigger>
                <AccordionContent>
                  {i18n.language === 'pt-BR' 
                    ? 'Sim! Nossa plataforma utiliza protocolos de segurança avançados para proteger seus dados.' 
                    : 'Yes! Our platform uses advanced security protocols to protect your data.'}
                </AccordionContent>
              </AccordionItem>
              
              <AccordionItem value="item-3">
                <AccordionTrigger>
                  {i18n.language === 'pt-BR' ? 'Posso converter vários arquivos ao mesmo tempo?' : 'Can I convert multiple files at the same time?'}
                </AccordionTrigger>
                <AccordionContent>
                  {i18n.language === 'pt-BR' 
                    ? 'Sim! Oferecemos suporte a conversões em lote dependendo do plano escolhido.' 
                    : 'Yes! We offer support for batch conversions depending on the chosen plan.'}
                </AccordionContent>
              </AccordionItem>
              
              <AccordionItem value="item-4">
                <AccordionTrigger>
                  {i18n.language === 'pt-BR' ? 'Há limite de tamanho de arquivo?' : 'Is there a file size limit?'}
                </AccordionTrigger>
                <AccordionContent>
                  {i18n.language === 'pt-BR' 
                    ? 'Temos limites de acordo com cada plano. Consulte nossa documentação para mais detalhes.' 
                    : 'We have limits according to each plan. Check our documentation for more details.'}
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </div>
        </div>
      </section>

      {/* Footer / Final CTA */}
      <footer className="py-16 bg-gray-900 text-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-2xl md:text-3xl font-bold mb-6">
            {i18n.language === 'pt-BR' ? 'Pronto para Otimizar seu Fluxo de Impressão de Etiquetas?' : 'Ready to Optimize Your Label Printing Workflow?'}
          </h2>
          <p className="mb-10 max-w-2xl mx-auto text-gray-300">
            {i18n.language === 'pt-BR' 
              ? 'Simplifique a criação de etiquetas e poupe tempo precioso. Acesse agora e descubra por que nossa ferramenta de conversão ZPL para PDF é a escolha ideal para milhares de usuários.' 
              : 'Simplify label creation and save precious time. Access now and discover why our ZPL to PDF conversion tool is the ideal choice for thousands of users.'}
          </p>
          <Button 
            size="lg" 
            onClick={handleGetStarted}
            className="px-8 py-6 text-lg bg-white text-gray-900 hover:bg-gray-100"
          >
            {i18n.language === 'pt-BR' ? 'Quero Criar Minha Conta Agora' : 'I Want to Create My Account Now'}
          </Button>
          
          <div className="mt-16 pt-8 border-t border-gray-800 text-sm text-gray-400">
            <p>© {new Date().getFullYear()} ZPL Magic. {i18n.language === 'pt-BR' ? 'Todos os direitos reservados.' : 'All rights reserved.'}</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
