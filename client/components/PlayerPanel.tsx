import React, { useState } from 'react';
import { IPlayerState } from '../../src/models/Player';
import { ResourceType } from '../../src/models/Enums';

interface PlayerPanelProps {
  player: IPlayerState;
  isActive: boolean;
}

const PlayerPanel: React.FC<PlayerPanelProps> = ({ player, isActive }) => {
  const [showResources, setShowResources] = useState(false);

  const totalResources = Object.values(player.resources).reduce((sum, count) => sum + count, 0);

  const resourceNames: Record<ResourceType, string> = {
    [ResourceType.LUMBER]: 'עץ',
    [ResourceType.BRICK]: 'לבנים',
    [ResourceType.WOOL]: 'צמר',
    [ResourceType.GRAIN]: 'חיטה',
    [ResourceType.ORE]: 'עפרות',
    [ResourceType.DESERT]: 'מדבר',
  };

  const resourceIcons: Record<ResourceType, string> = {
    [ResourceType.LUMBER]: '🌲',
    [ResourceType.BRICK]: '🧱',
    [ResourceType.WOOL]: '🐑',
    [ResourceType.GRAIN]: '🌾',
    [ResourceType.ORE]: '⛰️',
    [ResourceType.DESERT]: '🏜️',
  };

  return (
    <>
      <div 
        className={`player-card ${isActive ? 'active' : ''}`}
        onClick={() => setShowResources(true)}
      >
        <div className="player-header">
          <div 
            className="player-color-indicator" 
            style={{ backgroundColor: player.color }}
          />
          <div className="player-info">
            <h3>{player.name}</h3>
            <div className="victory-points">🏆 {player.victoryPoints} נקודות</div>
          </div>
        </div>

        <div className="player-stats">
          <div className="stat-item">
            <span className="label">משאבים</span>
            <span className="value">🎴 {totalResources}</span>
          </div>
          <div className="stat-item">
            <span className="label">כבישים</span>
            <span className="value">🛣️ {15 - player.roadsRemaining}/15</span>
          </div>
        </div>

        <div className="player-stats">
          <div className="stat-item">
            <span className="label">כפרים</span>
            <span className="value">🏘️ {5 - player.settlementsRemaining}/5</span>
          </div>
          <div className="stat-item">
            <span className="label">ערים</span>
            <span className="value">🏰 {4 - player.citiesRemaining}/4</span>
          </div>
        </div>

        <div className="player-stats">
          <div className="stat-item">
            <span className="label">קלפי פיתוח</span>
            <span className="value">📜 {player.developmentCards.length}</span>
          </div>
          <div className="stat-item">
            <span className="label">אבירים</span>
            <span className="value">⚔️ {player.knightsPlayed}</span>
          </div>
        </div>
      </div>

      {/* חלון משאבים */}
      {showResources && (
        <div className="resources-modal" onClick={() => setShowResources(false)}>
          <div className="resources-content" onClick={(e) => e.stopPropagation()}>
            <h2>משאבים של {player.name}</h2>
            <div className="resources-grid">
              {(Object.entries(player.resources) as [ResourceType, number][])
                .filter(([type]) => type !== ResourceType.DESERT)
                .map(([type, count]) => (
                  <div key={type} className="resource-item">
                    <div className={`resource-icon ${type.toLowerCase()}`}>
                      {resourceIcons[type]}
                    </div>
                    <div className="resource-info">
                      <span className="name">{resourceNames[type]}</span>
                      <span className="count">{count}</span>
                    </div>
                  </div>
                ))}
            </div>
            <button className="close-button" onClick={() => setShowResources(false)}>
              סגור
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default PlayerPanel;
