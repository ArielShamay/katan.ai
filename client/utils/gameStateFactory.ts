/**
 * gameStateFactory - Client-Side Game State Initialization
 * 
 * REFACTORED: Uses ProceduralBoardGenerator
 * - All topology generated procedurally (no static JSON)
 * - No BOARD_LAYOUT array (no duplication)
 * - Pure client-side logic
 */

import { IGameState } from '../../src/models/GameState';
import { ProceduralBoardGenerator } from '../../src/board/ProceduralBoardGenerator';
import { IPlayerState } from '../../src/models/Player';
import { ResourceType } from '../../src/models/Enums';

const PLAYER_COLORS = ['#E53935', '#1E88E5', '#43A047', '#FB8C00'];

/**
 * יצירת שחקנים התחלתיים בהתאם לשמות שנבחרו במסך הנחיתה
 */
function createPlayers(chosenNames?: string[]): IPlayerState[] {
  const sanitizedNames = chosenNames?.slice(0, PLAYER_COLORS.length);
  const totalPlayers = sanitizedNames?.length ?? PLAYER_COLORS.length;

  return Array.from({ length: totalPlayers }, (_, index) => ({
    id: `player-${index + 1}`,
    name: sanitizedNames?.[index]?.trim() || `שחקן ${index + 1}`,
    color: PLAYER_COLORS[index % PLAYER_COLORS.length],
    resources: {
      [ResourceType.LUMBER]: 0,
      [ResourceType.BRICK]: 0,
      [ResourceType.WOOL]: 0,
      [ResourceType.GRAIN]: 0,
      [ResourceType.ORE]: 0,
      [ResourceType.DESERT]: 0,
    },
    developmentCards: [],
    developmentCardsPlayedThisTurn: [],
    hasRolledDice: false,
    settlementsRemaining: 5,
    citiesRemaining: 4,
    roadsRemaining: 15,
    victoryPoints: 0,
    hiddenVictoryPoints: 0,
    knightsPlayed: 0,
    longestRoadLength: 0,
    hasLongestRoad: false,
    hasLargestArmy: false,
  }));
}

/**
 * יצירת מצב משחק התחלתי מלא
 */
export function createInitialGameState(playerNames?: string[]): IGameState {
  // Generate board procedurally (tiles, vertices, edges)
  const baseState = ProceduralBoardGenerator.generateInitialGameState();
  
  // Add players
  return {
    ...baseState,
    players: createPlayers(playerNames),
  };
}
