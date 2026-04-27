import React, { useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { MessageCircle, Send, Paperclip, X, FileText } from 'lucide-react';
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

const MAX_ATTACHMENT_BYTES = 9 * 1024 * 1024; // 9MB safety margin under FormSubmit's 10MB cap

const formatBytes = (bytes: number) => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
};

export const FeedbackModal = () => {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedbackType, setFeedbackType] = useState('');
  const [message, setMessage] = useState('');
  const [attachment, setAttachment] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const feedbackTypes = [
    { value: 'suggestion', label: t('feedbackSuggestion') },
    { value: 'bug', label: t('feedbackBug') },
    { value: 'complaint', label: t('feedbackComplaint') },
    { value: 'other', label: t('feedbackOther') },
  ];

  const isBug = feedbackType === 'bug';

  const resetForm = () => {
    setFeedbackType('');
    setMessage('');
    setAttachment(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleTypeChange = (value: string) => {
    setFeedbackType(value);
    // Clear attachment if user moves away from "bug"
    if (value !== 'bug') {
      setAttachment(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > MAX_ATTACHMENT_BYTES) {
      toast({
        title: t('attachFileTooLarge'),
        variant: 'destructive',
      });
      e.target.value = '';
      return;
    }

    setAttachment(file);
  };

  const removeAttachment = () => {
    setAttachment(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Guard against double submissions
    if (isSubmitting) return;

    if (!feedbackType || !message.trim()) {
      toast({
        title: t('requiredFields'),
        description: t('fillAllFields'),
        variant: 'destructive',
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      const userEmail = user?.email || 'Usuário não identificado';
      const typeLabel = feedbackTypes.find(t => t.value === feedbackType)?.label || feedbackType;

      if (attachment) {
        // Attachment branch: FormSubmit only accepts files via multipart on the
        // classic endpoint. We use mode: 'no-cors' (response is opaque, treat as success).
        const formData = new FormData();
        formData.append('_subject', 'Contato ZPL Easy');
        formData.append('_captcha', 'false');
        formData.append('tipo', typeLabel);
        formData.append('mensagem', message.trim());
        formData.append('email_usuario', userEmail);
        formData.append('attachment', attachment, attachment.name);

        await fetch('https://formsubmit.co/fernandothome@gmail.com', {
          method: 'POST',
          mode: 'no-cors',
          body: formData,
        });
        // Opaque response — assume success if no network error
      } else {
        // No attachment: use AJAX endpoint with JSON (proper CORS, returns 200)
        const response = await fetch('https://formsubmit.co/ajax/fernandothome@gmail.com', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
          },
          body: JSON.stringify({
            _subject: 'Contato ZPL Easy',
            _captcha: 'false',
            tipo: typeLabel,
            mensagem: message.trim(),
            email_usuario: userEmail,
          }),
        });

        if (!response.ok) throw new Error('Erro no envio');
      }

      toast({
        title: t('feedbackSent'),
        description: t('feedbackThankYou'),
      });

      resetForm();
      setIsOpen(false);
    } catch (error) {
      console.error('Error sending feedback:', error);
      toast({
        title: t('errorSendingFeedback'),
        description: t('tryAgainLater'),
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
          aria-label={t('sendFeedback')}
        >
          <MessageCircle size={16} />
          <span className="hidden sm:inline">{t('feedback')}</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MessageCircle size={20} />
            {t('sendFeedback')}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="feedback-type" className="text-sm font-medium">
              {t('feedbackType')} *
            </label>
            <Select value={feedbackType} onValueChange={handleTypeChange}>
              <SelectTrigger>
                <SelectValue placeholder={t('selectFeedbackType')} />
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
              {t('feedbackMessage')} *
            </label>
            <Textarea
              id="message"
              placeholder={t('feedbackMessagePlaceholder')}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={4}
              className="resize-none"
            />
          </div>

          {isBug && (
            <div className="rounded-lg border-2 border-dashed border-border bg-muted/30 p-3 space-y-2 animate-in fade-in slide-in-from-top-2 duration-300">
              <div className="flex items-start gap-2">
                <Paperclip size={16} className="text-muted-foreground mt-0.5 flex-shrink-0" />
                <div className="space-y-1 flex-1">
                  <p className="text-sm font-medium">{t('attachFile')}</p>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    {t('attachFileDescription')}
                  </p>
                </div>
              </div>

              <input
                ref={fileInputRef}
                type="file"
                accept=".zpl,.txt,.zip,.prn"
                onChange={handleFileChange}
                className="hidden"
                id="feedback-attachment"
              />

              {!attachment ? (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full"
                >
                  <Paperclip size={14} className="mr-2" />
                  {t('attachFileSelect')}
                </Button>
              ) : (
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2 rounded-md border border-border bg-background p-2">
                    <FileText size={16} className="text-primary flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium truncate">{attachment.name}</p>
                      <p className="text-xs text-muted-foreground">{formatBytes(attachment.size)}</p>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={removeAttachment}
                      aria-label={t('attachFileRemove')}
                      className="h-7 w-7 flex-shrink-0"
                    >
                      <X size={14} />
                    </Button>
                  </div>
                  <p className="text-xs text-green-600 dark:text-green-400 font-medium">
                    {t('attachFileBenefit')}
                  </p>
                </div>
              )}

              <p className="text-[11px] text-muted-foreground italic">
                🔒 {t('attachFilePrivacy')}
              </p>
            </div>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsOpen(false)}
              disabled={isSubmitting}
            >
              {t('cancel')}
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting || !feedbackType || !message.trim()}
              className="flex items-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-background border-t-transparent" />
                  {t('sending')}
                </>
              ) : (
                <>
                  <Send size={16} />
                  {t('sendFeedbackButton')}
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
