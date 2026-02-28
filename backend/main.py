from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import List, Optional, Dict
import random
import math
import time

app = FastAPI(
    title="GreenPath Logistics Engine",
    version="2.0.0",
    description="Reinforcement Learning-powered logistics routing API"
)

# --- CORS Middleware ---
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ============================================================
# City Graph
# ============================================================

class CityGraph:
    def __init__(self, size: int = 8):
        self.grid_size = size
        self.total_nodes = size * size
        self.edges: Dict[str, dict] = {}
        self._build_graph()

    def _build_graph(self):
        spacing = 100
        for row in range(self.grid_size):
            for col in range(self.grid_size):
                node = row * self.grid_size + col
                # Right neighbor
                if col < self.grid_size - 1:
                    right = row * self.grid_size + (col + 1)
                    dist = spacing + random.random() * 20
                    elev = (random.random() - 0.5) * 10
                    self._add_edge(node, right, dist, elev)
                # Down neighbor
                if row < self.grid_size - 1:
                    down = (row + 1) * self.grid_size + col
                    dist = spacing + random.random() * 20
                    elev = (random.random() - 0.5) * 10
                    self._add_edge(node, down, dist, elev)
                # Diagonal (40% chance)
                if col < self.grid_size - 1 and row < self.grid_size - 1 and random.random() > 0.6:
                    diag = (row + 1) * self.grid_size + (col + 1)
                    dist = spacing * 1.414 + random.random() * 20
                    elev = (random.random() - 0.5) * 15
                    self._add_edge(node, diag, dist, elev)

    def _add_edge(self, u: int, v: int, distance: float, elevation: float):
        self.edges[f"{u}-{v}"] = {"distance": distance, "elevation": elevation}
        self.edges[f"{v}-{u}"] = {"distance": distance, "elevation": -elevation}

    def get_neighbors(self, node: int) -> List[int]:
        neighbors = []
        for key in self.edges:
            parts = key.split("-")
            if int(parts[0]) == node:
                neighbors.append(int(parts[1]))
        return neighbors

    def get_edge(self, u: int, v: int) -> Optional[dict]:
        return self.edges.get(f"{u}-{v}")


# ============================================================
# Environment
# ============================================================

class Environment:
    def __init__(self, total_nodes: int):
        self.total_nodes = total_nodes
        self.traffic: Dict[str, float] = {}
        self.rain: float = random.random() * 0.5
        self.flood_zones: set = set()
        self._init_traffic()

    def _init_traffic(self):
        for i in range(self.total_nodes):
            for j in range(i + 1, self.total_nodes):
                key = f"{min(i, j)}-{max(i, j)}"
                self.traffic[key] = 0.5 * (0.6 + random.random() * 0.8)

    def get_traffic_factor(self, u: int, v: int) -> float:
        key = f"{min(u, v)}-{max(u, v)}"
        return self.traffic.get(key, 0.5)

    def get_weather_impact(self, node: int) -> float:
        if node in self.flood_zones:
            return 5.0
        if self.rain > 0.8:
            return 2.5
        elif self.rain > 0.3:
            return 1.5
        return 1.0

    def is_flooded(self, node: int) -> bool:
        return node in self.flood_zones

    def update(self):
        for key in self.traffic:
            val = self.traffic[key]
            self.traffic[key] = max(0.1, min(2.0, val + (random.random() - 0.5) * 0.3))
        self.rain = max(0, min(1, self.rain + (random.random() - 0.5) * 0.1))
        if random.random() > 0.95:
            self.flood_zones.clear()
            for _ in range(random.randint(0, 2)):
                self.flood_zones.add(random.randint(0, self.total_nodes - 1))


# ============================================================
# Q-Learning Agent
# ============================================================

def get_consumption_multiplier(vehicle_type: str) -> float:
    if vehicle_type == "ev":
        return 0.2
    elif vehicle_type == "hybrid":
        return 0.6
    return 1.0

def get_co2_factor(vehicle_type: str) -> float:
    if vehicle_type == "ev":
        return 0.4
    elif vehicle_type == "hybrid":
        return 1.2
    return 2.31


