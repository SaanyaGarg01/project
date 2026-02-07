import { RouteResult } from '../types/simulation';
import { TrendingDown, Clock, Gauge, Leaf } from 'lucide-react';

interface MetricsPanelProps {
  rlRoute?: RouteResult;
  dijkstraRoute?: RouteResult;
}

export function MetricsPanel({ rlRoute, dijkstraRoute }: MetricsPanelProps) {
  if (!rlRoute || !dijkstraRoute) {
    return (
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h2 className="text-xl font-bold text-gray-800 mb-4">Performance Metrics</h2>
        <p className="text-gray-500">Run a simulation to see metrics</p>
      </div>
    );
  }

  const fuelSaved = ((dijkstraRoute.totalFuel - rlRoute.totalFuel) / dijkstraRoute.totalFuel) * 100;
  const timeDiff = ((rlRoute.totalTime - dijkstraRoute.totalTime) / dijkstraRoute.totalTime) * 100;
  const co2Saved = dijkstraRoute.co2Emissions - rlRoute.co2Emissions;

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <h2 className="text-xl font-bold text-gray-800 mb-6">Performance Metrics</h2>

      <div className="grid grid-cols-2 gap-6 mb-6">
        <div>
          <h3 className="text-sm font-semibold text-green-600 mb-3 flex items-center gap-2">
            <div className="w-3 h-3 bg-green-500 rounded-full"></div>
            GreenPath RL
          </h3>
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Gauge className="w-4 h-4 text-gray-500" />
              <span className="text-sm text-gray-600">Fuel: {rlRoute.totalFuel.toFixed(2)} L</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-gray-500" />
              <span className="text-sm text-gray-600">Time: {rlRoute.totalTime.toFixed(2)} min</span>
            </div>
            <div className="flex items-center gap-2">
              <TrendingDown className="w-4 h-4 text-gray-500" />
              <span className="text-sm text-gray-600">Distance: {rlRoute.totalDistance.toFixed(2)} km</span>
            </div>
            <div className="flex items-center gap-2">
              <Leaf className="w-4 h-4 text-gray-500" />
              <span className="text-sm text-gray-600">CO₂: {rlRoute.co2Emissions.toFixed(2)} kg</span>
            </div>
          </div>
        </div>

        <div>
          <h3 className="text-sm font-semibold text-red-600 mb-3 flex items-center gap-2">
            <div className="w-3 h-3 bg-red-500 rounded-full"></div>
            Dijkstra Baseline
          </h3>
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Gauge className="w-4 h-4 text-gray-500" />
              <span className="text-sm text-gray-600">Fuel: {dijkstraRoute.totalFuel.toFixed(2)} L</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-gray-500" />
              <span className="text-sm text-gray-600">Time: {dijkstraRoute.totalTime.toFixed(2)} min</span>
            </div>
            <div className="flex items-center gap-2">
              <TrendingDown className="w-4 h-4 text-gray-500" />
              <span className="text-sm text-gray-600">Distance: {dijkstraRoute.totalDistance.toFixed(2)} km</span>
            </div>
            <div className="flex items-center gap-2">
              <Leaf className="w-4 h-4 text-gray-500" />
              <span className="text-sm text-gray-600">CO₂: {dijkstraRoute.co2Emissions.toFixed(2)} kg</span>
            </div>
          </div>
        </div>
      </div>

      <div className="border-t pt-6">
        <h3 className="text-sm font-semibold text-gray-700 mb-4">Improvement vs Baseline</h3>
        <div className="space-y-3">
          <div>
            <div className="flex justify-between mb-1">
              <span className="text-sm text-gray-600">Fuel Efficiency</span>
              <span className={`text-sm font-semibold ${fuelSaved > 0 ? 'text-green-600' : 'text-red-600'}`}>
                {fuelSaved > 0 ? '+' : ''}{fuelSaved.toFixed(1)}%
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className={`h-2 rounded-full ${fuelSaved > 0 ? 'bg-green-500' : 'bg-red-500'}`}
                style={{ width: `${Math.min(Math.abs(fuelSaved), 100)}%` }}
              ></div>
            </div>
          </div>

          <div>
            <div className="flex justify-between mb-1">
              <span className="text-sm text-gray-600">Time Difference</span>
              <span className={`text-sm font-semibold ${timeDiff < 0 ? 'text-green-600' : 'text-red-600'}`}>
                {timeDiff > 0 ? '+' : ''}{timeDiff.toFixed(1)}%
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className={`h-2 rounded-full ${timeDiff < 0 ? 'bg-green-500' : 'bg-red-500'}`}
                style={{ width: `${Math.min(Math.abs(timeDiff), 100)}%` }}
              ></div>
            </div>
          </div>

          <div className="pt-3 border-t">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">CO₂ Reduction</span>
              <span className={`text-lg font-bold ${co2Saved > 0 ? 'text-green-600' : 'text-red-600'}`}>
                {co2Saved > 0 ? '-' : '+'}{Math.abs(co2Saved).toFixed(2)} kg
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
