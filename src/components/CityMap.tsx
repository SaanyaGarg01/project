import { useEffect, useRef } from 'react';
import { CityGraph, RouteResult } from '../types/simulation';
import { DynamicEnvironment } from '../simulation/environment';

interface CityMapProps {
  graph: CityGraph;
  environment: DynamicEnvironment;
  rlRoute?: RouteResult;
  dijkstraRoute?: RouteResult;
  activeAlgorithm: 'both' | 'rl' | 'dijkstra';
  animationProgress: number;
}

export function CityMap({ graph, environment, rlRoute, dijkstraRoute, activeAlgorithm, animationProgress }: CityMapProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const padding = 50;
    const width = canvas.width - padding * 2;
    const height = canvas.height - padding * 2;

    let maxX = 0;
    let maxY = 0;
    graph.nodes.forEach(node => {
      maxX = Math.max(maxX, node.x);
      maxY = Math.max(maxY, node.y);
    });

    const scaleX = width / maxX;
    const scaleY = height / maxY;
    const scale = Math.min(scaleX, scaleY);

    const transform = (x: number, y: number) => ({
      x: x * scale + padding,
      y: y * scale + padding
    });

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    ctx.strokeStyle = '#e5e7eb';
    ctx.lineWidth = 2;
    graph.edges.forEach((edges, fromId) => {
      const fromNode = graph.nodes.get(fromId);
      if (!fromNode) return;

      edges.forEach(edge => {
        const toNode = graph.nodes.get(edge.to);
        if (!toNode) return;

        const from = transform(fromNode.x, fromNode.y);
        const to = transform(toNode.x, toNode.y);

        const trafficFactor = environment.getTrafficFactor(fromId, edge.to);
        const intensity = Math.floor((1 - trafficFactor) * 100 + 155);
        ctx.strokeStyle = `rgb(${intensity}, ${intensity}, ${intensity})`;

        ctx.beginPath();
        ctx.moveTo(from.x, from.y);
        ctx.lineTo(to.x, to.y);
        ctx.stroke();
      });
    });

    const drawRoute = (route: RouteResult, color: string, offset: number) => {
      if (!route || route.path.length < 2) return;

      const pathLength = route.path.length - 1;
      const currentSegment = Math.min(
        Math.floor(animationProgress * pathLength),
        pathLength - 1
      );

      ctx.strokeStyle = color;
      ctx.lineWidth = 4;
      ctx.shadowBlur = 10;
      ctx.shadowColor = color;

      for (let i = 0; i < currentSegment; i++) {
        const fromNode = graph.nodes.get(route.path[i]);
        const toNode = graph.nodes.get(route.path[i + 1]);
        if (!fromNode || !toNode) continue;

        const from = transform(fromNode.x, fromNode.y);
        const to = transform(toNode.x, toNode.y);

        const dx = to.x - from.x;
        const dy = to.y - from.y;
        const length = Math.sqrt(dx * dx + dy * dy);
        const offsetX = (-dy / length) * offset;
        const offsetY = (dx / length) * offset;

        ctx.beginPath();
        ctx.moveTo(from.x + offsetX, from.y + offsetY);
        ctx.lineTo(to.x + offsetX, to.y + offsetY);
        ctx.stroke();
      }

      if (currentSegment < pathLength) {
        const fromNode = graph.nodes.get(route.path[currentSegment]);
        const toNode = graph.nodes.get(route.path[currentSegment + 1]);
        if (fromNode && toNode) {
          const from = transform(fromNode.x, fromNode.y);
          const to = transform(toNode.x, toNode.y);

          const segmentProgress = (animationProgress * pathLength) - currentSegment;

          const dx = to.x - from.x;
          const dy = to.y - from.y;
          const length = Math.sqrt(dx * dx + dy * dy);
          const offsetX = (-dy / length) * offset;
          const offsetY = (dx / length) * offset;

          ctx.beginPath();
          ctx.moveTo(from.x + offsetX, from.y + offsetY);
          ctx.lineTo(
            from.x + offsetX + dx * segmentProgress,
            from.y + offsetY + dy * segmentProgress
          );
          ctx.stroke();
        }
      }

      ctx.shadowBlur = 0;
    };

    if (activeAlgorithm === 'both') {
      if (dijkstraRoute) drawRoute(dijkstraRoute, '#ef4444', -3);
      if (rlRoute) drawRoute(rlRoute, '#22c55e', 3);
    } else if (activeAlgorithm === 'rl' && rlRoute) {
      drawRoute(rlRoute, '#22c55e', 0);
    } else if (activeAlgorithm === 'dijkstra' && dijkstraRoute) {
      drawRoute(dijkstraRoute, '#ef4444', 0);
    }

    graph.nodes.forEach((node, id) => {
      const pos = transform(node.x, node.y);
      const isFlooded = environment.isFlooded(id);
      const incident = environment.hasIncident(id);

      let isStart = false;
      let isGoal = false;

      if (rlRoute && rlRoute.path.length > 0) {
        isStart = id === rlRoute.path[0];
        isGoal = id === rlRoute.path[rlRoute.path.length - 1];
      } else if (dijkstraRoute && dijkstraRoute.path.length > 0) {
        isStart = id === dijkstraRoute.path[0];
        isGoal = id === dijkstraRoute.path[dijkstraRoute.path.length - 1];
      }

      if (incident) {
        ctx.fillStyle = '#ef4444'; // Red for incident
        ctx.beginPath();
        ctx.arc(pos.x, pos.y, 12, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 12px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('!', pos.x, pos.y);

        // Optional: Draw text label if needed, but simplicity is better
      } else if (isFlooded) {
        ctx.fillStyle = '#3b82f6';
        ctx.beginPath();
        ctx.arc(pos.x, pos.y, 8, 0, Math.PI * 2);
        ctx.fill();
      } else if (isStart) {
        ctx.fillStyle = '#10b981';
        ctx.beginPath();
        ctx.arc(pos.x, pos.y, 8, 0, Math.PI * 2);
        ctx.fill();
      } else if (isGoal) {
        ctx.fillStyle = '#f59e0b';
        ctx.beginPath();
        ctx.arc(pos.x, pos.y, 8, 0, Math.PI * 2);
        ctx.fill();
      } else {
        ctx.fillStyle = '#6b7280';
        ctx.beginPath();
        ctx.arc(pos.x, pos.y, 4, 0, Math.PI * 2);
        ctx.fill();
      }
    });

  }, [graph, environment, rlRoute, dijkstraRoute, activeAlgorithm, animationProgress]);

  return (
    <canvas
      ref={canvasRef}
      width={800}
      height={600}
      className="border border-gray-300 rounded-lg bg-white shadow-lg"
    />
  );
}
