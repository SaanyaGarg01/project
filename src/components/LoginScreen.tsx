import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Shield, Truck, Settings, Cloud } from 'lucide-react';

export function LoginScreen() {
    const { login } = useAuth();
    const [selectedCity, setSelectedCity] = useState('New York');

    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-blue-900 text-white p-6">
            <div className="mb-8 text-center animate-fade-in">
                <Shield className="w-16 h-16 text-green-400 mx-auto mb-4" />
                <h1 className="text-4xl font-extrabold tracking-tight">
                    GreenPath <span className="text-green-400">Secure</span>
                </h1>
                <p className="text-slate-400 mt-2">Enterprise Logistics Management</p>
                <div className="mt-2 text-xs text-slate-500 font-mono bg-slate-800/50 px-3 py-1 rounded inline-block">
                    v2.5.0-alpha • Connected to US-East-1 Cluster
                </div>
            </div>

            <div className="bg-slate-800/80 backdrop-blur-md rounded-xl shadow-2xl p-8 w-full max-w-md border border-slate-700">
                <h2 className="text-xl font-bold mb-6 text-center border-b border-slate-700 pb-4">
                    Select Access Role
                </h2>

                <div className="space-y-4">
                    <button
                        onClick={() => login('admin')}
                        className="w-full group flex items-center justify-between p-4 rounded-lg bg-slate-700 hover:bg-green-600 transition-all duration-300"
                    >
                        <div className="flex items-center gap-3">
                            <Settings className="w-6 h-6 text-slate-300 group-hover:text-white" />
                            <div className="text-left">
                                <p className="font-bold text-slate-200 group-hover:text-white">Admin Console</p>
                                <p className="text-xs text-slate-400 group-hover:text-slate-200">Full System Control & Analytics</p>
                            </div>
                        </div>
                        <span className="text-xs bg-slate-900/50 px-2 py-1 rounded text-slate-400 group-hover:text-white">● Online</span>
                    </button>

                    <button
                        onClick={() => login('dispatcher')}
                        className="w-full group flex items-center justify-between p-4 rounded-lg bg-slate-700 hover:bg-blue-600 transition-all duration-300"
                    >
                        <div className="flex items-center gap-3">
                            <Cloud className="w-6 h-6 text-slate-300 group-hover:text-white" />
                            <div className="text-left">
                                <p className="font-bold text-slate-200 group-hover:text-white">Dispatcher Dashboard</p>
                                <p className="text-xs text-slate-400 group-hover:text-slate-200">Route Planning & Fleet Management</p>
                            </div>
                        </div>
                        <span className="text-xs bg-slate-900/50 px-2 py-1 rounded text-slate-400 group-hover:text-white">● Ready</span>
                    </button>

                    <button
                        onClick={() => login('driver')}
                        className="w-full group flex items-center justify-between p-4 rounded-lg bg-slate-700 hover:bg-orange-600 transition-all duration-300"
                    >
                        <div className="flex items-center gap-3">
                            <Truck className="w-6 h-6 text-slate-300 group-hover:text-white" />
                            <div className="text-left">
                                <p className="font-bold text-slate-200 group-hover:text-white">Driver App</p>
                                <p className="text-xs text-slate-400 group-hover:text-slate-200">Navigation & Deliveries</p>
                            </div>
                        </div>
                        <span className="text-xs bg-slate-900/50 px-2 py-1 rounded text-slate-400 group-hover:text-white">● Idle</span>
                    </button>
                </div>

                <div className="mt-8 pt-4 border-t border-slate-700 text-center text-xs text-slate-500">
                    <p>Protected by GreenShield™ Security</p>
                    <p>AES-256 Encrypted Traffic</p>
                </div>
            </div>
        </div>
    );
}
