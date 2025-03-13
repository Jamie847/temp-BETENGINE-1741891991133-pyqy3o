import { supabase } from '../lib/supabase';
import { sportsDataApi } from '../api/sportsDataApi';
import dayjs from 'dayjs';

export async function trackBracketResults() {
  try {
    const today = dayjs().format('YYYY-MM-DD');
    
    // Get today's tournament games
    const games = await sportsDataApi.getGamesByDate(today);
    const tournamentGames = games.filter(g => g.TournamentID);

    for (const game of tournamentGames) {
      if (game.Status === 'Final') {
        // Get the bracket prediction for this game
        const { data: bracketRound } = await supabase
          .from('bracket_rounds')
          .select('*')
          .eq('match_id', game.GameID)
          .single();

        if (bracketRound) {
          // Determine if prediction was correct
          const winningTeamId = game.HomeTeamScore > game.AwayTeamScore 
            ? game.HomeTeamID 
            : game.AwayTeamID;

          const predictionCorrect = bracketRound.predicted_winner_id === winningTeamId;

          // Update bracket round result
          await supabase
            .from('bracket_rounds')
            .update({
              prediction_correct: predictionCorrect,
              winning_team_id: winningTeamId,
              losing_team_id: game.HomeTeamScore > game.AwayTeamScore 
                ? game.AwayTeamID 
                : game.HomeTeamID
            })
            .eq('id', bracketRound.id);

          console.log(`Updated bracket prediction result: ${predictionCorrect ? 'Correct' : 'Incorrect'}`);
        }
      }
    }
  } catch (error) {
    console.error('Error tracking bracket results:', error);
  }
}
