import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface ProjectMetrics {
  totalLabels: number;
  totalConversions: number;
  uniqueUsers: number;
  labelsToday: number;
  conversionsToday: number;
  totalDonations: number;
  lastUpdated: Date;
  isLoading: boolean;
  error: string | null;
}

const CACHE_DURATION_MS = 5 * 60 * 1000; // 5 minutes

let cachedMetrics: ProjectMetrics | null = null;
let lastFetchTime: number = 0;

export const useProjectMetrics = (forceRefresh = false) => {
  const [metrics, setMetrics] = useState<ProjectMetrics>({
    totalLabels: 0,
    totalConversions: 0,
    uniqueUsers: 0,
    labelsToday: 0,
    conversionsToday: 0,
    totalDonations: 0,
    lastUpdated: new Date(),
    isLoading: true,
    error: null,
  });

  const fetchMetrics = useCallback(async () => {
    const now = Date.now();
    
    // Use cache if available and not expired
    if (!forceRefresh && cachedMetrics && (now - lastFetchTime) < CACHE_DURATION_MS) {
      setMetrics(cachedMetrics);
      return;
    }

    try {
      // Fetch total labels and conversions
      const { data: totalData, error: totalError } = await supabase
        .from('processing_history')
        .select('label_count, user_id');

      if (totalError) throw totalError;

      // Fetch today's data
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const { data: todayData, error: todayError } = await supabase
        .from('processing_history')
        .select('label_count')
        .gte('date', today.toISOString());

      if (todayError) throw todayError;

      // Fetch donations count using the database function
      const { data: donationsCount, error: donationsError } = await supabase
        .rpc('get_completed_donations_count');

      if (donationsError) throw donationsError;

      // Calculate metrics
      const totalLabels = totalData?.reduce((sum, row) => sum + (row.label_count || 0), 0) || 0;
      const totalConversions = totalData?.length || 0;
      const uniqueUsers = new Set(totalData?.map(row => row.user_id)).size;
      const labelsToday = todayData?.reduce((sum, row) => sum + (row.label_count || 0), 0) || 0;
      const conversionsToday = todayData?.length || 0;

      const newMetrics: ProjectMetrics = {
        totalLabels,
        totalConversions,
        uniqueUsers,
        labelsToday,
        conversionsToday,
        totalDonations: donationsCount || 0,
        lastUpdated: new Date(),
        isLoading: false,
        error: null,
      };

      // Update cache
      cachedMetrics = newMetrics;
      lastFetchTime = now;
      
      setMetrics(newMetrics);
    } catch (error) {
      console.error('Error fetching project metrics:', error);
      setMetrics(prev => ({
        ...prev,
        isLoading: false,
        error: 'Failed to fetch metrics',
      }));
    }
  }, [forceRefresh]);

  useEffect(() => {
    fetchMetrics();
  }, [fetchMetrics]);

  const refetch = useCallback(() => {
    lastFetchTime = 0; // Force cache invalidation
    fetchMetrics();
  }, [fetchMetrics]);

  return { ...metrics, refetch };
};
