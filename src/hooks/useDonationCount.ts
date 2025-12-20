import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export const useDonationCount = () => {
  return useQuery({
    queryKey: ['donation-count'],
    queryFn: async () => {
      const { data, error } = await supabase
        .rpc('get_completed_donations_count');

      if (error) {
        console.error('Error fetching donation count:', error);
        return 0;
      }

      return data || 0;
    },
    staleTime: 1000 * 60 * 5, // Cache for 5 minutes
  });
};
