/*
  # Enhanced NCAA Basketball Schema

  1. Team Updates
    - Add fields for detailed team statistics
    - Add tournament-specific metrics
    - Add player roster tracking

  2. Match Updates
    - Add detailed game statistics
    - Add player performance tracking
    - Add tournament-specific fields

  3. Historical Updates
    - Add player statistics tracking
    - Add team performance metrics
    - Add tournament history
*/

-- Add new team statistics columns
ALTER TABLE teams
ADD COLUMN IF NOT EXISTS points_per_game numeric(5,2),
ADD COLUMN IF NOT EXISTS points_allowed_per_game numeric(5,2),
ADD COLUMN IF NOT EXISTS field_goal_percentage numeric(5,2),
ADD COLUMN IF NOT EXISTS three_point_percentage numeric(5,2),
ADD COLUMN IF NOT EXISTS free_throw_percentage numeric(5,2),
ADD COLUMN IF NOT EXISTS rebounds_per_game numeric(5,2),
ADD COLUMN IF NOT EXISTS assists_per_game numeric(5,2),
ADD COLUMN IF NOT EXISTS turnovers_per_game numeric(5,2),
ADD COLUMN IF NOT EXISTS roster jsonb DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS injuries jsonb DEFAULT '[]'::jsonb;

-- Add detailed game statistics to matches
ALTER TABLE matches
ADD COLUMN IF NOT EXISTS game_stats jsonb DEFAULT '{}'::jsonb,
ADD COLUMN IF NOT EXISTS player_stats jsonb DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS team_stats jsonb DEFAULT '{}'::jsonb,
ADD COLUMN IF NOT EXISTS attendance integer,
ADD COLUMN IF NOT EXISTS neutral_site boolean DEFAULT false;

-- Create player_games table for detailed player statistics
CREATE TABLE IF NOT EXISTS player_games (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  match_id uuid REFERENCES matches(id),
  team_id uuid REFERENCES teams(id),
  player_id text NOT NULL,
  player_name text NOT NULL,
  minutes integer,
  points integer,
  assists integer,
  rebounds integer,
  steals integer,
  blocks integer,
  turnovers integer,
  field_goals_made integer,
  field_goals_attempted integer,
  three_pointers_made integer,
  three_pointers_attempted integer,
  free_throws_made integer,
  free_throws_attempted integer,
  created_at timestamptz DEFAULT now()
);

-- Create team_season_stats table
CREATE TABLE IF NOT EXISTS team_season_stats (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id uuid REFERENCES teams(id),
  season integer NOT NULL,
  games_played integer DEFAULT 0,
  wins integer DEFAULT 0,
  losses integer DEFAULT 0,
  points_scored numeric(6,2) DEFAULT 0,
  points_allowed numeric(6,2) DEFAULT 0,
  field_goal_percentage numeric(5,2),
  three_point_percentage numeric(5,2),
  free_throw_percentage numeric(5,2),
  rebounds_per_game numeric(5,2),
  assists_per_game numeric(5,2),
  steals_per_game numeric(5,2),
  blocks_per_game numeric(5,2),
  turnovers_per_game numeric(5,2),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT valid_season CHECK (season >= 1939 AND season <= extract(year from now()) + 1)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_player_games_match ON player_games(match_id);
CREATE INDEX IF NOT EXISTS idx_player_games_player ON player_games(player_id);
CREATE INDEX IF NOT EXISTS idx_player_games_team ON player_games(team_id);
CREATE INDEX IF NOT EXISTS idx_team_season_stats_team ON team_season_stats(team_id, season);

-- Enable RLS
ALTER TABLE player_games ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_season_stats ENABLE ROW LEVEL SECURITY;

-- Add RLS policies
CREATE POLICY "Enable read access for all users" ON player_games
  FOR SELECT TO public USING (true);

CREATE POLICY "Enable insert for service role" ON player_games
  FOR INSERT TO service_role WITH CHECK (true);

CREATE POLICY "Enable read access for all users" ON team_season_stats
  FOR SELECT TO public USING (true);

CREATE POLICY "Enable insert for service role" ON team_season_stats
  FOR INSERT TO service_role WITH CHECK (true);

-- Create function to update team season stats
CREATE OR REPLACE FUNCTION update_team_season_stats()
RETURNS trigger AS $$
BEGIN
  -- Update season stats when a match is completed
  IF NEW.status = 'finished' AND OLD.status != 'finished' THEN
    -- Update home team stats
    UPDATE team_season_stats
    SET 
      games_played = games_played + 1,
      wins = CASE WHEN NEW.home_score > NEW.away_score THEN wins + 1 ELSE wins END,
      losses = CASE WHEN NEW.home_score < NEW.away_score THEN losses + 1 ELSE losses END,
      points_scored = points_scored + NEW.home_score,
      points_allowed = points_allowed + NEW.away_score,
      updated_at = now()
    WHERE team_id = NEW.home_team_id AND season = extract(year from NEW.start_time);

    -- Update away team stats
    UPDATE team_season_stats
    SET 
      games_played = games_played + 1,
      wins = CASE WHEN NEW.away_score > NEW.home_score THEN wins + 1 ELSE wins END,
      losses = CASE WHEN NEW.away_score < NEW.home_score THEN losses + 1 ELSE losses END,
      points_scored = points_scored + NEW.away_score,
      points_allowed = points_allowed + NEW.home_score,
      updated_at = now()
    WHERE team_id = NEW.away_team_id AND season = extract(year from NEW.start_time);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for updating team season stats
CREATE TRIGGER update_team_season_stats_trigger
  AFTER UPDATE ON matches
  FOR EACH ROW
  EXECUTE FUNCTION update_team_season_stats();
