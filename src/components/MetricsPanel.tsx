import { RouteResult, DeliveryConstraint } from '../types/simulation';
import { Clock, Gauge, Leaf, Award, AlertTriangle } from 'lucide-react';

interface MetricsPanelProps {
  rlRoute?: RouteResult;
  dijkstraRoute?: RouteResult;
  constraints?: DeliveryConstraint | null;
}

export function MetricsPanel({ rlRoute, dijkstraRoute, constraints }: MetricsPanelProps) {
  if (!rlRoute || !dijkstraRoute) {
    return (
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h2 className="text-xl font-bold text-gray-800 mb-4">Performance Metrics</h2>
        <p className="text-gray-500">Run a simulation to see metrics</p>
      </div>
    );
  }

  // Calculate percentage differences relative to Dijkstra (Baseline)
  // Positive means RL is lower (Better) for consumption/time
  const fuelImprovement = ((dijkstraRoute.totalFuel - rlRoute.totalFuel) / dijkstraRoute.totalFuel) * 100;
  const timeImprovement = ((dijkstraRoute.totalTime - rlRoute.totalTime) / dijkstraRoute.totalTime) * 100;
  const co2Reduction = dijkstraRoute.co2Emissions - rlRoute.co2Emissions;

  // Determine Winner
  let winner: 'rl' | 'dijkstra' = 'dijkstra';
  const priority = constraints?.priority || 'standard';

  if (priority === 'critical' || priority === 'high') {
    if (rlRoute.totalTime < dijkstraRoute.totalTime) winner = 'rl';
  } else if (priority === 'low') {
    if (rlRoute.totalFuel < dijkstraRoute.totalFuel) winner = 'rl';
  } else {
    // Standard: Balance
    const scoreRL = rlRoute.totalTime + rlRoute.totalFuel * 10;
    const scoreDijkstra = dijkstraRoute.totalTime + dijkstraRoute.totalFuel * 10;
    if (scoreRL < scoreDijkstra) winner = 'rl';
  }

  const isHighPriority = priority === 'critical' || priority === 'high';

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <h2 className="text-xl font-bold text-gray-800 mb-4 flex justify-between items-center">
        <span>Performance Metrics</span>
        {winner === 'rl' ? (
          <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full flex items-center gap-1 border border-green-200">
            <Award className="w-3 h-3" /> AI Optimized
          </span>
        ) : (
          <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full flex items-center gap-1 border border-gray-200">
            <Award className="w-3 h-3" /> Baseline Optimal
          </span>
        )}
      </h2>

      {/* Recommendation Banner */}
      <div className={`mb-6 p-3 rounded-lg border text-sm ${winner === 'rl' ? 'bg-green-50 border-green-200 text-green-800' : 'bg-slate-50 border-slate-200 text-slate-700'
        }`}>
        <strong className="block mb-1">Recommendation:</strong>
        {winner === 'rl' ? (
          "GreenPath AI has found a more efficient route based on your constraints."
        ) : (
          "Standard routing is currently optimal. AI training may need more episodes for this complex scenario."
        )}
      </div>

      <div className="grid grid-cols-2 gap-6 mb-6">
        <div className={`p-3 rounded-lg border ${winner === 'rl' ? 'bg-green-50/50 border-green-200 ring-1 ring-green-200' : 'border-transparent'}`}>
          <h3 className="text-sm font-semibold text-green-600 mb-3 flex items-center gap-2">
            <div className="w-3 h-3 bg-green-500 rounded-full"></div>
            GreenPath AI
          </h3>
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Gauge className="w-4 h-4 text-gray-400" />
              <span className="text-sm text-gray-600">{rlRoute.totalFuel.toFixed(2)} L</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-gray-400" />
              <span className="text-sm text-gray-600">{rlRoute.totalTime.toFixed(1)} min</span>
            </div>
            <div className="flex items-center gap-2">
              <Leaf className="w-4 h-4 text-gray-400" />
              <span className="text-sm text-gray-600">{rlRoute.co2Emissions.toFixed(2)} kg</span>
            </div>
          </div>
        </div>

        <div className={`p-3 rounded-lg border ${winner === 'dijkstra' ? 'bg-slate-50 border-slate-200 ring-1 ring-slate-200' : 'border-transparent'}`}>
          <h3 className="text-sm font-semibold text-red-600 mb-3 flex items-center gap-2">
            <div className="w-3 h-3 bg-red-500 rounded-full"></div>
            Dijkstra Baseline
          </h3>
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Gauge className="w-4 h-4 text-gray-400" />
              <span className="text-sm text-gray-600">{dijkstraRoute.totalFuel.toFixed(2)} L</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-gray-400" />
              <span className="text-sm text-gray-600">{dijkstraRoute.totalTime.toFixed(1)} min</span>
            </div>
            <div className="flex items-center gap-2">
              <Leaf className="w-4 h-4 text-gray-400" />
              <span className="text-sm text-gray-600">{dijkstraRoute.co2Emissions.toFixed(2)} kg</span>
            </div>
          </div>
        </div>
      </div>

      <div className="border-t pt-6 space-y-4">
        <h3 className="text-sm font-semibold text-gray-700">Impact Analysis vs Baseline</h3>

        {/* Fuel Efficiency */}
        <div>
          <div className="flex justify-between mb-1">
            <span className="text-sm text-gray-600">Fuel Consumption</span>
            <span className={`text-sm font-bold ${fuelImprovement >= 0 ? 'text-green-600' : 'text-red-500'}`}>
              {fuelImprovement >= 0 ? 'SAVED' : 'INCREASED'} {Math.abs(fuelImprovement).toFixed(1)}%
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
            <div
              className={`h-full ${fuelImprovement >= 0 ? 'bg-green-500' : 'bg-red-500'}`}
              style={{ width: `${Math.min(100, Math.abs(fuelImprovement))}%` }}
            ></div>
          </div>
          {fuelImprovement < 0 && isHighPriority && (
            <p className="text-[10px] text-gray-500 mt-1 flex items-center gap-1">
              <AlertTriangle className="w-3 h-3" /> Trade-off: Higher fuel usage for speed.
            </p>
          )}
        </div>

        {/* Time Savings */}
        <div>
          <div className="flex justify-between mb-1">
            <span className="text-sm text-gray-600">Time Duration</span>
            <span className={`text-sm font-bold ${timeImprovement >= 0 ? 'text-green-600' : 'text-red-500'}`}>
              {timeImprovement >= 0 ? 'FASTER' : 'SLOWER'} by {Math.abs(timeImprovement).toFixed(1)}%
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
            <div
              className={`h-full ${timeImprovement >= 0 ? 'bg-green-500' : 'bg-red-500'}`}
              style={{ width: `${Math.min(100, Math.abs(timeImprovement))}%` }}
            ></div>
          </div>
        </div>

        {/* CO2 Impact */}
        <div className="pt-3 border-t flex items-center justify-between">
          <span className="text-sm text-gray-600">Net Emissions Change</span>
          <div className={`text-right ${co2Reduction >= 0 ? 'text-green-600' : 'text-red-500'}`}>
            <div className="text-lg font-bold">
              {co2Reduction > 0 ? '-' : '+'}{Math.abs(co2Reduction).toFixed(2)} kg
            </div>
            <div className="text-[10px] uppercase font-semibold">
              {co2Reduction >= 0 ? 'Reduced' : 'Added'}
            </div>
          </div>
        </div>
      </div>

      <div className="mt-6 p-4 bg-green-50 rounded-lg border border-green-200">
        <h3 className="text-sm font-bold text-green-800 mb-3 flex items-center gap-2">
          <Leaf className="w-4 h-4" /> Business Value
        </h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <span className="text-xs text-green-600 block mb-1">ESTIMATED SAVINGS</span>
            <span className={`text-lg font-bold ${fuelImprovement >= 0 ? 'text-green-900' : 'text-red-700'}`}>
              ${(fuelImprovement >= 0 ? (fuelImprovement / 100 * dijkstraRoute.totalFuel * 1.5) : -(Math.abs(fuelImprovement) / 100 * dijkstraRoute.totalFuel * 1.5)).toFixed(2)}
            </span>
            <span className="text-xs text-green-700 ml-1">per trip</span>
          </div>
          <div>
            <span className="text-xs text-green-600 block mb-1">ECO SCORE</span>
            <div className="text-lg font-bold text-green-900">
              {Math.max(0, Math.min(100, 50 + fuelImprovement)).toFixed(0)}/100
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
