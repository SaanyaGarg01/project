import { useState, useEffect, useCallback } from 'react';
import { SimulationController } from '../simulation/controller';
import { FleetVehicle } from '../types/simulation';
import L from 'leaflet';

export function useEnvironment(controller: SimulationController) {
    const [, setUpdateTrigger] = useState(0);
    const [fleet, setFleet] = useState<FleetVehicle[]>(controller.getFleet());
    const [isRealMapMode, setIsRealMapMode] = useState(false);
    const [selectedBounds, setSelectedBounds] = useState<L.LatLngBounds | null>(null);

    useEffect(() => {
        const unsubscribe = controller.subscribe(() => {
            setUpdateTrigger((prev) => prev + 1);
            setFleet([...controller.getFleet()]); // Update fleet state
        });

        controller.startEnvironmentUpdates();

        return () => {
            unsubscribe();
            controller.stopEnvironmentUpdates();
        };
    }, [controller]);

    const handleUpdateEnvironment = useCallback(async () => {
        await controller.syncWithRealWorld();
    }, [controller]);

    const handleTrafficChange = useCallback((level: number) => {
        controller.setTrafficIntensity(level);
        setUpdateTrigger((prev) => prev + 1);
    }, [controller]);

    const handleRainChange = useCallback((level: number) => {
        controller.setRainLevel(level);
        setUpdateTrigger((prev) => prev + 1);
    }, [controller]);

    return {
        fleet,
        isRealMapMode,
        selectedBounds,
        setIsRealMapMode,
        setSelectedBounds,
        handleUpdateEnvironment,
        handleTrafficChange,
        handleRainChange
    };
}
