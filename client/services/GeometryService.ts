/**
 * GeometryService - Strict Corner Mapping
 * 
 * PHILOSOPHY:
 * 1. Server provides pure logic (no pixel coordinates)
 * 2. Client calculates geometry from axial coordinates
 * 3. Vertex positions = STRICT BINDING to hex corners (NOT averaging)
 * 4. Edge positions = connect mapped vertex positions
 * 
 * GUARANTEES:
 * - Perfect alignment: tiles touch vertices exactly
 * - Correct topology: edges outline tiles perfectly
 * - Rotation offset handled: (i + 4) % 6 for Pointy Top
 */

import { defineHex, Orientation } from 'honeycomb-grid';
import { IGameState } from '../../src/models/GameState';
import { ITile, IVertex, IEdge } from '../../src/models/BoardComponents';
import { ResourceType } from '../../src/models/Enums';

const HEX_SIZE = 50; // Pixel size of each hex
const Hex = defineHex({ dimensions: HEX_SIZE, orientation: Orientation.POINTY });

/**
 * קבלת צבע משאב
 */
function getResourceColor(resourceType: ResourceType): string {
  const colors: Record<ResourceType, string> = {
    [ResourceType.LUMBER]: '#0a6100',
    [ResourceType.BRICK]: '#c7522a',
    [ResourceType.WOOL]: '#9fdf9f',
    [ResourceType.GRAIN]: '#e5c100',
    [ResourceType.ORE]: '#888888',
    [ResourceType.DESERT]: '#e6d5a8',
  };
  return colors[resourceType];
}

/**
 * ממשק עבור נתוני לוח מעובדים (עם גיאומטריה)
 */
export interface IBoardLayout {
  tiles: Array<{
    tile: ITile;
    center: { x: number; y: number };
    corners: Array<{ x: number; y: number }>;
    polygonPoints: string;
    color: string;
  }>;
  vertices: Array<{
    vertex: IVertex;
    position: { x: number; y: number };
  }>;
  edges: Array<{
    edge: IEdge;
    position: {
      x1: number;
      y1: number;
      x2: number;
      y2: number;
    };
  }>;
  viewBox: {
    minX: number;
    minY: number;
    width: number;
    height: number;
  };
}

/**
 * GeometryService - המרת מצב משחק ללייאאוט גרפי
 */
export class GeometryService {
  /**
   * חישוב לייאאוט מלא של הלוח - STRICT CORNER MAPPING
   */
  public static calculateLayout(gameState: IGameState): IBoardLayout {
    // Step 1: Initialize vertex map for strict binding
    const vertexMap = new Map<number, { x: number; y: number }>();
    const tileDataMap = new Map<number, { center: { x: number; y: number }; corners: Array<{ x: number; y: number }> }>();

    // Step 2: THE MAPPING LOOP - Bind logical vertices to physical corners
    gameState.tiles.forEach(tile => {
      // Create hex instance
      const hex = new Hex({ q: tile.q, r: tile.r });
      const corners = hex.corners;
      const vertexIds = tile.adjacentVertexIds;

      // Store tile center for number rendering
      tileDataMap.set(tile.id, {
        center: { x: hex.x, y: hex.y },
        corners: corners.map(c => ({ x: c.x, y: c.y })),
      });

      // THE MAPPING RULE: Apply rotation offset
      for (let i = 0; i < 6; i++) {
        const cornerIndex = (i + 4) % 6; // Rotation offset for Pointy Top
        const vertexId = vertexIds[i];
        
        // Bind vertex ID to physical corner position
        // Note: Overwrites are DESIRED for shared vertices (ensures perfect snapping)
        vertexMap.set(vertexId, {
          x: corners[cornerIndex].x,
          y: corners[cornerIndex].y,
        });
      }
    });

    // Step 3: Build tile geometry data
    const tilesWithGeometry = gameState.tiles.map(tile => {
      const tileData = tileDataMap.get(tile.id)!;
      
      // Build polygon points from MAPPED vertices (Connect-the-Dots)
      const polygonPoints = tile.adjacentVertexIds
        .map(vertexId => {
          const pos = vertexMap.get(vertexId);
          return pos ? `${pos.x},${pos.y}` : '';
        })
        .filter(s => s !== '')
        .join(' ');

      return {
        tile,
        center: tileData.center,
        corners: tileData.corners,
        polygonPoints,
        color: getResourceColor(tile.resourceType),
      };
    });

    // Step 4: Build vertex geometry data
    const verticesWithGeometry = gameState.vertices.map(vertex => {
      const position = vertexMap.get(vertex.id);
      
      if (!position) {
        console.warn(`Vertex ${vertex.id} not found in vertex map`);
        return {
          vertex,
          position: { x: 0, y: 0 }, // Fallback
        };
      }

      return {
        vertex,
        position,
      };
    });

    // Step 5: Build edge geometry data
    const edgesWithGeometry = gameState.edges.map(edge => {
      const v1 = vertexMap.get(edge.vertexIds[0]);
      const v2 = vertexMap.get(edge.vertexIds[1]);

      if (!v1 || !v2) {
        console.warn(`Edge ${edge.id} references missing vertices: ${edge.vertexIds[0]}, ${edge.vertexIds[1]}`);
        return {
          edge,
          position: { x1: 0, y1: 0, x2: 0, y2: 0 }, // Fallback
        };
      }

      return {
        edge,
        position: {
          x1: v1.x,
          y1: v1.y,
          x2: v2.x,
          y2: v2.y,
        },
      };
    });

    // Step 6: Calculate viewBox
    const allPositions = Array.from(vertexMap.values());
    const allX = allPositions.map(p => p.x);
    const allY = allPositions.map(p => p.y);
    const minX = Math.min(...allX) - 10;
    const minY = Math.min(...allY) - 10;
    const maxX = Math.max(...allX) + 10;
    const maxY = Math.max(...allY) + 10;

    return {
      tiles: tilesWithGeometry,
      vertices: verticesWithGeometry,
      edges: edgesWithGeometry,
      viewBox: {
        minX,
        minY,
        width: maxX - minX,
        height: maxY - minY,
      },
    };
  }

  /**
   * חישוב מיקום קודקוד בודד (for external use)
   */
  public static getVertexPosition(
    vertexId: number,
    gameState: IGameState
  ): { x: number; y: number } {
    const layout = this.calculateLayout(gameState);
    const vertexData = layout.vertices.find(v => v.vertex.id === vertexId);
    
    if (!vertexData) {
      throw new Error(`Vertex ${vertexId} not found`);
    }
    
    return vertexData.position;
  }

  /**
   * חישוב מרכז אריח (for external use)
   */
  public static getTileCenter(tile: ITile): { x: number; y: number } {
    const hex = new Hex({ q: tile.q, r: tile.r });
    return { x: hex.x, y: hex.y };
  }
}
