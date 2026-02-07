import { Play, RotateCcw, Zap, CloudRain, Clock, Truck } from 'lucide-react';
import { PriorityLevel } from '../types/simulation';

interface ControlPanelProps {
  onRunSimulation: () => void;
  onUpdateEnvironment: () => void;
  isTraining: boolean;
  trainingProgress: number;
  activeAlgorithm: 'both' | 'rl' | 'dijkstra';
  onAlgorithmChange: (algorithm: 'both' | 'rl' | 'dijkstra') => void;
  rainLevel: number;
  weatherType: string;
  incidentCount: number;
  onCityChange: (city: string) => void;
  startNode: string;
  goalNode: string;
  onStartNodeChange: (val: string) => void;
  onGoalNodeChange: (val: string) => void;
  onTrafficChange: (val: number) => void;
  onRainChange: (val: number) => void;

  // Lifted States
  priority: PriorityLevel;
  onPriorityChange: (val: PriorityLevel) => void;
  windowStart: string;
  onWindowStartChange: (val: string) => void;
  windowEnd: string;
  onWindowEndChange: (val: string) => void;
  weight: string;
  onWeightChange: (val: string) => void;
  vehicleType: 'ev' | 'petrol' | 'hybrid';
  onVehicleTypeChange: (val: 'ev' | 'petrol' | 'hybrid') => void;
}

