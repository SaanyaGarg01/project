from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import List, Optional
import random

app = FastAPI(title="GreenPath Logistics Engine", version="1.0.0")

# --- Simulation State ---
class CityGraph:
    def __init__(self, size=64):
        self.nodes = list(range(size))
        # Mock edges with weights
        self.edges = {} # (u, v) -> {weight, traffic, elevation}

    def get_neighbors(self, node):
        # Mock grid neighbors
        n = int(len(self.nodes) ** 0.5)
        row, col = divmod(node, n)
        neighbors = []
        if row > 0: neighbors.append(((row-1)*n + col))
        if row < n-1: neighbors.append(((row+1)*n + col))
        if col > 0: neighbors.append((row*n + col - 1))
        if col < n-1: neighbors.append((row*n + col + 1))
        return neighbors

city = CityGraph()

# --- Models ---
class SimulationParams(BaseModel):
    start_node: int
    goal_node: int
    vehicle_type: str = "ev"
    priority: str = "standard"
    traffic_intensity: float = 0.5
    rain_level: float = 0.0

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
    co2_emissions: float
    algorithm: str

# --- Endpoints ---

@app.get("/")
def read_root():
    return {"status": "GreenPath Engine Running", "version": "1.0.0"}

@app.post("/simulate/step")
def trigger_step():
    """Advances simulation by one time step (traffic, weather)"""
    # Simulate dynamic changes
    return {"status": "updated", "time_step": random.randint(0, 1440), "changes": "Traffic spike at Node 12"}

@app.post("/route/optimize", response_model=RouteResponse)
def optimize_route(params: SimulationParams):
    """Calculates optimal route using Q-Learning logic"""
    # Mocking the RL Agent's output for the Python implementation
    # Real logic would traverse the CityGraph using Q-Table
    
    path = [params.start_node]
    current = params.start_node
    # Simple direct line mock for backend example
    path.append(params.goal_node) 
    
    total_fuel = 1.5
    total_time = 12.0
    steps = [
        RouteStep(
            node=params.start_node, 
            traffic_level=params.traffic_intensity, 
            weather_condition="rainy" if params.rain_level > 0.5 else "clear",
            fuel_cost=0.5, 
            time_cost=1.0, 
            reason="Starting point"
        ),
        RouteStep(
            node=params.goal_node, 
            traffic_level=params.traffic_intensity, 
            weather_condition="rainy" if params.rain_level > 0.5 else "clear",
            fuel_cost=1.0, 
            time_cost=11.0, 
            reason="Avoided congestion"
        )
    ]

    return RouteResponse(
        path=path,
        steps=steps,
        total_fuel=total_fuel,
        total_time=total_time,
        co2_emissions=total_fuel * 2.6, 
        algorithm="QLearning-Python"
    )

@app.post("/chaos/trigger")
def trigger_chaos():
    """Injects a major incident"""
    return {
        "event": "Bridge Collapse Simulation", 
        "impact": "Routes recalculating...",
        "affected_nodes": [12, 13, 20]
    }

@app.get("/metrics")
def get_metrics():
    return {
        "total_co2_saved": 1250.5,
        "trees_equivalent": 62,
        "active_vehicles": 14
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
