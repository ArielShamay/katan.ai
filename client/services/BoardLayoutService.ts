/**
 * BoardLayoutService - מנוע הגיאומטריה המרכזי
 * האחראי היחיד על חישוב מיקומי פיקסלים (x, y) של כל רכיבי הלוח
 * 
 * עיקרון: Single Source of Truth לכל הגיאומטריה
 */

import { defineHex, Orientation } from 'honeycomb-grid';
import { IGameState } from '../../src/models/GameState';

// ===== קבועים גיאומטריים =====
export const HEX_SIZE = 50;
export const HEX_WIDTH = HEX_SIZE * 2;
export const HEX_HEIGHT = HEX_SIZE * Math.sqrt(3);

// הגדרת משושה (Pointy Top)
const Hex = defineHex({ 
  dimensions: HEX_SIZE, 
  orientation: Orientation.POINTY 
});

// ===== טיפוסים =====
export interface TilePosition {
  tileId: number;
  center: { x: number; y: number };
  corners: Array<{ x: number; y: number }>;
}

export interface VertexPosition {
  vertexId: number;
  x: number;
  y: number;
}

export interface BoardLayout {
  tiles: Map<number, TilePosition>;
  vertices: Map<number, VertexPosition>;
  viewBox: string;
}

/**
 * מחשב את כל המיקומים הפיזיים של הלוח
 * @param gameState - מצב המשחק הלוגי
 * @returns אובייקט עם כל המיקומים המחושבים
 */
export function calculateLayout(gameState: IGameState): BoardLayout {
  const tilesMap = new Map<number, TilePosition>();
  const vertexAccumulator = new Map<number, { sumX: number; sumY: number; count: number }>();
  
  console.log('🎯 BoardLayoutService: מתחיל חישוב גיאומטריה עבור', gameState.tiles.length, 'אריחים');
  
  // שלב 1: עיבוד כל האריחים וחישוב מיקומי הפינות
  gameState.tiles.forEach((tile) => {
    // יצירת משושה מקואורדינטות אקסיאליות
    const hex = new Hex({ q: tile.q, r: tile.r });
    const center = hex.center;
    const corners = hex.corners;
    
    // שמירת מיקום האריח
    tilesMap.set(tile.id, {
      tileId: tile.id,
      center: { x: center.x, y: center.y },
      corners: corners.map(c => ({ x: c.x, y: c.y }))
    });
    
    // מיפוי קודקודים לפינות עם rotation offset
    // Server order: [0]=Top, [1]=TopRight, [2]=BottomRight, [3]=Bottom, [4]=BottomLeft, [5]=TopLeft
    // honeycomb-grid order: [0]=TopRight, [1]=Right, [2]=BottomRight, [3]=BottomLeft, [4]=Left, [5]=TopLeft
    // Offset: (serverIndex + 4) % 6
    tile.adjacentVertexIds.forEach((vertexId, serverIndex) => {
      const libraryIndex = (serverIndex + 4) % 6;
      const corner = corners[libraryIndex];
      
      // צבירת מיקומים (לממוצע מאוחר יותר)
      if (!vertexAccumulator.has(vertexId)) {
        vertexAccumulator.set(vertexId, { sumX: 0, sumY: 0, count: 0 });
      }
      
      const acc = vertexAccumulator.get(vertexId)!;
      acc.sumX += corner.x;
      acc.sumY += corner.y;
      acc.count += 1;
    });
  });
  
  // שלב 2: חישוב ממוצע למיקומי קודקודים (de-duplication)
  const verticesMap = new Map<number, VertexPosition>();
  vertexAccumulator.forEach((acc, vertexId) => {
    verticesMap.set(vertexId, {
      vertexId,
      x: acc.sumX / acc.count,
      y: acc.sumY / acc.count
    });
  });
  
  console.log('✅ BoardLayoutService: ממופים', verticesMap.size, '/', gameState.vertices.length, 'קודקודים');
  
  // שלב 3: חישוב ViewBox
  const viewBox = calculateViewBox(tilesMap);
  
  return {
    tiles: tilesMap,
    vertices: verticesMap,
    viewBox
  };
}

/**
 * מחשב את ה-ViewBox של ה-SVG בהתאם למיקומי האריחים
 */
function calculateViewBox(tilesMap: Map<number, TilePosition>): string {
  const allPoints: { x: number; y: number }[] = [];
  
  // איסוף כל הפינות של כל האריחים
  tilesMap.forEach(tile => {
    tile.corners.forEach(corner => allPoints.push(corner));
  });
  
  if (allPoints.length === 0) {
    return '0 0 800 600'; // fallback
  }
  
  const xs = allPoints.map(p => p.x);
  const ys = allPoints.map(p => p.y);
  const minX = Math.min(...xs) - HEX_SIZE;
  const maxX = Math.max(...xs) + HEX_SIZE;
  const minY = Math.min(...ys) - HEX_SIZE;
  const maxY = Math.max(...ys) + HEX_SIZE;
  
  return `${minX} ${minY} ${maxX - minX} ${maxY - minY}`;
}

/**
 * מחזיר את צבע המשאב
 */
export function getResourceColor(resourceType: string): string {
  const colors: Record<string, string> = {
    LUMBER: '#2E7D32',
    BRICK: '#D32F2F',
    WOOL: '#AED581',
    GRAIN: '#FFB300',
    ORE: '#616161',
    DESERT: '#BCAAA4',
  };
  return colors[resourceType] || '#999999';
}