export function ControlPanel({
  onRunSimulation,
  onUpdateEnvironment,
  isTraining,
  trainingProgress,
  activeAlgorithm,
  onAlgorithmChange,
  rainLevel,
  weatherType,
  incidentCount,
  onCityChange,
  startNode,
  goalNode,
  onStartNodeChange,
  onGoalNodeChange,
  priority,
  onPriorityChange,
  windowStart,
  onWindowStartChange,
  windowEnd,
  onWindowEndChange,
  weight,
  onWeightChange,
  vehicleType,
  onVehicleTypeChange,
  onTrafficChange,
  onRainChange
}: ControlPanelProps) {

  // Local helper for Risk Calculation
  const getRiskColor = (traffic: number, rain: number) => {
    const score = (traffic * 0.5) + (rain * 0.5);
    if (score > 0.7) return 'text-red-600';
    if (score > 0.4) return 'text-orange-500';
    return 'text-green-600';
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6 max-h-[80vh] overflow-y-auto">

      <div className="bg-gradient-to-r from-blue-900 to-slate-900 -mx-6 -mt-6 p-4 rounded-t-lg mb-6 text-white">
        <div className="flex justify-between items-center mb-2">
          <h2 className="text-lg font-bold">Simulation Controls</h2>
          <div className="text-[10px] bg-white/20 px-2 py-0.5 rounded border border-white/30 uppercase tracking-tighter">
            v2.6 Intelligence
          </div>
        </div>
        <div className="mt-3 space-y-3">
          <div>
            <label className="text-xs text-blue-200 uppercase font-bold tracking-wider block mb-1">Active City Profile</label>
            <select onChange={(e) => onCityChange(e.target.value)} className="w-full bg-slate-800 border border-slate-600 text-white text-sm rounded p-2 focus:ring-2 focus:ring-blue-500">
              <option value="Mumbai">Mumbai (High Traffic, Monsoon)</option>
              <option value="Delhi">Delhi (Pollution Aware)</option>
              <option value="Bangalore">Bangalore (Tech Hub, Signals)</option>
            </select>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Start Node
            </label>
            <input
              type="number"
              min="0"
              max="63"
              value={startNode}
              onChange={(e) => onStartNodeChange(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
              disabled={isTraining}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Goal Node
            </label>
            <input
              type="number"
              min="0"
              max="63"
              value={goalNode}
              onChange={(e) => onGoalNodeChange(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
              disabled={isTraining}
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Priority
            </label>
            <select
              value={priority}
              onChange={(e) => onPriorityChange(e.target.value as PriorityLevel)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
              disabled={isTraining}
            >
              <option value="standard">Standard</option>
              <option value="high">High Priority</option>
              <option value="critical">Critical (Ambulance)</option>
              <option value="low">Low (Eco)</option>
            </select>

            <div className="flex items-center justify-between p-2 bg-emerald-50 rounded border border-emerald-100 mt-2">
              <div className="flex items-center gap-2">
                <span className="relative flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
                </span>
                <label className="text-xs font-bold text-emerald-800 cursor-pointer select-none">
                  Ethical Mode
                </label>
              </div>
              <div className="relative inline-block w-8 align-middle select-none">
                <input type="checkbox" className="toggle-checkbox absolute block w-4 h-4 rounded-full bg-white border-2 appearance-none cursor-pointer checked:right-0 checked:border-emerald-500 checked:bg-emerald-500 transition-all duration-300 top-0.5"
                  onChange={(e) => {
                    if (e.target.checked) onAlgorithmChange('rl');
                  }} />
                <div className="toggle-label block overflow-hidden h-5 rounded-full bg-gray-300 cursor-pointer"></div>
              </div>
            </div>
            <p className="text-[10px] text-emerald-600 mt-1 px-1">
              Prioritizes safety & community impact over speed.
            </p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Vehicle
            </label>
            <select
              value={vehicleType}
              onChange={(e) => onVehicleTypeChange(e.target.value as any)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
              disabled={isTraining}
            >
              <option value="ev">EV Truck</option>
              <option value="hybrid">Hybrid Van</option>
              <option value="petrol">Diesel Truck</option>
            </select>
          </div>
        </div>

        <div className="border-t pt-4">
          <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
            <Clock className="w-4 h-4" /> Scheduling
          </h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-gray-500 mb-1">Window Start</label>
              <input type="time" value={windowStart} onChange={e => onWindowStartChange(e.target.value)} className="w-full border rounded p-1 text-sm" />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Window End</label>
              <input type="time" value={windowEnd} onChange={e => onWindowEndChange(e.target.value)} className="w-full border rounded p-1 text-sm" />
            </div>
          </div>
        </div>

        <div className="border-t pt-4">
          <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
            <Truck className="w-4 h-4" /> Payload
          </h3>
          <div className="flex gap-4 items-center">
            <input
              type="range"
              min="10"
              max="1000"
              value={weight}
              onChange={e => onWeightChange(e.target.value)}
              className="flex-1"
            />
            <span className="text-sm text-gray-600 w-16 text-right">{weight} kg</span>
          </div>
        </div>


        <div className="border-t pt-4">
          <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
            <Zap className="w-4 h-4 text-purple-600" /> Dynamic Logistics Playground
          </h3>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-[10px] mb-1">
                <span className="text-gray-500 uppercase font-bold tracking-widest text-[9px]">Congestion Index</span>
                <span className={`font-black ${getRiskColor(0.5, rainLevel)}`}>{(0.5 * 100).toFixed(0)}% Impact</span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                defaultValue="50"
                onChange={(e) => onTrafficChange(parseInt(e.target.value) / 100)}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-slate-800"
              />
            </div>
            <div>
              <div className="flex justify-between text-[10px] mb-1">
                <span className="text-gray-500 uppercase font-bold tracking-widest text-[9px]">Monsoon Intensity</span>
                <span className={`font-black ${getRiskColor(0.5, rainLevel)}`}>{(rainLevel * 100).toFixed(0)}% Severity</span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                value={rainLevel * 100}
                onChange={(e) => onRainChange(parseInt(e.target.value) / 100)}
                className="w-full h-2 bg-blue-100 rounded-lg appearance-none cursor-pointer accent-blue-600"
              />
            </div>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-3">
            <div className="p-2 border rounded-lg bg-slate-50">
              <span className="block text-[8px] text-slate-400 font-bold uppercase">Real-Time Risk</span>
              <span className={`text-sm font-black ${getRiskColor(0.5, rainLevel)}`}>
                {rainLevel > 0.7 ? 'HIGH ALARM' : rainLevel > 0.4 ? 'MODERATE' : 'OPTIMAL'}
              </span>
            </div>
            <div className="p-2 border rounded-lg bg-slate-50">
              <span className="block text-[8px] text-slate-400 font-bold uppercase">Cons. Multiplier</span>
              <span className="text-sm font-black text-slate-800">
                {(1 + (rainLevel * 0.5) + (0.5 * 0.3)).toFixed(1)}x
              </span>
            </div>
          </div>
        </div>

        <div className="border-t pt-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Visualization
          </label>
          <div className="grid grid-cols-3 gap-2">
            <button
              onClick={() => onAlgorithmChange('both')}
              className={`px-2 py-2 rounded-md text-xs font-medium transition-colors ${activeAlgorithm === 'both'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-200 text-gray-700'
                }`}
            >
              Both
            </button>
            <button
              onClick={() => onAlgorithmChange('rl')}
              className={`px-2 py-2 rounded-md text-xs font-medium transition-colors ${activeAlgorithm === 'rl'
                ? 'bg-green-600 text-white'
                : 'bg-gray-200 text-gray-700'
                }`}
            >
              RL Only
            </button>
            <button
              onClick={() => onAlgorithmChange('dijkstra')}
              className={`px-2 py-2 rounded-md text-xs font-medium transition-colors ${activeAlgorithm === 'dijkstra'
                ? 'bg-red-600 text-white'
                : 'bg-gray-200 text-gray-700'
                }`}
            >
              Baseline
            </button>
          </div>
        </div>

        <button
          id="run-sim-btn"
          onClick={onRunSimulation}
          disabled={isTraining}
          className="w-full flex items-center justify-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-md font-medium hover:bg-blue-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
        >
          <Play className="w-5 h-5" />
          {isTraining ? 'Training...' : 'Run Simulation'}
        </button>

        {isTraining && (
          <div>
            <div className="flex justify-between mb-1">
              <span className="text-sm text-gray-600">Training Progress</span>
              <span className="text-sm font-semibold text-blue-600">{trainingProgress.toFixed(0)}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${trainingProgress}%` }}
              ></div>
            </div>
          </div>
        )}

        <div className="pt-4 border-t space-y-3">
          <button
            onClick={onUpdateEnvironment}
            disabled={isTraining}
            className="w-full flex items-center justify-center gap-2 bg-gray-600 text-white px-6 py-2 rounded-md font-medium hover:bg-gray-700 transition-colors disabled:bg-gray-400"
          >
            <RotateCcw className="w-4 h-4" />
            Update Conditions
          </button>

          <div className="grid grid-cols-2 gap-2">
            <div className="flex flex-col items-center justify-center p-3 bg-blue-50 rounded-md relative group cursor-pointer transition-all hover:bg-blue-100" onClick={onUpdateEnvironment}>
              <div className="absolute top-1 right-1">
                <span className="flex h-2 w-2 relative">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
                </span>
              </div>
              <div className="flex items-center gap-2 mb-1">
                <CloudRain className="w-5 h-5 text-blue-600" />
                <span className="text-xs font-medium text-gray-700">Weather API</span>
              </div>
              <span className="text-sm font-semibold text-blue-600 capitalize">{weatherType}</span>
              <span className="text-xs text-gray-500">{(rainLevel * 100).toFixed(0)}% (Real-time)</span>
              <div className="absolute inset-0 bg-black/5 opacity-0 group-hover:opacity-100 transition-opacity rounded-md flex items-center justify-center">
                <span className="text-xs font-bold text-blue-800 bg-white/80 px-2 py-1 rounded">SYNC</span>
              </div>
            </div>

            <div className="flex flex-col items-center justify-center p-3 bg-red-50 rounded-md">
              <div className="flex items-center gap-2 mb-1">
                <Zap className="w-5 h-5 text-red-600" />
                <span className="text-xs font-medium text-gray-700">Incidents</span>
              </div>
              <span className="text-sm font-semibold text-red-600">{incidentCount} Active</span>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-6 p-4 bg-gray-50 rounded-md">
        <h3 className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
          <Zap className="w-4 h-4" />
          Legend
        </h3>
        <div className="space-y-2 text-xs">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-green-500 rounded-full"></div>
            <span className="text-gray-600">GreenPath RL - Fuel Optimized</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-red-500 rounded-full"></div>
            <span className="text-gray-600">Dijkstra Baseline - Static Route</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
            <span className="text-gray-600">Flood Zone - Blocked</span>
          </div>
        </div>
      </div>
    </div >
  );
}
