import React, { useMemo, useState } from 'react';
import GameBoard from './components/GameBoard';
import PlayerPanel from './components/PlayerPanel';
import BuildMenu from './components/BuildMenu';
import LandingPage from './components/LandingPage';
import { IGameState } from '../src/models/GameState';
import { ResourceType, BuildingType, TurnPhase, GamePhase } from '../src/models/Enums';
import { createInitialGameState } from './utils/gameStateFactory';
import costsData from '../config/costs.json';

type BuildMode = 'ROAD' | 'SETTLEMENT' | 'CITY' | 'DEVELOPMENT_CARD' | null;

const grantSetupResourcesToPlayer = (
  state: IGameState,
  playerId: string,
  vertexId: number
): IGameState => {
  const vertex = state.vertices.find(v => v.id === vertexId);
  if (!vertex) {
    return state;
  }

  const playerIndex = state.players.findIndex(p => p.id === playerId);
  if (playerIndex === -1) {
    return state;
  }

  const resourcesToAdd: Partial<Record<ResourceType, number>> = {};

  vertex.adjacentTileIds.forEach(tileId => {
    const tile = state.tiles.find(t => t.id === tileId);
    if (!tile || tile.resourceType === ResourceType.DESERT || tile.isRobberPresent) {
      return;
    }

    resourcesToAdd[tile.resourceType] = (resourcesToAdd[tile.resourceType] ?? 0) + 1;
  });

  if (Object.keys(resourcesToAdd).length === 0) {
    return state;
  }

  const updatedPlayers = state.players.map((player, index) => {
    if (index !== playerIndex) {
      return player;
    }

    const updatedResources: Record<ResourceType, number> = { ...player.resources };
    for (const [resource, amount] of Object.entries(resourcesToAdd)) {
      const resourceType = resource as ResourceType;
      updatedResources[resourceType] = updatedResources[resourceType] + amount;
    }

    return {
      ...player,
      resources: updatedResources,
    };
  });

  const updatedBankResources: Record<ResourceType, number> = { ...state.bankResources };
  for (const [resource, amount] of Object.entries(resourcesToAdd)) {
    const resourceType = resource as ResourceType;
    updatedBankResources[resourceType] = Math.max(0, updatedBankResources[resourceType] - amount);
  }

  return {
    ...state,
    players: updatedPlayers,
    bankResources: updatedBankResources,
  };
};

const advanceSetupTurnState = (state: IGameState): IGameState => {
  const totalPlayers = state.players.length;
  if (totalPlayers === 0) {
    return state;
  }

  let nextPlayerIndex = state.currentPlayerIndex;
  let setupRound = state.setupRound ?? 1;
  let setupDirection = state.setupDirection ?? 1;

  if (setupDirection === 1) {
    if (nextPlayerIndex < totalPlayers - 1) {
      nextPlayerIndex += 1;
    } else {
      setupDirection = -1;
      setupRound = 2;
    }

    return {
      ...state,
      currentPlayerIndex: nextPlayerIndex,
      setupRound,
      setupDirection,
      turnPhase: TurnPhase.PLACING_SETTLEMENT,
    };
  }

  if (nextPlayerIndex > 0) {
    nextPlayerIndex -= 1;
    return {
      ...state,
      currentPlayerIndex: nextPlayerIndex,
      setupRound,
      setupDirection,
      turnPhase: TurnPhase.PLACING_SETTLEMENT,
    };
  }

  return {
    ...state,
    currentPlayerIndex: 0,
    setupRound: 2,
    setupDirection: -1,
    gamePhase: GamePhase.MAIN_GAME,
    turnPhase: TurnPhase.ROLLING_DICE,
  };
};

const RESERVED_NAMES = ['bank', 'בנק', 'robber', 'שודד', 'admin', 'system'];

