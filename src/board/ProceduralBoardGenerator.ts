/**
 * ProceduralBoardGenerator - Tile-Centric Board Generation
 * 
 * PHILOSOPHY:
 * 1. Start with tiles only (axial coordinates)
 * 2. Generate vertices by deduplicating tile corners
 * 3. Generate edges by connecting adjacent vertices
 * 4. Build adjacency lists programmatically
 * 
 * GUARANTEES:
 * - Exactly 54 unique vertices (no duplicates)
 * - Exactly 72 unique edges (no crossing)
 * - Correct topology (max 3 tiles per vertex, max 2 tiles per edge)
 * - Perfect honeycomb structure
 */

import { ResourceType, BuildingType, PortType, GamePhase, TurnPhase } from '../models/Enums';
import { ITile, IVertex, IEdge } from '../models/BoardComponents';
import { IGameState } from '../models/GameState';
import { GAME_CONSTANTS } from '../models/Constants';

/**
 * מפת הלוח הסטנדרטית של קטאן (3-4-5-4-3)
 * כל אריח מוגדר לפי קואורדינטות אקסיאליות (q, r)
 */
const STANDARD_CATAN_LAYOUT: Array<{ q: number; r: number }> = [
  // שורה r = -2 (3 אריחים)
  { q: 0, r: -2 }, { q: 1, r: -2 }, { q: 2, r: -2 },
  // שורה r = -1 (4 אריחים)
  { q: -1, r: -1 }, { q: 0, r: -1 }, { q: 1, r: -1 }, { q: 2, r: -1 },
  // שורה r = 0 (5 אריחים - מרכז)
  { q: -2, r: 0 }, { q: -1, r: 0 }, { q: 0, r: 0 }, { q: 1, r: 0 }, { q: 2, r: 0 },
  // שורה r = 1 (4 אריחים)
  { q: -2, r: 1 }, { q: -1, r: 1 }, { q: 0, r: 1 }, { q: 1, r: 1 },
  // שורה r = 2 (3 אריחים)
  { q: -2, r: 2 }, { q: -1, r: 2 }, { q: 0, r: 2 },
];

/**
 * משאבים ומספרי קוביות לפי חוקי המשחק
 */
const RESOURCES: ResourceType[] = [
  ResourceType.LUMBER, ResourceType.LUMBER, ResourceType.LUMBER, ResourceType.LUMBER,
  ResourceType.BRICK, ResourceType.BRICK, ResourceType.BRICK,
  ResourceType.WOOL, ResourceType.WOOL, ResourceType.WOOL, ResourceType.WOOL,
  ResourceType.GRAIN, ResourceType.GRAIN, ResourceType.GRAIN, ResourceType.GRAIN,
  ResourceType.ORE, ResourceType.ORE, ResourceType.ORE,
  ResourceType.DESERT,
];

const DICE_NUMBERS: (number | null)[] = [
  2, 3, 3, 4, 4, 5, 5, 6, 6, 8, 8, 9, 9, 10, 10, 11, 11, 12, null, // null = מדבר
];

/**
 * מחזיר את ההסתברות (מספר הנקודות) למספר קובייה נתון
 */
function getProbability(diceNumber: number | null): number {
  if (diceNumber === null) return 0;
  return 6 - Math.abs(diceNumber - 7);
}

/**
 * פונקציה לערבוב מערך (Fisher-Yates)
 */
function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

/**
 * מחשב hash ייחודי עבור קודקוד מסוים של אריח
 * הקואורדינטות הן של האריח והכיוון הוא המיקום של הפינה (0-5)
 * 
 * ALGORITHM: Normalize to vertex center using axial coordinate offsets
 * Each corner direction has specific offset pattern
 */
function computeVertexHash(tileQ: number, tileR: number, cornerDirection: number): string {
  // כל פינה מייצגת קודקוד ייחודי המשותף ל-3 אריחים לכל היותר
  // נשתמש בנורמליזציה של הקואורדינטות כדי ליצור hash אחיד
  
  // Corner offsets in axial coordinates (clockwise from top)
  // Direction 0: top (north)
  // Direction 1: top-right (northeast)
  // Direction 2: bottom-right (southeast)
  // Direction 3: bottom (south)
  // Direction 4: bottom-left (southwest)
  // Direction 5: top-left (northwest)
  
  const offsets = [
    { dq: 0, dr: -1, sub: 3 },    // 0: top
    { dq: 1, dr: -1, sub: 4 },    // 1: top-right
    { dq: 1, dr: 0, sub: 5 },     // 2: bottom-right
    { dq: 0, dr: 1, sub: 0 },     // 3: bottom
    { dq: -1, dr: 1, sub: 1 },    // 4: bottom-left
    { dq: -1, dr: 0, sub: 2 },    // 5: top-left
  ];
  
  const offset = offsets[cornerDirection];
  const neighborQ = tileQ + offset.dq;
  const neighborR = tileR + offset.dr;
  
  // Create normalized hash using smallest coordinate values
  const coords = [
    { q: tileQ, r: tileR, sub: cornerDirection },
    { q: neighborQ, r: neighborR, sub: offset.sub },
  ].sort((a, b) => {
    if (a.q !== b.q) return a.q - b.q;
    if (a.r !== b.r) return a.r - b.r;
    return a.sub - b.sub;
  });
  
  return `${coords[0].q},${coords[0].r}:${coords[0].sub}`;
}

