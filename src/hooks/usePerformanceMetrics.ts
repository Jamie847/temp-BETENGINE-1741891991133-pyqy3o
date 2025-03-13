import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

export interface PerformanceMetrics {
  prediction_type: string;
  total_predictions: number;
  resolved_predictions: number;
  correct_predictions: number;
  avg_confidence: number;
  win_percentage: number;
  profit_loss: number;
}

export interface SportAccuracy {
  sport: string;
  total_predictions: number;
  resolved_predictions: number;
  correct_predictions: number;
  avg_confidence: number;
  win_percentage: number;
  profit_loss: number;
  first_prediction: string;
  last_prediction: string;
}

export function useSportAccuracy() {
  const [sportAccuracy, setSportAccuracy] = useState<SportAccuracy[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchSportAccuracy() {
      try {
        // First check if view exists
        const { error: viewError } = await supabase
          .rpc('check_view_exists', { view_name: 'sport_prediction_accuracy' });

        if (viewError) {
          // Create view if it doesn't exist
          await supabase.rpc('create_sport_accuracy_view');
        }

        const { data, error: err } = await supabase
          .from('sport_prediction_accuracy')
          .select('*')
          .order('win_percentage', { ascending: false });

        if (err) throw err;
        setSportAccuracy(data || []);
      } catch (err) {
        // Fallback to direct query if view doesn't exist
        try {
          const { data, error: queryError } = await supabase
            .from('predictions')
            .select(`
              sport,
              count(*) as total_predictions,
              count(*) filter (where resolved_at is not null) as resolved_predictions,
              count(*) filter (where actual_outcome = true) as correct_predictions,
              avg(confidence_score) as avg_confidence,
              avg(case when actual_outcome = true then 100 else 0 end) as win_percentage,
              sum(profit_loss) as profit_loss
            `)
            .group('sport');

          if (queryError) throw queryError;
          setSportAccuracy(data || []);
        } catch (fallbackError) {
          console.error('Fallback query failed:', fallbackError);
          setError('Failed to fetch sport accuracy metrics');
        }
        console.error(err);
      } finally {
        setLoading(false);
      }
    }

    fetchSportAccuracy();

    // Subscribe to predictions changes
    const subscription = supabase
      .channel('sport_accuracy_updates')
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'predictions' 
      }, () => {
        fetchSportAccuracy();
      })
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  return { sportAccuracy, loading, error };
}
export function usePerformanceMetrics() {
  const [metrics, setMetrics] = useState<PerformanceMetrics[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchMetrics() {
      try {
        const { data, error: err } = await supabase
          .from('prediction_performance')
          .select('*')
          .order('prediction_type');

        if (err) throw err;
        setMetrics(data || []);
      } catch (err) {
        setError('Failed to fetch performance metrics');
        console.error(err);
      } finally {
        setLoading(false);
      }
    }

    fetchMetrics();

    // Subscribe to predictions changes
    const subscription = supabase
      .channel('prediction_updates')
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'predictions' 
      }, () => {
        fetchMetrics();
      })
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  return { metrics, loading, error };
}
