import { MapContainer, TileLayer, Rectangle, useMapEvents, Polyline, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { RouteResult, FleetVehicle } from '../types/simulation';
import { MapPin, Search, Target, Map as MapIcon, X, Loader2 } from 'lucide-react';
import { useState, useCallback, useRef } from 'react';

// Fix Leaflet icon issue
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
    iconUrl: icon,
    shadowUrl: iconShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41]
});

L.Marker.prototype.options.icon = DefaultIcon;

interface SearchResult {
    display_name: string;
    lat: string;
    lon: string;
}

interface RealMapProps {
    graph: any;
    rlRoute?: RouteResult;
    dijkstraRoute?: RouteResult;
    activeAlgorithm: 'both' | 'rl' | 'dijkstra';
    animationProgress: number;
    fleet?: FleetVehicle[];
    onAreaSelected: (bounds: L.LatLngBounds) => void;
    selectedBounds: L.LatLngBounds | null;
    startNode: number;
    goalNode: number;
    onNodeSelected: (nodeId: number, type: 'start' | 'goal') => void;
    isTraining?: boolean;
    trainingProgress?: number;
}

interface GeoControlsProps {
    startQuery: string;
    setStartQuery: (val: string) => void;
    goalQuery: string;
    setGoalQuery: (val: string) => void;
    onRunSimulation: () => void;
    startSuggestions: SearchResult[];
    setStartSuggestions: (results: SearchResult[]) => void;
    goalSuggestions: SearchResult[];
    setGoalSuggestions: (results: SearchResult[]) => void;
    searchLocation: (query: string, setResults: (results: SearchResult[]) => void) => void;
    handleSelectLocation: (result: SearchResult, type: 'start' | 'goal', map: L.Map) => void;
    selectionMode: 'none' | 'start' | 'goal';
    setSelectionMode: (mode: 'none' | 'start' | 'goal') => void;
    selectedBounds: L.LatLngBounds | null;
}

