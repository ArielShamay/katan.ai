import React from 'react';
import { IVertex } from '../../src/models/BoardComponents';
import { BuildingType } from '../../src/models/Enums';

interface VertexPointProps {
  vertex: IVertex;
  x: number;
  y: number;
  color?: string;
  onClick: () => void;
  isHighlighted?: boolean;
}

const VertexPoint: React.FC<VertexPointProps> = ({ vertex, x, y, color, onClick, isHighlighted }) => {
  const isOccupied = vertex.buildingType !== BuildingType.NONE;
  const isSettlement = vertex.buildingType === BuildingType.SETTLEMENT;
  const isCity = vertex.buildingType === BuildingType.CITY;

  // גודל הנקודה
  let radius = 8;
  if (isSettlement) radius = 10;
  if (isCity) radius = 14;
  if (isHighlighted && !isOccupied) radius = 12;

  // צבע מילוי
  let fill = 'rgba(255, 255, 255, 0.8)';
  let stroke = '#333';
  let strokeWidth = 2;

  if (isOccupied && color) {
    fill = color;
    stroke = '#fff';
    strokeWidth = 3;
  }

  if (isCity) {
    stroke = '#FFD700';
    strokeWidth = 4;
  }

  if (isHighlighted) {
    fill = isOccupied ? fill : 'rgba(76, 175, 80, 0.7)';
    stroke = '#4CAF50';
    strokeWidth = 4;
  }

  return (
    <g className="vertex-group">
      <circle
        className={`vertex ${isOccupied ? 'occupied' : ''} ${isSettlement ? 'settlement' : ''} ${isCity ? 'city' : ''} ${isHighlighted ? 'highlighted' : ''}`}
        cx={x}
        cy={y}
        r={radius}
        fill={fill}
        stroke={stroke}
        strokeWidth={strokeWidth}
        onClick={onClick}
        style={{ 
          cursor: 'pointer',
          transition: 'all 0.2s ease'
        }}
      />
      
      {/* אייקון לכפר/עיר */}
      {isSettlement && (
        <text
          x={x}
          y={y}
          textAnchor="middle"
          dominantBaseline="middle"
          fill="white"
          fontSize="10"
          fontWeight="bold"
          style={{ pointerEvents: 'none' }}
        >
          🏠
        </text>
      )}
      
      {isCity && (
        <text
          x={x}
          y={y}
          textAnchor="middle"
          dominantBaseline="middle"
          fill="white"
          fontSize="16"
          fontWeight="bold"
          style={{ pointerEvents: 'none' }}
        >
          🏰
        </text>
      )}
    </g>
  );
};

export default VertexPoint;