class QLearningAgent:
    def __init__(self, graph: CityGraph, env: Environment):
        self.graph = graph
        self.env = env
        self.q_table: Dict[str, Dict[int, float]] = {}
        self.lr = 0.1
        self.gamma = 0.9
        self.epsilon = 0.1

    def _state_key(self, node: int, traffic: float, weather: float) -> str:
        return f"{node}-{int(traffic * 5)}-{int(weather * 5)}"

    def _get_q(self, state_key: str, action: int) -> float:
        return self.q_table.get(state_key, {}).get(action, 0.0)

    def _set_q(self, state_key: str, action: int, value: float):
        if state_key not in self.q_table:
            self.q_table[state_key] = {}
        self.q_table[state_key][action] = value

    def train(self, start: int, goal: int, vehicle_type: str, priority: str, episodes: int = 200) -> List[float]:
        rewards_history = []
        mult = get_consumption_multiplier(vehicle_type)

        for _ in range(episodes):
            current = start
            visited = {start}
            total_reward = 0.0
            steps = 0

            while current != goal and steps < 50:
                neighbors = [n for n in self.graph.get_neighbors(current) if n not in visited]
                if not neighbors:
                    break

                traffic = self.env.get_traffic_factor(current, neighbors[0]) if neighbors else 0.5
                weather = self.env.get_weather_impact(current)
                state_key = self._state_key(current, traffic, weather)

                # Epsilon-greedy action selection
                if random.random() < self.epsilon:
                    next_node = random.choice(neighbors)
                else:
                    best_val = -math.inf
                    next_node = neighbors[0]
                    for n in neighbors:
                        q = self._get_q(state_key, n)
                        if q > best_val:
                            best_val = q
                            next_node = n

                edge = self.graph.get_edge(current, next_node)
                if not edge:
                    break

                tf = self.env.get_traffic_factor(current, next_node)
                wi = self.env.get_weather_impact(next_node)
                flooded = self.env.is_flooded(next_node)

                if flooded:
                    reward = -10000
                else:
                    fuel = edge["distance"] * 0.00025 * mult * tf * wi
                    time_cost = edge["distance"] * 0.002 * tf * wi
                    if priority in ("critical", "high"):
                        reward = -(time_cost * 80 + fuel * 5)
                    elif priority == "low":
                        reward = -(fuel * 50 + time_cost * 2)
                    else:
                        reward = -(fuel * 25 + time_cost * 15)

                total_reward += reward

                # Bellman update
                next_traffic = tf
                next_weather = wi
                next_state_key = self._state_key(next_node, next_traffic, next_weather)
                next_neighbors = self.graph.get_neighbors(next_node)
                max_next_q = max([self._get_q(next_state_key, n) for n in next_neighbors] or [0])
                current_q = self._get_q(state_key, next_node)
                new_q = current_q + self.lr * (reward + self.gamma * max_next_q - current_q)
                self._set_q(state_key, next_node, new_q)

                visited.add(next_node)
                current = next_node
                steps += 1

            rewards_history.append(total_reward)

        return rewards_history

    def find_route(self, start: int, goal: int, vehicle_type: str) -> dict:
        path = [start]
        steps = []
        current = start
        visited = {start}
        total_fuel = 0.0
        total_time = 0.0
        total_distance = 0.0
        mult = get_consumption_multiplier(vehicle_type)

        for _ in range(100):
            if current == goal:
                break

            neighbors = [n for n in self.graph.get_neighbors(current) if n not in visited]
            if not neighbors:
                # Allow backtracking
                all_nb = [n for n in self.graph.get_neighbors(current) if n != current]
                if not all_nb:
                    break
                neighbors = all_nb

            traffic = self.env.get_traffic_factor(current, neighbors[0])
            weather = self.env.get_weather_impact(current)
            state_key = self._state_key(current, traffic, weather)

            best_val = -math.inf
            best_node = neighbors[0]
            for n in neighbors:
                q = self._get_q(state_key, n)
                if q > best_val:
                    best_val = q
                    best_node = n

            edge = self.graph.get_edge(current, best_node)
            if not edge:
                break

            tf = self.env.get_traffic_factor(current, best_node)
            wi = self.env.get_weather_impact(best_node)

            seg_fuel = (edge["distance"] * 0.00025 + max(0, edge["elevation"] * 0.0001)) * mult * tf * wi
            seg_time = edge["distance"] * 0.002 * tf * wi

            total_fuel += seg_fuel
            total_time += seg_time
            total_distance += edge["distance"]

            reason = "Optimal path found."
            if tf > 1.2:
                reason = "Heavy traffic but shortest fuel path."
            elif wi > 1.2:
                reason = "Weather impact significant, but safe."

            steps.append({
                "node": best_node,
                "traffic_level": round(tf, 3),
                "weather_condition": "rainy" if wi > 1.2 else "clear",
                "fuel_cost": round(seg_fuel, 5),
                "time_cost": round(seg_time, 3),
                "reason": reason
            })

            path.append(best_node)
            visited.add(best_node)
            current = best_node

        co2 = total_fuel * get_co2_factor(vehicle_type)

        return {
            "path": path,
            "steps": steps,
            "total_fuel": round(total_fuel, 5),
            "total_time": round(total_time, 3),
            "total_distance": round(total_distance, 2),
            "co2_emissions": round(co2, 5),
            "algorithm": "QLearning"
        }


