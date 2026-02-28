import { useState, useCallback } from 'react';
import { RouteResult, VehicleConstraints } from './types/simulation';
import { SimulationController } from './simulation/controller';
import { CityMap } from './components/CityMap';
import { MetricsPanel } from './components/MetricsPanel';
import { ControlPanel } from './components/ControlPanel';
import { Navigation } from 'lucide-react';
import { TelematicsPanel } from './components/TelematicsPanel';
import { TrainingChart } from './components/TrainingChart';
import { VoiceAssistant } from './components/VoiceAssistant';
import { AuthProvider, useAuth } from './context/AuthContext';
import { LoginScreen } from './components/LoginScreen';
import { RealMap } from './components/RealMap';
import { ErrorBoundary } from './components/ErrorBoundary';
import { SimulationHistory } from './components/SimulationHistory';
import { useSimulation } from './hooks/useSimulation';
import { useEnvironment } from './hooks/useEnvironment';

const controller = new SimulationController();

function Dashboard() {
  const { user, logout } = useAuth();

  const {
    rlRoute,
    dijkstraRoute,
    animationProgress,
    isAnimating,
    currentVehicle,
    currentConstraints,
    priority,
    windowStart,
    windowEnd,
    weight,
    vehicleType,
    startNode,
    goalNode,
    setPriority,
    setWindowStart,
    setWindowEnd,
    setWeight,
    setVehicleType,
    setStartNode,
    setGoalNode,
    handleRunSimulation,
    executeSimulation,
    getCurrentStep
  } = useSimulation(controller);

  const {
    fleet,
    isRealMapMode,
    selectedBounds,
    setIsRealMapMode,
    setSelectedBounds,
    handleUpdateEnvironment,
    handleTrafficChange,
    handleRainChange
  } = useEnvironment(controller);

  const [activeAlgorithm, setActiveAlgorithm] = useState<'both' | 'rl' | 'dijkstra'>('both');

  const handleVoiceCommand = useCallback((command: string) => {
    console.log("Voice Command:", command);
    if (command.includes("storm") || command.includes("rain")) {
      controller.updateEnvironment();
    }
  }, []);





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
                      if (type === 'start') {
                        setStartNode(newId);
                      } else {
                        setGoalNode(newId);
                        // Auto-trigger only if we have a valid start node that isn't the same as goal
                        if (startNode !== newId) {
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
              vehicle={currentVehicle || { type: 'ev', maxRange: 200, currentRange: 150, capacity: 1000, maxDriveTime: 480 }}
              currentStep={getCurrentStep()}
              totalDistance={rlRoute?.totalDistance}
              progress={animationProgress}
              fleet={fleet}
            />

            <MetricsPanel
              rlRoute={rlRoute}
              dijkstraRoute={dijkstraRoute}
              constraints={currentConstraints}
              rainLevel={controller.getState().environment.getRainLevel()}
              trafficLevel={0.5}
            />

            <SimulationHistory />
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
              onTrafficChange={handleTrafficChange}
              onRainChange={handleRainChange}
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
    <ErrorBoundary>
      <AuthProvider>
        <Dashboard />
      </AuthProvider>
    </ErrorBoundary>
  );
}
