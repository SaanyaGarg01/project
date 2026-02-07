import { useRef, useEffect } from 'react';

interface TrainingChartProps {
    history: number[];
}

export function TrainingChart({ history }: TrainingChartProps) {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas || history.length === 0) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const width = canvas.width;
        const height = canvas.height;
        const padding = 20;

        // Clear canvas
        ctx.clearRect(0, 0, width, height);

        // Find min/max for scaling
        const minReward = Math.min(...history);
        const maxReward = Math.max(...history);
        const range = maxReward - minReward || 1;

        // Draw axes
        ctx.strokeStyle = '#e5e7eb';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(padding, padding);
        ctx.lineTo(padding, height - padding);
        ctx.lineTo(width - padding, height - padding);
        ctx.stroke();

        // Draw data line
        ctx.strokeStyle = '#2563eb';
        ctx.lineWidth = 2;
        ctx.beginPath();

        let pathPoints: Array<{ x: number, y: number }> = [];

        history.forEach((reward, index) => {
            const x = padding + (index / (history.length - 1 || 1)) * (width - 2 * padding);
            const normalizedReward = (reward - minReward) / (range || 1);
            const y = (height - padding) - (normalizedReward * (height - 2 * padding));

            pathPoints.push({ x, y });

            if (index === 0) {
                ctx.moveTo(x, y);
            } else {
                ctx.lineTo(x, y);
            }
        });

        ctx.stroke();

        // Fill area under curve
        if (pathPoints.length > 0) {
            const gradient = ctx.createLinearGradient(0, padding, 0, height - padding);
            gradient.addColorStop(0, 'rgba(37, 99, 235, 0.2)');
            gradient.addColorStop(1, 'rgba(37, 99, 235, 0)');
            ctx.fillStyle = gradient;

            ctx.beginPath();
            ctx.moveTo(pathPoints[0].x, pathPoints[0].y);
            for (let i = 1; i < pathPoints.length; i++) {
                ctx.lineTo(pathPoints[i].x, pathPoints[i].y);
            }
            ctx.lineTo(pathPoints[pathPoints.length - 1].x, height - padding); // Bottom right
            ctx.lineTo(pathPoints[0].x, height - padding); // Bottom left
            ctx.closePath();
            ctx.fill();
        }

    }, [history]);

    return (
        <div className="bg-white rounded-lg shadow-md p-4 mt-4">
            <h3 className="text-sm font-semibold text-gray-700 mb-2">AI Learning Curve (Reward/Episode)</h3>
            <div className="relative w-full h-32">
                {history.length === 0 ? (
                    <div className="flex items-center justify-center h-full text-xs text-gray-400">
                        No training data yet
                    </div>
                ) : (
                    <canvas
                        ref={canvasRef}
                        width={300}
                        height={128}
                        className="w-full h-full"
                    />
                )}
            </div>
        </div>
    );
}