# ============================================================
# Dijkstra Router
# ============================================================

import heapq

class DijkstraRouter:
    def __init__(self, graph: CityGraph, env: Environment):
        self.graph = graph
        self.env = env

    def find_route(self, start: int, goal: int, vehicle_type: str, priority: str) -> dict:
        dist = {i: math.inf for i in range(self.graph.total_nodes)}
        prev = {i: None for i in range(self.graph.total_nodes)}
        dist[start] = 0
        pq = [(0, start)]
        mult = get_consumption_multiplier(vehicle_type)

        while pq:
            d, u = heapq.heappop(pq)
            if d > dist[u]:
                continue
            if u == goal:
                break

            for v in self.graph.get_neighbors(u):
                edge = self.graph.get_edge(u, v)
                if not edge:
                    continue
                tf = self.env.get_traffic_factor(u, v)
                wi = self.env.get_weather_impact(v)
                flood_penalty = 500 if self.env.is_flooded(v) else 0

                time_cost = edge["distance"] * 0.002 * tf * wi
                fuel_cost = edge["distance"] * 0.00025 * mult * tf * wi

                if priority in ("critical", "high"):
                    cost = time_cost + flood_penalty
                elif priority == "low":
                    cost = fuel_cost * 2 + flood_penalty
                else:
                    cost = fuel_cost * 5 + time_cost * 2 + flood_penalty

                new_dist = dist[u] + cost
                if new_dist < dist[v]:
                    dist[v] = new_dist
                    prev[v] = u
                    heapq.heappush(pq, (new_dist, v))

        # Reconstruct path
        path = []
        node = goal
        while node is not None:
            path.append(node)
            node = prev[node]
        path.reverse()

        if not path or path[0] != start:
            return {
                "path": [start, goal],
                "steps": [],
                "total_fuel": 0,
                "total_time": 0,
                "total_distance": 0,
                "co2_emissions": 0,
                "algorithm": "Dijkstra"
            }

        # Calculate metrics
        steps = []
        total_fuel = 0.0
        total_time = 0.0
        total_distance = 0.0

        for i in range(len(path) - 1):
            edge = self.graph.get_edge(path[i], path[i + 1])
            if not edge:
                continue
            tf = self.env.get_traffic_factor(path[i], path[i + 1])
            wi = self.env.get_weather_impact(path[i + 1])
            seg_fuel = (edge["distance"] * 0.00025 + max(0, edge["elevation"] * 0.0001)) * mult * tf * wi
            seg_time = edge["distance"] * 0.002 * tf * wi

            total_fuel += seg_fuel
            total_time += seg_time
            total_distance += edge["distance"]

            steps.append({
                "node": path[i + 1],
                "traffic_level": round(tf, 3),
                "weather_condition": "rainy" if wi > 1.2 else "clear",
                "fuel_cost": round(seg_fuel, 5),
                "time_cost": round(seg_time, 3),
                "reason": None
            })

        co2 = total_fuel * get_co2_factor(vehicle_type)

        return {
            "path": path,
            "steps": steps,
            "total_fuel": round(total_fuel, 5),
            "total_time": round(total_time, 3),
            "total_distance": round(total_distance, 2),
            "co2_emissions": round(co2, 5),
            "algorithm": "Dijkstra"
        }


# ============================================================
# Global State
# ============================================================

city = CityGraph()
env = Environment(city.total_nodes)
rl_agent = QLearningAgent(city, env)
dijkstra_router = DijkstraRouter(city, env)
simulation_history: List[dict] = []


# ============================================================
# Request/Response Models
# ============================================================

class SimulationParams(BaseModel):
    start_node: int = Field(..., ge=0, le=63, description="Start node (0-63)")
    goal_node: int = Field(..., ge=0, le=63, description="Goal node (0-63)")
    vehicle_type: str = Field(default="ev", pattern="^(ev|petrol|hybrid)$")
    priority: str = Field(default="standard", pattern="^(critical|high|standard|low)$")
    traffic_intensity: float = Field(default=0.5, ge=0, le=1)
    rain_level: float = Field(default=0.0, ge=0, le=1)
    episodes: int = Field(default=200, ge=10, le=1000)

class RouteStep(BaseModel):
    node: int
    traffic_level: float
    weather_condition: str
    fuel_cost: float
    time_cost: float
    reason: Optional[str] = None

class RouteResponse(BaseModel):
    path: List[int]
    steps: List[RouteStep]
    total_fuel: float
    total_time: float
    total_distance: float
    co2_emissions: float
    algorithm: str


