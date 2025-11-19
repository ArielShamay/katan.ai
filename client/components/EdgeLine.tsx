import React from 'react';
import { IEdge } from '../../src/models/BoardComponents';

interface EdgeLineProps {
  edge: IEdge;
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  color?: string;
  onClick: () => void;
  isHighlighted?: boolean;
}

const EdgeLine: React.FC<EdgeLineProps> = ({ edge, x1, y1, x2, y2, color, onClick, isHighlighted }) => {
  const isOccupied = edge.ownerId !== null;

  return (
    <line
      className={`edge ${isOccupied ? 'occupied' : ''} ${isHighlighted ? 'highlighted' : ''}`}
      x1={x1}
      y1={y1}
      x2={x2}
      y2={y2}
      stroke={isOccupied && color ? color : isHighlighted ? 'rgba(76, 175, 80, 0.6)' : 'rgba(100, 100, 100, 0.3)'}
      strokeWidth={isOccupied ? 10 : isHighlighted ? 8 : 6}
      strokeLinecap="round"
      onClick={!isOccupied ? onClick : undefined}
      style={{
        cursor: isOccupied ? 'not-allowed' : 'pointer',
        transition: 'all 0.2s ease',
      }}
    />
  );
};

export default EdgeLine;
