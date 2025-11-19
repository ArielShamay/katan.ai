import React from 'react';
import { PortType } from '../../src/models/Enums';

interface PortIndicatorProps {
  portType: PortType;
  x: number;
  y: number;
}

const PortIndicator: React.FC<PortIndicatorProps> = ({ portType, x, y }) => {
  if (portType === PortType.NONE) return null;

  // טקסט וסמל לפי סוג נמל
  const portInfo: Record<string, { label: string; icon: string; color: string }> = {
    [PortType.GENERAL_3_TO_1]: { label: '3:1', icon: '⚓', color: '#2196F3' },
    [PortType.LUMBER_2_TO_1]: { label: '2:1', icon: '🌲', color: '#228B22' },
    [PortType.BRICK_2_TO_1]: { label: '2:1', icon: '🧱', color: '#CD5C5C' },
    [PortType.WOOL_2_TO_1]: { label: '2:1', icon: '🐑', color: '#90EE90' },
    [PortType.GRAIN_2_TO_1]: { label: '2:1', icon: '🌾', color: '#FFD700' },
    [PortType.ORE_2_TO_1]: { label: '2:1', icon: '⛰️', color: '#708090' },
  };

  const info = portInfo[portType];
  if (!info) return null;

  return (
    <g className="port">
      {/* רקע */}
      <circle
        className="port-icon"
        cx={x}
        cy={y}
        r="15"
        fill={info.color}
        stroke="#fff"
        strokeWidth="2"
      />
      
      {/* סמל */}
      <text
        x={x}
        y={y - 2}
        textAnchor="middle"
        dominantBaseline="middle"
        fontSize="16"
        style={{ pointerEvents: 'none' }}
      >
        {info.icon}
      </text>
      
      {/* טקסט יחס */}
      <text
        className="port-text"
        x={x}
        y={y + 25}
        textAnchor="middle"
        fill={info.color}
        fontSize="12"
        fontWeight="bold"
        style={{ pointerEvents: 'none' }}
      >
        {info.label}
      </text>
    </g>
  );
};

export default PortIndicator;