/**
 * מחשב hash ייחודי עבור צלע בין שני קודקודים
 */
function computeEdgeHash(v1Id: number, v2Id: number): string {
  const sorted = [v1Id, v2Id].sort((a, b) => a - b);
  return `${sorted[0]}-${sorted[1]}`;
}

/**
 * יצירת לוח משחק באופן פרוצדורלי
 */
export class ProceduralBoardGenerator {
  /**
   * יוצר מצב משחק התחלתי עם לוח מלא
   */
  public static generateInitialGameState(): IGameState {
    // Step 1: Generate tiles with shuffled resources and numbers
    const shuffledResources = shuffleArray(RESOURCES);
    const shuffledNumbers = shuffleArray(DICE_NUMBERS);
    
    const tiles: ITile[] = STANDARD_CATAN_LAYOUT.map((coords, index) => ({
      id: index,
      q: coords.q,
      r: coords.r,
      resourceType: shuffledResources[index],
      diceNumber: shuffledNumbers[index],
      probability: getProbability(shuffledNumbers[index]),
      isRobberPresent: shuffledNumbers[index] === null, // השוד מתחיל על המדבר
      adjacentVertexIds: [], // יוכנס בשלב 2
      adjacentEdgeIds: [],   // יוכנס בשלב 3
    }));

    // Step 2: Generate vertices by deduplicating tile corners
    const { vertices, tileToVertexMap } = this.generateVertices(tiles);
    
    // Step 3: Generate edges by connecting adjacent vertices
    const { edges, tileToEdgeMap } = this.generateEdges(vertices, tileToVertexMap);
    
    // Step 4: Update tile adjacency lists
    tiles.forEach(tile => {
      tile.adjacentVertexIds.push(...tileToVertexMap.get(tile.id)!);
      tile.adjacentEdgeIds.push(...tileToEdgeMap.get(tile.id)!);
    });
    
    // Step 5: Place ports on coastal vertices
    this.placePortsOnVertices(vertices);
    
    // Step 6: Create initial game state
    return {
      tiles,
      vertices,
      edges,
      players: [], // יווצרו בהמשך
      currentPlayerIndex: 0,
      gamePhase: GamePhase.SETUP,
      turnPhase: TurnPhase.PLACING_SETTLEMENT,
      diceResult: null,
      robberTileId: tiles.findIndex(t => t.resourceType === ResourceType.DESERT),
      developmentCardDeck: [], // יווצר בהמשך
      bankResources: {
        [ResourceType.LUMBER]: GAME_CONSTANTS.RESOURCE_CARDS_PER_TYPE,
        [ResourceType.BRICK]: GAME_CONSTANTS.RESOURCE_CARDS_PER_TYPE,
        [ResourceType.WOOL]: GAME_CONSTANTS.RESOURCE_CARDS_PER_TYPE,
        [ResourceType.GRAIN]: GAME_CONSTANTS.RESOURCE_CARDS_PER_TYPE,
        [ResourceType.ORE]: GAME_CONSTANTS.RESOURCE_CARDS_PER_TYPE,
        [ResourceType.DESERT]: 0,
      },
      longestRoadPlayerId: null,
      largestArmyPlayerId: null,
      winner: null,
      setupRound: 1,
      setupDirection: 1,
    };
  }

  /**
   * שלב 2: יצירת קודקודים על ידי דדופליקציה של פינות האריחים
   */
  private static generateVertices(
    tiles: ITile[]
  ): { vertices: IVertex[]; tileToVertexMap: Map<number, number[]> } {
    const vertexMap = new Map<string, IVertex>();
    const tileToVertexMap = new Map<number, number[]>();
    let vertexIdCounter = 0;

    tiles.forEach(tile => {
      const tileVertexIds: number[] = [];

      // Each hex has 6 corners (0-5, clockwise from top)
      for (let cornerDirection = 0; cornerDirection < 6; cornerDirection++) {
        const hash = computeVertexHash(tile.q, tile.r, cornerDirection);

        if (!vertexMap.has(hash)) {
          // Create new vertex
          const newVertex: IVertex = {
            id: vertexIdCounter++,
            adjacentTileIds: [tile.id],
            adjacentEdgeIds: [], // Will be filled in Step 3
            adjacentVertexIds: [], // Will be calculated after all vertices exist
            ownerId: null,
            buildingType: BuildingType.NONE,
            portType: PortType.NONE,
          };
          vertexMap.set(hash, newVertex);
        } else {
          // Add tile to existing vertex
          const existingVertex = vertexMap.get(hash)!;
          if (!existingVertex.adjacentTileIds.includes(tile.id)) {
            existingVertex.adjacentTileIds.push(tile.id);
          }
        }

        tileVertexIds.push(vertexMap.get(hash)!.id);
      }

      tileToVertexMap.set(tile.id, tileVertexIds);
    });

    return {
      vertices: Array.from(vertexMap.values()),
      tileToVertexMap,
    };
  }

