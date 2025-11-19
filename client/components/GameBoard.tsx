import React from 'react';
import { IGameState } from '../../src/models/GameState';
import { ResourceType, BuildingType } from '../../src/models/Enums';
import HexTile from './HexTile';
import VertexPoint from './VertexPoint';
import EdgeLine from './EdgeLine';
import PortIndicator from './PortIndicator';
import { BOARD_LAYOUT } from '../utils/gameStateFactory';

interface GameBoardProps {
  gameState: IGameState;
  onVertexClick: (vertexId: number) => void;
  onEdgeClick: (edgeId: number) => void;
  buildMode: 'ROAD' | 'SETTLEMENT' | 'CITY' | null;
}

const GameBoard: React.FC<GameBoardProps> = ({ gameState, onVertexClick, onEdgeClick, buildMode }) => {
  const hexSize = 80; // הגדלת גודל צלע המשושה מ-70 ל-80
  const hexHeight = hexSize * 2;
  const hexWidth = Math.sqrt(3) * hexSize;

  // חישוב מיקום מרכז אריח לפי row ו-col
  const getHexCenter = (row: number, col: number, offsetX: number): { x: number; y: number } => {
    const x = col * hexWidth + offsetX * hexWidth;
    const y = row * (hexHeight * 0.75);
    return { x, y };
  };

  // חישוב קודקודי משושה (6 נקודות)
  const getHexCorners = (cx: number, cy: number): Array<{ x: number; y: number }> => {
    const corners: Array<{ x: number; y: number }> = [];
    for (let i = 0; i < 6; i++) {
      const angle = (Math.PI / 3) * i - Math.PI / 2; // התחלה מהנקודה העליונה
      corners.push({
        x: cx + hexSize * Math.cos(angle),
        y: cy + hexSize * Math.sin(angle),
      });
    }
    return corners;
  };

  // בניית מיפוי של vertexId למיקום פיזי
  const vertexPositions = new Map<number, { x: number; y: number }>();
  
  BOARD_LAYOUT.forEach((layout) => {
    const tile = gameState.tiles.find(t => t.id === layout.tileId);
    if (!tile) return;
    
    const center = getHexCenter(layout.row, layout.col, layout.offsetX);
    const corners = getHexCorners(center.x, center.y);
    
    // מיפוי כל קודקוד של האריח למיקום הפיזי שלו
    tile.adjacentVertexIds.forEach((vertexId, index) => {
      if (!vertexPositions.has(vertexId)) {
        vertexPositions.set(vertexId, corners[index]);
      }
    });
  });

  // חישוב ממדים כוללים
  const boardWidth = hexWidth * 6 + 100;
  const boardHeight = hexHeight * 5 + 100;
  const offsetX = 50;
  const offsetY = 50;

  return (
    <svg 
      className="board-svg" 
      viewBox={`0 0 ${boardWidth} ${boardHeight}`}
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        {/* פילטר לצל */}
        <filter id="shadow" x="-50%" y="-50%" width="200%" height="200%">
          <feDropShadow dx="2" dy="2" stdDeviation="3" floodOpacity="0.3" />
        </filter>
      </defs>

      {/* רקע */}
      <rect width={boardWidth} height={boardHeight} fill="#87CEEB" opacity="0.2" />

      {/* קווים (Edges) - שכבה תחתונה */}
      <g className="edges-layer">
        {gameState.edges.map((edge) => {
          const v1Pos = vertexPositions.get(edge.vertexIds[0]);
          const v2Pos = vertexPositions.get(edge.vertexIds[1]);
          
          if (!v1Pos || !v2Pos) return null;

          const ownerPlayer = edge.ownerId
            ? gameState.players.find((p) => p.id === edge.ownerId)
            : null;

          // הדגשת צלעות פנויות במצב בניית דרך
          const isHighlighted = buildMode === 'ROAD' && !edge.ownerId;

          return (
            <EdgeLine
              key={edge.id}
              edge={edge}
              x1={v1Pos.x + offsetX}
              y1={v1Pos.y + offsetY}
              x2={v2Pos.x + offsetX}
              y2={v2Pos.y + offsetY}
              color={ownerPlayer?.color}
              onClick={() => onEdgeClick(edge.id)}
              isHighlighted={isHighlighted}
            />
          );
        })}
      </g>

      {/* אריחים (Tiles) */}
      <g className="tiles-layer">
        {BOARD_LAYOUT.map((layout) => {
          const tile = gameState.tiles.find(t => t.id === layout.tileId);
          if (!tile) return null;
          
          const center = getHexCenter(layout.row, layout.col, layout.offsetX);

          return (
            <HexTile
              key={tile.id}
              tile={tile}
              x={center.x + offsetX}
              y={center.y + offsetY}
              size={hexSize}
            />
          );
        })}
      </g>

      {/* קודקודים (Vertices) */}
      <g className="vertices-layer">
        {gameState.vertices.map((vertex) => {
          const pos = vertexPositions.get(vertex.id);
          if (!pos) return null;

          const ownerPlayer = vertex.ownerId
            ? gameState.players.find((p) => p.id === vertex.ownerId)
            : null;

          // הדגשת קודקודים פנויים במצב בניית כפר
          // או קודקודים עם כפרים במצב שדרוג לעיר
          const isHighlighted = 
            (buildMode === 'SETTLEMENT' && !vertex.ownerId) ||
            (buildMode === 'CITY' && vertex.ownerId === gameState.players[gameState.currentPlayerIndex].id && vertex.buildingType === BuildingType.SETTLEMENT);

          return (
            <VertexPoint
              key={vertex.id}
              vertex={vertex}
              x={pos.x + offsetX}
              y={pos.y + offsetY}
              color={ownerPlayer?.color}
              onClick={() => onVertexClick(vertex.id)}
              isHighlighted={isHighlighted}
            />
          );
        })}
      </g>

      {/* נמלים */}
      <g className="ports-layer">
        {gameState.vertices
          .filter((v) => v.portType !== 'NONE')
          .map((vertex) => {
            const pos = vertexPositions.get(vertex.id);
            if (!pos) return null;

            return (
              <PortIndicator
                key={`port-${vertex.id}`}
                portType={vertex.portType}
                x={pos.x + offsetX}
                y={pos.y + offsetY}
              />
            );
          })}
      </g>
    </svg>
  );
};

export default GameBoard;
