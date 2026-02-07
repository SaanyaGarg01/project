import { TrafficConditions, WeatherConditions, WeatherType, Incident, IncidentType } from '../types/simulation';

export class DynamicEnvironment {
  private traffic: TrafficConditions = {};
  private weather: WeatherConditions = {
    rain: 0,
    type: 'clear',
    floodZones: new Set(),
    visibility: 1.0
  };
  private incidents: Incident[] = [];
  private updateInterval: number = 3000;
  private intervalId?: number;
  private timeStep: number = 0; // consistent time tracking for predictive model

  constructor(private totalNodes: number) {
    this.initializeConditions();
  }

  private initializeConditions(): void {
    for (let i = 0; i < this.totalNodes; i++) {
      for (let j = i + 1; j < this.totalNodes; j++) {
        const key = this.getEdgeKey(i, j);
        this.traffic[key] = 0.3 + Math.random() * 0.4;
      }
    }

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
    let factor = this.traffic[key] || 0.5;

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

  updateConditions(): void {
    this.timeStep = (this.timeStep + 1) % 1440; // Increment time

    // Update Traffic
    for (const key in this.traffic) {
      this.traffic[key] = Math.max(0.1, Math.min(2.0,
        this.traffic[key] + (Math.random() - 0.5) * 0.3
      ));
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