// DEFINED OUTSIDE TO PREVENT RE-MOUNTING ON STATE CHANGE (FIXES FOCUS LOSS)
function GeoControls({
    startQuery, setStartQuery,
    goalQuery, setGoalQuery,
    onRunSimulation,
    startSuggestions, setStartSuggestions,
    goalSuggestions, setGoalSuggestions,
    searchLocation, handleSelectLocation,
    selectionMode, setSelectionMode,
    selectedBounds
}: GeoControlsProps) {
    const map = useMap();

    return (
        <div className="absolute top-4 left-4 z-[1000] flex flex-col gap-3 w-80 pointer-events-none">
            <div className="bg-white/95 backdrop-blur-md rounded-xl shadow-2xl p-4 border border-blue-100 pointer-events-auto transition-all hover:border-blue-300">
                <div className="flex items-center justify-between mb-4 text-blue-900 border-b border-blue-50 pb-2">
                    <div className="flex items-center gap-2">
                        <MapIcon className="w-5 h-5" />
                        <h3 className="font-bold text-sm tracking-tight">Geo-routing Control</h3>
                    </div>
                    {startQuery && goalQuery && (
                        <button
                            onClick={onRunSimulation}
                            className="bg-blue-600 text-white px-3 py-1 rounded-full text-[10px] font-black hover:bg-blue-700 animate-pulse shadow-lg"
                        >
                            RUN AI
                        </button>
                    )}
                </div>

                <div className="space-y-4">
                    <div className="relative">
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1 block">Pick Up Point</label>
                        <div className="relative flex items-center">
                            <MapPin className="absolute left-3 w-4 h-4 text-green-500" />
                            <input
                                type="text"
                                placeholder="Type city or address..."
                                className="w-full pl-9 pr-8 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-green-500 outline-none transition-all placeholder:text-slate-400"
                                value={startQuery}
                                onChange={(e) => {
                                    setStartQuery(e.target.value);
                                    searchLocation(e.target.value, setStartSuggestions);
                                }}
                            />
                            {startQuery && (
                                <button onClick={() => { setStartQuery(''); setStartSuggestions([]); }} className="absolute right-3 p-1 hover:bg-slate-200 rounded-full transition-colors">
                                    <X className="w-3 h-3 text-slate-500" />
                                </button>
                            )}
                        </div>
                        {startSuggestions.length > 0 && (
                            <div className="absolute w-full mt-1 bg-white rounded-lg shadow-xl border border-slate-100 z-[1001] max-h-48 overflow-y-auto">
                                {startSuggestions.map((s, i) => (
                                    <div
                                        key={i}
                                        className="px-3 py-2 text-xs hover:bg-blue-50 cursor-pointer border-b border-slate-50 last:border-0"
                                        onClick={() => handleSelectLocation(s, 'start', map)}
                                    >
                                        {s.display_name}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    <div className="relative">
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1 block">Drop Off Goal</label>
                        <div className="relative flex items-center">
                            <Target className="absolute left-3 w-4 h-4 text-red-500" />
                            <input
                                type="text"
                                placeholder="Destination location..."
                                className="w-full pl-9 pr-8 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-red-500 outline-none transition-all placeholder:text-slate-400"
                                value={goalQuery}
                                onChange={(e) => {
                                    setGoalQuery(e.target.value);
                                    searchLocation(e.target.value, setGoalSuggestions);
                                }}
                            />
                            {goalQuery && (
                                <button onClick={() => { setGoalQuery(''); setGoalSuggestions([]); }} className="absolute right-3 p-1 hover:bg-slate-200 rounded-full transition-colors">
                                    <X className="w-3 h-3 text-slate-500" />
                                </button>
                            )}
                        </div>
                        {goalSuggestions.length > 0 && (
                            <div className="absolute w-full mt-1 bg-white rounded-lg shadow-xl border border-slate-100 z-[1001] max-h-48 overflow-y-auto">
                                {goalSuggestions.map((s, i) => (
                                    <div
                                        key={i}
                                        className="px-3 py-2 text-xs hover:bg-red-50 cursor-pointer border-b border-slate-50 last:border-0"
                                        onClick={() => handleSelectLocation(s, 'goal', map)}
                                    >
                                        {s.display_name}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {selectedBounds && (
                <div className="flex gap-2 pointer-events-auto">
                    <button
                        onClick={() => setSelectionMode('start')}
                        className={`flex-1 py-3 px-4 rounded-xl shadow-lg text-xs font-bold flex items-center justify-center gap-2 transition-all ${selectionMode === 'start' ? 'bg-green-600 text-white ring-4 ring-green-100' : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'}`}
                    >
                        <MapPin className="w-4 h-4" />
                        PICK MAP START
                    </button>
                    <button
                        onClick={() => setSelectionMode('goal')}
                        className={`flex-1 py-3 px-4 rounded-xl shadow-lg text-xs font-bold flex items-center justify-center gap-2 transition-all ${selectionMode === 'goal' ? 'bg-red-600 text-white ring-4 ring-red-100' : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'}`}
                    >
                        <Target className="w-4 h-4" />
                        PICK MAP GOAL
                    </button>
                </div>
            )}
        </div>
    );
}

// DEFINING OUTSIDE COMPONENT TO PREVENT RE-MOUNTING ON STATE CHANGE
function RouteLayer({
    activeAlgorithm,
    rlRoute,
    dijkstraRoute,
    getRoutePoints
}: {
    activeAlgorithm: string;
    rlRoute?: RouteResult;
    dijkstraRoute?: RouteResult;
    getRoutePoints: (route: RouteResult, full?: boolean) => [number, number][]
}) {
    return (
        <>
            {/* Full Background Path (Subtle) */}
            {(activeAlgorithm === 'both' || activeAlgorithm === 'rl') && rlRoute && (
                <Polyline
                    positions={getRoutePoints(rlRoute, true)}
                    pathOptions={{ color: '#10b981', weight: 4, opacity: 0.2 }}
                />
            )}

            {/* Animated RL Path (Heavy) */}
            {(activeAlgorithm === 'both' || activeAlgorithm === 'rl') && rlRoute && (
                <Polyline
                    positions={getRoutePoints(rlRoute)}
                    pathOptions={{ color: '#059669', weight: 10, opacity: 0.9, lineJoin: 'round' }}
                    eventHandlers={{
                        click: (e) => {
                            L.popup()
                                .setLatLng(e.latlng)
                                .setContent(`
                                    <div class="p-2 font-sans" style="min-width: 140px;">
                                        <div class="flex items-center gap-2 mb-1">
                                            <div class="w-2 h-2 bg-emerald-500 rounded-full"></div>
                                            <b class="text-emerald-800">GreenPath AI</b>
                                        </div>
                                        <p class="text-[10px] text-slate-600">AI Green-Routing Metrics</p>
                                        <div class="mt-2 grid grid-cols-2 gap-2 border-t pt-2">
                                            <div>
                                                <p class="text-[9px] text-slate-400 uppercase font-extrabold">Fuel Used</p>
                                                <p class="text-xs font-bold text-slate-800">${Math.abs(rlRoute.totalFuel).toFixed(2)} L</p>
                                            </div>
                                            <div>
                                                <p class="text-[9px] text-slate-400 uppercase font-extrabold">Time Est.</p>
                                                <p class="text-xs font-bold text-slate-800">${Math.abs(rlRoute.totalTime).toFixed(1)}m</p>
                                            </div>
                                        </div>
                                    </div>
                                `)
                                .openOn(e.target._map);
                        }
                    }}
                />
            )}

            {/* Baseline Path */}
            {(activeAlgorithm === 'both' || activeAlgorithm === 'dijkstra') && dijkstraRoute && (
                <Polyline
                    positions={getRoutePoints(dijkstraRoute, true)}
                    pathOptions={{ color: '#dc2626', weight: 4, opacity: 0.6, dashArray: '12, 12' }}
                />
            )}
        </>
    );
}

export function RealMap({
    graph,
    rlRoute,
    dijkstraRoute,
    activeAlgorithm,
    animationProgress,
    fleet = [],
    onAreaSelected,
    selectedBounds,
    startNode,
    goalNode,
    onNodeSelected,
    isTraining,
    trainingProgress
}: RealMapProps) {
    const [selectionMode, setSelectionMode] = useState<'none' | 'start' | 'goal'>('none');
    const [startQuery, setStartQuery] = useState('');
    const [goalQuery, setGoalQuery] = useState('');
    const [startSuggestions, setStartSuggestions] = useState<SearchResult[]>([]);
    const [goalSuggestions, setGoalSuggestions] = useState<SearchResult[]>([]);
    const [isSearching, setIsSearching] = useState(false);

    const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    const searchLocation = useCallback(async (query: string, setResults: (results: SearchResult[]) => void) => {
        if (query.length < 3) {
            setResults([]);
            return;
        }

        if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);

        searchTimeoutRef.current = setTimeout(async () => {
            setIsSearching(true);
            try {
                // Removed country restriction and increased limit for 'any location' support
                const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=10&addressdetails=1`);
                const data = await response.json();
                setResults(data);
            } catch (error) {
                console.error("Geocoding error:", error);
            } finally {
                setIsSearching(false);
            }
        }, 800);
    }, []);

    const handleSelectLocation = useCallback((result: SearchResult, type: 'start' | 'goal', map: L.Map) => {
        const lat = parseFloat(result.lat);
        const lon = parseFloat(result.lon);
        const coords = L.latLng(lat, lon);

        if (type === 'start') {
            setStartQuery(result.display_name);
            setStartSuggestions([]);
        } else {
            setGoalQuery(result.display_name);
            setGoalSuggestions([]);
        }

        if (!selectedBounds) {
            const size = 0.05;
            const newBounds = L.latLngBounds(
                [lat - size, lon - size],
                [lat + size, lon + size]
            );
            onAreaSelected(newBounds);
            map.flyTo(coords, 13);

            // On first geocode, select Node 0 (Top-left) or Node 27 (Center) to initialize state
            onNodeSelected(type === 'start' ? 0 : 63, type);
        } else {
            const sw = selectedBounds.getSouthWest();
            const ne = selectedBounds.getNorthEast();

            // Check if coordinates are inside current bounds, if not expand
            if (!selectedBounds.contains(coords)) {
                const newBounds = selectedBounds.extend(coords).pad(0.1);
                onAreaSelected(newBounds);
                // After expansion, we need to recalculate xRel/yRel based on NEW bounds
                const nsw = newBounds.getSouthWest();
                const nne = newBounds.getNorthEast();
                const xRel = (lon - nsw.lng) / (nne.lng - nsw.lng);
                const yRel = (lat - nsw.lat) / (nne.lat - nsw.lat);
                const col = Math.max(0, Math.min(7, Math.round(xRel * 7)));
                const row = Math.max(0, Math.min(7, Math.round(yRel * 7)));
                onNodeSelected(row * 8 + col, type);
            } else {
                const xRel = (lon - sw.lng) / (ne.lng - sw.lng);
                const yRel = (lat - sw.lat) / (ne.lat - sw.lat);
                const col = Math.max(0, Math.min(7, Math.round(xRel * 7)));
                const row = Math.max(0, Math.min(7, Math.round(yRel * 7)));
                onNodeSelected(row * 8 + col, type);
            }
        }
    }, [selectedBounds, onAreaSelected, onNodeSelected]);

    const transformToMap = useCallback((x: number, y: number): [number, number] => {
        if (!selectedBounds) return [0, 0];
        const sw = selectedBounds.getSouthWest();
        const ne = selectedBounds.getNorthEast();
        const lat = sw.lat + (y / 700) * (ne.lat - sw.lat);
        const lng = sw.lng + (x / 700) * (ne.lng - sw.lng);
        return [lat, lng];
    }, [selectedBounds]);

    const MapEvents = () => {
        const map = useMap();
        useMapEvents({
            dblclick(e) {
                const center = e.latlng;
                const size = 0.05;
                const newBounds = L.latLngBounds(
                    [center.lat - size, center.lng - size],
                    [center.lat + size, center.lng + size]
                );
                onAreaSelected(newBounds);
                map.flyToBounds(newBounds);
            },
            click(e) {
                if (selectionMode !== 'none' && selectedBounds) {
                    const sw = selectedBounds.getSouthWest();
                    const ne = selectedBounds.getNorthEast();
                    const xRel = (e.latlng.lng - sw.lng) / (ne.lng - sw.lng);
                    const yRel = (e.latlng.lat - sw.lat) / (ne.lat - sw.lat);

                    if (xRel >= 0 && xRel <= 1 && yRel >= 0 && yRel <= 1) {
                        const col = Math.max(0, Math.min(7, Math.round(xRel * 7)));
                        const row = Math.max(0, Math.min(7, Math.round(yRel * 7)));
                        onNodeSelected(row * 8 + col, selectionMode as any);
                        setSelectionMode('none');
                    }
                }
            }
        });
        return null;
    };

    const getRoutePoints = useCallback((route: RouteResult, full: boolean = false) => {
        if (!route || route.path.length < 2) return [];
        const pathLength = route.path.length - 1;

        if (full) {
            return route.path.map(id => {
                const node = graph.nodes.get(id);
                return node ? transformToMap(node.x, node.y) : [0, 0] as [number, number];
            });
        }

        const currentSegment = Math.min(Math.floor(animationProgress * pathLength), pathLength - 1);
        const points: [number, number][] = [];
        for (let i = 0; i <= currentSegment; i++) {
            const node = graph.nodes.get(route.path[i]);
            if (node) points.push(transformToMap(node.x, node.y));
        }

        if (currentSegment < pathLength) {
            const from = graph.nodes.get(route.path[currentSegment]);
            const to = graph.nodes.get(route.path[currentSegment + 1]);
            if (from && to) {
                const segmentProgress = (animationProgress * pathLength) - currentSegment;
                const interX = from.x + (to.x - from.x) * segmentProgress;
                const interY = from.y + (to.y - from.y) * segmentProgress;
                points.push(transformToMap(interX, interY));
            }
        }
        return points;
    }, [graph.nodes, animationProgress, transformToMap]);

    return (
        <div className="relative w-full h-[650px] rounded-2xl overflow-hidden border-4 border-white shadow-2xl bg-slate-100 group">
            <MapContainer
                center={[20.5937, 78.9629]}
                zoom={5}
                className="w-full h-full"
                scrollWheelZoom={true}
                doubleClickZoom={false}
            >
                <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />

                <MapEvents />

                <GeoControls
                    startQuery={startQuery}
                    setStartQuery={setStartQuery}
                    goalQuery={goalQuery}
                    setGoalQuery={setGoalQuery}
                    onRunSimulation={() => {
                        // Expose simulation trigger to search panel
                        const start = graph.nodes.get(startNode);
                        const goal = graph.nodes.get(goalNode);
                        if (start && goal) document.getElementById('run-sim-btn')?.click();
                    }}
                    startSuggestions={startSuggestions}
                    setStartSuggestions={setStartSuggestions}
                    goalSuggestions={goalSuggestions}
                    setGoalSuggestions={setGoalSuggestions}
                    searchLocation={searchLocation}
                    handleSelectLocation={handleSelectLocation}
                    selectionMode={selectionMode}
                    setSelectionMode={setSelectionMode}
                    selectedBounds={selectedBounds}
                />

                {selectedBounds && (
                    <Rectangle
                        bounds={selectedBounds}
                        pathOptions={{ color: '#3b82f6', weight: 2, fillOpacity: 0.05, dashArray: '8, 8' }}
                    />
                )}

                <RouteLayer
                    activeAlgorithm={activeAlgorithm}
                    rlRoute={rlRoute}
                    dijkstraRoute={dijkstraRoute}
                    getRoutePoints={getRoutePoints}
                />

                {fleet.map(v => {
                    const node = graph.nodes.get(v.location);
                    if (!node) return null;
                    const pos = transformToMap(node.x, node.y);
                    return (
                        <Marker position={pos} key={v.id}>
                            <Popup>
                                <div className="p-2 min-w-[120px]">
                                    <div className="flex items-center gap-2 mb-2 border-b pb-1">
                                        <div className={`w-2 h-2 rounded-full ${v.status === 'en-route' ? 'bg-green-500 animate-pulse' : 'bg-slate-400'}`}></div>
                                        <span className="font-bold text-xs uppercase text-slate-700">{v.id}</span>
                                    </div>
                                    <p className="text-[10px] text-slate-500 font-mono">TYPE: {v.type.toUpperCase()}</p>
                                    <p className="text-[10px] text-slate-500 font-mono">STRESS: {v.stressIndex}/10</p>
                                </div>
                            </Popup>
                        </Marker>
                    );
                })}

                {selectedBounds && graph.nodes.get(startNode) && (
                    <Marker position={transformToMap(graph.nodes.get(startNode)!.x, graph.nodes.get(startNode)!.y)}>
                        <Popup><span className="font-bold text-green-600">START:</span> Node {startNode}</Popup>
                    </Marker>
                )}
                {selectedBounds && graph.nodes.get(goalNode) && (
                    <Marker position={transformToMap(graph.nodes.get(goalNode)!.x, graph.nodes.get(goalNode)!.y)}>
                        <Popup><span className="font-bold text-red-600">GOAL:</span> Node {goalNode}</Popup>
                    </Marker>
                )}
            </MapContainer>

            {!selectedBounds && (
                <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm z-[1100] flex items-center justify-center p-6 text-center pointer-events-none">
                    <div className="bg-white p-8 rounded-3xl shadow-2xl max-w-sm pointer-events-auto scale-in-center">
                        <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center mx-auto mb-6">
                            <Search className="w-8 h-8 text-blue-600 animate-pulse" />
                        </div>
                        <h3 className="text-2xl font-black text-slate-800 mb-3 tracking-tight">Real-World Ready</h3>
                        <p className="text-sm text-slate-500 mb-8 leading-relaxed">
                            Search for any city or street in India, or <b>double-click</b> the map to initialize your AI deployment zone.
                        </p>
                    </div>
                </div>
            )}

            {isTraining && (
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[1200] bg-white/90 backdrop-blur-md px-8 py-6 rounded-2xl shadow-2xl border-2 border-blue-500 flex flex-col items-center gap-4 text-center">
                    <Loader2 className="w-10 h-10 text-blue-600 animate-spin" />
                    <div>
                        <h4 className="font-bold text-slate-800">AI Path Discovery</h4>
                        <p className="text-xs text-slate-500 mb-2">Simulating 1,000+ urban scenarios...</p>
                        <div className="w-48 bg-slate-200 h-1.5 rounded-full overflow-hidden">
                            <div className="bg-blue-600 h-full transition-all duration-300" style={{ width: `${trainingProgress}%` }} />
                        </div>
                    </div>
                </div>
            )}

            {isSearching && (
                <div className="absolute bottom-4 right-4 z-[1000] bg-white/90 backdrop-blur-sm px-4 py-2 rounded-full shadow-lg border border-blue-50 flex items-center gap-2">
                    <Loader2 className="w-4 h-4 text-blue-600 animate-spin" />
                    <span className="text-xs font-bold text-slate-700">Geocoding Location...</span>
                </div>
            )}
        </div>
    );
}
