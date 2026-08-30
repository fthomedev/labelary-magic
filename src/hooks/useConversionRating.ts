import { useCallback, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface ConversionRatingContext {
  processingHistoryId?: string | null;
  processingType?: string;
  labelCount?: number;
  processingTimeMs?: number;
  twoColumn?: boolean;
  labelSize?: string;
}

export const useConversionRating = () => {
  const [isSaving, setIsSaving] = useState(false);

  const saveRating = useCallback(
    async (rating: number, comment: string | null, context: ConversionRatingContext) => {
      setIsSaving(true);
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          console.log('Rating skipped: no authenticated user');
          return false;
        }

        const { error } = await supabase.from('conversion_ratings').insert({
          user_id: user.id,
          rating,
          comment: comment && comment.trim() ? comment.trim().slice(0, 2000) : null,
          processing_history_id: context.processingHistoryId ?? null,
          processing_type: context.processingType ?? null,
          label_count: context.labelCount ?? null,
          processing_time_ms: context.processingTimeMs ?? null,
          two_column: context.twoColumn ?? null,
          label_size: context.labelSize ?? null,
        });

        if (error) {
          // Never block the UI because of analytics
          console.error('Error saving conversion rating:', error);
          return false;
        }
        return true;
      } catch (error) {
        console.error('Failed to save conversion rating:', error);
        return false;
      } finally {
        setIsSaving(false);
      }
    },
    []
  );

  return { saveRating, isSaving };
};
