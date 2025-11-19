import React, { useState, useEffect } from 'react';
import GameBoard from './components/GameBoard';
import PlayerPanel from './components/PlayerPanel';
import BuildMenu from './components/BuildMenu';
import { IGameState } from '../src/models/GameState';
import { ActionType, ResourceType, BuildingType, TurnPhase } from '../src/models/Enums';
import { createRealGameState } from './utils/gameStateFactory';
import costsData from '../config/costs.json';

type BuildMode = 'ROAD' | 'SETTLEMENT' | 'CITY' | 'DEVELOPMENT_CARD' | null;

const App: React.FC = () => {
  const [gameState, setGameState] = useState<IGameState | null>(null);
  const [buildMenuOpen, setBuildMenuOpen] = useState(false);
  const [buildMode, setBuildMode] = useState<BuildMode>(null);

  useEffect(() => {
    // אתחול משחק עם 4 שחקנים
    const initGame = async () => {
      try {
        // יצירת לוח אמיתי מהקונפיגורציה
        const initialState = createRealGameState();
        setGameState(initialState);
      } catch (error) {
        console.error('Failed to initialize game:', error);
        alert('שגיאה באתחול המשחק: ' + (error as Error).message);
      }
    };

    initGame();
  }, []);

  const handleVertexClick = (vertexId: number) => {
    if (!gameState) return;

    try {
      const currentPlayer = gameState.players[gameState.currentPlayerIndex];
      const vertex = gameState.vertices[vertexId];
      
      // במצב בנייה של כפר או עיר
      if (buildMode === 'SETTLEMENT' || buildMode === 'CITY') {
        if (vertex.ownerId && buildMode === 'SETTLEMENT') {
          alert('מיקום תפוס!');
          return;
        }

        if (buildMode === 'CITY' && vertex.ownerId !== currentPlayer.id) {
          alert('ניתן לשדרג רק כפרים שלך!');
          return;
        }

        if (buildMode === 'CITY' && vertex.buildingType !== BuildingType.SETTLEMENT) {
          alert('ניתן לשדרג רק כפרים!');
          return;
        }

        // עדכון הקודקוד
        const newBuildingType = buildMode === 'SETTLEMENT' ? BuildingType.SETTLEMENT : BuildingType.CITY;
        const newVertices = gameState.vertices.map(v =>
          v.id === vertexId
            ? { ...v, ownerId: currentPlayer.id, buildingType: newBuildingType }
            : v
        );

        // עדכון השחקן
        const vpGain = buildMode === 'SETTLEMENT' ? 1 : 1; // עיר נותנת +1 נוסף (סה"כ 2)
        const newPlayers = gameState.players.map(p => {
          if (p.id !== currentPlayer.id) return p;
          
          if (buildMode === 'SETTLEMENT') {
            return { 
              ...p, 
              settlementsRemaining: p.settlementsRemaining - 1, 
              victoryPoints: p.victoryPoints + vpGain,
              resources: {
                ...p.resources,
                [ResourceType.LUMBER]: p.resources[ResourceType.LUMBER] - 1,
                [ResourceType.BRICK]: p.resources[ResourceType.BRICK] - 1,
                [ResourceType.WOOL]: p.resources[ResourceType.WOOL] - 1,
                [ResourceType.GRAIN]: p.resources[ResourceType.GRAIN] - 1,
              }
            };
          } else {
            return { 
              ...p, 
              citiesRemaining: p.citiesRemaining - 1,
              settlementsRemaining: p.settlementsRemaining + 1, // מחזיר כפר למלאי
              victoryPoints: p.victoryPoints + vpGain,
              resources: {
                ...p.resources,
                [ResourceType.ORE]: p.resources[ResourceType.ORE] - 3,
                [ResourceType.GRAIN]: p.resources[ResourceType.GRAIN] - 2,
              }
            };
          }
        });

        setGameState({
          ...gameState,
          vertices: newVertices,
          players: newPlayers,
        });

        // יציאה ממצב בנייה
        setBuildMode(null);
        return;
      }

      // מצב רגיל - הצגת מידע על הקודקוד
      if (vertex.ownerId) {
        const owner = gameState.players.find(p => p.id === vertex.ownerId);
        alert(`שייך ל: ${owner?.name} (${vertex.buildingType})`);
      }
    } catch (error) {
      console.error('Failed to handle vertex click:', error);
      alert((error as Error).message);
    }
  };

  const handleEdgeClick = (edgeId: number) => {
    if (!gameState) return;

    try {
      const currentPlayer = gameState.players[gameState.currentPlayerIndex];
      const edge = gameState.edges[edgeId];
      
      // במצב בנייה של דרך
      if (buildMode === 'ROAD') {
        if (edge.ownerId) {
          alert('מיקום תפוס!');
          return;
        }

        // עדכון הצלע
        const newEdges = gameState.edges.map(e =>
          e.id === edgeId
            ? { ...e, ownerId: currentPlayer.id }
            : e
        );

        // עדכון השחקן
        const newPlayers = gameState.players.map(p =>
          p.id === currentPlayer.id
            ? { 
                ...p, 
                roadsRemaining: p.roadsRemaining - 1,
                resources: {
                  ...p.resources,
                  [ResourceType.LUMBER]: p.resources[ResourceType.LUMBER] - 1,
                  [ResourceType.BRICK]: p.resources[ResourceType.BRICK] - 1,
                }
              }
            : p
        );

        setGameState({
          ...gameState,
          edges: newEdges,
          players: newPlayers,
        });

        // יציאה ממצב בנייה
        setBuildMode(null);
        return;
      }

      // מצב רגיל - הצגת מידע על הצלע
      if (edge.ownerId) {
        const owner = gameState.players.find(p => p.id === edge.ownerId);
        alert(`דרך של: ${owner?.name}`);
      }
    } catch (error) {
      console.error('Failed to handle edge click:', error);
      alert((error as Error).message);
    }
  };

  const handleRollDice = () => {
    if (!gameState) return;

    try {
      // הטלת קוביות אקראית
      const die1 = Math.floor(Math.random() * 6) + 1;
      const die2 = Math.floor(Math.random() * 6) + 1;
      const total = die1 + die2;

      setGameState({
        ...gameState,
        diceResult: total,
        turnPhase: TurnPhase.MAIN_ACTIONS,
      });
    } catch (error) {
      console.error('Failed to roll dice:', error);
      alert((error as Error).message);
    }
  };

  const handleEndTurn = () => {
    if (!gameState) return;

    try {
      const nextPlayerIndex = (gameState.currentPlayerIndex + 1) % gameState.players.length;

      setGameState({
        ...gameState,
        currentPlayerIndex: nextPlayerIndex,
        turnPhase: TurnPhase.ROLLING_DICE,
        diceResult: null,
      });
      
      // ביטול מצב בנייה אם קיים
      setBuildMode(null);
    } catch (error) {
      console.error('Failed to end turn:', error);
      alert((error as Error).message);
    }
  };

  const handleBuildClick = () => {
    setBuildMenuOpen(true);
  };

  const handleSelectBuildOption = (buildType: 'ROAD' | 'SETTLEMENT' | 'CITY' | 'DEVELOPMENT_CARD') => {
    if (buildType === 'DEVELOPMENT_CARD') {
      // רכישת קלף התפתחות - לא צריך בחירת מיקום
      if (!gameState) return;
      
      const currentPlayer = gameState.players[gameState.currentPlayerIndex];
      const newPlayers = gameState.players.map(p =>
        p.id === currentPlayer.id
          ? {
              ...p,
              resources: {
                ...p.resources,
                [ResourceType.ORE]: p.resources[ResourceType.ORE] - 1,
                [ResourceType.WOOL]: p.resources[ResourceType.WOOL] - 1,
                [ResourceType.GRAIN]: p.resources[ResourceType.GRAIN] - 1,
              }
            }
          : p
      );
      
      setGameState({
        ...gameState,
        players: newPlayers,
      });
      
      alert('קנית קלף התפתחות! (ייושם במלואו בעתיד)');
    } else {
      // כניסה למצב בחירת מיקום
      setBuildMode(buildType);
    }
  };

  if (!gameState) {
    return (
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center', 
        height: '100vh',
        color: 'white',
        fontSize: '2rem'
      }}>
        טוען משחק...
      </div>
    );
  }

  // חלוקת שחקנים לפאנלים
  const leftPlayers = gameState.players.slice(0, 2);
  const rightPlayers = gameState.players.slice(2);
  const currentPlayer = gameState.players[gameState.currentPlayerIndex];

  return (
    <div className="game-container">
      {/* פאנל שחקנים שמאל */}
      <div className="players-panel-left">
        {leftPlayers.map((player, index) => (
          <PlayerPanel
            key={player.id}
            player={player}
            isActive={index === gameState.currentPlayerIndex}
          />
        ))}
      </div>

      {/* לוח המשחק */}
      <div className="board-container">
        <div className="game-header">
          <h1>Settlers of Catan</h1>
          <div className="game-phase">
            {gameState.gamePhase === 'SETUP' ? 'שלב הכנה' : 'משחק רגיל'}
          </div>
        </div>

        {buildMode && (
          <div className="build-mode-banner">
            <div className="build-mode-text">
              {buildMode === 'ROAD' && '🛣️ בחר צלע לבניית דרך'}
              {buildMode === 'SETTLEMENT' && '🏘️ בחר קודקוד לבניית כפר'}
              {buildMode === 'CITY' && '🏰 בחר כפר שלך לשדרוג לעיר'}
            </div>
            <button className="cancel-build-btn" onClick={() => setBuildMode(null)}>
              ביטול
            </button>
          </div>
        )}

        <GameBoard
          gameState={gameState}
          onVertexClick={handleVertexClick}
          onEdgeClick={handleEdgeClick}
          buildMode={buildMode}
        />

        {gameState.diceResult && (
          <div className="dice-result">
            <div className="dice-numbers">
              <div className="die">{Math.floor(gameState.diceResult / 2)}</div>
              <div className="die">{Math.ceil(gameState.diceResult / 2)}</div>
            </div>
            <div className="total">סה"כ: {gameState.diceResult}</div>
          </div>
        )}

        <div className="action-buttons">
          <button 
            className="action-button" 
            onClick={handleRollDice}
            disabled={gameState.turnPhase !== 'ROLLING_DICE'}
          >
            🎲 הטל קוביות
          </button>
          <button 
            className="action-button build-btn" 
            onClick={handleBuildClick}
            disabled={buildMode !== null}
          >
            🏗️ בנייה
          </button>
          <button 
            className="action-button secondary" 
            onClick={handleEndTurn}
          >
            ✓ סיים תור
          </button>
        </div>
      </div>

      {/* פאנל שחקנים ימין */}
      <div className="players-panel-right">
        {rightPlayers.map((player, index) => (
          <PlayerPanel
            key={player.id}
            player={player}
            isActive={index + 2 === gameState.currentPlayerIndex}
          />
        ))}
      </div>

      {/* תפריט בנייה */}
      <BuildMenu
        isOpen={buildMenuOpen}
        onClose={() => setBuildMenuOpen(false)}
        playerResources={currentPlayer.resources}
        buildCosts={costsData.costs}
        onSelectBuildOption={handleSelectBuildOption}
      />
    </div>
  );
};

export default App;
