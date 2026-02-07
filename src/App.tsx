import { useState, useEffect, useCallback } from 'react';
import { CityMap } from './components/CityMap';
import { MetricsPanel } from './components/MetricsPanel';
import { ControlPanel } from './components/ControlPanel';
import { SimulationController } from './simulation/controller';
import { RouteResult, DeliveryConstraint, VehicleConstraints, FleetVehicle, PriorityLevel } from './types/simulation';
import { Navigation } from 'lucide-react';
import { TelematicsPanel } from './components/TelematicsPanel';
import { TrainingChart } from './components/TrainingChart';
import { VoiceAssistant } from './components/VoiceAssistant';
import { AuthProvider, useAuth } from './context/AuthContext';
import { LoginScreen } from './components/LoginScreen';
import { RealMap } from './components/RealMap';
import L from 'leaflet';

const controller = new SimulationController();

function Dashboard() {
  const { user, logout } = useAuth();

  if (!user) return <LoginScreen />;

  const [, setUpdateTrigger] = useState(0);
  const [rlRoute, setRlRoute] = useState<RouteResult | undefined>();
  const [dijkstraRoute, setDijkstraRoute] = useState<RouteResult | undefined>();
  const [activeAlgorithm, setActiveAlgorithm] = useState<'both' | 'rl' | 'dijkstra'>('both');
  const [animationProgress, setAnimationProgress] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const [currentVehicle, setCurrentVehicle] = useState<VehicleConstraints | null>(null);
  const [fleet, setFleet] = useState<FleetVehicle[]>(controller.getFleet());
  const [currentConstraints, setCurrentConstraints] = useState<DeliveryConstraint | null>(null);
  const [isRealMapMode, setIsRealMapMode] = useState(false);
  const [selectedBounds, setSelectedBounds] = useState<L.LatLngBounds | null>(null);
  const [startNode, setStartNode] = useState('0');
  const [goalNode, setGoalNode] = useState('63');

  // Lifted Simulation Settings
  const [priority, setPriority] = useState<PriorityLevel>('standard');
  const [windowStart, setWindowStart] = useState('08:00');
  const [windowEnd, setWindowEnd] = useState('17:00');
  const [weight, setWeight] = useState('50');
  const [vehicleType, setVehicleType] = useState<'ev' | 'petrol' | 'hybrid'>('ev');

  useEffect(() => {
    const unsubscribe = controller.subscribe(() => {
      setUpdateTrigger(prev => prev + 1);
      setFleet([...controller.getFleet()]); // Update fleet state
    });

    controller.startEnvironmentUpdates();

    return () => {
      unsubscribe();
      controller.stopEnvironmentUpdates();
    };
  }, []);

  const executeSimulation = useCallback(async (
    start: number,
    goal: number,
    currentPriority: PriorityLevel,
    wStart: string,
    wEnd: string,
    payloadWeight: string,
    vType: 'ev' | 'petrol' | 'hybrid'
  ) => {
    // Parse time strings
    const [startH, startM] = wStart.split(':').map(Number);
    const [endH, endM] = wEnd.split(':').map(Number);
    const startMins = startH * 60 + startM;
    const endMins = endH * 60 + endM;

    const constraints: DeliveryConstraint = {
      priority: currentPriority,
      windowStart: startMins,
      windowEnd: endMins,
      weight: parseInt(payloadWeight)
    };

    const vehicle: VehicleConstraints = {
      type: vType,
      maxRange: vType === 'ev' ? 200 : 500,
      currentRange: vType === 'ev' ? 150 : 400,
      capacity: 1000,
      maxDriveTime: 480
    };

    setCurrentConstraints(constraints);
    setCurrentVehicle(vehicle);
    setRlRoute(undefined);
    setDijkstraRoute(undefined);
    setAnimationProgress(0);
    setIsAnimating(false);

    await controller.trainAgent(start, goal, constraints, vehicle, 200);
    const results = await controller.runComparison(start, goal, constraints, vehicle);

    setRlRoute(results.rl);
    setDijkstraRoute(results.dijkstra);
    setIsAnimating(true);
    setAnimationProgress(0);

    let progress = 0;
    const animationInterval = setInterval(() => {
      progress += 0.01;
      if (progress >= 1) {
        progress = 1;
        clearInterval(animationInterval);
        setIsAnimating(false);
      }
      setAnimationProgress(progress);
    }, 50);
  }, []);

  const handleRunSimulation = useCallback(() => {
    executeSimulation(
      parseInt(startNode),
      parseInt(goalNode),
      priority,
      windowStart,
      windowEnd,
      weight,
      vehicleType
    );
  }, [executeSimulation, startNode, goalNode, priority, windowStart, windowEnd, weight, vehicleType]);

  const handleUpdateEnvironment = useCallback(async () => {
    await controller.syncWithRealWorld();
  }, []);

  const handleVoiceCommand = useCallback((command: string) => {
    console.log("Voice Command:", command);
    if (command.includes("storm") || command.includes("rain")) {
      controller.updateEnvironment();
    }
  }, []);

  // Helper to get current step for telematics
  const getCurrentStep = () => {
    if (!rlRoute || !rlRoute.steps) return undefined;
    const stepIndex = Math.floor(animationProgress * (rlRoute.steps.length - 1));
    return rlRoute.steps[stepIndex];
  };

  const defaultVehicle: VehicleConstraints = { type: 'ev', maxRange: 200, currentRange: 150, capacity: 1000, maxDriveTime: 480 };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* ... header ... */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <Navigation className="w-8 h-8 text-blue-600" />
            <div>
              <h1 className="text-2xl font-bold text-gray-900">GreenPath Dynamic Routing</h1>
              <p className="text-sm text-gray-600">Predictive Logistics AI with Reinforcement Learning</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <button
              onClick={() => setIsRealMapMode(!isRealMapMode)}
              className={`px-4 py-2 rounded-md text-sm font-bold transition-all flex items-center gap-2 border shadow-sm ${isRealMapMode
                ? 'bg-blue-50 text-blue-600 border-blue-200 hover:bg-blue-100'
                : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                }`}
            >
              🌍 {isRealMapMode ? 'Exit Real Map' : 'Real Map Mode'}
            </button>
            <div className="text-right hidden md:block border-l pl-4">
              <p className="text-sm font-bold text-gray-800">{user?.name}</p>
              <p className="text-xs text-blue-600 uppercase font-semibold tracking-wider">{user?.role}</p>
            </div>
            <button
              onClick={logout}
              className="bg-gray-100 hover:bg-gray-200 text-gray-600 px-4 py-2 rounded-md text-sm font-medium transition-colors"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            {/* Map Card */}
            <div className="bg-white rounded-lg shadow-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-gray-800">
                  {isRealMapMode ? 'Real-World Fleet Deployment' : 'City Network Visualization'}
                </h2>
                {isAnimating && (
                  <span className="text-sm text-blue-600 font-medium animate-pulse">
                    Route Animation in Progress...
                  </span>
                )}
              </div>
              <div className="flex justify-center transition-all">
                {isRealMapMode ? (
                  <RealMap
                    graph={controller.getState().graph}
                    rlRoute={rlRoute}
                    dijkstraRoute={dijkstraRoute}
                    activeAlgorithm={activeAlgorithm}
                    animationProgress={animationProgress}
                    fleet={fleet}
                    selectedBounds={selectedBounds}
                    onAreaSelected={setSelectedBounds}
                    startNode={parseInt(startNode)}
                    goalNode={parseInt(goalNode)}
                    onNodeSelected={(id, type) => {
                      const newId = id.toString();
                      if (type === 'start') setStartNode(newId);
                      else {
                        setGoalNode(newId);
                        // Auto-trigger simulation immediately
                        executeSimulation(
                          parseInt(startNode),
                          id,
                          priority,
                          windowStart,
                          windowEnd,
                          weight,
                          vehicleType
                        );
                      }
                    }}
                    isTraining={controller.getState().isTraining}
                    trainingProgress={controller.getState().trainingProgress}
                  />
                ) : (
                  <CityMap
                    graph={controller.getState().graph}
                    environment={controller.getState().environment}
                    rlRoute={rlRoute}
                    dijkstraRoute={dijkstraRoute}
                    activeAlgorithm={activeAlgorithm}
                    animationProgress={animationProgress}
                  />
                )}
              </div>
            </div>

            {/* Telematics Panel - Always show if fleet or vehicle active */}
            <TelematicsPanel
              vehicle={currentVehicle || defaultVehicle}
              currentStep={getCurrentStep()}
              totalDistance={rlRoute?.totalDistance}
              progress={animationProgress}
              fleet={fleet}
            />

            <MetricsPanel rlRoute={rlRoute} dijkstraRoute={dijkstraRoute} constraints={currentConstraints} />
          </div>

          <div className="space-y-6">
            {/* ... ControlPanel ... */}
            <ControlPanel
              onRunSimulation={handleRunSimulation}
              onUpdateEnvironment={handleUpdateEnvironment}
              isTraining={controller.getState().isTraining}
              trainingProgress={controller.getState().trainingProgress}
              activeAlgorithm={activeAlgorithm}
              onAlgorithmChange={setActiveAlgorithm}
              rainLevel={controller.getState().environment.getRainLevel()}
              weatherType={controller.getState().environment.getWeatherType()}
              incidentCount={controller.getState().environment.getIncidentCount()}
              onCityChange={(city) => controller.setCity(city)}
              startNode={startNode}
              goalNode={goalNode}
              onStartNodeChange={setStartNode}
              onGoalNodeChange={setGoalNode}
              priority={priority}
              onPriorityChange={setPriority}
              windowStart={windowStart}
              onWindowStartChange={setWindowStart}
              windowEnd={windowEnd}
              onWindowEndChange={setWindowEnd}
              weight={weight}
              onWeightChange={setWeight}
              vehicleType={vehicleType}
              onVehicleTypeChange={setVehicleType}
            />
            {/* ... other components ... */}
            <VoiceAssistant onCommand={handleVoiceCommand} />
            <TrainingChart history={controller.getState().trainingHistory || []} />
            {/* ... about ... */}
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h3 className="text-lg font-bold text-gray-800 mb-3">About This System</h3>
              <div className="text-sm text-gray-600 space-y-2">
                <p>
                  GreenPath uses Q-Learning reinforcement learning to optimize delivery routes by balancing:
                </p>
                <ul className="list-disc list-inside space-y-1 ml-2">
                  <li>Fuel efficiency (elevation, traffic)</li>
                  <li>Delivery time constraints</li>
                  <li>Real-time weather conditions</li>
                  <li>Priority-based routing</li>
                </ul>
                <p className="pt-2">
                  The system adapts dynamically to changing conditions, outperforming static shortest-path algorithms in chaotic urban environments.
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>
      {/* ... footer ... */}
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <Dashboard />
    </AuthProvider>
  );
}
