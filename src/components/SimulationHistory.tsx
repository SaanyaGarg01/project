import { useState, useEffect } from 'react';
import { simulationRunsRef, getDocs, query, orderBy, limit as firestoreLimit } from '../lib/firebase';
import { Clock, Gauge, Leaf, ChevronDown, ChevronUp, Database } from 'lucide-react';

interface SimulationRecord {
    id: string;
    algorithm: string;
    start_node: number;
    end_node: number;
    priority: string;
    total_fuel: number;
    total_time: number;
    total_distance: number;
    co2_emissions: number;
    created_at: string;
}

export function SimulationHistory() {
    const [runs, setRuns] = useState<SimulationRecord[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [expanded, setExpanded] = useState(false);

    useEffect(() => {
        fetchHistory();
    }, []);

    async function fetchHistory() {
        try {
            setLoading(true);
            setError(null);

            const q = query(simulationRunsRef, orderBy('created_at', 'desc'), firestoreLimit(20));
            const snapshot = await getDocs(q);

            const data: SimulationRecord[] = snapshot.docs.map(doc => {
                const d = doc.data();
                return {
                    id: doc.id,
                    algorithm: d.algorithm,
                    start_node: d.start_node,
                    end_node: d.end_node,
                    priority: d.priority || 'normal',
                    total_fuel: d.total_fuel,
                    total_time: d.total_time,
                    total_distance: d.total_distance,
                    co2_emissions: d.co2_emissions,
                    created_at: d.created_at?.toDate?.()?.toISOString?.() || '',
                };
            });

            setRuns(data);
        } catch (e: any) {
            setError(e.message || 'Failed to load history');
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
            <button
                onClick={() => setExpanded(!expanded)}
                className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
            >
                <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                    <Database className="w-5 h-5 text-indigo-600" />
                    Simulation History
                </h3>
                <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-400 font-mono">{runs.length} runs</span>
                    {expanded ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
                </div>
            </button>

            {expanded && (
                <div className="px-6 pb-4">
                    {loading ? (
                        <div className="text-center py-6 text-gray-400 text-sm">Loading history...</div>
                    ) : error ? (
                        <div className="text-center py-6">
                            <p className="text-red-500 text-sm mb-2">{error}</p>
                            <button onClick={fetchHistory} className="text-xs text-blue-600 hover:underline">
                                Retry
                            </button>
                        </div>
                    ) : runs.length === 0 ? (
                        <div className="text-center py-6 text-gray-400 text-sm">
                            No simulation runs yet. Run a simulation to see results here.
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-xs">
                                <thead>
                                    <tr className="border-b text-gray-500 uppercase tracking-wider">
                                        <th className="py-2 text-left font-semibold">Algorithm</th>
                                        <th className="py-2 text-left font-semibold">Route</th>
                                        <th className="py-2 text-left font-semibold">Priority</th>
                                        <th className="py-2 text-right font-semibold">
                                            <span className="inline-flex items-center gap-1"><Gauge className="w-3 h-3" /> Fuel</span>
                                        </th>
                                        <th className="py-2 text-right font-semibold">
                                            <span className="inline-flex items-center gap-1"><Clock className="w-3 h-3" /> Time</span>
                                        </th>
                                        <th className="py-2 text-right font-semibold">
                                            <span className="inline-flex items-center gap-1"><Leaf className="w-3 h-3" /> CO₂</span>
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {runs.map((run) => (
                                        <tr key={run.id} className="hover:bg-gray-50 transition-colors">
                                            <td className="py-2">
                                                <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${run.algorithm === 'rl'
                                                        ? 'bg-green-100 text-green-700'
                                                        : 'bg-red-100 text-red-700'
                                                    }`}>
                                                    {run.algorithm === 'rl' ? 'AI' : 'Baseline'}
                                                </span>
                                            </td>
                                            <td className="py-2 text-gray-600 font-mono">
                                                N{run.start_node} → N{run.end_node}
                                            </td>
                                            <td className="py-2">
                                                <span className="capitalize text-gray-600">{run.priority}</span>
                                            </td>
                                            <td className="py-2 text-right font-mono text-gray-700">
                                                {Math.abs(run.total_fuel).toFixed(3)} L
                                            </td>
                                            <td className="py-2 text-right font-mono text-gray-700">
                                                {Math.abs(run.total_time).toFixed(1)} min
                                            </td>
                                            <td className="py-2 text-right font-mono text-gray-700">
                                                {Math.abs(run.co2_emissions).toFixed(3)} kg
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
