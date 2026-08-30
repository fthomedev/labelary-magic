import { useState } from 'react';
import { Star, Heart, Loader2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { DonationButton } from '@/components/DonationButton';
import { useConversionRating, ConversionRatingContext } from '@/hooks/useConversionRating';
import qrCodePix from '@/assets/qrcode-pix.png';

interface ConversionRatingProps {
  context: ConversionRatingContext;
  onDismiss?: () => void;
}

type Phase = 'idle' | 'comment' | 'thanks-high' | 'thanks-low';

export const ConversionRating = ({ context, onDismiss }: ConversionRatingProps) => {
  const { t } = useTranslation();
  const { saveRating, isSaving } = useConversionRating();
  const [hovered, setHovered] = useState(0);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [phase, setPhase] = useState<Phase>('idle');

  const handleSelect = async (value: number) => {
    if (phase !== 'idle' || isSaving) return;
    setRating(value);

    if (value >= 4) {
      await saveRating(value, null, context);
      setPhase('thanks-high');
    } else {
      // Save the score right away; the comment is an optional follow-up
      await saveRating(value, null, context);
      setPhase('comment');
    }
  };

  const handleSendComment = async () => {
    if (comment.trim()) {
      await saveRating(rating, comment, context);
    }
    setPhase('thanks-low');
  };

  return (
    <div className="rounded-lg border border-border/60 bg-muted/30 p-4">
      {phase === 'idle' && (
        <div className="flex flex-col items-center gap-2">
          <p className="text-sm font-medium text-foreground">{t('rating.question')}</p>
          <div className="flex items-center gap-1" role="radiogroup" aria-label={t('rating.question')}>
            {[1, 2, 3, 4, 5].map((value) => (
              <button
                key={value}
                type="button"
                role="radio"
                aria-checked={rating === value}
                aria-label={t('rating.starLabel', { count: value })}
                className="p-1 rounded transition-transform hover:scale-110 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                onMouseEnter={() => setHovered(value)}
                onMouseLeave={() => setHovered(0)}
                onFocus={() => setHovered(value)}
                onBlur={() => setHovered(0)}
                onClick={() => handleSelect(value)}
                disabled={isSaving}
              >
                <Star
                  className={`h-7 w-7 transition-colors ${
                    value <= (hovered || rating)
                      ? 'fill-amber-400 text-amber-400'
                      : 'text-muted-foreground'
                  }`}
                />
              </button>
            ))}
          </div>
          {onDismiss && (
            <button
              type="button"
              onClick={onDismiss}
              className="text-xs text-muted-foreground underline-offset-4 hover:underline"
            >
              {t('rating.notNow')}
            </button>
          )}
        </div>
      )}

      {phase === 'comment' && (
        <div className="space-y-3">
          <p className="text-sm font-medium text-foreground">{t('rating.improveQuestion')}</p>
          <Textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder={t('rating.commentPlaceholder')}
            maxLength={2000}
            rows={3}
          />
          <div className="flex justify-end gap-2">
            <Button variant="ghost" size="sm" onClick={() => setPhase('thanks-low')}>
              {t('rating.skip')}
            </Button>
            <Button size="sm" onClick={handleSendComment} disabled={isSaving}>
              {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              {t('rating.send')}
            </Button>
          </div>
        </div>
      )}

      {phase === 'thanks-low' && (
        <p className="text-center text-sm text-muted-foreground">{t('rating.thanksFeedback')}</p>
      )}

      {phase === 'thanks-high' && (
        <div className="flex flex-col items-center gap-3 text-center">
          <p className="text-sm font-medium text-foreground flex items-center gap-2">
            <Heart className="h-4 w-4 text-red-500" />
            {t('rating.thanksHigh')}
          </p>
          <p className="text-sm text-muted-foreground">{t('rating.supportAsk')}</p>
          <div className="bg-white p-2 rounded-lg shadow-sm">
            <img src={qrCodePix} alt="QR Code PIX" className="w-40 h-40 object-contain" />
          </div>
          <p className="text-xs text-muted-foreground">{t('scanPixQrCode')}</p>
          <DonationButton variant="success" />
        </div>
      )}
    </div>
  );
};
