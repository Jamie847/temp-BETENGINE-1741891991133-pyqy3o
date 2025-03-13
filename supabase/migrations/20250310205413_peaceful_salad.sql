/*
  # Add service role and initial permissions

  1. Security
    - Create service role
    - Grant necessary permissions
    - Enable RLS policies
*/

-- Create service role if not exists
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT FROM pg_catalog.pg_roles WHERE rolname = 'service_role'
  ) THEN
    CREATE ROLE service_role;
  END IF;
END
$$;

-- Grant necessary permissions to service role
GRANT USAGE ON SCHEMA public TO service_role;
GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO service_role;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO service_role;

-- Enable RLS on all tables
ALTER TABLE teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE predictions ENABLE ROW LEVEL SECURITY;
ALTER TABLE betting_odds ENABLE ROW LEVEL SECURITY;
ALTER TABLE historical_performance ENABLE ROW LEVEL SECURITY;
ALTER TABLE weather_data ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for service role
CREATE POLICY "Enable service role access on teams" ON teams FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "Enable service role access on matches" ON matches FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "Enable service role access on predictions" ON predictions FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "Enable service role access on betting_odds" ON betting_odds FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "Enable service role access on historical_performance" ON historical_performance FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "Enable service role access on weather_data" ON weather_data FOR ALL TO service_role USING (true) WITH CHECK (true);

-- Create RLS policies for public read access
CREATE POLICY "Enable public read access on teams" ON teams FOR SELECT USING (true);
CREATE POLICY "Enable public read access on matches" ON matches FOR SELECT USING (true);
CREATE POLICY "Enable public read access on predictions" ON predictions FOR SELECT USING (true);
CREATE POLICY "Enable public read access on betting_odds" ON betting_odds FOR SELECT USING (true);
CREATE POLICY "Enable public read access on historical_performance" ON historical_performance FOR SELECT USING (true);
CREATE POLICY "Enable public read access on weather_data" ON weather_data FOR SELECT USING (true);
