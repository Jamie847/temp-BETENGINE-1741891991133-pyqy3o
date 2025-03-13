/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL: string
  readonly VITE_SUPABASE_ANON_KEY: string
  readonly VITE_SPORTSDATA_API_KEY: string
  readonly VITE_SPORTSDATA_BASE_URL: string
  readonly VITE_ODDS_API_KEY: string
  readonly CURRENT_SEASON_URL: string
  readonly LEAGUE_HIERARCHY_URL: string
  readonly PLAYERS_URL: string
  readonly PLAYERS_BY_TEAM_URL: string
  readonly TEAMS_URL: string
  readonly PLAYER_GAME_STATS_BY_DATE_URL: string
  readonly PLAYER_SEASON_STATS_URL: string
  readonly PLAYER_SEASON_STATS_BY_TEAM_URL: string
  readonly GAMES_BY_DATE_URL: string
  readonly GAME_ODDS_BY_DATE_URL: string
  readonly GAME_ODDS_LINE_MOVEMENT_URL: string
  readonly SCHEDULES_URL: string
  readonly STADIUMS_URL: string
  readonly TEAM_GAME_STATS_BY_DATE_URL: string
  readonly TEAM_SEASON_STATS_URL: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
