import { sportsDataApi } from '../api/sportsDataApi';
import type { SportsDataTeam, SportsDataGame, SportsDataGameOdds, SportsDataPlayerGame } from '../types/sportsData';
import { supabase } from '../lib/supabase';
import dayjs from 'dayjs';

export async function syncNCAABasketballData() {
  console.log('[NCAA Sync] Starting NCAA basketball data sync');
  console.log('[NCAA Sync] Using Sports Data IO API key:', '1b2733da195b4ca3b5fad5c8ae2082db');

  let currentSeason;

  try {
    // Get current season
    try {
      currentSeason = await sportsDataApi.getCurrentSeason();
      console.log('[NCAA Sync] Current season:', currentSeason);
    } catch (error) {
      console.error('[NCAA Sync] Error getting current season:', error);
      currentSeason = new Date().getFullYear();
      console.log('[NCAA Sync] Using fallback current season:', currentSeason);
    }
    
    // Fetch all required data in parallel
    const [teams, schedule, stadiums] = await Promise.all([
      sportsDataApi.getTeams(),
      sportsDataApi.getSchedules(currentSeason),
      sportsDataApi.getStadiums()
    ]).catch(error => {
      console.error('[NCAA Sync] Error fetching initial data:', error);
      return [[], [], []];
    });

    console.log(`[NCAA Sync] Fetched ${teams.length} teams, ${schedule.length} games, ${stadiums.length} stadiums`);

    // Process and store team data
    for (const team of teams) {
      console.log(`[NCAA Sync] Processing team: ${team.School}`);
      const { data: storedTeam, error: teamError } = await supabase
        .from('teams')
        .upsert({
          name: team.School,
          sport: 'NCAAB',
          conference: team.Conference,
          ranking: team.ApRank,
          record: team.Wins && team.Losses ? `${team.Wins}-${team.Losses}` : '0-0',
          logo_url: team.TeamLogoUrl || 'https://via.placeholder.com/24?text=Team',
          updated_at: new Date().toISOString()
        })
        .select()
        .single();

      if (teamError) {
        console.error(`Error storing team ${team.School}:`, teamError);
        continue;
      }

      // Get team's season stats
      const seasonStats = await sportsDataApi.getTeamSeasonStats(currentSeason);
      const teamStats = seasonStats.find(s => s.TeamID === team.TeamID);
      console.log(`Got season stats for ${team.School}:`, teamStats ? 'found' : 'not found');
      
      if (teamStats && storedTeam) {
        await supabase
          .from('historical_performance')
          .upsert({
            team_id: storedTeam.id,
            season: currentSeason,
            regular_season_wins: teamStats.Wins,
            regular_season_losses: teamStats.Losses,
            created_at: new Date().toISOString()
          });
      }
    }

    // Process and store game data
    const today = dayjs().format('YYYY-MM-DD');
    const [todaysGames, gameOdds] = await Promise.all([
      sportsDataApi.getGamesByDate(today),
      sportsDataApi.getGameOddsByDate(today)
    ]).catch(error => {
      console.error('Error fetching today\'s games:', error);
      return [[], []];
    });

    console.log(`Fetched ${todaysGames.length} games and ${gameOdds.length} odds for today`);

    for (const game of todaysGames) {
      const homeTeam = teams.find(t => t.TeamID === game.HomeTeamID);
      const awayTeam = teams.find(t => t.TeamID === game.AwayTeamID);
      const stadium = stadiums.find(s => s.StadiumID === game.Stadium?.StadiumID);
      const odds = gameOdds.find(o => o.GameId === game.GameID);

      if (homeTeam && awayTeam) {
        // Store match
        const { data: match, error: matchError } = await supabase
          .from('matches')
          .upsert({
            sport: 'NCAAB',
            home_team_id: homeTeam.TeamID,
            away_team_id: awayTeam.TeamID,
            start_time: game.DateTime,
            venue_name: stadium?.Name,
            venue_city: stadium?.City,
            venue_state: stadium?.State,
            tournament_round: game.Round ? `Round ${game.Round}` : null,
            status: game.Status,
            home_score: game.HomeTeamScore,
            away_score: game.AwayTeamScore,
            created_at: new Date().toISOString()
          })
          .select()
          .single();

        if (matchError) {
          console.error('Error storing match:', matchError);
          continue;
        }

        // Store odds if available
        if (odds && match) {
          await supabase
            .from('betting_odds')
            .upsert({
              match_id: match.id,
              home_odds: odds.HomeMoneyLine,
              away_odds: odds.AwayMoneyLine,
              over_under: odds.OverUnder,
              created_at: new Date().toISOString()
            });
        }

        // Get and store player stats
        const playerStats = await sportsDataApi.getPlayerGameStatsByDate(today);
        const gameStats = playerStats.filter(p => 
          p.TeamID === game.HomeTeamID || p.TeamID === game.AwayTeamID
        );

        if (match && gameStats.length > 0) {
          await supabase
            .from('historical_data')
            .upsert({
              match_id: match.id,
              performance_metrics: gameStats,
              created_at: new Date().toISOString()
            });
        }
      }
    }

    console.log('[NCAA Sync] Data sync completed successfully');
  } catch (error) {
    console.error('[NCAA Sync] Error during sync:', error);
    if (error.response) {
      console.error('API Response:', error.response.data);
      console.error('Status:', error.response.status);
    }
  }
}
