import { CityGraph, Edge, RouteResult, DeliveryConstraint, VehicleConstraints } from '../types/simulation';
import { DynamicEnvironment } from '../simulation/environment';
import { getEdge } from '../simulation/cityGraph';

interface QState {
  node: number;
  trafficLevel: number;
  weatherLevel: number;
  hasIncident: number; // 0 or 1
}

export class QLearningAgent {
  private qTable: Map<string, Map<number, number>> = new Map();
  private learningRate: number = 0.1;
  private discountFactor: number = 0.9;
  private epsilon: number = 0.1;

  constructor(
    private graph: CityGraph,
    private environment: DynamicEnvironment
  ) { }

  private getStateKey(state: QState): string {
    const tLevel = Math.floor(state.trafficLevel * 5); // Reduced granularity to 5
    const wLevel = Math.floor(state.weatherLevel * 5); // Reduced granularity to 5
    return `${state.node}-${tLevel}-${wLevel}-${state.hasIncident}`;
  }

  private getQValue(state: QState, action: number): number {
    const key = this.getStateKey(state);
    if (!this.qTable.has(key)) {
      this.qTable.set(key, new Map());
    }
    return this.qTable.get(key)!.get(action) || 0;
  }

  private setQValue(state: QState, action: number, value: number): void {
    const key = this.getStateKey(state);
    if (!this.qTable.has(key)) {
      this.qTable.set(key, new Map());
    }
    this.qTable.get(key)!.set(action, value);
  }

  private calculateReward(
    edge: Edge,
    trafficFactor: number,
    predictedTraffic: number,
    weatherImpact: number,
    isFlooded: boolean,
    hasIncident: boolean,
    constraints: DeliveryConstraint,
    vehicle: VehicleConstraints,
    currentRange: number,
    currentTime: number
  ): number {
    if (isFlooded) return -10000;
    if (hasIncident) return -5000;

    // Vehicle constraint checks
    if (vehicle.capacity < constraints.weight) return -10000; // Impossible

    // Blend current and predicted traffic
    const effectiveTraffic = (trafficFactor * 0.6) + (predictedTraffic * 0.4);

    const baseTime = edge.distance * 0.002; // 30km/h scale
    const timeCost = baseTime * effectiveTraffic * weatherImpact;

    // Vehicle Specific Consumption Scaling
    let consumptionMultiplier = 1.0; // Petrol
    if (vehicle.type === 'ev') consumptionMultiplier = 0.2; // EVs are more efficient
    if (vehicle.type === 'hybrid') consumptionMultiplier = 0.6; // Hybrids in between

    const baseFuelCost = edge.distance * 0.00025 * consumptionMultiplier;
    const elevationCost = Math.max(0, edge.elevation * 0.0001) * consumptionMultiplier;
    const fuelCost = (baseFuelCost + elevationCost) * effectiveTraffic * weatherImpact;

    // Check range constraint
    if (currentRange - fuelCost < 0) return -10000; // Impossible, run out of fuel

    // Check time window constraint (soft or hard depending on priority)
    const projectedArrival = currentTime + timeCost;
    let timeWindowPenalty = 0;
    if (projectedArrival > constraints.windowEnd) {
      timeWindowPenalty = (projectedArrival - constraints.windowEnd) * 100; // Late penalty
    } else if (projectedArrival < constraints.windowStart) {
      timeWindowPenalty = (constraints.windowStart - projectedArrival) * 50; // Early penalty (waiting)
    }

    let reward = -(fuelCost * 15 + timeCost * 8 + timeWindowPenalty * 1.5);

    // Priority-based reward adjustments
    switch (constraints.priority) {
      case 'critical':
        // Absolute focus on time reduction
        reward = -(timeCost * 150 + timeWindowPenalty * 20);
        break;
      case 'high':
        // Fast but respect fuel
        reward = -(timeCost * 80 + fuelCost * 5 + timeWindowPenalty * 10);
        break;
      case 'standard':
        // Aggressive balance
        reward = -(fuelCost * 25 + timeCost * 15 + timeWindowPenalty * 2);
        break;
      case 'low':
        // Maximum fuel conservation
        reward = -(fuelCost * 50 + timeCost * 2 + timeWindowPenalty);
        break;
    }

    return reward;
  }

