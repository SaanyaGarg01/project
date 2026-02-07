import { Zap, Battery, AlertTriangle, TrendingDown } from 'lucide-react';
import { RouteResult, VehicleConstraints } from '../types/simulation';

interface TelematicsPanelProps {
    vehicle: VehicleConstraints;
    currentStep?: {
        node: number;
        fuel: number;
        time: number;
        traffic: number;
        weather: number;
        reason?: string;
    };
    totalDistance?: number;
    progress: number; // 0-1
}

export function TelematicsPanel({ vehicle, currentStep, totalDistance, progress }: TelematicsPanelProps) {
    // ... (existing logic)
    const currentSpeed = currentStep
        ? (60 * (1 - currentStep.traffic * 0.5) * (1 - currentStep.weather * 0.3)).toFixed(0)
        : 0;

    const currentConsumption = currentStep ? Math.abs(currentStep.fuel * 10).toFixed(1) : 0;
    const rangeRemaining = (vehicle.currentRange - (currentStep ? currentStep.fuel : 0)).toFixed(1);

    // Create a visual gauge for range
    const rangePercent = Math.max(0, Math.min(100, (parseFloat(rangeRemaining) / vehicle.maxRange) * 100));

    return (
        <div className="bg-slate-900 text-white rounded-lg shadow-lg p-4 font-mono">
            <div className="flex items-center justify-between mb-4 border-b border-slate-700 pb-2">
                <h2 className="text-lg font-bold text-green-400 flex items-center gap-2">
                    <Zap className="w-5 h-5" /> LIVE TELEMETRY
                </h2>
                <span className="text-xs text-slate-400 animate-pulse">● CONNECTED</span>
            </div>

            <div className="grid grid-cols-2 gap-4">
                {/* Speed Gauge */}
                <div className="bg-slate-800 p-3 rounded border border-slate-700">
                    <span className="text-xs text-slate-400 block mb-1">SPEED</span>
                    <div className="flex items-baseline gap-1">
                        <span className="text-3xl font-bold">{currentSpeed}</span>
                        <span className="text-sm text-slate-500">km/h</span>
                    </div>
                </div>

                {/* Battery/Fuel */}
                <div className="bg-slate-800 p-3 rounded border border-slate-700">
                    <span className="text-xs text-slate-400 block mb-1 flex justify-between">
                        <span>{vehicle.type === 'ev' ? 'BATTERY' : 'FUEL'}</span>
                        <Battery className={`w-4 h-4 ${rangePercent < 20 ? 'text-red-500' : 'text-green-500'}`} />
                    </span>
                    <div className="w-full bg-slate-700 h-2 rounded-full mt-2 mb-1">
                        <div
                            className={`h-2 rounded-full transition-all duration-300 ${rangePercent < 20 ? 'bg-red-500' : 'bg-green-500'}`}
                            style={{ width: `${rangePercent}%` }}
                        ></div>
                    </div>
                    <div className="flex justify-between text-xs">
                        <span>{rangePercent.toFixed(0)}%</span>
                        <span>{rangeRemaining} {vehicle.type === 'ev' ? 'km' : 'L'}</span>
                    </div>
                </div>

                {/* Real-time Consumption */}
                <div className="bg-slate-800 p-3 rounded border border-slate-700">
                    <span className="text-xs text-slate-400 block mb-1">CONSUMPTION</span>
                    <div className="flex items-baseline gap-1">
                        <span className="text-2xl font-bold text-yellow-400">{currentConsumption}</span>
                        <span className="text-xs text-slate-500">{vehicle.type === 'ev' ? 'kWh/100km' : 'L/100km'}</span>
                    </div>
                </div>

                {/* Hazard Risk */}
                <div className="bg-slate-800 p-3 rounded border border-slate-700">
                    <span className="text-xs text-slate-400 block mb-1">RISK LEVEL</span>
                    <div className="flex items-center gap-2 mt-1">
                        {currentStep && currentStep.traffic > 0.8 ? (
                            <>
                                <AlertTriangle className="w-6 h-6 text-red-500 animate-bounce" />
                                <span className="text-sm text-red-400 font-bold">HIGH TRAFFIC</span>
                            </>
                        ) : currentStep && currentStep.weather > 1.0 ? (
                            <>
                                <TrendingDown className="w-6 h-6 text-yellow-500" />
                                <span className="text-sm text-yellow-400 font-bold">WEATHER</span>
                            </>
                        ) : (
                            <span className="text-sm text-green-400 font-bold">NOMINAL</span>
                        )}
                    </div>
                </div>

                {/* AI Insight */}
                {currentStep?.reason && (
                    <div className="col-span-2 bg-blue-900/40 p-3 rounded border border-blue-700/50">
                        <span className="text-xs text-blue-300 block mb-1 uppercase tracking-wider">AI Insight</span>
                        <p className="text-sm text-blue-100 italic">"{currentStep.reason}"</p>
                    </div>
                )}
            </div>

            <div className="mt-4 pt-2 border-t border-slate-700">
                <div className="flex justify-between text-xs text-slate-400 mb-1">
                    <span>START</span>
                    <span>DESTINATION</span>
                </div>
                <div className="w-full bg-slate-700 h-1 rounded-full relative">
                    <div
                        className="absolute h-3 w-3 bg-blue-500 rounded-full top-[-4px] shadow-[0_0_10px_rgba(59,130,246,0.8)] transition-all duration-300"
                        style={{ left: `${progress * 100}%` }}
                    ></div>
                    <div className="h-full bg-blue-900/50 rounded-full" style={{ width: `${progress * 100}%` }}></div>
                </div>
                <div className="flex justify-between text-xs text-slate-500 mt-1">
                    <span>0 km</span>
                    <span>{totalDistance?.toFixed(1) || '--'} km</span>
                </div>
            </div>
        </div>
    );
}
