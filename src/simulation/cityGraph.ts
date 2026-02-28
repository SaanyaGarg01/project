import { Node, Edge, CityGraph } from '../types/simulation';

export function generateCityGraph(): CityGraph {
  const nodes = new Map<number, Node>();
  const edges = new Map<number, Edge[]>();
  const adjacency = new Map<number, number[]>();

  const gridSize = 8;
  const spacing = 100;

  let nodeId = 0;
  for (let row = 0; row < gridSize; row++) {
    for (let col = 0; col < gridSize; col++) {
      nodes.set(nodeId, {
        id: nodeId,
        x: col * spacing,
        y: row * spacing,
        name: `N${nodeId}`
      });
      adjacency.set(nodeId, []);
      edges.set(nodeId, []);
      nodeId++;
    }
  }

  for (let row = 0; row < gridSize; row++) {
    for (let col = 0; col < gridSize; col++) {
      const currentId = row * gridSize + col;

      if (col < gridSize - 1) {
        const rightId = row * gridSize + (col + 1);
        const distance = spacing + Math.random() * 20;
        const elevation = (Math.random() - 0.5) * 10;

        edges.get(currentId)!.push({
          from: currentId,
          to: rightId,
          distance,
          elevation
        });

        edges.get(rightId)!.push({
          from: rightId,
          to: currentId,
          distance,
          elevation: -elevation
        });

        adjacency.get(currentId)!.push(rightId);
        adjacency.get(rightId)!.push(currentId);
      }

      if (row < gridSize - 1) {
        const downId = (row + 1) * gridSize + col;
        const distance = spacing + Math.random() * 20;
        const elevation = (Math.random() - 0.5) * 10;

        edges.get(currentId)!.push({
          from: currentId,
          to: downId,
          distance,
          elevation
        });

        edges.get(downId)!.push({
          from: downId,
          to: currentId,
          distance,
          elevation: -elevation
        });

        adjacency.get(currentId)!.push(downId);
        adjacency.get(downId)!.push(currentId);
      }

      if (col < gridSize - 1 && row < gridSize - 1 && Math.random() > 0.6) {
        const diagonalId = (row + 1) * gridSize + (col + 1);
        const distance = spacing * 1.414 + Math.random() * 20;
        const elevation = (Math.random() - 0.5) * 15;

        edges.get(currentId)!.push({
          from: currentId,
          to: diagonalId,
          distance,
          elevation
        });

        edges.get(diagonalId)!.push({
          from: diagonalId,
          to: currentId,
          distance,
          elevation: -elevation
        });

        adjacency.get(currentId)!.push(diagonalId);
        adjacency.get(diagonalId)!.push(currentId);
      }
    }
  }

  return { nodes, edges, adjacency };
}

export function getEdge(graph: CityGraph, from: number, to: number): Edge | undefined {
  const nodeEdges = graph.edges.get(from);
  return nodeEdges?.find(e => e.to === to);
}
