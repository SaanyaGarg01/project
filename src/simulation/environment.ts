import { WeatherConditions, WeatherType, Incident, IncidentType, CityProfile, FleetVehicle } from '../types/simulation';

export const CITIES: Record<string, CityProfile> = {
  Mumbai: { name: 'Mumbai', trafficVolatility: 0.9, weatherRisk: 0.8, averageSpeed: 20, description: 'High congestion, monsoon risk' },
  Delhi: { name: 'Delhi', trafficVolatility: 0.7, weatherRisk: 0.4, averageSpeed: 35, description: 'Pollution awareness, wider roads' },
  Bangalore: { name: 'Bangalore', trafficVolatility: 0.8, weatherRisk: 0.5, averageSpeed: 25, description: 'Tech hub, signal density' },
};

export class DynamicEnvironment {
  public traffic: Map<string, number> = new Map();
  private baseTrafficCongestion: number = 0.5;
  public weather: WeatherConditions = {
    rain: 0,
    type: 'clear',
    floodZones: new Set(),
    visibility: 1.0
  };
  public incidents: Incident[] = [];
  private updateInterval: number = 3000;
  private intervalId?: number;
  private timeStep: number = 0;

  // New Modules
  private activeCity: CityProfile = CITIES.Mumbai;
  private fleet: FleetVehicle[] = [];

  constructor(private totalNodes: number) {
    this.initializeTraffic();
    this.initializeWeather();
    this.initializeFleet();
  }

  setCity(cityName: string) {
    if (CITIES[cityName]) {
      this.activeCity = CITIES[cityName];
      this.baseTrafficCongestion = this.activeCity.trafficVolatility;
      this.setTrafficIntensity(this.activeCity.trafficVolatility); // Reset traffic
      // Adjust weather based on city risk
      this.weather.rain = Math.random() * this.activeCity.weatherRisk;
      console.log(`Switched to ${cityName}`);
    }
  }

  private initializeFleet() {
    // Create initial simulated fleet
    for (let i = 0; i < 5; i++) {
      this.fleet.push({
        id: `VH-${100 + i}`,
        type: i % 2 === 0 ? 'ev' : 'petrol',
        maxRange: i % 2 === 0 ? 300 : 600,
        currentRange: i % 2 === 0 ? 250 : 500,
        capacity: 1000,
        maxDriveTime: 480,
        location: Math.floor(Math.random() * this.totalNodes),
        status: 'idle',
        stressIndex: 0
      });
    }
  }

  getFleet(): FleetVehicle[] {
    return this.fleet;
  }

  updateFleet() {
    this.fleet.forEach(vehicle => {
      if (vehicle.status === 'en-route' && vehicle.route && vehicle.route.length > 0) {
        // Move vehicle
        const nextNode = vehicle.route[0];
        // Simple simulation: move one node per step if traffic permits
        const currentTraffic = this.getTrafficFactor(vehicle.location, nextNode);
        const moveChance = Math.max(0.1, 1 - currentTraffic);

        if (Math.random() < moveChance) {
          vehicle.location = nextNode;
          vehicle.route.shift(); // Remove visited node
          vehicle.currentRange -= 5; // Burn fuel/battery
          vehicle.stressIndex = Math.max(0, Math.min(10, vehicle.stressIndex + (currentTraffic > 0.7 ? 1 : -0.5)));

          if (vehicle.route.length === 0) {
            vehicle.status = 'idle';
          }
        } else {
          vehicle.stressIndex = Math.min(10, vehicle.stressIndex + 0.5); // Stuck in traffic
        }
      }
    });
  }

  // ... existing methods ...

  private initializeTraffic(): void {
    for (let i = 0; i < this.totalNodes; i++) {
      for (let j = i + 1; j < this.totalNodes; j++) {
        const key = this.getEdgeKey(i, j);
        this.traffic.set(key, this.baseTrafficCongestion * (0.6 + Math.random() * 0.8));
      }
    }
  }

  private initializeWeather(): void {
    this.weather.rain = Math.random() * 0.5;
    this.weather.type = this.determineWeatherType(this.weather.rain);
    this.updateVisibility();

    const numFloodZones = Math.floor(Math.random() * 3);
    for (let i = 0; i < numFloodZones; i++) {
      this.weather.floodZones.add(Math.floor(Math.random() * this.totalNodes));
    }
  }

