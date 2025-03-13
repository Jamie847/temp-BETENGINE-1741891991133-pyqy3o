import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import type { Match, Team, Prediction } from '../types';

export function useMatches(sport: string = 'all') {
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchMatches() {
      try {
        // Get existing prediction match IDs first
        const { data: predictionData, error: predError } = await supabase
          .from('predictions')
          .select('match_id');

        if (predError) throw predError;
        
        const existingMatchIds = predictionData?.map(p => p.match_id).filter(Boolean) || [];

        let query = supabase
          .from('matches')
          .select(`
            *,
            home_team:teams!matches_home_team_id_fkey(*),
            away_team:teams!matches_away_team_id_fkey(*),
            weather:weather_data(*),
            odds:betting_odds(*),
            predictions(*)
          `)
          .order('start_time', { ascending: true });
        
        if (sport !== 'all') {
          query = query
            .eq('sport', sport.toUpperCase())
            .gt('start_time', new Date().toISOString());
        }

        if (existingMatchIds.length > 0) {
          query = query.not('id', 'in', existingMatchIds);
        }

        const { data, error: err } = await query;

        if (err) throw err;
        
        // Transform and validate data
        const validMatches = (data || []).map(match => ({
          id: match.id,
          sport: match.sport,
          startTime: match.start_time,
          venue: { 
            name: match.venue_name || 'TBD', 
            city: match.venue_city || '', 
            state: match.venue_state || '' 
          },
          homeTeam: { 
            ...match.home_team,
            logo: match.home_team?.logo_url || 'https://via.placeholder.com/24?text=Team',
            logo: match.home_team?.logo_url || '',
            name: match.home_team?.name || 'TBD',
            record: match.home_team?.record || '0-0'
          },
          awayTeam: { 
            ...match.away_team,
            logo: match.away_team?.logo_url || '',
            name: match.away_team?.name || 'TBD',
            record: match.away_team?.record || '0-0'
          },
          predictions: match.predictions?.[0] || { 
            confidenceScore: 0,
            homeWinProbability: 0.5,
            awayWinProbability: 0.5
          }
        }));
        
        setMatches(validMatches);
      } catch (err) {
        setError('Failed to fetch matches');
        console.error('Match fetch error:', err);
        // Fall back to mock data
        const mockMatches = MOCK_DATA.matches
          .filter(m => sport === 'all' || m.sport.toUpperCase() === sport.toUpperCase())
          .map(match => ({
            id: match.id,
            sport: match.sport,
            startTime: match.date,
            venue: {
              name: match.competitions[0].venue?.fullName || 'TBD',
              city: match.competitions[0].venue?.address?.city || '',
              state: match.competitions[0].venue?.address?.state || ''
            },
            homeTeam: {
              id: match.competitions[0].competitors[0].team.id,
              name: match.competitions[0].competitors[0].team.name,
              logo: match.competitions[0].competitors[0].team.logo,
              record: match.competitions[0].competitors[0].records[0].summary
            },
            awayTeam: {
              id: match.competitions[0].competitors[1].team.id,
              name: match.competitions[0].competitors[1].team.name,
              logo: match.competitions[0].competitors[1].team.logo,
              record: match.competitions[0].competitors[1].records[0].summary
            },
            predictions: {
              confidenceScore: 75,
              homeWinProbability: 0.5,
              awayWinProbability: 0.5
            }
          }));
        setMatches(mockMatches);
      } finally {
        setLoading(false);
      }
    }

    fetchMatches();
  }, [sport]);

  return { matches, loading, error };
}

export function useHighConfidencePicks() {
  const [picks, setPicks] = useState<Prediction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchPicks() {
      try {
        const { data, error: err } = await supabase
          .from('predictions')
          .select(`
            *,
            match:matches(
              *,
              home_team:teams!matches_home_team_id_fkey(*),
              away_team:teams!matches_away_team_id_fkey(*)
            )
          `)
          .gte('confidence_score', 85)
          .order('confidence_score', { ascending: false });

        if (err) throw err;
        setPicks(data || []);
      } catch (err) {
        setError('Failed to fetch high confidence picks');
        console.error(err);
      } finally {
        setLoading(false);
      }
    }

    fetchPicks();
  }, []);

  return { picks, loading, error };
}
