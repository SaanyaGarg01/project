import { CityGraph, RouteResult, VehicleConstraints, DeliveryConstraint } from '../types/simulation';
import { DynamicEnvironment } from '../simulation/environment';
import { getEdge } from '../simulation/cityGraph';

class PriorityQueue<T> {
  private items: Array<{ element: T; priority: number }> = [];

  enqueue(element: T, priority: number): void {
    this.items.push({ element, priority });
    this.items.sort((a, b) => a.priority - b.priority);
  }

  dequeue(): T | undefined {
    return this.items.shift()?.element;
  }

  isEmpty(): boolean {
    return this.items.length === 0;
  }
}

export class DijkstraRouter {
  constructor(
    private graph: CityGraph,
    private environment: DynamicEnvironment
  ) { }

  findRoute(
    start: number,
    goal: number,
    constraints: DeliveryConstraint,
    vehicle: VehicleConstraints
  ): RouteResult {
    const distances = new Map<number, number>();
    const previous = new Map<number, number | null>();
    const pq = new PriorityQueue<number>();

    for (const nodeId of this.graph.nodes.keys()) {
      distances.set(nodeId, Infinity);
      previous.set(nodeId, null);
    }

    distances.set(start, 0);
    pq.enqueue(start, 0);

    while (!pq.isEmpty()) {
      const current = pq.dequeue();
      if (current === undefined) break;
      if (current === goal) break;

      const currentDistance = distances.get(current)!;
      const neighbors = this.graph.adjacency.get(current) || [];

      for (const neighbor of neighbors) {
        const edge = getEdge(this.graph, current, neighbor);
        if (!edge) continue;

        const trafficFactor = this.environment.getTrafficFactor(current, neighbor);
        const weatherImpact = this.environment.getWeatherImpact(neighbor);
        const isFlooded = this.environment.isFlooded(neighbor);

        if (isFlooded) continue;

        // Vehicle Specific Consumption Scaling
        let consumptionMultiplier = 1.0;
        if (vehicle.type === 'ev') consumptionMultiplier = 0.2;
        if (vehicle.type === 'hybrid') consumptionMultiplier = 0.6;

        let edgeCost: number;
        if (constraints.priority === 'critical' || constraints.priority === 'high') {
          edgeCost = (edge.distance / 60) * trafficFactor * weatherImpact;
        } else {
          const baseFuelCost = edge.distance * 0.05 * consumptionMultiplier;
          const elevationCost = Math.max(0, edge.elevation * 0.02) * consumptionMultiplier;
          edgeCost = (baseFuelCost + elevationCost) * trafficFactor * weatherImpact;
        }

        const newDistance = currentDistance + edgeCost;

        if (newDistance < distances.get(neighbor)!) {
          distances.set(neighbor, newDistance);
          previous.set(neighbor, current);
          pq.enqueue(neighbor, newDistance);
        }
      }
    }

    const path: number[] = [];
    let current: number | null = goal;

    while (current !== null) {
      path.unshift(current);
      current = previous.get(current) || null;
    }

    if (path[0] !== start) {
      return {
        path: [start, goal],
        totalFuel: 999,
        totalTime: 999,
        totalDistance: 999,
        co2Emissions: 999,
        steps: []
      };
    }

    let totalFuel = 0;
    let totalTime = 0;
    let totalDistance = 0;
    const steps: Array<{
      node: number;
      fuel: number;
      time: number;
      traffic: number;
      weather: number;
      reason?: string;
    }> = [];

    for (let i = 0; i < path.length - 1; i++) {
      const from = path[i];
      const to = path[i + 1];
      const edge = getEdge(this.graph, from, to)!;

      const trafficFactor = this.environment.getTrafficFactor(from, to);
      const weatherImpact = this.environment.getWeatherImpact(to);

      const baseFuelCost = edge.distance * 0.05;
      const elevationCost = Math.max(0, edge.elevation * 0.02);
      const segmentFuel = (baseFuelCost + elevationCost) * trafficFactor * weatherImpact;

      const segmentTime = (edge.distance / 60) * trafficFactor * weatherImpact;

      totalFuel += segmentFuel;
      totalTime += segmentTime;
      totalDistance += edge.distance;

      steps.push({
        node: to,
        fuel: segmentFuel,
        time: segmentTime,
        traffic: trafficFactor,
        weather: weatherImpact
      });
    }

    // Vehicle Specific CO2 calculation
    let co2Factor = 2.31;
    if (vehicle.type === 'ev') co2Factor = 0.4;
    if (vehicle.type === 'hybrid') co2Factor = 1.2;

    const co2Emissions = totalFuel * co2Factor;

    return {
      path,
      totalFuel,
      totalTime,
      totalDistance,
      co2Emissions,
      steps
    };
  }
}