  private determineWeatherType(rain: number): WeatherType {
    if (rain > 0.8) return 'stormy';
    if (rain > 0.3) return 'rainy';
    if (Math.random() > 0.9) return 'foggy';
    // Actually let's use a randomness unrelated to rain for fog
    if (rain < 0.1 && Math.random() > 0.8) return 'foggy';
    return 'clear';
  }

  private updateVisibility(): void {
    if (this.weather.type === 'foggy') this.weather.visibility = 0.3 + Math.random() * 0.3;
    else if (this.weather.type === 'stormy') this.weather.visibility = 0.5;
    else this.weather.visibility = 1.0;
  }

  private getEdgeKey(from: number, to: number): string {
    return `${Math.min(from, to)}-${Math.max(from, to)}`;
  }

  getTrafficFactor(from: number, to: number): number {
    const key = this.getEdgeKey(from, to);
    // Base traffic + Incident impact
    let factor = this.traffic.get(key) || 0.5;

    // Check for incidents on either node
    const incident = this.incidents.find(i => i.nodeId === from || i.nodeId === to);
    if (incident) {
      if (incident.type === 'accident') factor *= 2.0;
      else if (incident.type === 'road_closure') factor *= 100.0; // Effectively blocked
      else if (incident.type === 'construction') factor *= 1.5;
      else if (incident.type === 'festival') factor *= 1.8;
    }

    return factor;
  }

  // Predictive Traffic Forecasting
  // Uses a sine wave pattern + current trend to predict future traffic
  getPredictedTraffic(from: number, to: number, timeOffsetMinutes: number): number {
    const currentTraffic = this.getTrafficFactor(from, to);
    // Simulate daily cycle (24h) with 1 minute steps
    const timeOfDay = (this.timeStep + timeOffsetMinutes) % 1440;
    const rushHourMorning = Math.exp(-Math.pow((timeOfDay - 480) / 60, 2)); // Peak at 8 AM (480 min)
    const rushHourEvening = Math.exp(-Math.pow((timeOfDay - 1080) / 60, 2)); // Peak at 6 PM (1080 min)

    const historicalTrend = (rushHourMorning + rushHourEvening) * 0.5;

    // Blend current real-time condition with historical trend
    return (currentTraffic * 0.7) + (historicalTrend * 0.3);
  }

  getWeatherImpact(node: number): number {
    if (this.weather.floodZones.has(node)) {
      return 5.0; // Severe penalty for flooding
    }

    let impact = 1.0;

    switch (this.weather.type) {
      case 'stormy':
        impact = 2.5; // High impact
        break;
      case 'rainy':
        impact = 1.5;
        break;
      case 'snowy':
        impact = 3.0; // Very slow
        break;
      case 'foggy':
        impact = 1.8; // Low visibility slows down
        break;
      case 'clear':
      default:
        impact = 1.0;
    }

    return impact;
  }

  isFlooded(node: number): boolean {
    return this.weather.floodZones.has(node);
  }

  hasIncident(node: number): Incident | undefined {
    return this.incidents.find(i => i.nodeId === node);
  }

  getRainLevel(): number {
    return this.weather.rain;
  }

  getWeatherType(): WeatherType {
    return this.weather.type;
  }

  getIncidentCount(): number {
    return this.incidents.length;
  }

