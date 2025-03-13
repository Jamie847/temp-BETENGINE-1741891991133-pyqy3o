// API Configuration
export const API_CONFIG = {
  SPORTSDATA: {
    API_KEY: import.meta.env.VITE_SPORTSDATA_API_KEY,
    BASE_URL: import.meta.env.VITE_SPORTSDATA_BASE_URL,
    FANTASY: {
      CURRENT_SEASON: '/fantasy/json/CurrentSeason',
      LEAGUE_HIERARCHY: '/fantasy/json/LeagueHierarchy',
      PLAYERS: '/fantasy/json/Players',
      PLAYERS_BY_TEAM: '/fantasy/json/Players/{team}',
      TEAMS: '/fantasy/json/Teams',
      PLAYER_GAME_STATS_BY_DATE: '/fantasy/json/PlayerGameStatsByDate/{date}',
      PLAYER_SEASON_STATS: '/fantasy/json/PlayerSeasonStats/{season}',
      PLAYER_SEASON_STATS_BY_TEAM: '/fantasy/json/PlayerSeasonStatsByTeam/{season}/{team}'
    },
    ODDS: {
      GAMES_BY_DATE: '/odds/json/GamesByDate/{date}',
      GAME_ODDS_BY_DATE: '/odds/json/GameOddsByDate/{date}',
      GAME_ODDS_LINE_MOVEMENT: '/odds/json/GameOddsLineMovement/{gameid}',
      SCHEDULES: '/odds/json/Games/{season}',
      STADIUMS: '/odds/json/Stadiums',
      TEAM_GAME_STATS_BY_DATE: '/odds/json/TeamGameStatsByDate/{date}',
      TEAM_SEASON_STATS: '/odds/json/TeamSeasonStats/{season}'
    }
  }
};
