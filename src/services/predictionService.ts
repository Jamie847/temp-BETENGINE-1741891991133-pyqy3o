import { supabase } from '../lib/supabase';
import { AIAgent } from '../ai/AIAgent';
import dayjs from 'dayjs';

const agent = new AIAgent();

export async function generatePredictions() {
  try {
    const isTournamentTime = new Date().getMonth() === 2; // March
    
    // First get existing prediction match IDs
    const { data: predictionData } = await supabase
      .from('predictions')
      .select('match_id');
    
    const existingMatchIds = predictionData?.map(p => p.match_id).filter(Boolean) || [];
    
    // Base query for upcoming matches
    let query = supabase
      .from('matches')
      .select(`
        *,
        home_team:teams!matches_home_team_id_fkey(*),
        away_team:teams!matches_away_team_id_fkey(*),
        weather:weather_data(*),
        odds:betting_odds(*)
      `)
      .eq('status', 'scheduled');

    // Prioritize tournament games during March
    if (isTournamentTime) {
      query = query
        .eq('sport', 'NCAAB')
        .order('start_time', { ascending: true });
    } else {
      query = query
        .gt('start_time', dayjs().toISOString())
        .lt('start_time', dayjs().add(7, 'days').toISOString());
    }

    // Exclude existing predictions
    if (existingMatchIds.length > 0) {
      query = query.not('id', 'in', existingMatchIds);
    }

    const { data: matches, error: matchError } = await query;

    if (matchError) {
      console.error('Error fetching matches:', matchError);
      return;
    }

    if (!matches?.length) {
      console.log('No new matches need predictions');
      return;
    }

    for (const match of matches) {
      // Determine if this is a tournament game
      const isTournamentGame = match.sport === 'NCAAB' && 
        match.tournament_round && 
        isTournamentTime;

      const prediction = await agent.predictMatch(match);
      
      const { error: insertError } = await supabase
        .from('predictions')
        .upsert({
          id: crypto.randomUUID(), // Ensure valid UUID
          match_id: match.id,
          home_win_probability: prediction.homeWinProbability,
          away_win_probability: prediction.awayWinProbability,
          sport: match.sport,
          confidence_score: prediction.confidenceScore,
          factors: prediction.factors,
          prediction_type: isTournamentGame ? 'tournament' : 
            (prediction.confidenceScore >= 85 ? 'high_confidence' : 'regular'),
          created_at: new Date().toISOString()
        });

      if (insertError) {
        console.error('Error inserting prediction:', JSON.stringify(insertError));
      }
    }
  } catch (error) {
    console.error('Error generating predictions:', JSON.stringify(error));
  }
}