  async syncWithRealWorld(latitude: number = 40.7128, longitude: number = -74.0060) {
    try {
      const response = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,rain,showers,snowfall,weather_code,wind_speed_10m`);
      const data = await response.json();

      if (data.current) {
        // Map Open-Meteo WMO codes to our types
        const code = data.current.weather_code;
        const rain = data.current.rain + data.current.showers;
        // const wind = data.current.wind_speed_10m; // Not used directly for weather type, but could be for impact

        this.weather.rain = Math.min(1, rain / 10); // Normalize roughly
        this.weather.visibility = Math.max(0.1, 1 - (rain * 0.1 + (code > 40 ? 0.3 : 0))); // Simple visibility logic

        if (code >= 95) this.weather.type = 'stormy';
        else if (code >= 70) this.weather.type = 'snowy';
        else if (rain > 0.5) this.weather.type = 'rainy';
        else if (code >= 45) this.weather.type = 'foggy';
        else this.weather.type = 'clear';

        // Update flood risks if heavy rain
        if (this.weather.rain > 0.8) {
          // Re-evaluate flood zones based on heavy rain
          this.weather.floodZones.clear();
          const numFloodZones = Math.floor(Math.random() * 3); // Still random for specific nodes
          for (let i = 0; i < numFloodZones; i++) {
            this.weather.floodZones.add(Math.floor(Math.random() * this.totalNodes));
          }
        } else {
          this.weather.floodZones.clear();
        }

        console.log(`Synced with Real Weather: ${this.weather.type}, Rain: ${this.weather.rain.toFixed(2)}`);
      }
    } catch (e) {
      console.error("Failed to sync with real weather, falling back to simulation.", e);
      this.updateConditions(); // Fallback
    }
  }

  setTrafficIntensity(level: number) {
    this.baseTrafficCongestion = Math.max(0, Math.min(1, level)); // Ensure level is between 0 and 1
    // Regenerate traffic based on this base level
    for (let i = 0; i < this.totalNodes; i++) {
      for (let j = i + 1; j < this.totalNodes; j++) {
        const key = this.getEdgeKey(i, j);
        // Scale traffic values around the new base level
        this.traffic.set(key, this.baseTrafficCongestion * (0.6 + Math.random() * 0.8));
      }
    }
  }

  setRainLevel(level: number) {
    this.weather.rain = Math.max(0, Math.min(1, level)); // Ensure level is between 0 and 1
    this.weather.type = this.determineWeatherType(this.weather.rain);
    this.updateVisibility();
    // Also update flood zones based on new rain level
    if (this.weather.rain > 0.8) {
      this.weather.floodZones.clear();
      const numFloodZones = Math.floor(Math.random() * 3);
      for (let i = 0; i < numFloodZones; i++) {
        this.weather.floodZones.add(Math.floor(Math.random() * this.totalNodes));
      }
    } else {
      this.weather.floodZones.clear();
    }
  }

  updateConditions(): void {
    this.timeStep = (this.timeStep + 1) % 1440; // Increment time

    // Update Traffic
    for (const [key, val] of this.traffic.entries()) {
      this.traffic.set(key, Math.max(0.1, Math.min(2.0,
        val + (Math.random() - 0.5) * 0.3
      )));
    }

    // Update Weather
    this.weather.rain = Math.max(0, Math.min(1,
      this.weather.rain + (Math.random() - 0.5) * 0.1
    ));

    // Chance to change weather type
    if (Math.random() > 0.95) {
      this.weather.type = this.determineWeatherType(this.weather.rain);
    }
    this.updateVisibility();

    // Flood Zones
    if (Math.random() > 0.98) { // Less frequent
      this.weather.floodZones.clear();
      const numFloodZones = Math.floor(Math.random() * 3);
      for (let i = 0; i < numFloodZones; i++) {
        this.weather.floodZones.add(Math.floor(Math.random() * this.totalNodes));
      }
    }

    // Incident Generation (Random Events)
    if (Math.random() > 0.95 && this.incidents.length < 3) {
      // Add new incident
      const nodeId = Math.floor(Math.random() * this.totalNodes);
      if (!this.incidents.find(i => i.nodeId === nodeId)) {
        const types: IncidentType[] = ['accident', 'construction', 'festival'];
        const type = types[Math.floor(Math.random() * types.length)];
        this.incidents.push({
          nodeId,
          type,
          severity: Math.random(),
          description: `${type} reported at Node ${nodeId}`
        });
      }
    }

    // Resolve incidents
    if (Math.random() > 0.9 && this.incidents.length > 0) {
      this.incidents.shift(); // Remove oldest incident
    }
  }

  startAutoUpdate(callback?: () => void): void {
    this.intervalId = window.setInterval(() => {
      this.updateConditions();
      callback?.();
    }, this.updateInterval);
  }

  stopAutoUpdate(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
    }
  }

  getSnapshot(): any {
    return {
      traffic: { ...this.traffic },
      weather: {
        rain: this.weather.rain,
        type: this.weather.type,
        floodZones: new Set(this.weather.floodZones),
        visibility: this.weather.visibility
      },
      incidents: [...this.incidents]
    };
  }
}
