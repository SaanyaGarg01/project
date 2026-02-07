import { Truck, AlertTriangle, TrendingDown, Battery, Zap } from 'lucide-react';
import { FleetVehicle, VehicleConstraints } from '../types/simulation';

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
    eta?: number;
    fleet?: FleetVehicle[];
    progress?: number;
}

export function TelematicsPanel({ vehicle, currentStep, totalDistance, fleet = [], progress = 0 }: TelematicsPanelProps) {
    const currentSpeed = currentStep
        ? (60 * (1 - currentStep.traffic * 0.5) * (1 - currentStep.weather * 0.3)).toFixed(0)
        : 0;

    // Use vehicle prop for main display
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
                <div className="flex items-center gap-2">
                    {fleet.length > 0 && <span className="text-xs text-blue-400 font-bold px-2 border border-blue-500 rounded">FLEET MODE</span>}
                    <span className="text-xs text-slate-400 animate-pulse">● CONNECTED</span>
                </div>
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

                {/* Traffic Forecast */}
                <div className="bg-slate-800 p-3 rounded border border-slate-700">
                    <span className="text-xs text-slate-400 block mb-1">FORECAST (+15m)</span>
                    <div className="flex items-center gap-1 mt-1">
                        {currentStep && currentStep.traffic > 0.7 ? (
                            <TrendingDown className="w-5 h-5 text-green-500" />
                        ) : (
                            <TrendingDown className="w-5 h-5 text-red-500 rotate-180" />
                        )}
                        <span className={`text-lg font-bold ${currentStep && currentStep.traffic > 0.7 ? 'text-green-400' : 'text-red-400'}`}>
                            {currentStep && currentStep.traffic > 0.7 ? 'CLEARING' : 'RISING'}
                        </span>
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

                {/* Driver Index */}
                <div className="bg-slate-800 p-3 rounded border border-slate-700 col-span-2 flex items-center justify-between">
                    <div>
                        <span className="text-xs text-slate-400 block mb-1">DRIVER STRESS INDEX</span>
                        <div className="w-32 bg-slate-700 h-2 rounded-full mt-1">
                            <div
                                className={`h-2 rounded-full transition-all duration-300 ${(currentStep?.traffic || 0) > 0.7 ? 'bg-red-500' : 'bg-green-500'}`}
                                style={{ width: `${Math.min(100, (currentStep?.traffic || 0) * 100)}%` }}
                            ></div>
                        </div>
                    </div>
                    <div className="text-right">
                        <span className={`text-xl font-bold ${(currentStep?.traffic || 0) > 0.7 ? 'text-red-400' : 'text-green-400'}`}>
                            {((currentStep?.traffic || 0) * 10).toFixed(1)}/10
                        </span>
                        <span className="text-xs text-slate-500 block">
                            {(currentStep?.traffic || 0) > 0.7 ? 'Stop-and-Go' : 'Smooth Flow'}
                        </span>
                    </div>
                </div>

            </div>

            {/* Fleet Section */}
            {fleet.length > 0 && (
                <div className="mt-4 border-t border-slate-700 pt-3">
                    <h3 className="text-xs font-bold text-slate-400 mb-2 flex items-center gap-2 uppercase tracking-wider">
                        <Truck className="w-3 h-3" /> Active Fleet Status
                    </h3>
                    <div className="space-y-2 max-h-32 overflow-y-auto pr-1">
                        {fleet.map(v => (
                            <div key={v.id} className="flex items-center justify-between p-2 bg-slate-800 rounded border border-slate-700 text-[10px]">
                                <div className="flex items-center gap-2">
                                    <div className={`w-1.5 h-1.5 rounded-full ${v.status === 'en-route' ? 'bg-green-500 animate-pulse' : 'bg-gray-500'}`}></div>
                                    <span className="font-semibold text-slate-300">{v.id}</span>
                                    <span className={`px-1 rounded uppercase ${v.type === 'ev' ? 'bg-green-900 text-green-300' : 'bg-orange-900 text-orange-300'}`}>{v.type}</span>
                                </div>
                                <div className="flex items-center gap-3 text-slate-400">
                                    <span>Loc: {v.location}</span>
                                    <span className={`${v.stressIndex > 7 ? 'text-red-400 font-bold' : ''}`}>Stress: {v.stressIndex.toFixed(0)}</span>
                                    <span>{v.currentRange}km</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            <div className="mt-4 pt-4 border-t border-slate-700 grid grid-cols-2 gap-4">
                <div>
                    <span className="text-xs text-slate-400 block mb-1">ETA</span>
                    <span className="text-xl font-bold text-white">
                        {currentStep ? new Date(Date.now() + ((totalDistance || 10) - (progress * (totalDistance || 10))) * 60000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--:--'}
                    </span>
                </div>
                <div>
                    <span className="text-xs text-slate-400 block mb-1">STATUS</span>
                    <span className={`text-sm font-bold px-2 py-1 rounded ${currentStep && currentStep.traffic > 0.8 ? 'bg-red-900/50 text-red-400' : 'bg-green-900/50 text-green-400'}`}>
                        {currentStep && currentStep.traffic > 0.8 ? 'DELAYED' : 'ON TIME'}
                    </span>
                </div>
            </div>

            {currentStep?.reason && (
                <div className="mt-4 bg-blue-900/40 p-3 rounded border border-blue-700/50 animate-fade-in">
                    <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs text-blue-300 uppercase tracking-wider font-bold">Driver Alert</span>
                        <span className="flex h-2 w-2 relative">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
                        </span>
                    </div>
                    <p className="text-sm text-blue-100 italic">"{currentStep.reason}"</p>
                </div>
            )}

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
