import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export interface CityNode {
  id: string;
  node_id: number;
  x: number;
  y: number;
  name: string;
}

export interface RoadEdge {
  id: string;
  from_node: number;
  to_node: number;
  distance: number;
  base_elevation: number;
}

export interface SimulationRun {
  algorithm: string;
  start_node: number;
  end_node: number;
  priority: string;
  total_fuel: number;
  total_time: number;
  total_distance: number;
  co2_emissions: number;
  route_path: number[];
  traffic_conditions: Record<string, number>;
  weather_conditions: Record<string, number>;
}
