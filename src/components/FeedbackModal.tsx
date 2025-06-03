
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { MessageCircle, Send } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface FeedbackData {
  type: string;
  message: string;
  userEmail: string;
}

export const FeedbackModal = () => {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedbackType, setFeedbackType] = useState('');
  const [message, setMessage] = useState('');

  const feedbackTypes = [
    { value: 'suggestion', label: 'Sugestão' },
    { value: 'bug', label: 'Erro' },
    { value: 'complaint', label: 'Reclamação' },
    { value: 'other', label: 'Outro' },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!feedbackType || !message.trim()) {
      toast({
        title: 'Campos obrigatórios',
        description: 'Por favor, preencha todos os campos.',
        variant: 'destructive',
      });
      return;
    }

    setIsSubmitting(true);

    try {
      // Get user email from Supabase auth
      const { data: { user } } = await supabase.auth.getUser();
      const userEmail = user?.email || 'Usuário não identificado';

      const feedbackData: FeedbackData = {
        type: feedbackTypes.find(t => t.value === feedbackType)?.label || feedbackType,
        message: message.trim(),
        userEmail,
      };

      // Create form data for FormSubmit
      const formData = new FormData();
      formData.append('_subject', `Feedback ZPL Easy - ${feedbackData.type}`);
      formData.append('_next', window.location.href); // Redirect back to current page
      formData.append('_captcha', 'false'); // Disable captcha
      formData.append('tipo', feedbackData.type);
      formData.append('mensagem', feedbackData.message);
      formData.append('email_usuario', feedbackData.userEmail);

      // Send to FormSubmit.co
      const response = await fetch('https://formsubmit.co/fernandothome@gmail.com', {
        method: 'POST',
        body: formData
      });

      if (response.ok) {
        toast({
          title: 'Feedback enviado!',
          description: 'Obrigado pelo seu feedback. Entraremos em contato em breve.',
        });

        // Reset form and close modal
        setFeedbackType('');
        setMessage('');
        setIsOpen(false);
      } else {
        throw new Error('Erro no envio');
      }
    } catch (error) {
      console.error('Error sending feedback:', error);
      toast({
        title: 'Erro ao enviar feedback',
        description: 'Tente novamente mais tarde ou entre em contato diretamente.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="flex items-center gap-2"
          aria-label="Enviar feedback"
        >
          <MessageCircle size={16} />
          <span className="hidden sm:inline">Feedback</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MessageCircle size={20} />
            Enviar Feedback
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="feedback-type" className="text-sm font-medium">
              Tipo de feedback *
            </label>
            <Select value={feedbackType} onValueChange={setFeedbackType}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione o tipo de feedback" />
              </SelectTrigger>
              <SelectContent>
                {feedbackTypes.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <label htmlFor="message" className="text-sm font-medium">
              Mensagem *
            </label>
            <Textarea
              id="message"
              placeholder="Descreva seu feedback detalhadamente..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={4}
              className="resize-none"
            />
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsOpen(false)}
              disabled={isSubmitting}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting || !feedbackType || !message.trim()}
              className="flex items-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-background border-t-transparent" />
                  Enviando...
                </>
              ) : (
                <>
                  <Send size={16} />
                  Enviar Feedback
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
