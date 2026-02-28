import { Edge } from '../types/simulation';

export type VehicleType = 'ev' | 'petrol' | 'hybrid';

/**
 * Returns the consumption multiplier for a given vehicle type.
 * EVs are most efficient, petrol is baseline.
 */
export function getConsumptionMultiplier(type: VehicleType): number {
    if (type === 'ev') return 0.2;
    if (type === 'hybrid') return 0.6;
    return 1.0;
}

/**
 * Returns the CO2 factor (kg CO2 per unit fuel) for a given vehicle type.
 */
export function getCO2Factor(type: VehicleType): number {
    if (type === 'ev') return 0.4;   // Grid electricity impact
    if (type === 'hybrid') return 1.2;
    return 2.31;                      // Petrol/Diesel
}

/**
 * Calculates fuel cost for a single road segment.
 */
export function calculateSegmentFuel(
    edge: Edge,
    trafficFactor: number,
    weatherImpact: number,
    vehicleType: VehicleType
): number {
    const mult = getConsumptionMultiplier(vehicleType);
    const baseFuelCost = edge.distance * 0.00025 * mult;
    const elevationCost = Math.max(0, edge.elevation * 0.0001) * mult;
    return (baseFuelCost + elevationCost) * trafficFactor * weatherImpact;
}

/**
 * Calculates time cost for a single road segment.
 */
export function calculateSegmentTime(
    edge: Edge,
    trafficFactor: number,
    weatherImpact: number
): number {
    return edge.distance * 0.002 * trafficFactor * weatherImpact;
}

/**
 * Calculates CO2 emissions from total fuel consumption.
 */
export function calculateCO2(totalFuel: number, vehicleType: VehicleType): number {
    return totalFuel * getCO2Factor(vehicleType);
}
