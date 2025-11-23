/**
 * GameBoard Component - FINAL RECONSTRUCTION
 * 
 * Master Vertex Map Algorithm:
 * 1. honeycomb-grid (pointy orientation, fixed HEX_SIZE)
 * 2. Rotation Offset: Server[i] → Library[(i + 4) % 6]
 *    - Server: Top=0, TopRight=1, BottomRight=2, Bottom=3, BottomLeft=4, TopLeft=5
 *    - Library: TopRight=0, Right=1, BottomRight=2, BottomLeft=3, Left=4, TopLeft=5
 * 3. Layer Order: Edges → Tiles → Numbers → Vertices
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

// ===== CONFIGURATION =====
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
  
  // ===== MASTER VERTEX MAP (Source of Truth) =====
  const { hexGrid, vertexPositionMap } = useMemo(() => {
    const hexMap = new Map<number, typeof Hex.prototype>();
    const vertexMap = new Map<number, { x: number; y: number }>();
    
    console.log('🎯 RECONSTRUCTION: Building from', gameState.tiles.length, 'tiles');
    
    // Process ALL tiles (no filtering)
    gameState.tiles.forEach((tile) => {
      // Create hex instance from axial coordinates
      const hex = new Hex({ q: tile.q, r: tile.r });
      (hex as any).tileData = tile;
      hexMap.set(tile.id, hex);
      
      // Get the 6 corners from honeycomb-grid
      const corners = hex.corners; // Library order: [0]=TopRight, [1]=Right, [2]=BottomRight, [3]=BottomLeft, [4]=Left, [5]=TopLeft
      const serverIds = tile.adjacentVertexIds; // Server order: [0]=Top, [1]=TopRight, [2]=BottomRight, [3]=Bottom, [4]=BottomLeft, [5]=TopLeft
      
      // THE GOLDEN FIX: Rotation Offset
      serverIds.forEach((vertexId, serverIndex) => {
        // Primary offset: (serverIndex + 4) % 6
        // This aligns Server's "Top" (0) with Library's "TopLeft" (5)
        const libraryIndex = (serverIndex + 4) % 6;
        const corner = corners[libraryIndex];
        
        // Store first occurrence only (no averaging to prevent drift)
        if (!vertexMap.has(vertexId)) {
          vertexMap.set(vertexId, {
            x: corner.x,
            y: corner.y
          });
        }
      });
    });
    
    console.log('✅ Mapped:', vertexMap.size, '/', gameState.vertices.length, 'vertices');
    
    // Debug missing vertices
    const missing = gameState.vertices.filter(v => !vertexMap.has(v.id));
    if (missing.length > 0) {
      console.warn('⚠️ MISSING VERTICES:', missing.map(v => v.id).join(', '));
    }
    
    return {
      hexGrid: Array.from(hexMap.values()),
      vertexPositionMap: vertexMap
    };
  }, [gameState.tiles, gameState.vertices.length]);
  
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
  
  // ===== SVG RENDERING: STRICT LAYER ORDER =====
  return (
    <svg 
      viewBox={viewBox} 
      style={{ width: '100%', height: 'auto', maxHeight: '90vh' }}
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* LAYER 1: EDGES (Background - must be first to appear behind tiles) */}
      <g id="edges-layer">
        {gameState.edges.map(edge => {
          const v1 = vertexPositionMap.get(edge.vertexIds[0]);
          const v2 = vertexPositionMap.get(edge.vertexIds[1]);
          
          // Only render if BOTH vertices exist in map
          if (!v1 || !v2) return null;
          
          const isBuilt = edge.ownerId !== null;
          const ownerPlayer = isBuilt ? gameState.players.find(p => p.id === edge.ownerId) : null;
          const isHighlighted = buildMode === 'ROAD' && !isBuilt;
          
          return (
            <g key={`edge-${edge.id}`}>
              {/* Clickable area (transparent) */}
              <line
                x1={v1.x} y1={v1.y} x2={v2.x} y2={v2.y}
                stroke="transparent"
                strokeWidth="14"
                onClick={() => onEdgeClick(edge.id)}
                style={{ cursor: isBuilt ? 'default' : 'pointer' }}
              />
              {/* Visual line */}
              <line
                x1={v1.x} y1={v1.y} x2={v2.x} y2={v2.y}
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
      
      {/* LAYER 2: TILES (Middle layer - hexagon polygons) */}
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
      
      {/* LAYER 3: NUMBERS & TOKENS (Top layer - must be above tiles) */}
      <g id="numbers-layer" pointerEvents="none">
        {hexGrid.map((hex) => {
          const tile = (hex as any).tileData as typeof gameState.tiles[0];
          if (!tile) return null;
          
          // Get exact center coordinates
          const center = hex.center;
          const cx = center.x;
          const cy = center.y;
          const isRobber = gameState.robberTileId === tile.id;
          const isDesert = tile.resourceType === ResourceType.DESERT;
          
          return (
            <g key={`number-${tile.id}`}>
              {/* Desert Token (dash symbol) */}
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
              
              {/* Dice Number (non-desert tiles) */}
              {tile.diceNumber !== null && !isDesert && (
                <>
                  <circle 
                    cx={cx} 
                    cy={cy} 
                    r={20} 
                    fill="#FAFAFA" 
                    stroke="#333" 
                    strokeWidth="2.5" 
                  />
                  {/* Number - CENTERED with textAnchor + dominantBaseline */}
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
                  style={{ pointerEvents: 'none' }}
                >
                  🦹
                </text>
              )}
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
