import { RouteResult, DeliveryConstraint } from '../types/simulation';
import { Clock, Gauge, Leaf, Award, AlertTriangle, Zap } from 'lucide-react';

interface MetricsPanelProps {
  rlRoute?: RouteResult;
  dijkstraRoute?: RouteResult;
  constraints?: DeliveryConstraint | null;
  rainLevel: number;
  trafficLevel: number;
}

export function MetricsPanel({ rlRoute, dijkstraRoute, constraints, rainLevel, trafficLevel }: MetricsPanelProps) {
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
              <span className="text-sm text-gray-600">{Math.abs(rlRoute.totalFuel).toFixed(2)} L</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-gray-400" />
              <span className="text-sm text-gray-600">{Math.abs(rlRoute.totalTime).toFixed(1)} min</span>
            </div>
            <div className="flex items-center gap-2">
              <Leaf className="w-4 h-4 text-gray-400" />
              <span className="text-sm text-gray-600">{Math.abs(rlRoute.co2Emissions).toFixed(2)} kg</span>
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
              <span className="text-sm text-gray-600">{Math.abs(dijkstraRoute.totalFuel).toFixed(2)} L</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-gray-400" />
              <span className="text-sm text-gray-600">{Math.abs(dijkstraRoute.totalTime).toFixed(1)} min</span>
            </div>
            <div className="flex items-center gap-2">
              <Leaf className="w-4 h-4 text-gray-400" />
              <span className="text-sm text-gray-600">{Math.abs(dijkstraRoute.co2Emissions).toFixed(2)} kg</span>
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
              {Math.abs(co2Reduction).toFixed(2)} kg
            </div>
            <div className="text-[10px] uppercase font-semibold">
              {co2Reduction >= 0 ? 'Total Saved' : 'Total Added'}
            </div>
          </div>
        </div>
      </div>

      {/* Predictive Analytics Section */}
      <div className="mt-6 border-t pt-6">
        <h3 className="text-sm font-bold text-slate-800 mb-4 flex items-center gap-2">
          <Zap className="w-4 h-4 text-amber-500" /> Predictive Intelligence Forecast
        </h3>

        <div className="grid grid-cols-2 gap-4">
          <div className={`p-3 rounded-xl border ${rainLevel > 0.6 || trafficLevel > 0.7 ? 'bg-red-50 border-red-100' : 'bg-slate-50 border-slate-100'}`}>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Risk Profile</span>
            <div className="flex items-center gap-2">
              <span className={`text-sm font-black ${rainLevel > 0.6 || trafficLevel > 0.7 ? 'text-red-600' : 'text-slate-700'}`}>
                {rainLevel > 0.8 ? 'CRITICAL (FLOOD)' : rainLevel > 0.4 || trafficLevel > 0.6 ? 'ELEVATED RISK' : 'STABLE URBAN'}
              </span>
            </div>
            <p className="text-[9px] text-slate-500 mt-1">
              {rainLevel > 0.5 ? 'Active monsoon impacting brake distance.' : 'Current conditions allow optimal speed.'}
            </p>
          </div>

          <div className="p-3 rounded-xl border bg-slate-50 border-slate-100">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Consumption Forecast</span>
            <div className="flex items-center gap-2">
              <span className="text-sm font-black text-slate-700">
                +{((rainLevel * 0.4) + (trafficLevel * 0.3) * 100).toFixed(0)}% Var.
              </span>
              <div className="h-1.5 w-12 bg-slate-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-slate-800"
                  style={{ width: `${Math.min(100, (rainLevel * 40) + (trafficLevel * 30))}%` }}
                />
              </div>
            </div>
            <p className="text-[9px] text-slate-500 mt-1">Reflecting real-time playground shifts.</p>
          </div>
        </div>
      </div>

      <div className="mt-6 p-4 bg-green-900 rounded-xl shadow-inner shadow-green-950/20">
        <h3 className="text-sm font-bold text-green-50 mb-3 flex items-center gap-2">
          <Leaf className="w-4 h-4 text-green-400" /> Executive Business Value
        </h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <span className="text-[10px] text-green-300 font-bold uppercase tracking-wider block mb-1">Total Trip Impact</span>
            <span className={`text-lg font-black ${fuelImprovement >= 0 ? 'text-white' : 'text-red-300'}`}>
              ₹{Math.abs(fuelImprovement / 100 * dijkstraRoute.totalFuel * 105).toFixed(2)}
            </span>
            <span className="text-[9px] text-green-400 ml-1 block">
              {fuelImprovement >= 0 ? 'Cost Avoidance' : 'Efficiency Loss'}
            </span>
          </div>
          <div className="text-right">
            <span className="text-[10px] text-green-300 font-bold uppercase tracking-wider block mb-1">Fleet Eco Score</span>
            <div className="text-2xl font-black text-white">
              {Math.max(0, Math.min(100, 50 + fuelImprovement - (rainLevel * 10))).toFixed(0)}
              <span className="text-xs text-green-400">/100</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
