import React from 'react';
import { ITile } from '../../src/models/BoardComponents';
import { ResourceType } from '../../src/models/Enums';

interface HexTileProps {
  tile: ITile;
  x: number;
  y: number;
  size: number;
}

const HexTile: React.FC<HexTileProps> = ({ tile, x, y, size }) => {
  // חישוב נקודות המשושה
  const getHexPoints = (): string => {
    const points: string[] = [];
    for (let i = 0; i < 6; i++) {
      const angle = (Math.PI / 3) * i - Math.PI / 2;
      const px = x + size * Math.cos(angle);
      const py = y + size * Math.sin(angle);
      points.push(`${px},${py}`);
    }
    return points.join(' ');
  };

  // צבעים לפי סוג משאב
  const resourceColors: Record<ResourceType, string> = {
    [ResourceType.LUMBER]: '#228B22',
    [ResourceType.BRICK]: '#CD5C5C',
    [ResourceType.WOOL]: '#90EE90',
    [ResourceType.GRAIN]: '#FFD700',
    [ResourceType.ORE]: '#708090',
    [ResourceType.DESERT]: '#F4A460',
  };

  // טקסט לסוג משאב
  const resourceLabels: Record<ResourceType, string> = {
    [ResourceType.LUMBER]: 'יער',
    [ResourceType.BRICK]: 'חומר',
    [ResourceType.WOOL]: 'צמר',
    [ResourceType.GRAIN]: 'חיטה',
    [ResourceType.ORE]: 'עפרות',
    [ResourceType.DESERT]: 'מדבר',
  };

  const color = resourceColors[tile.resourceType];
  const label = resourceLabels[tile.resourceType];

  return (
    <g className="hex-tile-group">
      {/* משושה */}
      <polygon
        points={getHexPoints()}
        className={`hex-tile ${tile.resourceType.toLowerCase()}`}
        fill={color}
        stroke="#333"
        strokeWidth="2"
      />

      {/* טקסט סוג משאב */}
      <text
        x={x}
        y={y - 15}
        textAnchor="middle"
        fill="white"
        fontSize="14"
        fontWeight="bold"
        style={{ pointerEvents: 'none', textShadow: '1px 1px 2px rgba(0,0,0,0.5)' }}
      >
        {label}
      </text>

      {/* מספר קובייה */}
      {tile.diceNumber && (
        <>
          <circle
            className="dice-number-bg"
            cx={x}
            cy={y + 5}
            r="20"
            fill="#333"
            opacity="0.8"
          />
          <text
            className="dice-number"
            x={x}
            y={y + 5}
            textAnchor="middle"
            dominantBaseline="middle"
            fill="#fff"
            fontSize="24"
            fontWeight="bold"
          >
            {tile.diceNumber}
          </text>
          {/* נקודות הסתברות */}
          <text
            x={x}
            y={y + 22}
            textAnchor="middle"
            fill="white"
            fontSize="10"
            style={{ pointerEvents: 'none' }}
          >
            {'•'.repeat(tile.probability)}
          </text>
        </>
      )}

      {/* שודד */}
      {tile.isRobberPresent && (
        <g className="robber">
          <circle cx={x} cy={y - 35} r="12" fill="#000" stroke="#fff" strokeWidth="2" />
          <text
            x={x}
            y={y - 35}
            textAnchor="middle"
            dominantBaseline="middle"
            fill="#fff"
            fontSize="18"
          >
            🦹
          </text>
        </g>
      )}
    </g>
  );
};

export default HexTile;
