import { supabase } from '../lib/supabase';
import { fetchMatchData } from '../api/client';
import dayjs from 'dayjs';

export async function syncMatchResults() {
  try {
    // Get matches that need resolution
    const { data: pendingMatches } = await supabase
      .from('matches')
      .select(`
        id,
        sport,
        home_team_id,
        away_team_id,
        start_time,
        status
      `)
      .in('status', ['scheduled', 'in_progress'])
      .lt('start_time', dayjs().toISOString());

    if (!pendingMatches?.length) return;

    for (const match of pendingMatches) {
      // Fetch latest match data
      const matchData = await fetchMatchData(match.sport, 'all');
      const result = matchData?.events?.find(
        (e: any) => 
          e.id === match.id || 
          (dayjs(e.date).isSame(match.start_time, 'day') &&
           e.competitions[0].competitors.some((c: any) => 
             c.team.id === match.home_team_id || c.team.id === match.away_team_id))
      );

      if (!result) continue;

      // Update match result
      const homeScore = parseInt(result.competitions[0].competitors[0].score);
      const awayScore = parseInt(result.competitions[0].competitors[1].score);
      const status = result.status.type.completed ? 'finished' : 'in_progress';

      await supabase
        .from('matches')
        .update({
          home_score: homeScore,
          away_score: awayScore,
          status,
          result_data: result
        })
        .eq('id', match.id);

      // If match is finished, resolve predictions
      if (status === 'finished') {
        const homeWin = homeScore > awayScore;
        
        const { data: predictions } = await supabase
          .from('predictions')
          .select('*')
          .eq('match_id', match.id)
          .is('resolved_at', null);

        for (const prediction of predictions || []) {
          const correct = prediction.home_win_probability > 0.5 ? homeWin : !homeWin;
          const profitLoss = correct ? 
            (prediction.home_win_probability > 0.5 ? prediction.odds - 1 : prediction.odds - 1) : 
            -1;

          await supabase
            .from('predictions')
            .update({
              actual_outcome: correct,
              resolved_at: new Date().toISOString(),
              profit_loss: profitLoss
            })
            .eq('id', prediction.id);
        }
      }
    }
  } catch (error) {
    console.error('Error syncing match results:', error);
  }
}