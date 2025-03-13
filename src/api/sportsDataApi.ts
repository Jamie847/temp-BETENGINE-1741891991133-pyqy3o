import axios from 'axios';
import rateLimit from 'axios-rate-limit';
import { API_ENDPOINTS } from './sources';
import type { SportsDataTeam, SportsDataGame, SportsDataGameOdds, SportsDataPlayerGame } from '../types/sportsData';

const API_KEY = import.meta.env.VITE_SPORTSDATA_API_KEY;
const BASE_URL = 'https://api.sportsdata.io/v3/cbb';

// Create base axios instance with common config
const baseConfig = {
  timeout: 10000,
  headers: {
    'Ocp-Apim-Subscription-Key': API_KEY,
    'Accept': 'application/json'
  }
};

// Create rate-limited instance
const http = rateLimit(axios.create(baseConfig), {
  maxRequests: 5,
  perMilliseconds: 1000
});

// Enhanced error handling with retries
async function fetchWithRetry(client: any, endpoint: string, options: any = {}, retries = 3) {
  for (let i = 0; i < retries; i++) {
    const fullUrl = `${BASE_URL}${endpoint}`;
    try {
      console.log(`[SportsData API] Fetching ${fullUrl}...`);
      const response = await client.get(endpoint, options);
      console.log(`[SportsData API] Successfully fetched ${endpoint}:`, response.data?.length || 1, 'items');
      return response.data;
    } catch (error) {
      const errorMsg = error.response?.data?.message || error.message;
      console.error(`[SportsData API] Error (attempt ${i + 1}/${retries}) for ${endpoint}:`, errorMsg);
      if (error.response?.status === 401) {
        console.error('[SportsData API] Authentication failed. Check API key.');
        throw error;
      }
      if (i === retries - 1) throw error;
      await new Promise(resolve => setTimeout(resolve, 2000 * Math.pow(2, i))); // Exponential backoff
    }
  }
}

export const sportsDataApi = {
  // Fantasy endpoints
  getCurrentSeason: async (): Promise<number> => {
    try {
      const data = await fetchWithRetry(http, API_ENDPOINTS.NCAAB.CURRENT_SEASON);
      return parseInt(data) || new Date().getFullYear();
    } catch (error) {
      console.error('[SportsData API] Error getting current season:', error);
      return new Date().getFullYear();
    }
  },
  
  getLeagueHierarchy: async () => {
    try {
      return await fetchWithRetry(http, API_ENDPOINTS.NCAAB.LEAGUE_HIERARCHY);
    } catch (error) {
      console.error('[SportsData API] Error getting league hierarchy:', error);
      return [];
    }
  },
  
  getPlayers: async () => {
    try {
      return await fetchWithRetry(http, API_ENDPOINTS.NCAAB.PLAYERS);
    } catch (error) {
      console.error('[SportsData API] Error getting players:', error);
      return [];
    }
  },
  
  getPlayersByTeam: async (team: string) => {
    try {
      return await fetchWithRetry(http, API_ENDPOINTS.NCAAB.PLAYERS_BY_TEAM.replace('{team}', team));
    } catch (error) {
      console.error(`[SportsData API] Error getting players for team ${team}:`, error);
      return [];
    }
  },
  
  getTeams: async (): Promise<SportsDataTeam[]> => {
    try {
      return await fetchWithRetry(http, API_ENDPOINTS.NCAAB.TEAMS);
    } catch (error) {
      console.error('[SportsData API] Error getting teams:', error);
      return [];
    }
  },
  
  getPlayerGameStatsByDate: (date: string) => 
    fetchWithRetry(http, API_ENDPOINTS.NCAAB.PLAYER_GAME_STATS_BY_DATE.replace('{date}', date)),
  
  getPlayerSeasonStats: (season: string) => 
    fetchWithRetry(http, API_ENDPOINTS.NCAAB.PLAYER_SEASON_STATS.replace('{season}', season)),
  
  getPlayerSeasonStatsByTeam: (season: string, team: string) => 
    fetchWithRetry(http, API_ENDPOINTS.NCAAB.PLAYER_SEASON_STATS_BY_TEAM.replace('{season}', season).replace('{team}', team)),

  // Odds endpoints
  getGamesByDate: (date: string) => 
    fetchWithRetry(http, API_ENDPOINTS.NCAAB.GAMES_BY_DATE.replace('{date}', date)),
  
  getGameOddsByDate: (date: string) => 
    fetchWithRetry(http, API_ENDPOINTS.NCAAB.GAME_ODDS_BY_DATE.replace('{date}', date)),
  
  getGameOddsLineMovement: (gameId: string) => 
    fetchWithRetry(http, API_ENDPOINTS.NCAAB.GAME_ODDS_LINE_MOVEMENT.replace('{gameid}', gameId)),
  
  getSchedules: (season: string) => 
    fetchWithRetry(http, API_ENDPOINTS.NCAAB.SCHEDULES.replace('{season}', season)),
  
  getStadiums: () => 
    fetchWithRetry(http, API_ENDPOINTS.NCAAB.STADIUMS),
  
  getTeamGameStatsByDate: (date: string) => 
    fetchWithRetry(http, API_ENDPOINTS.NCAAB.TEAM_GAME_STATS_BY_DATE.replace('{date}', date)),
  
  getTeamSeasonStats: (season: string) => 
    fetchWithRetry(http, API_ENDPOINTS.NCAAB.TEAM_SEASON_STATS.replace('{season}', season))
};
