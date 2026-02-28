import { initializeApp } from 'firebase/app';
import { getFirestore, collection, addDoc, getDocs, query, orderBy, limit, Timestamp } from 'firebase/firestore';

const firebaseConfig = {
    apiKey: "AIzaSyDc8JwNqZFw2z34EBS-gkfBM0m8zmFn4wk",
    authDomain: "greenpath-1f3b9.firebaseapp.com",
    projectId: "greenpath-1f3b9",
    storageBucket: "greenpath-1f3b9.firebasestorage.app",
    messagingSenderId: "760222503831",
    appId: "1:760222503831:web:9adefc0d6dd19f8bd32ad2",
    measurementId: "G-8DQYL9681D"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);

// Collection references
export const simulationRunsRef = collection(db, 'simulation_runs');
export const cityNodesRef = collection(db, 'city_nodes');
export const roadEdgesRef = collection(db, 'road_edges');

// Firestore types
export interface SimulationRunDoc {
    algorithm: string;
    start_node: number;
    end_node: number;
    priority: string;
    total_fuel: number;
    total_time: number;
    total_distance: number;
    co2_emissions: number;
    route_path: number[];
    traffic_conditions: Record<string, unknown>;
    weather_conditions: Record<string, unknown>;
    created_at: Timestamp;
}

// Re-export utilities for use in other files
export { addDoc, getDocs, query, orderBy, limit, Timestamp };
