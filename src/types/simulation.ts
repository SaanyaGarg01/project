export interface Node {
  id: number;
  x: number;
  y: number;
  name: string;
}

export interface Edge {
  from: number;
  to: number;
  distance: number;
  elevation: number;
}

export interface State {
  currentNode: number;
  trafficLevel: number;
  weatherCondition: number;
  fuelRemaining: number;
  priority: 'high' | 'normal';
}

export interface Action {
  nextNode: number;
  edge: Edge;
}

export interface Reward {
  fuelCost: number;
  timeCost: number;
  penalty: number;
  bonus: number;
  total: number;
}

export interface TrafficConditions {
  [edgeKey: string]: number;
}

// New types for Advanced Features
export type IncidentType = 'accident' | 'road_closure' | 'festival' | 'construction' | 'none';
export type PriorityLevel = 'critical' | 'high' | 'standard' | 'low';

export interface Incident {
  nodeId: number;
  type: IncidentType;
  severity: number; // 0-1
  description: string;
}

export type WeatherType = 'clear' | 'rainy' | 'stormy' | 'snowy' | 'foggy';

export interface WeatherConditions {
  rain: number;
  type: WeatherType;
  floodZones: Set<number>;
  visibility: number;
}

export interface VehicleConstraints {
  type: 'ev' | 'petrol' | 'hybrid';
  maxRange: number; // km (or fuel units)
  currentRange: number;
  capacity: number; // kg
  maxDriveTime: number; // minutes
}

export interface DeliveryConstraint {
  priority: PriorityLevel;
  windowStart: number; // minutes from midnight
  windowEnd: number; // minutes from midnight
  weight: number; // kg
}

export interface RouteResult {
  path: number[];
  totalFuel: number;
  totalTime: number;
  totalDistance: number;
  co2Emissions: number;
  steps: Array<{
    node: number;
    fuel: number;
    time: number;
    traffic: number;
    weather: number;
    reason?: string;
  }>;
}

export interface EnvironmentSnapshot {
  traffic: TrafficConditions;
  weather: {
    rain: number;
    type: WeatherType;
    floodZones: Set<number>;
    visibility: number;
  };
  incidents: Incident[];
}

export interface CityGraph {
  nodes: Map<number, Node>;
  edges: Map<number, Edge[]>;
  adjacency: Map<number, number[]>;
}

export interface CityProfile {
  name: string;
  trafficVolatility: number; // 0-1
  weatherRisk: number; // 0-1
  averageSpeed: number; // km/h base
  description: string;
}

export interface FleetVehicle extends VehicleConstraints {
  id: string;
  location: number; // Node ID
  status: 'idle' | 'en-route' | 'charging' | 'breakdown';
  route?: number[];
  eta?: number; // minutes
  stressIndex: number; // 0-10
}
