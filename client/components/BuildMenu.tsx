import React from 'react';
import { BuildingType, ResourceType } from '../../src/models/Enums';

interface BuildCost {
  [ResourceType.LUMBER]?: number;
  [ResourceType.BRICK]?: number;
  [ResourceType.WOOL]?: number;
  [ResourceType.GRAIN]?: number;
  [ResourceType.ORE]?: number;
}

interface BuildCosts {
  ROAD: BuildCost;
  SETTLEMENT: BuildCost;
  CITY: BuildCost;
  DEVELOPMENT_CARD: BuildCost;
}

interface BuildMenuProps {
  isOpen: boolean;
  onClose: () => void;
  playerResources: Record<ResourceType, number>;
  buildCosts: BuildCosts;
  onSelectBuildOption: (buildType: 'ROAD' | 'SETTLEMENT' | 'CITY' | 'DEVELOPMENT_CARD') => void;
}

const BuildMenu: React.FC<BuildMenuProps> = ({
  isOpen,
  onClose,
  playerResources,
  buildCosts,
  onSelectBuildOption,
}) => {
  if (!isOpen) return null;

  const canAfford = (cost: BuildCost): boolean => {
    return Object.entries(cost).every(([resource, amount]) => {
      return playerResources[resource as ResourceType] >= amount;
    });
  };

  const buildOptions = [
    {
      id: 'ROAD' as const,
      name: 'דרך',
      icon: '🛣️',
      cost: buildCosts.ROAD,
    },
    {
      id: 'SETTLEMENT' as const,
      name: 'כפר',
      icon: '🏘️',
      cost: buildCosts.SETTLEMENT,
    },
    {
      id: 'CITY' as const,
      name: 'עיר',
      icon: '🏰',
      cost: buildCosts.CITY,
    },
    {
      id: 'DEVELOPMENT_CARD' as const,
      name: 'קלף התפתחות',
      icon: '📜',
      cost: buildCosts.DEVELOPMENT_CARD,
    },
  ];

  const resourceIcons: Record<ResourceType, string> = {
    [ResourceType.LUMBER]: '🌲',
    [ResourceType.BRICK]: '🧱',
    [ResourceType.WOOL]: '🐑',
    [ResourceType.GRAIN]: '🌾',
    [ResourceType.ORE]: '⛰️',
    [ResourceType.DESERT]: '🏜️',
  };

  const resourceNames: Record<ResourceType, string> = {
    [ResourceType.LUMBER]: 'עץ',
    [ResourceType.BRICK]: 'לבנים',
    [ResourceType.WOOL]: 'צמר',
    [ResourceType.GRAIN]: 'חיטה',
    [ResourceType.ORE]: 'עפרות',
    [ResourceType.DESERT]: 'מדבר',
  };

  return (
    <div className="build-menu-overlay" onClick={onClose}>
      <div className="build-menu" onClick={(e) => e.stopPropagation()}>
        <div className="build-menu-header">
          <h2>בחר מה לבנות</h2>
          <button className="close-btn" onClick={onClose}>✕</button>
        </div>

        <div className="build-options">
          {buildOptions.map((option) => {
            const affordable = canAfford(option.cost);
            return (
              <button
                key={option.id}
                className={`build-option ${affordable ? '' : 'disabled'}`}
                onClick={() => {
                  if (affordable) {
                    onSelectBuildOption(option.id);
                    onClose();
                  }
                }}
                disabled={!affordable}
              >
                <div className="build-option-icon">{option.icon}</div>
                <div className="build-option-name">{option.name}</div>
                <div className="build-option-cost">
                  {Object.entries(option.cost).map(([resource, amount]) => (
                    <div key={resource} className="cost-item">
                      <span className="cost-icon">
                        {resourceIcons[resource as ResourceType]}
                      </span>
                      <span className="cost-amount">×{amount}</span>
                    </div>
                  ))}
                </div>
                {!affordable && (
                  <div className="not-affordable-badge">לא מספיק משאבים</div>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default BuildMenu;
