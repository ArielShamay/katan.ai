/**
 * יוצר מצב משחק אמיתי מהקונפיגורציה
 */

import { IGameState } from '../../src/models/GameState';
import { IPlayerState } from '../../src/models/Player';
import { ITile, IEdge, IVertex } from '../../src/models/BoardComponents';
import { 
  ResourceType, 
  BuildingType, 
  GamePhase, 
  TurnPhase, 
  PortType 
} from '../../src/models/Enums';
import boardConfig from '../../config/board_static.json';

// מבנה הלוח הפיזי - 19 אריחים במבנה משושה
const BOARD_LAYOUT = [
  // שורה 0 - 3 אריחים
  { tileId: 0, row: 0, col: 0, offsetX: 1 },
  { tileId: 1, row: 0, col: 1, offsetX: 1 },
  { tileId: 2, row: 0, col: 2, offsetX: 1 },
  // שורה 1 - 4 אריחים
  { tileId: 3, row: 1, col: 0, offsetX: 0.5 },
  { tileId: 4, row: 1, col: 1, offsetX: 0.5 },
  { tileId: 5, row: 1, col: 2, offsetX: 0.5 },
  { tileId: 6, row: 1, col: 3, offsetX: 0.5 },
  // שורה 2 - 5 אריחים (מרכזית)
  { tileId: 7, row: 2, col: 0, offsetX: 0 },
  { tileId: 8, row: 2, col: 1, offsetX: 0 },
  { tileId: 9, row: 2, col: 2, offsetX: 0 },
  { tileId: 10, row: 2, col: 3, offsetX: 0 },
  { tileId: 11, row: 2, col: 4, offsetX: 0 },
  // שורה 3 - 4 אריחים
  { tileId: 12, row: 3, col: 0, offsetX: 0.5 },
  { tileId: 13, row: 3, col: 1, offsetX: 0.5 },
  { tileId: 14, row: 3, col: 2, offsetX: 0.5 },
  { tileId: 15, row: 3, col: 3, offsetX: 0.5 },
  // שורה 4 - 3 אריחים
  { tileId: 16, row: 4, col: 0, offsetX: 1 },
  { tileId: 17, row: 4, col: 1, offsetX: 1 },
  { tileId: 18, row: 4, col: 2, offsetX: 1 },
];

function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

export function createRealGameState(): IGameState {
  // 1. יצירת משאבים מעורבבים
  const resources: ResourceType[] = [
    ...Array(4).fill(ResourceType.LUMBER),
    ...Array(4).fill(ResourceType.GRAIN),
    ...Array(4).fill(ResourceType.WOOL),
    ...Array(3).fill(ResourceType.BRICK),
    ...Array(3).fill(ResourceType.ORE),
    ResourceType.DESERT,
  ];
  const shuffledResources = shuffleArray(resources);

  // 2. יצירת מספרים מעורבבים
  const diceNumbers = [2, 3, 3, 4, 4, 5, 5, 6, 6, 8, 8, 9, 9, 10, 10, 11, 11, 12];
  const shuffledNumbers = shuffleArray(diceNumbers);

  // 3. מיפוי הסתברויות
  const probabilities: Record<number, number> = {
    2: 1, 3: 2, 4: 3, 5: 4, 6: 5,
    8: 5, 9: 4, 10: 3, 11: 2, 12: 1,
  };

  // 4. יצירת אריחים עם הקונפיגורציה מהקובץ
  const tiles: ITile[] = BOARD_LAYOUT.map((layout, index) => {
    const tileConfig = boardConfig.graph_structure.tiles.tile_layout[layout.tileId];
    const resourceType = shuffledResources[index];
    const isDesert = resourceType === ResourceType.DESERT;
    
    let diceNumber: number | null = null;
    if (!isDesert && shuffledNumbers.length > 0) {
      diceNumber = shuffledNumbers.shift()!;
    }

    return {
      id: layout.tileId,
      resourceType,
      diceNumber,
      probability: diceNumber ? probabilities[diceNumber] : 0,
      isRobberPresent: isDesert,
      adjacentVertexIds: tileConfig.adjacentVertexIds,
      adjacentEdgeIds: tileConfig.adjacentEdgeIds,
    };
  });

  // 5. יצירת קודקודים מהקונפיגורציה
  const vertices: IVertex[] = boardConfig.graph_structure.vertex_adjacency.vertices.map((v: any) => {
    // בדיקה אם הקודקוד הזה הוא נמל
    let portType = PortType.NONE;
    const port = boardConfig.port_locations.ports.find((p: any) => 
      p.vertexIds.includes(v.vertexId)
    );
    if (port) {
      portType = port.type as PortType;
    }

    return {
      id: v.vertexId,
      adjacentTileIds: v.adjacentTileIds,
      adjacentEdgeIds: v.adjacentEdgeIds,
      adjacentVertexIds: v.adjacentVertexIds,
      ownerId: null,
      buildingType: BuildingType.NONE,
      portType,
    };
  });

  // 6. יצירת צלעות מהקונפיגורציה
  const edges: IEdge[] = boardConfig.graph_structure.edge_adjacency.edges.map((e: any) => ({
    id: e.edgeId,
    vertexIds: e.vertexIds as [number, number],
    adjacentTileIds: e.adjacentTileIds,
    ownerId: null,
    adjacentEdgeIds: e.adjacentEdgeIds,
  }));

  // 7. יצירת שחקנים
  const players: IPlayerState[] = [
    {
      id: 'player1',
      name: 'שחקן 1',
      color: '#FF6B6B',
      resources: {
        [ResourceType.LUMBER]: 4,
        [ResourceType.BRICK]: 2,
        [ResourceType.WOOL]: 3,
        [ResourceType.GRAIN]: 2,
        [ResourceType.ORE]: 1,
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
    },
    {
      id: 'player2',
      name: 'שחקן 2',
      color: '#4ECDC4',
      resources: {
        [ResourceType.LUMBER]: 3,
        [ResourceType.BRICK]: 3,
        [ResourceType.WOOL]: 2,
        [ResourceType.GRAIN]: 2,
        [ResourceType.ORE]: 2,
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
    },
    {
      id: 'player3',
      name: 'שחקן 3',
      color: '#45B7D1',
      resources: {
        [ResourceType.LUMBER]: 2,
        [ResourceType.BRICK]: 1,
        [ResourceType.WOOL]: 4,
        [ResourceType.GRAIN]: 3,
        [ResourceType.ORE]: 1,
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
    },
    {
      id: 'player4',
      name: 'שחקן 4',
      color: '#FFA07A',
      resources: {
        [ResourceType.LUMBER]: 2,
        [ResourceType.BRICK]: 2,
        [ResourceType.WOOL]: 1,
        [ResourceType.GRAIN]: 3,
        [ResourceType.ORE]: 3,
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
    },
  ];

  return {
    tiles,
    edges,
    vertices,
    players,
    currentPlayerIndex: 0,
    bankResources: {
      [ResourceType.LUMBER]: 19,
      [ResourceType.BRICK]: 19,
      [ResourceType.WOOL]: 19,
      [ResourceType.GRAIN]: 19,
      [ResourceType.ORE]: 19,
      [ResourceType.DESERT]: 0,
    },
    developmentCardDeck: [],
    gamePhase: GamePhase.MAIN_GAME,
    turnPhase: TurnPhase.ROLLING_DICE,
    diceResult: null,
    robberTileId: tiles.findIndex(t => t.resourceType === ResourceType.DESERT),
    longestRoadPlayerId: null,
    largestArmyPlayerId: null,
    winner: null,
  };
}

export { BOARD_LAYOUT };