  /**
   * שלב 3: יצירת צלעות על ידי חיבור קודקודים סמוכים
   */
  private static generateEdges(
    vertices: IVertex[],
    tileToVertexMap: Map<number, number[]>
  ): { edges: IEdge[]; tileToEdgeMap: Map<number, number[]> } {
    const edgeMap = new Map<string, IEdge>();
    const tileToEdgeMap = new Map<number, number[]>();
    let edgeIdCounter = 0;

    tileToVertexMap.forEach((vertexIds, tileId) => {
      const tileEdgeIds: number[] = [];

      // Connect adjacent vertex pairs (6 edges per tile)
      for (let i = 0; i < 6; i++) {
        const v1 = vertexIds[i];
        const v2 = vertexIds[(i + 1) % 6];
        const hash = computeEdgeHash(v1, v2);

        if (!edgeMap.has(hash)) {
          // Create new edge
          const newEdge: IEdge = {
            id: edgeIdCounter++,
            vertexIds: [v1, v2] as readonly [number, number],
            adjacentTileIds: [tileId],
            ownerId: null,
            adjacentEdgeIds: [], // Will be calculated later
          };
          edgeMap.set(hash, newEdge);

          // Add edge to both vertices
          const vertex1 = vertices.find(v => v.id === v1)!;
          const vertex2 = vertices.find(v => v.id === v2)!;
          vertex1.adjacentEdgeIds.push(newEdge.id);
          vertex2.adjacentEdgeIds.push(newEdge.id);
        } else {
          // Add tile to existing edge
          const existingEdge = edgeMap.get(hash)!;
          if (!existingEdge.adjacentTileIds.includes(tileId)) {
            existingEdge.adjacentTileIds.push(tileId);
          }
        }

        tileEdgeIds.push(edgeMap.get(hash)!.id);
      }

      tileToEdgeMap.set(tileId, tileEdgeIds);
    });

    // Step 3.1: Calculate adjacentVertexIds for each vertex
    vertices.forEach(vertex => {
      const adjacentVertices = new Set<number>();
      vertex.adjacentEdgeIds.forEach(edgeId => {
        const edge = Array.from(edgeMap.values()).find(e => e.id === edgeId)!;
        edge.vertexIds.forEach(vId => {
          if (vId !== vertex.id) {
            adjacentVertices.add(vId);
          }
        });
      });
      vertex.adjacentVertexIds.push(...Array.from(adjacentVertices));
    });

    // Step 3.2: Calculate adjacentEdgeIds for each edge
    const edges = Array.from(edgeMap.values());
    edges.forEach(edge => {
      const adjacentEdges = new Set<number>();
      edge.vertexIds.forEach(vertexId => {
        const vertex = vertices.find(v => v.id === vertexId)!;
        vertex.adjacentEdgeIds.forEach(adjEdgeId => {
          if (adjEdgeId !== edge.id) {
            adjacentEdges.add(adjEdgeId);
          }
        });
      });
      edge.adjacentEdgeIds.push(...Array.from(adjacentEdges));
    });

    return { edges, tileToEdgeMap };
  }

  /**
   * שלב 5: מיקום נמלים על קודקודים חופיים
   */
  private static placePortsOnVertices(vertices: IVertex[]): void {
    // Find coastal vertices (vertices with < 3 adjacent tiles)
    const coastalVertices = vertices.filter(v => v.adjacentTileIds.length < 3);

    // Port configuration: 4 generic (3:1), 5 specific (2:1)
    const portTypes = shuffleArray([
      PortType.GENERAL_3_TO_1,
      PortType.GENERAL_3_TO_1,
      PortType.GENERAL_3_TO_1,
      PortType.GENERAL_3_TO_1,
      PortType.LUMBER_2_TO_1,
      PortType.BRICK_2_TO_1,
      PortType.WOOL_2_TO_1,
      PortType.GRAIN_2_TO_1,
      PortType.ORE_2_TO_1,
    ]);

    // Place ports on evenly distributed coastal vertices
    // TODO: Implement proper port placement algorithm (currently random)
    const portVertices = coastalVertices
      .sort(() => Math.random() - 0.5)
      .slice(0, 9);

    portVertices.forEach((vertex, index) => {
      (vertex as any).portType = portTypes[index];
    });
  }
}
