/**
 * GameBoard Component - Catan Board Reconstruction Protocol
 * 
 * Architecture: "Derived Geometry" Pattern
 * - Backend sends: Tiles with (q, r) + adjacentVertexIds
 * - Frontend: Uses honeycomb-grid to derive pixel positions
 * - Synchronization: 1:1 mapping with rotation offset correction
 */

import React, { useMemo } from 'react';
import { defineHex, Orientation } from 'honeycomb-grid';
import { IGameState } from '../../src/models/GameState';
import { ResourceType, BuildingType } from '../../src/models/Enums';

interface GameBoardProps {
  gameState: IGameState;
  onVertexClick: (vertexId: number) => void;
  onEdgeClick: (edgeId: number) => void;
  buildMode: 'ROAD' | 'SETTLEMENT' | 'CITY' | 'DEVELOPMENT_CARD' | null;
}

// ===== PHASE 1: STANDARDIZATION =====
const HEX_SIZE = 50;
const Hex = defineHex({ dimensions: HEX_SIZE, orientation: Orientation.POINTY });

// Resource colors
const RESOURCE_COLORS: Record<ResourceType, string> = {
  [ResourceType.LUMBER]: '#2E7D32',
  [ResourceType.BRICK]: '#D32F2F',
  [ResourceType.WOOL]: '#AED581',
  [ResourceType.GRAIN]: '#FFB300',
  [ResourceType.ORE]: '#616161',
  [ResourceType.DESERT]: '#BCAAA4',
};