  private selectAction(state: QState, availableActions: number[]): number {
    if (Math.random() < this.epsilon || availableActions.length === 0) {
      return availableActions[Math.floor(Math.random() * availableActions.length)];
    }

    let bestAction = availableActions[0];
    let bestValue = this.getQValue(state, bestAction);

    for (const action of availableActions) {
      const value = this.getQValue(state, action);
      if (value > bestValue) {
        bestValue = value;
        bestAction = action;
      }
    }

    return bestAction;
  }

  train(
    start: number,
    goal: number,
    constraints: DeliveryConstraint,
    vehicle: VehicleConstraints,
    episodes: number = 200
  ): number[] {
    const episodeRewards: number[] = [];

    for (let episode = 0; episode < episodes; episode++) {
      let totalReward = 0;
      let currentNode = start;
      const visited = new Set<number>();
      let steps = 0;
      let currentRange = vehicle.currentRange;
      let currentTime = 480; // Start at 8:00 AM for simplicity in training

      const maxSteps = 50; // Optimized path shouldn't be too long

      while (currentNode !== goal && steps < maxSteps) {
        visited.add(currentNode);

        const neighbors = this.graph.adjacency.get(currentNode) || [];
        const availableNeighbors = neighbors.filter(n => !visited.has(n));

        if (availableNeighbors.length === 0) break;

        const currentState: QState = {
          node: currentNode,
          trafficLevel: 0.5,
          weatherLevel: this.environment.getRainLevel(),
          hasIncident: this.environment.hasIncident(currentNode) ? 1 : 0
        };

        const nextNode = this.selectAction(currentState, availableNeighbors);
        const edge = getEdge(this.graph, currentNode, nextNode)!;

        // Get environment data
        const trafficFactor = this.environment.getTrafficFactor(currentNode, nextNode);
        const predictedTraffic = this.environment.getPredictedTraffic(currentNode, nextNode, 15); // Predict 15 mins ahead
        const weatherImpact = this.environment.getWeatherImpact(nextNode);
        const isFlooded = this.environment.isFlooded(nextNode);
        const hasIncident = !!this.environment.hasIncident(nextNode);

        const reward = this.calculateReward(
          edge,
          trafficFactor,
          predictedTraffic,
          weatherImpact,
          isFlooded,
          hasIncident,
          constraints,
          vehicle,
          currentRange,
          currentTime
        );

        totalReward += reward;

        // Update virtual state for next step in episode
        // Calculate costs to update range/time
        const baseFuelCost = edge.distance * 0.00018;
        const elevationCost = Math.max(0, edge.elevation * 0.00005);
        const fuelCost = (baseFuelCost + elevationCost) * trafficFactor * weatherImpact;
        const timeCost = edge.distance * 0.0015 * trafficFactor * weatherImpact;

        currentRange -= fuelCost;
        currentTime += timeCost;

        const nextState: QState = {
          node: nextNode,
          trafficLevel: trafficFactor,
          weatherLevel: weatherImpact,
          hasIncident: hasIncident ? 1 : 0
        };

        const nextNeighbors = this.graph.adjacency.get(nextNode) || [];
        const maxNextQ = Math.max(
          ...nextNeighbors.map(n => this.getQValue(nextState, n)),
          0
        );

        const currentQ = this.getQValue(currentState, nextNode);
        const newQ = currentQ + this.learningRate * (reward + this.discountFactor * maxNextQ - currentQ);
        this.setQValue(currentState, nextNode, newQ);

        currentNode = nextNode;
        steps++;

        if (currentRange <= 0) break; // Out of fuel mid-episode
      }
      episodeRewards.push(totalReward);
    }
    return episodeRewards;
  }

