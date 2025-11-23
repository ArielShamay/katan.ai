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
    <>
      {/* קו רקע לכל הצלעות - כדי שיהיו נראות */}
      <line
        x1={x1}
        y1={y1}
        x2={x2}
        y2={y2}
        stroke={isOccupied && color ? color : isHighlighted ? '#4CAF50' : 'rgba(150, 150, 150, 0.4)'}
        strokeWidth={isOccupied ? 12 : isHighlighted ? 10 : 6}
        strokeLinecap="round"
        onClick={!isOccupied ? onClick : undefined}
        style={{
          cursor: isOccupied ? 'not-allowed' : 'pointer',
          transition: 'all 0.2s ease',
          pointerEvents: 'stroke',
        }}
      />
      {/* צל לצלעות תפוסות */}
      {isOccupied && color && (
        <line
          x1={x1}
          y1={y1}
          x2={x2}
          y2={y2}
          stroke="rgba(0, 0, 0, 0.3)"
          strokeWidth={14}
          strokeLinecap="round"
          style={{ pointerEvents: 'none' }}
        />
      )}
    </>
  );
};

export default EdgeLine;