# ============================================================
# Endpoints
# ============================================================

@app.get("/")
def read_root():
    return {
        "status": "GreenPath Engine Running",
        "version": "2.0.0",
        "total_nodes": city.total_nodes,
        "total_edges": len(city.edges),
        "simulation_runs": len(simulation_history)
    }


@app.get("/health")
def health_check():
    return {
        "status": "healthy",
        "uptime_nodes": city.total_nodes,
        "q_table_size": len(rl_agent.q_table),
        "active_flood_zones": list(env.flood_zones),
        "rain_level": round(env.rain, 3)
    }


@app.post("/simulate/step")
def trigger_step():
    """Advances simulation by one time step (traffic, weather)"""
    env.update()
    return {
        "status": "updated",
        "rain_level": round(env.rain, 3),
        "flood_zones": list(env.flood_zones)
    }


@app.post("/route/optimize")
def optimize_route(params: SimulationParams):
    """Trains the RL agent and returns both RL and Dijkstra routes for comparison"""
    if params.start_node == params.goal_node:
        raise HTTPException(status_code=400, detail="Start and goal nodes must be different")

    # Apply environment overrides
    env.rain = params.rain_level
    if params.rain_level > 0.8:
        env.flood_zones.clear()
        for _ in range(random.randint(0, 2)):
            env.flood_zones.add(random.randint(0, city.total_nodes - 1))

    # Train RL agent
    start_time = time.time()
    rewards = rl_agent.train(
        params.start_node, params.goal_node,
        params.vehicle_type, params.priority,
        params.episodes
    )
    training_time = time.time() - start_time

    # Get routes from both algorithms
    rl_result = rl_agent.find_route(params.start_node, params.goal_node, params.vehicle_type)
    dijkstra_result = dijkstra_router.find_route(
        params.start_node, params.goal_node, params.vehicle_type, params.priority
    )

    # Save to history
    run_record = {
        "id": len(simulation_history) + 1,
        "timestamp": time.time(),
        "params": params.model_dump(),
        "rl": rl_result,
        "dijkstra": dijkstra_result,
        "training_time_ms": round(training_time * 1000, 1),
        "training_episodes": params.episodes,
        "final_reward": rewards[-1] if rewards else 0,
    }
    simulation_history.append(run_record)

    return {
        "rl": rl_result,
        "dijkstra": dijkstra_result,
        "training_time_ms": round(training_time * 1000, 1),
        "reward_history": rewards[-20:],  # Last 20 episode rewards
    }


@app.post("/chaos/trigger")
def trigger_chaos():
    """Injects a major incident — floods random nodes and spikes traffic"""
    affected = []
    for _ in range(random.randint(2, 5)):
        node = random.randint(0, city.total_nodes - 1)
        env.flood_zones.add(node)
        affected.append(node)
    env.rain = min(1.0, env.rain + 0.4)

    return {
        "event": "Major Weather Event Triggered",
        "impact": "Multiple routes blocked, recalculation required",
        "affected_nodes": affected,
        "new_rain_level": round(env.rain, 3)
    }


@app.get("/metrics")
def get_metrics():
    total_runs = len(simulation_history)
    rl_wins = sum(
        1 for r in simulation_history
        if r["rl"]["total_fuel"] < r["dijkstra"]["total_fuel"]
    )
    avg_training_time = (
        sum(r["training_time_ms"] for r in simulation_history) / total_runs
        if total_runs > 0 else 0
    )

    return {
        "total_simulations": total_runs,
        "rl_wins": rl_wins,
        "dijkstra_wins": total_runs - rl_wins,
        "rl_win_rate": round(rl_wins / total_runs * 100, 1) if total_runs > 0 else 0,
        "avg_training_time_ms": round(avg_training_time, 1),
        "q_table_states": len(rl_agent.q_table),
        "active_flood_zones": len(env.flood_zones),
        "current_rain": round(env.rain, 3)
    }


@app.get("/history")
def get_history(limit: int = 20):
    """Retrieve recent simulation history"""
    recent = simulation_history[-limit:]
    recent.reverse()
    return {"runs": recent, "total": len(simulation_history)}


@app.get("/fleet")
def get_fleet():
    """Return simulated fleet status"""
    fleet = []
    for i in range(5):
        fleet.append({
            "id": f"VH-{100 + i}",
            "type": "ev" if i % 2 == 0 else "petrol",
            "location": random.randint(0, city.total_nodes - 1),
            "status": random.choice(["idle", "en-route", "charging"]),
            "current_range": random.randint(50, 300),
            "stress_index": round(random.random() * 10, 1)
        })
    return {"fleet": fleet}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
