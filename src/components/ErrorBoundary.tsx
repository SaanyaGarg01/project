import React from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface Props {
    children: React.ReactNode;
}

interface State {
    hasError: boolean;
    error: Error | null;
}

export class ErrorBoundary extends React.Component<Props, State> {
    constructor(props: Props) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error };
    }

    componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
        console.error('GreenPath Error:', error, errorInfo);
    }

    handleReset = () => {
        this.setState({ hasError: false, error: null });
    };

    render() {
        if (this.state.hasError) {
            return (
                <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-red-900 flex items-center justify-center p-6">
                    <div className="bg-white/10 backdrop-blur-md rounded-2xl shadow-2xl p-8 max-w-md text-center border border-white/20">
                        <AlertTriangle className="w-16 h-16 text-red-400 mx-auto mb-4" />
                        <h2 className="text-2xl font-bold text-white mb-2">Something went wrong</h2>
                        <p className="text-slate-300 text-sm mb-6">
                            The application encountered an unexpected error. This has been logged for review.
                        </p>
                        {this.state.error && (
                            <pre className="bg-slate-900/50 rounded-lg p-3 text-xs text-red-300 mb-6 overflow-auto max-h-32 text-left">
                                {this.state.error.message}
                            </pre>
                        )}
                        <button
                            onClick={this.handleReset}
                            className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
                        >
                            <RefreshCw className="w-4 h-4" />
                            Restart Application
                        </button>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}
