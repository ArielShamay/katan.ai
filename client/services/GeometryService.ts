/**
 * GeometryService - Vertex Position Averaging
 * 
 * PHILOSOPHY:
 * 1. Server provides pure logic (no pixel coordinates)
 * 2. Client calculates geometry from axial coordinates
 * 3. Vertex positions = average of adjacent tile centers
 * 4. Edge positions = connect averaged vertex positions
 * 
 * GUARANTEES:
 * - No visual duplicates (shared vertices appear once)
 * - Perfect honeycomb (edges connect exactly)
 * - Separation of concerns (logic vs. rendering)
 */

import { defineHex, Orientation } from 'honeycomb-grid';
import { IGameState } from '../../src/models/GameState';
import { ITile, IVertex, IEdge } from '../../src/models/BoardComponents';
import { ResourceType } from '../../src/models/Enums';

const HEX_SIZE = 50; // Pixel size of each hex
const Hex = defineHex({ dimensions: HEX_SIZE, orientation: Orientation.POINTY });

/**
 * חישוב מרכז אריח לפי קואורדינטות אקסיאליות
 */
function getTileCenter(tile: ITile): { x: number; y: number } {
  const hex = new Hex({ q: tile.q, r: tile.r });
  return { x: hex.x, y: hex.y };
}

/**
 * חישוב מיקום קודקוד על ידי ממוצע של מרכזי האריחים הסמוכים
 */
function getVertexPosition(
  vertex: IVertex,
  tiles: readonly ITile[]
): { x: number; y: number } {
  const adjacentTiles = vertex.adjacentTileIds
    .map(tileId => tiles.find(t => t.id === tileId))
    .filter((t): t is ITile => t !== undefined);

  if (adjacentTiles.length === 0) {
    throw new Error(`Vertex ${vertex.id} has no adjacent tiles`);
  }

  // חישוב ממוצע של מרכזי האריחים
  const centers = adjacentTiles.map(getTileCenter);
  const avgX = centers.reduce((sum, c) => sum + c.x, 0) / centers.length;
  const avgY = centers.reduce((sum, c) => sum + c.y, 0) / centers.length;

  return { x: avgX, y: avgY };
}

/**
 * חישוב פינות משושה לפי מרכז האריח
 */
function getHexCorners(tile: ITile): Array<{ x: number; y: number }> {
  const hex = new Hex({ q: tile.q, r: tile.r });
  return hex.corners.map(corner => ({ x: corner.x, y: corner.y }));
}

/**
 * המרת רשימת נקודות למחרוזת SVG
 */
function pointsToSVGString(points: Array<{ x: number; y: number }>): string {
  return points.map(p => `${p.x},${p.y}`).join(' ');
}

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
   * חישוב לייאאוט מלא של הלוח
   */
  public static calculateLayout(gameState: IGameState): IBoardLayout {
    // Step 1: Calculate tile geometry
    const tilesWithGeometry = gameState.tiles.map(tile => {
      const center = getTileCenter(tile);
      const corners = getHexCorners(tile);
      return {
        tile,
        center,
        corners,
        polygonPoints: pointsToSVGString(corners),
        color: getResourceColor(tile.resourceType),
      };
    });

    // Step 2: Calculate vertex positions (averaged from adjacent tiles)
    const verticesWithGeometry = gameState.vertices.map(vertex => {
      const position = getVertexPosition(vertex, gameState.tiles);
      return {
        vertex,
        position,
      };
    });

    // Step 3: Calculate edge positions (connect vertex positions)
    const edgesWithGeometry = gameState.edges.map(edge => {
      const v1 = verticesWithGeometry.find(v => v.vertex.id === edge.vertexIds[0]);
      const v2 = verticesWithGeometry.find(v => v.vertex.id === edge.vertexIds[1]);

      if (!v1 || !v2) {
        throw new Error(`Edge ${edge.id} references missing vertices`);
      }

      return {
        edge,
        position: {
          x1: v1.position.x,
          y1: v1.position.y,
          x2: v2.position.x,
          y2: v2.position.y,
        },
      };
    });

    // Step 4: Calculate viewBox
    const allX = tilesWithGeometry.flatMap(t => t.corners.map(c => c.x));
    const allY = tilesWithGeometry.flatMap(t => t.corners.map(c => c.y));
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
   * חישוב מיקום קודקוד בודד
   */
  public static getVertexPosition(
    vertexId: number,
    gameState: IGameState
  ): { x: number; y: number } {
    const vertex = gameState.vertices.find(v => v.id === vertexId);
    if (!vertex) {
      throw new Error(`Vertex ${vertexId} not found`);
    }
    return getVertexPosition(vertex, gameState.tiles);
  }

  /**
   * חישוב מרכז אריח
   */
  public static getTileCenter(tile: ITile): { x: number; y: number } {
    return getTileCenter(tile);
  }
}
