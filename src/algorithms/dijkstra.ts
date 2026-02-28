import { CityGraph, RouteResult, VehicleConstraints, DeliveryConstraint } from '../types/simulation';
import { DynamicEnvironment } from '../simulation/environment';
import { getEdge } from '../simulation/cityGraph';
import { calculateSegmentFuel, calculateSegmentTime, calculateCO2 } from '../utils/fuelCalculator';

/**
 * Binary Min-Heap PriorityQueue — O(log n) insert/extract
 * Replaces the naive sort-based approach which was O(n log n) per insert.
 */
class PriorityQueue<T> {
  private heap: Array<{ element: T; priority: number }> = [];

  enqueue(element: T, priority: number): void {
    this.heap.push({ element, priority });
    this._bubbleUp(this.heap.length - 1);
  }

  dequeue(): T | undefined {
    if (this.heap.length === 0) return undefined;
    const top = this.heap[0];
    const last = this.heap.pop()!;
    if (this.heap.length > 0) {
      this.heap[0] = last;
      this._sinkDown(0);
    }
    return top.element;
  }

  isEmpty(): boolean {
    return this.heap.length === 0;
  }

  private _bubbleUp(idx: number): void {
    while (idx > 0) {
      const parent = Math.floor((idx - 1) / 2);
      if (this.heap[parent].priority <= this.heap[idx].priority) break;
      [this.heap[parent], this.heap[idx]] = [this.heap[idx], this.heap[parent]];
      idx = parent;
    }
  }

  private _sinkDown(idx: number): void {
    const length = this.heap.length;
    while (true) {
      let smallest = idx;
      const left = 2 * idx + 1;
      const right = 2 * idx + 2;
      if (left < length && this.heap[left].priority < this.heap[smallest].priority) smallest = left;
      if (right < length && this.heap[right].priority < this.heap[smallest].priority) smallest = right;
      if (smallest === idx) break;
      [this.heap[smallest], this.heap[idx]] = [this.heap[idx], this.heap[smallest]];
      idx = smallest;
    }
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

        let edgeCost: number;
        const floodPenalty = isFlooded ? 500 : 0;
        const timeCost = calculateSegmentTime(edge, trafficFactor, weatherImpact);
        const fuelCost = calculateSegmentFuel(edge, trafficFactor, weatherImpact, vehicle.type);

        if (constraints.priority === 'critical' || constraints.priority === 'high') {
          edgeCost = timeCost + floodPenalty;
        } else if (constraints.priority === 'low') {
          edgeCost = (fuelCost * 2) + floodPenalty;
        } else {
          edgeCost = (fuelCost * 5) + (timeCost * 2) + floodPenalty;
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

    if (path.length <= 1 || path[0] !== start) {
      // Fallback estimate for impossible geocoding match
      const estDist = 5000; // 5km fallback
      return {
        path: [start, goal],
        totalFuel: estDist * 0.00025,
        totalTime: estDist * 0.002,
        totalDistance: estDist,
        co2Emissions: estDist * 0.00025 * (vehicle.type === 'ev' ? 0.4 : 2.3),
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

      const segmentFuel = calculateSegmentFuel(edge, trafficFactor, weatherImpact, vehicle.type);
      const segmentTime = calculateSegmentTime(edge, trafficFactor, weatherImpact);

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

    const co2Emissions = calculateCO2(totalFuel, vehicle.type);

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
