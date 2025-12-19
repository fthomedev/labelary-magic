import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export const useDonationCount = () => {
  return useQuery({
    queryKey: ['donation-count'],
    queryFn: async () => {
      const { count, error } = await supabase
        .from('donations')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'completed');

      if (error) {
        console.error('Error fetching donation count:', error);
        return 0;
      }

      return count || 0;
    },
    staleTime: 1000 * 60 * 5, // Cache for 5 minutes
  });
};
