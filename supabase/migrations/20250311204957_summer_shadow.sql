/*
  # Tournament Bracket Prediction System

  1. New Tables
    - tournament_brackets: Store tournament structure
    - bracket_predictions: Store AI predictions for entire bracket
    - bracket_rounds: Track round-by-round results
    - prediction_accuracy: Track prediction success rates

  2. Features
    - Full bracket prediction support
    - Round-by-round tracking
    - Historical accuracy analysis
    - Region-based predictions
*/

-- Create tournament brackets table
CREATE TABLE IF NOT EXISTS tournament_brackets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  season integer NOT NULL,
  region text NOT NULL,
  seed integer NOT NULL,
  team_id uuid REFERENCES teams(id),
  first_round_game_id uuid REFERENCES matches(id),
  created_at timestamptz DEFAULT now(),
  CONSTRAINT valid_tournament_seed CHECK (seed >= 1 AND seed <= 16)
);

-- Create bracket predictions table
CREATE TABLE IF NOT EXISTS bracket_predictions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  season integer NOT NULL,
  bracket_id uuid REFERENCES tournament_brackets(id),
  predicted_rounds integer NOT NULL,
  confidence_scores jsonb DEFAULT '[]'::jsonb,
  prediction_factors jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create bracket rounds table
CREATE TABLE IF NOT EXISTS bracket_rounds (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  bracket_id uuid REFERENCES tournament_brackets(id),
  round_number integer NOT NULL,
  match_id uuid REFERENCES matches(id),
  winning_team_id uuid REFERENCES teams(id),
  losing_team_id uuid REFERENCES teams(id),
  predicted_winner_id uuid REFERENCES teams(id),
  prediction_correct boolean,
  confidence_score double precision,
  created_at timestamptz DEFAULT now(),
  CONSTRAINT valid_round_number CHECK (round_number >= 1 AND round_number <= 6)
);

-- Create view for tournament prediction accuracy
CREATE OR REPLACE VIEW tournament_prediction_accuracy AS
WITH prediction_stats AS (
  SELECT 
    m.tournament_round as game_type,
    COUNT(*) as total_predictions,
    COUNT(*) FILTER (WHERE br.prediction_correct IS NOT NULL) as resolved_predictions,
    COUNT(*) FILTER (WHERE br.prediction_correct = true) as correct_predictions,
    AVG(br.confidence_score) as avg_confidence
  FROM bracket_rounds br
  JOIN matches m ON br.match_id = m.id
  GROUP BY m.tournament_round
)
SELECT 
  game_type,
  total_predictions,
  resolved_predictions,
  correct_predictions,
  ROUND(CAST(avg_confidence AS numeric), 2) as avg_confidence,
  CASE 
    WHEN resolved_predictions > 0 
    THEN ROUND((correct_predictions::numeric / resolved_predictions * 100)::numeric, 2)
    ELSE 0 
  END as win_percentage,
  MIN(m.start_time)::text as first_prediction,
  MAX(m.start_time)::text as last_prediction
FROM prediction_stats ps
JOIN matches m ON m.tournament_round = ps.game_type
GROUP BY 
  game_type,
  total_predictions,
  resolved_predictions,
  correct_predictions,
  avg_confidence;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_tournament_brackets_team ON tournament_brackets(team_id, season);
CREATE INDEX IF NOT EXISTS idx_tournament_brackets_region ON tournament_brackets(season, region);
CREATE INDEX IF NOT EXISTS idx_bracket_predictions_season ON bracket_predictions(season);
CREATE INDEX IF NOT EXISTS idx_bracket_rounds_bracket ON bracket_rounds(bracket_id, round_number);

-- Enable RLS
ALTER TABLE tournament_brackets ENABLE ROW LEVEL SECURITY;
ALTER TABLE bracket_predictions ENABLE ROW LEVEL SECURITY;
ALTER TABLE bracket_rounds ENABLE ROW LEVEL SECURITY;

-- Add RLS policies
CREATE POLICY "Enable read access for all users" ON tournament_brackets
  FOR SELECT TO public USING (true);

CREATE POLICY "Enable insert for service role" ON tournament_brackets
  FOR INSERT TO service_role WITH CHECK (true);

CREATE POLICY "Enable read access for all users" ON bracket_predictions
  FOR SELECT TO public USING (true);

CREATE POLICY "Enable insert for service role" ON bracket_predictions
  FOR INSERT TO service_role WITH CHECK (true);

CREATE POLICY "Enable read access for all users" ON bracket_rounds
  FOR SELECT TO public USING (true);

CREATE POLICY "Enable insert for service role" ON bracket_rounds
  FOR INSERT TO service_role WITH CHECK (true);
