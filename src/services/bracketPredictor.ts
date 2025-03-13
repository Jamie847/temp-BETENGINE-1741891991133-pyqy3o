import { supabase } from '../lib/supabase';
import { AIAgent } from '../ai/AIAgent';
import { sportsDataApi } from '../api/sportsDataApi';
import type { Team, Match } from '../types';

const agent = new AIAgent();

interface BracketTeam {
  id: string;
  name: string;
  seed: number;
  region: string;
}

interface BracketPrediction {
  round: number;
  matchId: string;
  predictedWinnerId: string;
  confidenceScore: number;
}

export async function generateTournamentBracket(season: number) {
  try {
    console.log('Generating tournament bracket predictions...');

    // Get tournament teams from Sports Data IO
    const teams = await sportsDataApi.getTeams();
    const tournamentTeams = teams.filter(team => team.ApRank && team.ApRank <= 68);

    // Store tournament bracket structure
    for (const team of tournamentTeams) {
      const { data: storedTeam } = await supabase
        .from('teams')
        .select('id')
        .eq('name', team.School)
        .single();

      if (storedTeam) {
        await supabase
          .from('tournament_brackets')
          .insert({
            season,
            region: team.Conference,
            seed: team.ApRank,
            team_id: storedTeam.id
          });
      }
    }

    // Generate predictions for each round
    const regions = ['East', 'West', 'South', 'Midwest'];
    const predictions: BracketPrediction[] = [];

    // First round matchups
    for (const region of regions) {
      const regionTeams = await getRegionTeams(season, region);
      const firstRoundMatchups = generateFirstRoundMatchups(regionTeams);
      
      for (const matchup of firstRoundMatchups) {
        const prediction = await predictMatchup(matchup.team1, matchup.team2);
        predictions.push({
          round: 1,
          matchId: matchup.matchId,
          predictedWinnerId: prediction.homeWinProbability > 0.5 ? matchup.team1.id : matchup.team2.id,
          confidenceScore: prediction.confidenceScore
        });
      }
    }

    // Store predictions
    for (const prediction of predictions) {
      await supabase
        .from('bracket_rounds')
        .insert({
          round_number: prediction.round,
          match_id: prediction.matchId,
          predicted_winner_id: prediction.predictedWinnerId,
          confidence_score: prediction.confidenceScore
        });
    }

    console.log('Tournament bracket predictions generated successfully');
  } catch (error) {
    console.error('Error generating tournament bracket:', error);
  }
}

async function getRegionTeams(season: number, region: string): Promise<BracketTeam[]> {
  const { data: teams } = await supabase
    .from('tournament_brackets')
    .select(`
      id,
      team:teams (
        id,
        name
      ),
      seed,
      region
    `)
    .eq('season', season)
    .eq('region', region);

  return teams?.map(t => ({
    id: t.team.id,
    name: t.team.name,
    seed: t.seed,
    region: t.region
  })) || [];
}

function generateFirstRoundMatchups(teams: BracketTeam[]) {
  const matchups = [];
  const sortedTeams = teams.sort((a, b) => a.seed - b.seed);

  for (let i = 0; i < sortedTeams.length / 2; i++) {
    matchups.push({
      team1: sortedTeams[i],
      team2: sortedTeams[sortedTeams.length - 1 - i],
      matchId: crypto.randomUUID()
    });
  }

  return matchups;
}

async function predictMatchup(team1: BracketTeam, team2: BracketTeam) {
  // Get full team data
  const [homeTeam, awayTeam] = await Promise.all([
    getTeamData(team1.id),
    getTeamData(team2.id)
  ]);

  // Create mock match for prediction
  const match: Match = {
    id: crypto.randomUUID(),
    sport: 'NCAAB',
    homeTeam,
    awayTeam,
    startTime: new Date(),
    venue: {
      name: 'Tournament Venue',
      city: '',
      state: '',
      capacity: 0,
      surface: ''
    },
    weather: {
      temperature: 70,
      condition: 'Indoor',
      windSpeed: 0,
      precipitation: 0,
      humidity: 50
    },
    odds: {
      homeOdds: 1.9,
      awayOdds: 1.9,
      overUnder: 140,
      lineMovement: []
    },
    tournament: {
      round: `Round of ${team1.seed <= 8 ? '64' : '32'}`,
      region: team1.region
    }
  };

  return agent.predictMatch(match);
}

async function getTeamData(teamId: string): Promise<Team> {
  const { data: team } = await supabase
    .from('teams')
    .select(`
      *,
      historical_performance (
        tournament_seed,
        tournament_result
      )
    `)
    .eq('id', teamId)
    .single();

  return {
    id: team.id,
    name: team.name,
    logo: team.logo_url,
    record: team.record,
    recentForm: [],
    injuries: team.injuries || [],
    seed: team.seed,
    strengthOfSchedule: team.strength_of_schedule,
    tournamentHistory: {
      appearances: team.tournament_appearances || 0,
      finalFours: team.final_four_appearances || 0,
      championships: 0,
      lastAppearance: team.historical_performance?.[0]?.season
    },
    venue: null
  };
}
