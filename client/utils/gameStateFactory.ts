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

const HEX_SIZE = 85;
const HEX_HEIGHT = HEX_SIZE * 2;
const HEX_WIDTH = Math.sqrt(3) * HEX_SIZE;

const getHexCenter = (row: number, col: number, offsetX: number) => {
  const x = col * HEX_WIDTH + offsetX * HEX_WIDTH;
  const y = row * (HEX_HEIGHT * 0.75);
  return { x, y };
};

const getHexCorners = (cx: number, cy: number) => {
  // משושה flat-top, SVG coordinates (Y חיובי למטה)
  // הסדר בכיוון השעון החל מהפינה השמאלית-עליונה
  // תואם ל-adjacentVertexIds בboard_static.json
  const angles = [150, 90, 30, -30, -90, -150];
  return angles.map(degrees => {
    const angleRad = (degrees * Math.PI) / 180;
    return {
      x: cx + HEX_SIZE * Math.cos(angleRad),
      y: cy + HEX_SIZE * Math.sin(angleRad),
    };
  });
};

// מבנה הלוח הפיזי - 19 אריחים במבנה משושה 3-4-5-4-3
// כל אריח ממופה לפי הקואורדינטות שלו ב-board_static.json
const BOARD_LAYOUT = [
  // שורה 0 - 3 אריחים (r=-2): q = 0, 1, 2
  { tileId: 0, row: 0, col: 0, offsetX: 1 },      // q=0, r=-2
  { tileId: 1, row: 0, col: 1, offsetX: 1 },      // q=1, r=-2
  { tileId: 2, row: 0, col: 2, offsetX: 1 },      // q=2, r=-2
  // שורה 1 - 4 אריחים (r=-1): q = -1, 0, 1, 2
  { tileId: 3, row: 1, col: 0, offsetX: 0.5 },    // q=-1, r=-1
  { tileId: 4, row: 1, col: 1, offsetX: 0.5 },    // q=0, r=-1
  { tileId: 5, row: 1, col: 2, offsetX: 0.5 },    // q=1, r=-1
  { tileId: 6, row: 1, col: 3, offsetX: 0.5 },    // q=2, r=-1
  // שורה 2 - 5 אריחים (r=0): q = -2, -1, 0, 1, 2 - השורה האמצעית!
  { tileId: 7, row: 2, col: 0, offsetX: 0 },      // q=-2, r=0
  { tileId: 8, row: 2, col: 1, offsetX: 0 },      // q=-1, r=0
  { tileId: 9, row: 2, col: 2, offsetX: 0 },      // q=0, r=0 (המדבר)
  { tileId: 10, row: 2, col: 3, offsetX: 0 },     // q=1, r=0
  { tileId: 18, row: 2, col: 4, offsetX: 0 },     // q=2, r=0
  // שורה 3 - 4 אריחים (r=1): q = -2, -1, 0, 1
  { tileId: 11, row: 3, col: 0, offsetX: 0.5 },   // q=-2, r=1
  { tileId: 12, row: 3, col: 1, offsetX: 0.5 },   // q=-1, r=1
  { tileId: 13, row: 3, col: 2, offsetX: 0.5 },   // q=0, r=1
  { tileId: 14, row: 3, col: 3, offsetX: 0.5 },   // q=1, r=1
  // שורה 4 - 3 אריחים (r=2): q = -2, -1, 0
  { tileId: 15, row: 4, col: 0, offsetX: 1 },     // q=-2, r=2
  { tileId: 16, row: 4, col: 1, offsetX: 1 },     // q=-1, r=2
  { tileId: 17, row: 4, col: 2, offsetX: 1 },     // q=0, r=2
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
      q: tileConfig.q,
      r: tileConfig.r,
      resourceType,
      diceNumber,
      probability: diceNumber ? probabilities[diceNumber] : 0,
      isRobberPresent: isDesert,
      adjacentVertexIds: tileConfig.adjacentVertexIds,
      adjacentEdgeIds: tileConfig.adjacentEdgeIds,
    };
  });

  // 4.1 הוספת מידע גיאומטרי לאריחים
  const tileCenters = new Map<number, { x: number; y: number }>();
  BOARD_LAYOUT.forEach((layout) => {
    tileCenters.set(layout.tileId, getHexCenter(layout.row, layout.col, layout.offsetX));
  });

  // חישוב פעם אחת של כל הפינות לכל אריח
  const tileCorners = new Map<number, Array<{ x: number; y: number }>>();
  BOARD_LAYOUT.forEach((layout) => {
    const center = tileCenters.get(layout.tileId)!;
    tileCorners.set(layout.tileId, getHexCorners(center.x, center.y));
  });

  const tilesWithGeometry: ITile[] = tiles.map((tile) => {
    const center = tileCenters.get(tile.id)!;
    const corners = tileCorners.get(tile.id)!;
    return {
      ...tile,
      center,
      polygonPoints: corners.map((corner) => `${corner.x},${corner.y}`).join(' '),
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

  // 5.1 חישוב מיקום קודקודים - שימוש באותן פינות שחושבו לאריחים
  const vertexPositionsAccumulator = new Map<number, Array<{ x: number; y: number }>>();
  tilesWithGeometry.forEach((tile) => {
    const corners = tileCorners.get(tile.id)!;
    
    tile.adjacentVertexIds.forEach((vertexId, index) => {
      if (!vertexPositionsAccumulator.has(vertexId)) {
        vertexPositionsAccumulator.set(vertexId, []);
      }
      vertexPositionsAccumulator.get(vertexId)!.push(corners[index]);
    });
  });

  const vertexPositions = new Map<number, { x: number; y: number }>();
  vertexPositionsAccumulator.forEach((positions, vertexId) => {
    const avgX = positions.reduce((sum, pos) => sum + pos.x, 0) / positions.length;
    const avgY = positions.reduce((sum, pos) => sum + pos.y, 0) / positions.length;
    vertexPositions.set(vertexId, { x: avgX, y: avgY });
  });

  const verticesWithPositions: IVertex[] = vertices.map((vertex) => ({
    ...vertex,
    position: vertexPositions.get(vertex.id),
  }));

  // 6. יצירת צלעות מהקונפיגורציה
  const edges: IEdge[] = boardConfig.graph_structure.edge_adjacency.edges.map((e: any) => ({
    id: e.edgeId,
    vertexIds: e.vertexIds as [number, number],
    adjacentTileIds: e.adjacentTileIds,
    ownerId: null,
    adjacentEdgeIds: e.adjacentEdgeIds,
  }));

  const edgesWithPositions: IEdge[] = edges.map((edge) => {
    const start = vertexPositions.get(edge.vertexIds[0]);
    const end = vertexPositions.get(edge.vertexIds[1]);
    return {
      ...edge,
      position: start && end ? {
        x1: start.x,
        y1: start.y,
        x2: end.x,
        y2: end.y,
      } : undefined,
    };
  });

  // 7. יצירת שחקנים
  const players: IPlayerState[] = [
    {
      id: 'player1',
      name: 'שחקן 1',
      color: '#FF6B6B',
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
    },
    {
      id: 'player2',
      name: 'שחקן 2',
      color: '#4ECDC4',
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
    },
    {
      id: 'player3',
      name: 'שחקן 3',
      color: '#45B7D1',
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
    },
    {
      id: 'player4',
      name: 'שחקן 4',
      color: '#FFA07A',
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
    },
  ];

  return {
    tiles: tilesWithGeometry,
    edges: edgesWithPositions,
    vertices: verticesWithPositions,
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
    gamePhase: GamePhase.SETUP,
    turnPhase: TurnPhase.PLACING_SETTLEMENT,
    diceResult: null,
    robberTileId: tiles.findIndex(t => t.resourceType === ResourceType.DESERT),
    longestRoadPlayerId: null,
    largestArmyPlayerId: null,
    winner: null,
  };
}

export { BOARD_LAYOUT };
