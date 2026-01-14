import React from 'react';
import { useTranslation } from 'react-i18next';
import { FileText, Users, Clock, Sparkles } from 'lucide-react';

interface StatCardProps {
  icon: React.ReactNode;
  value: string;
  label: string;
}

const StatCard: React.FC<StatCardProps> = ({ icon, value, label }) => (
  <div className="text-center p-6">
    <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
      {icon}
    </div>
    <div className="text-4xl md:text-5xl font-bold mb-2 bg-clip-text text-transparent bg-gradient-to-r from-primary to-primary/70">
      {value}
    </div>
    <div className="text-muted-foreground font-medium">{label}</div>
  </div>
);

export const StatsSection: React.FC = () => {
  const { i18n } = useTranslation();
  const isPt = i18n.language === 'pt-BR';

  const stats = [
    {
      icon: <FileText className="w-8 h-8" />,
      value: '50K+',
      label: isPt ? 'Etiquetas Convertidas' : 'Labels Converted'
    },
    {
      icon: <Users className="w-8 h-8" />,
      value: '1.000+',
      label: isPt ? 'Usuários Ativos' : 'Active Users'
    },
    {
      icon: <Clock className="w-8 h-8" />,
      value: '99.9%',
      label: 'Uptime'
    },
    {
      icon: <Sparkles className="w-8 h-8" />,
      value: isPt ? 'IA' : 'AI',
      label: isPt ? 'Modo Nitidez+' : 'Sharpness+ Mode'
    }
  ];

  return (
    <section className="py-20 bg-gradient-to-b from-background to-muted/30" id="estatisticas">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <span className="inline-block px-4 py-2 bg-primary/10 text-primary rounded-full text-sm font-medium mb-4">
            {isPt ? 'Números' : 'Numbers'}
          </span>
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            {isPt ? 'A Confiança de Quem Usa' : 'Trusted by Users'}
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            {isPt 
              ? 'Milhares de etiquetas convertidas com sucesso. Junte-se à comunidade.' 
              : 'Thousands of labels converted successfully. Join the community.'}
          </p>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 max-w-5xl mx-auto">
          {stats.map((stat, index) => (
            <StatCard key={index} {...stat} />
          ))}
        </div>
      </div>
    </section>
  );
};

export default StatsSection;
