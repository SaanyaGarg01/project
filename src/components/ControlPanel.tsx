import { useState } from 'react';
import { Play, RotateCcw, Zap, CloudRain, Clock, Truck, Battery } from 'lucide-react';
import { DeliveryConstraint, VehicleConstraints, PriorityLevel } from '../types/simulation';

interface ControlPanelProps {
  onRunSimulation: (
    start: number,
    goal: number,
    constraints: DeliveryConstraint,
    vehicle: VehicleConstraints
  ) => void;
  onUpdateEnvironment: () => void;
  isTraining: boolean;
  trainingProgress: number;
  activeAlgorithm: 'both' | 'rl' | 'dijkstra';
  onAlgorithmChange: (algorithm: 'both' | 'rl' | 'dijkstra') => void;
  rainLevel: number;
  weatherType: string;
  incidentCount: number;
  onTrafficChange: (val: number) => void;
  onRainChange: (val: number) => void;
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
  onTrafficChange,
  onRainChange
}: ControlPanelProps) {
  const [startNode, setStartNode] = useState('0');
  const [goalNode, setGoalNode] = useState('63');
  const [priority, setPriority] = useState<PriorityLevel>('standard');
  const [windowStart, setWindowStart] = useState('08:00');
  const [windowEnd, setWindowEnd] = useState('17:00');
  const [weight, setWeight] = useState('50');
  const [vehicleType, setVehicleType] = useState<'ev' | 'petrol' | 'hybrid'>('ev');

  const handleRun = () => {
    const start = parseInt(startNode);
    const goal = parseInt(goalNode);

    // Parse time strings to minutes from midnight
    const [startH, startM] = windowStart.split(':').map(Number);
    const [endH, endM] = windowEnd.split(':').map(Number);
    const startMins = startH * 60 + startM;
    const endMins = endH * 60 + endM;

    const constraints: DeliveryConstraint = {
      priority,
      windowStart: startMins,
      windowEnd: endMins,
      weight: parseInt(weight)
    };

    const vehicle: VehicleConstraints = {
      type: vehicleType,
      maxRange: vehicleType === 'ev' ? 200 : 500, // Simple defaults
      currentRange: vehicleType === 'ev' ? 150 : 400,
      capacity: 1000,
      maxDriveTime: 480 // 8 hours
    };

    if (!isNaN(start) && !isNaN(goal) && start >= 0 && goal <= 63) {
      onRunSimulation(start, goal, constraints, vehicle);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6 max-h-[80vh] overflow-y-auto">
      <h2 className="text-xl font-bold text-gray-800 mb-6">Simulation Controls</h2>

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
              onChange={(e) => setStartNode(e.target.value)}
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
              onChange={(e) => setGoalNode(e.target.value)}
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
              onChange={(e) => setPriority(e.target.value as PriorityLevel)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
              disabled={isTraining}
            >
              <option value="standard">Standard</option>
              <option value="high">High Priority</option>
              <option value="critical">Critical (Ambulance)</option>
              <option value="low">Low (Eco)</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Vehicle
            </label>
            <select
              value={vehicleType}
              onChange={(e) => setVehicleType(e.target.value as any)}
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
              <input type="time" value={windowStart} onChange={e => setWindowStart(e.target.value)} className="w-full border rounded p-1 text-sm" />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Window End</label>
              <input type="time" value={windowEnd} onChange={e => setWindowEnd(e.target.value)} className="w-full border rounded p-1 text-sm" />
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
              onChange={e => setWeight(e.target.value)}
              className="flex-1"
            />
            <span className="text-sm text-gray-600 w-16 text-right">{weight} kg</span>
          </div>
        </div>


        <div className="border-t pt-4">
          <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
            <Zap className="w-4 h-4 text-purple-600" /> Interactive Playground
          </h3>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-gray-600">Base Traffic Congestion</span>
                <span className="font-semibold">{Math.round(0.5 * 100)}% (drag to change)</span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                defaultValue="50"
                onChange={(e) => onTrafficChange(parseInt(e.target.value) / 100)}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
              />
            </div>
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-gray-600">Rain Intensity</span>
                <span className="font-semibold">{Math.round(rainLevel * 100)}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                defaultValue={rainLevel * 100}
                onChange={(e) => onRainChange(parseInt(e.target.value) / 100)}
                className="w-full h-2 bg-blue-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
              />
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
          onClick={handleRun}
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
    </div>
  );
}
