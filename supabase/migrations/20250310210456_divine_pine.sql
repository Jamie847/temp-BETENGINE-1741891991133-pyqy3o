/*
  # Fix RLS policies for teams and matches tables

  1. Changes
    - Add RLS policies to allow service role to perform all operations
    - Add RLS policies to allow public role to read data
    - Remove existing restrictive policies

  2. Security
    - Enable RLS on teams and matches tables
    - Add appropriate policies for CRUD operations
*/

-- Enable RLS
ALTER TABLE teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE matches ENABLE ROW LEVEL SECURITY;

-- Teams table policies
CREATE POLICY "Enable read access for all users on teams"
  ON teams
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Enable all access for service role on teams"
  ON teams
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Matches table policies
CREATE POLICY "Enable read access for all users on matches"
  ON matches
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Enable all access for service role on matches"
  ON matches
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);