const App: React.FC = () => {
  const [gameState, setGameState] = useState<IGameState | null>(null);
  const [buildMenuOpen, setBuildMenuOpen] = useState(false);
  const [buildMode, setBuildMode] = useState<BuildMode>(null);
  const [showDiceResult, setShowDiceResult] = useState(false);
  const [lastDiceResult, setLastDiceResult] = useState<number | null>(null);
  const [isLandingVisible, setIsLandingVisible] = useState(true);
  const [isStartingGame, setIsStartingGame] = useState(false);
  const [savedPlayerNames, setSavedPlayerNames] = useState<string[]>([]);
  const [pendingSetupVertexId, setPendingSetupVertexId] = useState<number | null>(null);

  const reservedNameSet = useMemo(() => new Set(RESERVED_NAMES.map(name => name.toLowerCase())), []);

  const resetSetupState = () => {
    setPendingSetupVertexId(null);
    setBuildMenuOpen(false);
    setBuildMode(null);
    setShowDiceResult(false);
    setLastDiceResult(null);
  };

  const isSetupPhase = gameState?.gamePhase === GamePhase.SETUP;

  const validatePlayerNames = (names: string[]): string | null => {
    const seen = new Set<string>();

    for (const name of names) {
      const normalized = name.trim().toLowerCase();
      if (normalized.length === 0) {
        return 'שם שחקן אינו יכול להיות ריק.';
      }
      if (reservedNameSet.has(normalized)) {
        return `השם "${name}" שמור לשימוש המערכת.`;
      }
      if (seen.has(normalized)) {
        return 'אסור להשתמש באותו שם יותר מפעם אחת.';
      }
      seen.add(normalized);
    }

    return null;
  };

  const handleStartGame = (playerNames: string[]) => {
    try {
      setIsStartingGame(true);
      const sanitizedNames = playerNames
        .slice(0, 4)
        .map((name, index) => name.trim() || `שחקן ${index + 1}`);

      if (sanitizedNames.length < 2) {
        alert('יש לבחור לפחות שני שחקנים.');
        return;
      }

      const validationError = validatePlayerNames(sanitizedNames);
      if (validationError) {
        alert(validationError);
        return;
      }

      resetSetupState();
      const initialState = createInitialGameState(sanitizedNames);
      setGameState(initialState);
      setIsLandingVisible(false);
      setSavedPlayerNames(sanitizedNames);
    } catch (error) {
      console.error('Failed to initialize game:', error);
      alert('שגיאה באתחול המשחק: ' + (error as Error).message);
    } finally {
      setIsStartingGame(false);
    }
  };

  const handleNewGame = () => {
    if (gameState && !window.confirm('להתחיל משחק חדש? ההתקדמות הנוכחית תאופס.')) {
      return;
    }

    if (gameState) {
      setSavedPlayerNames(gameState.players.map(player => player.name));
    }

    setGameState(null);
    resetSetupState();
    setIsLandingVisible(true);
    setIsStartingGame(false);
  };

  const handleSetupSettlementPlacement = (vertexId: number) => {
    if (!gameState) return;
    if (pendingSetupVertexId !== null) {
      alert('יש להציב תחילה דרך מחוברת לכפר שהונח לפני בחירת קודקוד נוסף.');
      return;
    }

    const vertex = gameState.vertices.find(v => v.id === vertexId);
    if (!vertex) return;

    if (vertex.ownerId) {
      alert('המיקום כבר תפוס.');
      return;
    }

    const hasNeighboringSettlement = vertex.adjacentVertexIds.some(adjacentId => {
      const neighbor = gameState.vertices.find(v => v.id === adjacentId);
      return neighbor?.ownerId !== null;
    });

    if (hasNeighboringSettlement) {
      alert('חובה לשמור מרווח של קודקוד אחד בין כפרים.');
      return;
    }

    const currentPlayer = gameState.players[gameState.currentPlayerIndex];

    const updatedVertices = gameState.vertices.map(v =>
      v.id === vertexId
        ? { ...v, ownerId: currentPlayer.id, buildingType: BuildingType.SETTLEMENT }
        : v
    );

    const updatedPlayers = gameState.players.map(p =>
      p.id === currentPlayer.id
        ? {
            ...p,
            settlementsRemaining: p.settlementsRemaining - 1,
            victoryPoints: p.victoryPoints + 1,
          }
        : p
    );

    setGameState({
      ...gameState,
      vertices: updatedVertices,
      players: updatedPlayers,
      turnPhase: TurnPhase.PLACING_SETTLEMENT,
    });
    setPendingSetupVertexId(vertexId);
  };

  const handleSetupRoadPlacement = (edgeId: number) => {
    if (!gameState) return;

    if (pendingSetupVertexId === null) {
      alert('בחר קודם קודקוד להצבת כפר ולאחר מכן בחר דרך סמוכה.');
      return;
    }

    const edge = gameState.edges.find(e => e.id === edgeId);
    if (!edge) return;

    if (edge.ownerId) {
      alert('הדרך כבר תפוסה.');
      return;
    }

    if (!edge.vertexIds.includes(pendingSetupVertexId)) {
      alert('יש לבחור דרך צמודה לכפר שהרגע הונח.');
      return;
    }

    const currentPlayer = gameState.players[gameState.currentPlayerIndex];

    const updatedEdges = gameState.edges.map(e =>
      e.id === edgeId
        ? { ...e, ownerId: currentPlayer.id }
        : e
    );

    const updatedPlayers = gameState.players.map(p =>
      p.id === currentPlayer.id
        ? { ...p, roadsRemaining: p.roadsRemaining - 1 }
        : p
    );

    let nextState: IGameState = {
      ...gameState,
      edges: updatedEdges,
      players: updatedPlayers,
    };

    if ((gameState.setupRound ?? 1) === 2) {
      nextState = grantSetupResourcesToPlayer(nextState, currentPlayer.id, pendingSetupVertexId);
    }

    nextState = advanceSetupTurnState(nextState);

    setGameState(nextState);
    setPendingSetupVertexId(null);
    setBuildMode(null);
  };

  const distributeResources = (roll: number, currentGameState: IGameState): IGameState => {
    if (roll === 7) return currentGameState; // Robber logic not implemented yet

    const newPlayers = [...currentGameState.players];
    
    currentGameState.tiles.forEach(tile => {
      if (tile.diceNumber === roll && !tile.isRobberPresent) {
        tile.adjacentVertexIds.forEach(vertexId => {
          const vertex = currentGameState.vertices.find(v => v.id === vertexId);
          if (vertex && vertex.ownerId) {
            const playerIndex = newPlayers.findIndex(p => p.id === vertex.ownerId);
            if (playerIndex !== -1) {
              const resourceAmount = vertex.buildingType === BuildingType.CITY ? 2 : 1;
              const resourceType = tile.resourceType;
              
              if (resourceType !== ResourceType.DESERT) {
                newPlayers[playerIndex] = {
                  ...newPlayers[playerIndex],
                  resources: {
                    ...newPlayers[playerIndex].resources,
                    [resourceType]: newPlayers[playerIndex].resources[resourceType] + resourceAmount
                  }
                };
              }
            }
          }
        });
      }
    });

    return {
      ...currentGameState,
      players: newPlayers
    };
  };

  const handleVertexClick = (vertexId: number) => {
    if (!gameState) return;

    if (isSetupPhase) {
      handleSetupSettlementPlacement(vertexId);
      return;
    }

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

    if (isSetupPhase) {
      if (pendingSetupVertexId === null) {
        alert('עליך להניח כפר לפני בחירת דרך בשלב ההכנה.');
        return;
      }
      handleSetupRoadPlacement(edgeId);
      return;
    }

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

      let newState: IGameState = {
        ...gameState,
        diceResult: total,
        turnPhase: TurnPhase.MAIN_ACTIONS,
      };

      // חלוקת משאבים
      newState = distributeResources(total, newState);

      setGameState(newState);
      setShowDiceResult(true);
      setLastDiceResult(total);
    } catch (error) {
      console.error('Failed to roll dice:', error);
      alert((error as Error).message);
    }
  };

  const handleCloseDiceResult = () => {
    setShowDiceResult(false);
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
      setShowDiceResult(false);
      setLastDiceResult(null);
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

  if (isLandingVisible || !gameState) {
    return (
      <LandingPage 
        onStartGame={handleStartGame}
        isStarting={isStartingGame}
        initialNames={savedPlayerNames}
        validateNames={validatePlayerNames}
      />
    );
  }

  // חלוקת שחקנים לפאנלים
  const midpoint = Math.ceil(gameState.players.length / 2);
  const leftPlayers = gameState.players.slice(0, midpoint);
  const rightPlayers = gameState.players.slice(midpoint);
  const currentPlayer = gameState.players[gameState.currentPlayerIndex];

  return (
    <div className="game-container">
      {/* פאנל שחקנים שמאל */}
      <div className="players-panel-left">
        {leftPlayers.map((player, index) => (
          <PlayerPanel
            key={player.id}
            player={player}
            isActive={player.id === currentPlayer.id}
          />
        ))}
      </div>

      {/* לוח המשחק */}
      <div className="board-container">
        <div className="game-header">
          <h1>Settlers of Catan</h1>
          <div className="game-phase">
            {gameState.gamePhase === GamePhase.SETUP ? 'שלב הכנה' : 'משחק רגיל'}
          </div>
        </div>
        {isSetupPhase && (
          <div className="setup-instructions">
            {pendingSetupVertexId === null
              ? '⚒️ בחר קודקוד פנוי להצבת כפר חינמי'
              : '🛣️ עכשיו בחר דרך צמודה לכפר שהונח'}
          </div>
        )}

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

        {/* באנר תוצאת קוביות גדול */}
        {showDiceResult && gameState.diceResult && (
          <div className="dice-result" onClick={handleCloseDiceResult}>
            <div className="dice-numbers">
              <div className="die">{Math.floor(gameState.diceResult / 2)}</div>
              <div className="die">{Math.ceil(gameState.diceResult / 2)}</div>
            </div>
            <div className="total">סה"כ: {gameState.diceResult}</div>
            <div className="click-to-close">לחץ לסגירה</div>
          </div>
        )}

        {/* תצוגה קטנה של תוצאה קודמת */}
        {!showDiceResult && lastDiceResult && (
          <div className="last-dice-small">
            🎲 {lastDiceResult}
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
          <button 
            className="action-button ghost" 
            onClick={handleNewGame}
          >
            ↻ משחק חדש
          </button>
        </div>
      </div>

      {/* פאנל שחקנים ימין */}
      <div className="players-panel-right">
        {rightPlayers.map((player, index) => (
          <PlayerPanel
            key={player.id}
            player={player}
            isActive={player.id === currentPlayer.id}
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