const GameBoard: React.FC<GameBoardProps> = ({ gameState, onVertexClick, onEdgeClick, buildMode }) => {
  
  // ===== PHASE 2: THE MAPPING ALGORITHM =====
  const { hexGrid, vertexPositionMap } = useMemo(() => {
    const hexMap = new Map<number, typeof Hex.prototype>();
    const vertexMap = new Map<number, { x: number; y: number }>();
    
    console.log('🎯 GameBoard: Building grid from', gameState.tiles.length, 'tiles');
    console.log('📊 Total vertices in gameState:', gameState.vertices.length);
    
    // Iterate ALL tiles to capture ALL vertices
    gameState.tiles.forEach((tile) => {
      // Create hex from Axial coordinates
      const hex = new Hex({ q: tile.q, r: tile.r });
      (hex as any).tileData = tile;
      hexMap.set(tile.id, hex);
      
      // CRITICAL: Map Server IDs to Library Corners with Rotation Offset
      const corners = hex.corners; // [0]=E, [1]=SE, [2]=SW, [3]=W, [4]=NW, [5]=NE
      const serverIds = tile.adjacentVertexIds; // Server order: [0]=N, [1]=NE, [2]=SE, [3]=S, [4]=SW, [5]=NW
      
      serverIds.forEach((vertexId, serverIndex) => {
        // ROTATION OFFSET: (serverIndex + 5) % 6
        // This shifts the mapping back by 1 position to align Server North with Library coordinates
        const libraryIndex = (serverIndex + 5) % 6;
        const point = corners[libraryIndex];
        
        // Store in map - use first occurrence only (no averaging)
        // Averaging can cause misalignment with tile corners
        if (!vertexMap.has(vertexId)) {
          vertexMap.set(vertexId, {
            x: point.x,
            y: point.y
          });
        }
      });
    });
    
    console.log('✅ GameBoard: Grid complete -', hexMap.size, 'hexes,', vertexMap.size, 'unique vertices');
    console.log('🔍 Vertices mapped vs expected:', vertexMap.size, '/', gameState.vertices.length);
    
    // Check for missing vertices
    const missingVertices = gameState.vertices.filter(v => !vertexMap.has(v.id));
    if (missingVertices.length > 0) {
      console.warn('⚠️ Missing vertices:', missingVertices.map(v => v.id));
    }
    
    return {
      hexGrid: Array.from(hexMap.values()),
      vertexPositionMap: vertexMap
    };
  }, [gameState.tiles]);
  
  // ===== ViewBox Calculation =====
  const viewBox = useMemo(() => {
    const allPoints: { x: number; y: number }[] = [];
    hexGrid.forEach(hex => {
      hex.corners.forEach(corner => allPoints.push(corner));
    });
    
    if (allPoints.length === 0) return '0 0 800 600';
    
    const xs = allPoints.map(p => p.x);
    const ys = allPoints.map(p => p.y);
    const minX = Math.min(...xs) - HEX_SIZE;
    const maxX = Math.max(...xs) + HEX_SIZE;
    const minY = Math.min(...ys) - HEX_SIZE;
    const maxY = Math.max(...ys) + HEX_SIZE;
    
    return `${minX} ${minY} ${maxX - minX} ${maxY - minY}`;
  }, [hexGrid]);
  
  // ===== PHASE 3: SVG RENDERING (LAYERED ARCHITECTURE) =====
  return (
    <svg 
      viewBox={viewBox} 
      style={{ width: '100%', height: 'auto', maxHeight: '90vh' }}
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Layer 1: TILES ONLY (Background Polygons) */}
      <g id="tiles-layer">
        {hexGrid.map((hex) => {
          const tile = (hex as any).tileData as typeof gameState.tiles[0];
          if (!tile) return null;
          
          const corners = hex.corners;
          const points = corners.map(c => `${c.x},${c.y}`).join(' ');
          const color = RESOURCE_COLORS[tile.resourceType];
          const isRobber = gameState.robberTileId === tile.id;
          
          return (
            <polygon
              key={`tile-${tile.id}`}
              points={points}
              fill={color}
              stroke="#2C2C2C"
              strokeWidth="2.5"
              opacity={isRobber ? 0.5 : 0.95}
            />
          );
        })}
      </g>
      
      {/* Layer 2: NUMBERS/TOKENS (Always on top of tiles) */}
      <g id="numbers-layer">
        {hexGrid.map((hex) => {
          const tile = (hex as any).tileData as typeof gameState.tiles[0];
          if (!tile) return null;
          
          // Get center coordinates - hex.center is a Point object
          const centerPoint = hex.center;
          const cx = centerPoint.x;
          const cy = centerPoint.y;
          const isRobber = gameState.robberTileId === tile.id;
          const isDesert = tile.resourceType === ResourceType.DESERT;
          
          return (
            <g key={`number-${tile.id}`}>
              {/* Desert Token (no dice number) */}
              {isDesert && !isRobber && (
                <>
                  <circle 
                    cx={cx} 
                    cy={cy} 
                    r={20} 
                    fill="#FAFAFA" 
                    stroke="#333" 
                    strokeWidth="2.5" 
                  />
                  <text
                    x={cx}
                    y={cy}
                    textAnchor="middle"
                    dominantBaseline="central"
                    fontSize="28"
                    fontWeight="bold"
                    fill="#999"
                  >
                    -
                  </text>
                </>
              )}
              
              {/* Dice Number Circle and Text (for non-desert tiles) */}
              {tile.diceNumber !== null && !isDesert && (
                <>
                  {/* White circle background */}
                  <circle 
                    cx={cx} 
                    cy={cy} 
                    r={20} 
                    fill="#FAFAFA" 
                    stroke="#333" 
                    strokeWidth="2.5" 
                  />
                  {/* Dice number */}
                  <text
                    x={cx}
                    y={cy - 2}
                    textAnchor="middle"
                    dominantBaseline="central"
                    fontSize="22"
                    fontWeight="bold"
                    fill={[6, 8].includes(tile.diceNumber) ? '#D32F2F' : '#333'}
                  >
                    {tile.diceNumber}
                  </text>
                  {/* Probability dots */}
                  <text
                    x={cx}
                    y={cy + 13}
                    textAnchor="middle"
                    fontSize="9"
                    fill="#666"
                    letterSpacing="1"
                  >
                    {'•'.repeat(tile.probability)}
                  </text>
                </>
              )}
              
              {/* Robber */}
              {isRobber && (
                <text 
                  x={cx} 
                  y={cy} 
                  textAnchor="middle" 
                  dominantBaseline="central" 
                  fontSize="35"
                >
                  🦹
                </text>
              )}
            </g>
          );
        })}
      </g>
      
      {/* Layer 3: EDGES (Roads) */}
      <g id="edges-layer">
        {gameState.edges.map(edge => {
          const v1Pos = vertexPositionMap.get(edge.vertexIds[0]);
          const v2Pos = vertexPositionMap.get(edge.vertexIds[1]);
          
          if (!v1Pos || !v2Pos) return null;
          
          const isBuilt = edge.ownerId !== null;
          const ownerPlayer = isBuilt ? gameState.players.find(p => p.id === edge.ownerId) : null;
          const isHighlighted = buildMode === 'ROAD' && !isBuilt;
          
          return (
            <g key={`edge-${edge.id}`}>
              {/* Clickable area */}
              <line
                x1={v1Pos.x} y1={v1Pos.y} x2={v2Pos.x} y2={v2Pos.y}
                stroke="transparent"
                strokeWidth="14"
                onClick={() => onEdgeClick(edge.id)}
                style={{ cursor: isBuilt ? 'default' : 'pointer' }}
              />
              {/* Visual line */}
              <line
                x1={v1Pos.x} y1={v1Pos.y} x2={v2Pos.x} y2={v2Pos.y}
                stroke={isBuilt ? (ownerPlayer?.color || '#999') : isHighlighted ? '#43A047' : '#999'}
                strokeWidth={isBuilt ? 6 : isHighlighted ? 4 : 2}
                strokeDasharray={!isBuilt && isHighlighted ? '5,5' : 'none'}
                opacity={isBuilt ? 1 : isHighlighted ? 0.8 : 0.3}
                strokeLinecap="round"
                pointerEvents="none"
              />
            </g>
          );
        })}
      </g>
      
      {/* Layer 4: VERTICES (Settlements/Cities) */}
      <g id="vertices-layer">
        {gameState.vertices.map(vertex => {
          const pos = vertexPositionMap.get(vertex.id);
          if (!pos) return null;
          
          const isBuilt = vertex.buildingType !== BuildingType.NONE;
          const ownerPlayer = vertex.ownerId ? gameState.players.find(p => p.id === vertex.ownerId) : null;
          const isSettlement = vertex.buildingType === BuildingType.SETTLEMENT;
          const isCity = vertex.buildingType === BuildingType.CITY;
          const currentPlayer = gameState.players[gameState.currentPlayerIndex];
          const isHighlighted = 
            (buildMode === 'SETTLEMENT' && !isBuilt) ||
            (buildMode === 'CITY' && isSettlement && vertex.ownerId === currentPlayer?.id);
          
          const radius = isCity ? 14 : isSettlement ? 10 : 8;
          
          return (
            <g key={`vertex-${vertex.id}`}>
              {/* Clickable area */}
              <circle
                cx={pos.x} cy={pos.y} r={radius + 6}
                fill="transparent"
                onClick={() => onVertexClick(vertex.id)}
                style={{ cursor: isBuilt && !isHighlighted ? 'default' : 'pointer' }}
              />
              {/* Visual circle */}
              <circle
                cx={pos.x} cy={pos.y} r={radius}
                fill={isBuilt ? (ownerPlayer?.color || '#FFF') : isHighlighted ? '#43A04750' : 'rgba(255,255,255,0.5)'}
                stroke={isBuilt ? '#FFF' : isHighlighted ? '#43A047' : '#666'}
                strokeWidth={isBuilt ? 3 : isHighlighted ? 2.5 : 1.5}
                opacity={isBuilt ? 1 : isHighlighted ? 0.9 : 0.6}
                pointerEvents="none"
              />
              {/* Building icons */}
              {isSettlement && (
                <text x={pos.x} y={pos.y} textAnchor="middle" dominantBaseline="central" fontSize="12" pointerEvents="none">
                  🏠
                </text>
              )}
              {isCity && (
                <text x={pos.x} y={pos.y} textAnchor="middle" dominantBaseline="central" fontSize="16" pointerEvents="none">
                  🏰
                </text>
              )}
            </g>
          );
        })}
      </g>
    </svg>
  );
};

export default GameBoard;
