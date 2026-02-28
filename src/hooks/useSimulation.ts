import { useState, useCallback } from 'react';
import { SimulationController } from '../simulation/controller';
import { RouteResult, DeliveryConstraint, VehicleConstraints, PriorityLevel } from '../types/simulation';

export function useSimulation(controller: SimulationController) {
    const [rlRoute, setRlRoute] = useState<RouteResult | undefined>();
    const [dijkstraRoute, setDijkstraRoute] = useState<RouteResult | undefined>();
    const [animationProgress, setAnimationProgress] = useState(0);
    const [isAnimating, setIsAnimating] = useState(false);
    const [currentVehicle, setCurrentVehicle] = useState<VehicleConstraints | null>(null);
    const [currentConstraints, setCurrentConstraints] = useState<DeliveryConstraint | null>(null);

    // Simulation Settings
    const [priority, setPriority] = useState<PriorityLevel>('standard');
    const [windowStart, setWindowStart] = useState('08:00');
    const [windowEnd, setWindowEnd] = useState('17:00');
    const [weight, setWeight] = useState('50');
    const [vehicleType, setVehicleType] = useState<'ev' | 'petrol' | 'hybrid'>('ev');
    const [startNode, setStartNode] = useState('0');
    const [goalNode, setGoalNode] = useState('63');

    const executeSimulation = useCallback(async (
        start: number,
        goal: number,
        currentPriority: PriorityLevel,
        wStart: string,
        wEnd: string,
        payloadWeight: string,
        vType: 'ev' | 'petrol' | 'hybrid'
    ) => {
        // Parse time strings
        const [startH, startM] = wStart.split(':').map(Number);
        const [endH, endM] = wEnd.split(':').map(Number);
        const startMins = startH * 60 + startM;
        const endMins = endH * 60 + endM;

        const constraints: DeliveryConstraint = {
            priority: currentPriority,
            windowStart: startMins,
            windowEnd: endMins,
            weight: parseInt(payloadWeight)
        };

        const vehicle: VehicleConstraints = {
            type: vType,
            maxRange: vType === 'ev' ? 200 : 500,
            currentRange: vType === 'ev' ? 150 : 400,
            capacity: 1000,
            maxDriveTime: 480
        };

        setCurrentConstraints(constraints);
        setCurrentVehicle(vehicle);
        setRlRoute(undefined);
        setDijkstraRoute(undefined);
        setAnimationProgress(0);
        setIsAnimating(false);

        await controller.trainAgent(start, goal, constraints, vehicle, 200);
        const results = await controller.runComparison(start, goal, constraints, vehicle);

        setRlRoute(results.rl);
        setDijkstraRoute(results.dijkstra);
        setIsAnimating(true);
        setAnimationProgress(0);

        let progress = 0;
        const animationInterval = setInterval(() => {
            progress += 0.01;
            if (progress >= 1) {
                progress = 1;
                clearInterval(animationInterval);
                setIsAnimating(false);
            }
            setAnimationProgress(progress);
        }, 50);
    }, [controller]);

    const handleRunSimulation = useCallback(() => {
        executeSimulation(
            parseInt(startNode),
            parseInt(goalNode),
            priority,
            windowStart,
            windowEnd,
            weight,
            vehicleType
        );
    }, [executeSimulation, startNode, goalNode, priority, windowStart, windowEnd, weight, vehicleType]);

    // Helper to get current step for telematics
    const getCurrentStep = useCallback(() => {
        if (!rlRoute || !rlRoute.steps) return undefined;
        const stepIndex = Math.floor(animationProgress * (rlRoute.steps.length - 1));
        return rlRoute.steps[stepIndex];
    }, [rlRoute, animationProgress]);

    return {
        // State
        rlRoute,
        dijkstraRoute,
        animationProgress,
        isAnimating,
        currentVehicle,
        currentConstraints,
        priority,
        windowStart,
        windowEnd,
        weight,
        vehicleType,
        startNode,
        goalNode,
        // Setters
        setPriority,
        setWindowStart,
        setWindowEnd,
        setWeight,
        setVehicleType,
        setStartNode,
        setGoalNode,
        // Actions
        executeSimulation,
        handleRunSimulation,
        getCurrentStep
    };
}
