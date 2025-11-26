/**
 * GameBoard Component - REFACTORED VERSION (GeometryService)
 * 
 * Architecture: Pure Presentational Component
 * - Geometry calculations delegated to GeometryService
 * - Correct layer order: Tiles → Edges → Numbers → Vertices
 * - Single Source of Truth for all pixel positions
 */

import React, { useMemo } from 'react';
import { IGameState } from '../../src/models/GameState';
import { ResourceType, BuildingType } from '../../src/models/Enums';
import { GeometryService } from '../services/GeometryService';

interface GameBoardProps {
  gameState: IGameState;
  onVertexClick: (vertexId: number) => void;
  onEdgeClick: (edgeId: number) => void;
  buildMode: 'ROAD' | 'SETTLEMENT' | 'CITY' | 'DEVELOPMENT_CARD' | null;
}

const GameBoard: React.FC<GameBoardProps> = ({ gameState, onVertexClick, onEdgeClick, buildMode }) => {
  
  // ===== GEOMETRY CALCULATION (Single Source of Truth) =====
  const layout = useMemo(() => {
    return GeometryService.calculateLayout(gameState);
  }, [gameState.tiles, gameState.vertices, gameState.edges]);
  
  // ===== SVG RENDERING: CORRECT LAYER ORDER =====
  return (
    <svg 
      viewBox={`${layout.viewBox.minX} ${layout.viewBox.minY} ${layout.viewBox.width} ${layout.viewBox.height}`} 
      style={{ width: '100%', height: 'auto', maxHeight: '90vh' }}
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* LAYER 1: TILES (Background - must be drawn first) */}
      <g id="tiles-layer">
        {layout.tiles.map(tileData => {
          const tile = tileData.tile;
          const isRobber = gameState.robberTileId === tile.id;
          
          return (
            <polygon
              key={`tile-${tile.id}`}
              points={tileData.polygonPoints}
              fill={tileData.color}
              stroke="#2C2C2C"
              strokeWidth="2.5"
              opacity={isRobber ? 0.5 : 0.95}
            />
          );
        })}
      </g>
      
      {/* LAYER 2: EDGES (Roads - drawn on top of tiles) */}
      <g id="edges-layer">
        {layout.edges.map(edgeData => {
          const edge = edgeData.edge;
          const pos = edgeData.position;
          
          const isBuilt = edge.ownerId !== null;
          const ownerPlayer = isBuilt ? gameState.players.find(p => p.id === edge.ownerId) : null;
          const isHighlighted = buildMode === 'ROAD' && !isBuilt;
          
          return (
            <g key={`edge-${edge.id}`}>
              {/* Clickable area */}
              <line
                x1={pos.x1} y1={pos.y1} x2={pos.x2} y2={pos.y2}
                stroke="transparent"
                strokeWidth="14"
                onClick={() => onEdgeClick(edge.id)}
                style={{ cursor: isBuilt ? 'default' : 'pointer' }}
              />
              {/* Visual line */}
              <line
                x1={pos.x1} y1={pos.y1} x2={pos.x2} y2={pos.y2}
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
      
      {/* LAYER 3: NUMBERS & TOKENS (Above tiles and edges) */}
      <g id="numbers-layer" pointerEvents="none">
        {layout.tiles.map(tileData => {
          const tile = tileData.tile;
          const cx = tileData.center.x;
          const cy = tileData.center.y;
          const isRobber = gameState.robberTileId === tile.id;
          const isDesert = tile.resourceType === ResourceType.DESERT;
          
          return (
            <g key={`number-${tile.id}`}>
              {/* Desert Token */}
              {isDesert && !isRobber && (
                <>
                  <circle cx={cx} cy={cy} r={20} fill="#FAFAFA" stroke="#333" strokeWidth="2.5" />
                  <text x={cx} y={cy} textAnchor="middle" dominantBaseline="central" fontSize="28" fontWeight="bold" fill="#999">
                    -
                  </text>
                </>
              )}
              
              {/* Dice Number */}
              {tile.diceNumber !== null && !isDesert && (
                <>
                  <circle cx={cx} cy={cy} r={20} fill="#FAFAFA" stroke="#333" strokeWidth="2.5" />
                  <text
                    x={cx} y={cy - 2}
                    textAnchor="middle" dominantBaseline="central"
                    fontSize="22" fontWeight="bold"
                    fill={[6, 8].includes(tile.diceNumber) ? '#D32F2F' : '#333'}
                  >
                    {tile.diceNumber}
                  </text>
                  <text x={cx} y={cy + 13} textAnchor="middle" fontSize="9" fill="#666" letterSpacing="1">
                    {'•'.repeat(tile.probability)}
                  </text>
                </>
              )}
              
              {/* Robber */}
              {isRobber && (
                <text x={cx} y={cy} textAnchor="middle" dominantBaseline="central" fontSize="35">
                  🦹
                </text>
              )}
            </g>
          );
        })}
      </g>
      
      {/* LAYER 4: VERTICES (Settlements/Cities - Topmost layer) */}
      <g id="vertices-layer">
        {layout.vertices.map(vertexData => {
          const vertex = vertexData.vertex;
          const pos = vertexData.position;
          
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
              <circle
                cx={pos.x} cy={pos.y} r={radius + 6}
                fill="transparent"
                onClick={() => onVertexClick(vertex.id)}
                style={{ cursor: isBuilt && !isHighlighted ? 'default' : 'pointer' }}
              />
              <circle
                cx={pos.x} cy={pos.y} r={radius}
                fill={isBuilt ? (ownerPlayer?.color || '#FFF') : isHighlighted ? '#43A04750' : 'rgba(255,255,255,0.5)'}
                stroke={isBuilt ? '#FFF' : isHighlighted ? '#43A047' : '#666'}
                strokeWidth={isBuilt ? 3 : isHighlighted ? 2.5 : 1.5}
                opacity={isBuilt ? 1 : isHighlighted ? 0.9 : 0.6}
                pointerEvents="none"
              />
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
