/*
  # GreenPath Dynamic Routing Schema

  1. New Tables
    - `city_nodes`
      - `id` (uuid, primary key)
      - `node_id` (integer, unique) - Node identifier in graph
      - `x` (float) - X coordinate
      - `y` (float) - Y coordinate
      - `name` (text) - Node name/label
      - `created_at` (timestamptz)
    
    - `road_edges`
      - `id` (uuid, primary key)
      - `from_node` (integer) - Source node
      - `to_node` (integer) - Destination node
      - `distance` (float) - Base distance in km
      - `base_elevation` (float) - Elevation change (affects fuel)
      - `created_at` (timestamptz)
    
    - `simulation_runs`
      - `id` (uuid, primary key)
      - `algorithm` (text) - 'rl' or 'dijkstra'
      - `start_node` (integer)
      - `end_node` (integer)
      - `priority` (text) - 'high' or 'normal'
      - `total_fuel` (float) - Fuel consumed
      - `total_time` (float) - Time taken
      - `total_distance` (float) - Distance traveled
      - `co2_emissions` (float) - CO2 emissions
      - `route_path` (jsonb) - Array of nodes in route
      - `traffic_conditions` (jsonb) - Traffic state during run
      - `weather_conditions` (jsonb) - Weather state during run
      - `completed_at` (timestamptz)
      - `created_at` (timestamptz)

  2. Security
    - Enable RLS on all tables
    - Allow public read access for demo purposes
    - Restrict writes to authenticated users (future enhancement)
*/

CREATE TABLE IF NOT EXISTS city_nodes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  node_id integer UNIQUE NOT NULL,
  x float NOT NULL,
  y float NOT NULL,
  name text NOT NULL,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS road_edges (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  from_node integer NOT NULL,
  to_node integer NOT NULL,
  distance float NOT NULL,
  base_elevation float DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  UNIQUE(from_node, to_node)
);

CREATE TABLE IF NOT EXISTS simulation_runs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  algorithm text NOT NULL,
  start_node integer NOT NULL,
  end_node integer NOT NULL,
  priority text DEFAULT 'normal',
  total_fuel float NOT NULL,
  total_time float NOT NULL,
  total_distance float NOT NULL,
  co2_emissions float NOT NULL,
  route_path jsonb NOT NULL,
  traffic_conditions jsonb DEFAULT '{}',
  weather_conditions jsonb DEFAULT '{}',
  completed_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE city_nodes ENABLE ROW LEVEL SECURITY;
ALTER TABLE road_edges ENABLE ROW LEVEL SECURITY;
ALTER TABLE simulation_runs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read access to city_nodes"
  ON city_nodes FOR SELECT
  TO anon
  USING (true);

CREATE POLICY "Allow public read access to road_edges"
  ON road_edges FOR SELECT
  TO anon
  USING (true);

CREATE POLICY "Allow public read access to simulation_runs"
  ON simulation_runs FOR SELECT
  TO anon
  USING (true);

CREATE POLICY "Allow public insert to simulation_runs"
  ON simulation_runs FOR INSERT
  TO anon
  WITH CHECK (true);

CREATE INDEX IF NOT EXISTS idx_simulation_runs_algorithm ON simulation_runs(algorithm);
CREATE INDEX IF NOT EXISTS idx_simulation_runs_created_at ON simulation_runs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_road_edges_from_node ON road_edges(from_node);
CREATE INDEX IF NOT EXISTS idx_road_edges_to_node ON road_edges(to_node);