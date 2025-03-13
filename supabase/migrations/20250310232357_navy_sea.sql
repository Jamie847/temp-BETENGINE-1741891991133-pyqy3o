/*
  # Historical Data Setup

  1. New Tables
    - `historical_performance`
      - Team performance history by season
      - Tournament appearances and results
      - Regular season records
    - `tournament_history`
      - Detailed tournament performance metrics
      - Seed differentials and upset metrics
      - Points scored/allowed in tournament games

  2. Security
    - Enable RLS on new tables
    - Add policies for read/write access
*/

-- Create historical performance table if it doesn't exist
CREATE TABLE IF NOT EXISTS historical_performance (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id uuid REFERENCES teams(id),
  season integer NOT NULL,
  tournament_seed integer,
  regular_season_wins integer,
  regular_season_losses integer,
  tournament_result text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT valid_season CHECK (season >= 1939 AND season <= EXTRACT(year FROM now()) + 1)
);

-- Create tournament history table if it doesn't exist
CREATE TABLE IF NOT EXISTS tournament_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id uuid REFERENCES teams(id),
  season integer NOT NULL,
  seed integer,
  final_round text,
  games_played integer DEFAULT 0,
  wins integer DEFAULT 0,
  losses integer DEFAULT 0,
  points_scored numeric(6,2) DEFAULT 0,
  points_allowed numeric(6,2) DEFAULT 0,
  avg_margin numeric(5,2) DEFAULT 0,
  seed_diff_wins integer DEFAULT 0,
  close_game_wins integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT valid_tournament_season CHECK (season >= 1939 AND season <= EXTRACT(year FROM now()) + 1)
);

-- Enable RLS
ALTER TABLE historical_performance ENABLE ROW LEVEL SECURITY;
ALTER TABLE tournament_history ENABLE ROW LEVEL SECURITY;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_historical_performance_team ON historical_performance(team_id, season);
CREATE INDEX IF NOT EXISTS idx_historical_season ON historical_performance(season, team_id);
CREATE INDEX IF NOT EXISTS idx_tournament_history_team ON tournament_history(team_id, season);
CREATE INDEX IF NOT EXISTS idx_tournament_history_performance ON tournament_history(season, seed, wins);

-- Add RLS policies
CREATE POLICY "Enable read access for all users" ON historical_performance
  FOR SELECT USING (true);

CREATE POLICY "Enable insert/update for service role" ON historical_performance
  FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "Enable read access for all users" ON tournament_history
  FOR SELECT USING (true);

CREATE POLICY "Enable insert/update for service role" ON tournament_history
  FOR ALL TO service_role USING (true) WITH CHECK (true);

-- Create trigger to update metrics
CREATE OR REPLACE FUNCTION update_team_tournament_metrics()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE teams
  SET 
    tournament_appearances = (
      SELECT COUNT(DISTINCT season)
      FROM tournament_history
      WHERE team_id = NEW.team_id
    ),
    final_four_appearances = (
      SELECT COUNT(*)
      FROM tournament_history
      WHERE team_id = NEW.team_id
      AND final_round IN ('Final Four', 'Championship')
    ),
    tournament_win_pct = (
      SELECT COALESCE(
        ROUND(CAST(SUM(wins) AS numeric) / NULLIF(SUM(wins + losses), 0) * 100, 2),
        0
      )
      FROM tournament_history
      WHERE team_id = NEW.team_id
    ),
    upset_factor = (
      SELECT COALESCE(
        ROUND(CAST(SUM(seed_diff_wins) AS numeric) / NULLIF(COUNT(*), 0), 2),
        0
      )
      FROM tournament_history
      WHERE team_id = NEW.team_id
    )
  WHERE id = NEW.team_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
