import { generateCityGraph } from './cityGraph';
import { DynamicEnvironment } from './environment';
import { QLearningAgent } from '../algorithms/qlearning';
import { DijkstraRouter } from '../algorithms/dijkstra';
import { RouteResult, CityGraph, DeliveryConstraint, VehicleConstraints } from '../types/simulation';
import { supabase } from '../lib/supabase';

export interface SimulationState {
  graph: CityGraph;
  environment: DynamicEnvironment;
  rlAgent: QLearningAgent;
  dijkstraRouter: DijkstraRouter;
  isTraining: boolean;
  trainingProgress: number;
  trainingHistory: number[];
}

export class SimulationController {
  private state: SimulationState;
  private listeners: Array<() => void> = [];

  constructor() {
    const graph = generateCityGraph();
    const environment = new DynamicEnvironment(graph.nodes.size);
    const rlAgent = new QLearningAgent(graph, environment);
    const dijkstraRouter = new DijkstraRouter(graph, environment);

    this.state = {
      graph,
      environment,
      rlAgent,
      dijkstraRouter,
      isTraining: false,
      trainingProgress: 0,
      trainingHistory: []
    };
  }

  getState(): SimulationState {
    return this.state;
  }

  subscribe(listener: () => void): () => void {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  private notify(): void {
    this.listeners.forEach(listener => listener());
  }

  async trainAgent(
    start: number,
    goal: number,
    constraints: DeliveryConstraint,
    vehicle: VehicleConstraints,
    episodes: number = 200
  ): Promise<void> {
    this.state.isTraining = true;
    this.state.trainingProgress = 0;
    this.state.trainingHistory = []; // Reset history
    this.notify();

    const batchSize = 25;
    const batches = Math.ceil(episodes / batchSize);

    for (let i = 0; i < batches; i++) {
      await new Promise<void>(resolve => {
        setTimeout(() => {
          const rewards = this.state.rlAgent.train(start, goal, constraints, vehicle, batchSize);
          this.state.trainingHistory = [...this.state.trainingHistory, ...rewards];
          this.state.trainingProgress = ((i + 1) / batches) * 100;
          this.notify();
          resolve();
        }, 10);
      });
    }

    this.state.isTraining = false;
    this.notify();
  }

  async runComparison(
    start: number,
    goal: number,
    constraints: DeliveryConstraint,
    vehicle: VehicleConstraints
  ): Promise<{
    rl: RouteResult;
    dijkstra: RouteResult;
  }> {
    const rlResult = this.state.rlAgent.findRoute(start, goal, constraints, vehicle);
    const dijkstraResult = this.state.dijkstraRouter.findRoute(start, goal, constraints, vehicle);

    await this.saveSimulationRun('rl', start, goal, constraints, rlResult);
    await this.saveSimulationRun('dijkstra', start, goal, constraints, dijkstraResult);

    return {
      rl: rlResult,
      dijkstra: dijkstraResult
    };
  }

  private async saveSimulationRun(
    algorithm: string,
    start: number,
    goal: number,
    constraints: DeliveryConstraint,
    result: RouteResult
  ): Promise<void> {
    try {
      const envSnapshot = this.state.environment.getSnapshot();

      await supabase.from('simulation_runs').insert({
        algorithm,
        start_node: start,
        end_node: goal,
        priority: constraints.priority,
        total_fuel: result.totalFuel,
        total_time: result.totalTime,
        total_distance: result.totalDistance,
        co2_emissions: result.co2Emissions,
        route_path: result.path,
        traffic_conditions: envSnapshot.traffic,
        weather_conditions: {
          rain: envSnapshot.weather.rain,
          flood_zones: Array.from(envSnapshot.weather.floodZones)
        }
      });
    } catch (error) {
      console.error('Error saving simulation run:', error);
    }
  }

  startEnvironmentUpdates(callback?: () => void): void {
    this.state.environment.startAutoUpdate(() => {
      this.notify();
      callback?.();
    });
  }

  stopEnvironmentUpdates(): void {
    this.state.environment.stopAutoUpdate();
  }

  setTrafficIntensity(level: number) {
    this.state.environment.setTrafficIntensity(level);
    this.notify();
  }

  setRainLevel(level: number) {
    this.state.environment.setRainLevel(level);
    this.notify();
  }

  // existing method
  async syncWithRealWorld(): Promise<void> {
    await this.state.environment.syncWithRealWorld();
    this.notify();
  }

  setCity(cityName: string) {
    this.state.environment.setCity(cityName);
    this.notify();
  }

  getFleet() {
    return this.state.environment.getFleet();
  }

  updateEnvironment(): void {
    this.state.environment.updateConditions();
    this.state.environment.updateFleet(); // Simulate fleet movement
    this.notify();
  }
}