  findRoute(
    start: number,
    goal: number,
    constraints: DeliveryConstraint,
    vehicle: VehicleConstraints
  ): RouteResult {
    const path: number[] = [start];
    const steps: Array<{
      node: number;
      fuel: number;
      time: number;
      traffic: number;
      weather: number;
      reason?: string;
    }> = [];

    let currentNode = start;
    let totalFuel = 0;
    let totalTime = 0;
    let totalDistance = 0;
    const visited = new Set<number>([start]);
    let stepCount = 0;
    const maxSteps = 100;

    let currentRange = vehicle.currentRange;
    // Assume start time is "now" relative to windowStart if not specified, or just 0 for relative calculation
    // Let's assume absolute time starts at 8:00 AM (480 mins) for demo consistency with training
    let currentTime = 480;

    while (currentNode !== goal && stepCount < maxSteps) {
      const neighbors = this.graph.adjacency.get(currentNode) || [];
      const availableNeighbors = neighbors.filter(n => !visited.has(n));

      if (availableNeighbors.length === 0) {
        // Backtracking fallback specifically for Dijkstra or if dead end
        const allNeighbors = neighbors.filter(n => n !== currentNode);
        if (allNeighbors.length === 0) break;
        availableNeighbors.push(...allNeighbors);
      }

      const currentState: QState = {
        node: currentNode,
        trafficLevel: 0.5,
        weatherLevel: this.environment.getRainLevel(),
        hasIncident: this.environment.hasIncident(currentNode) ? 1 : 0
      };

      let bestAction = availableNeighbors[0];
      let bestValue = -Infinity;

      // Smart decision making at runtime for route finding
      // Instead of just taking max Q, we re-evaluate local reward to enforce hard constraints
      // This hybrid approach ensures we don't pick a "learned" path that violates a hard constraint (like running out of fuel)

      for (const action of availableNeighbors) {
        // Consult Q-Table for long-term value
        const qValue = this.getQValue(currentState, action);

        // Check immediate feasibility
        const edge = getEdge(this.graph, currentNode, action)!;
        const trafficFactor = this.environment.getTrafficFactor(currentNode, action);
        const weatherImpact = this.environment.getWeatherImpact(action);

        const baseFuel = edge.distance * 0.05;
        const fuelRequired = (baseFuel + Math.max(0, edge.elevation * 0.05)) * trafficFactor * weatherImpact;

        if (currentRange - fuelRequired < 0) {
          continue; // Skip impossible moves
        }

        if (qValue > bestValue) {
          bestValue = qValue;
          bestAction = action;
        }
      }

      // If no valid move found via Q-values (e.g. all lead to distinct death), pick safer random if possible or just fail
      // For now, stick with bestAction found.

      const nextNode = bestAction;
      const edge = getEdge(this.graph, currentNode, nextNode)!;

      const trafficFactor = this.environment.getTrafficFactor(currentNode, nextNode);
      const weatherImpact = this.environment.getWeatherImpact(nextNode);
      const segmentTime = edge.distance * 0.002 * trafficFactor * weatherImpact;

      // Vehicle Specific Consumption
      let consumptionMultiplier = 1.0;
      if (vehicle.type === 'ev') consumptionMultiplier = 0.2;
      if (vehicle.type === 'hybrid') consumptionMultiplier = 0.6;

      const baseFuelCost = edge.distance * 0.00025 * consumptionMultiplier;
      const elevationCost = Math.max(0, edge.elevation * 0.0001) * consumptionMultiplier;
      const segmentFuel = (baseFuelCost + elevationCost) * trafficFactor * weatherImpact;

      totalFuel += segmentFuel;
      totalTime += segmentTime;
      totalDistance += edge.distance;
      currentRange -= segmentFuel;
      currentTime += segmentTime;

      let reason = "Optimal path found.";
      if (trafficFactor > 1.2) reason = "Heavy traffic but shortest fuel path.";
      else if (weatherImpact > 1.2) reason = "Weather impact significant, but safe.";
      else if (currentRange < vehicle.maxRange * 0.2) reason = "Low range, prioritizing energy efficiency.";
      else if (constraints.priority === 'critical') reason = "Critical priority: Fastest route chosen regardless of cost.";

      steps.push({
        node: nextNode,
        fuel: segmentFuel,
        time: segmentTime,
        traffic: trafficFactor,
        weather: weatherImpact,
        reason
      });

      path.push(nextNode);
      visited.add(nextNode);
      currentNode = nextNode;
      stepCount++;

      if (currentRange <= 0) break;
    }

    // Vehicle Specific CO2 calculation
    let co2Factor = 2.31; // Petrol
    if (vehicle.type === 'ev') co2Factor = 0.4; // Grid impact
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
