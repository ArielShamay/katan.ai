import * as fs from 'fs';
import * as path from 'path';
import { HexGraphManager } from './HexGraphManager';
import { shuffleArray, isValidDiceNumberPlacement, generateId } from './BoardUtils';
import { IGameState } from '../models/GameState';
import { ITile, IEdge, IVertex } from '../models/BoardComponents';
import { ResourceType, PortType, BuildingType, GamePhase, TurnPhase, DevelopmentCardType } from '../models/Enums';
import { GAME_CONSTANTS } from '../models/Constants';

/**
 * גנרטור לוח (BoardGenerator)
 * אחראי על יצירת לוח משחק אקראי ומאוזן
 */
export class BoardGenerator {
  private readonly graphManager: HexGraphManager;
  private readonly configData: any;

  /**
   * Constructor
   * @param configPath נתיב לקובץ board_static.json (אופציונלי)
   */
  constructor(configPath?: string) {
    this.graphManager = new HexGraphManager(configPath);
    
    const defaultPath = path.join(__dirname, '../../config/board_static.json');
    const finalPath = configPath || defaultPath;
    this.configData = JSON.parse(fs.readFileSync(finalPath, 'utf-8'));
  }

  /**
   * יצירת לוח משחק אקראי חדש
   * @param playerIds מערך מזהי שחקנים (3-4)
   * @returns מצב משחק ראשוני מלא
   */
  public generateRandomBoard(playerIds: string[]): IGameState {
    if (playerIds.length < GAME_CONSTANTS.MIN_PLAYERS || 
        playerIds.length > GAME_CONSTANTS.MAX_PLAYERS) {
      throw new Error(`Number of players must be between ${GAME_CONSTANTS.MIN_PLAYERS}-${GAME_CONSTANTS.MAX_PLAYERS}`);
    }

    // 1. יצירת אריחים עם פיזור אקראי
    const tiles = this.generateTiles();

    // 2. יצירת צלעות ריקות
    const edges = this.generateEdges();

    // 3. יצירת קודקודים עם נמלים
    const vertices = this.generateVertices();

    // 4. יצירת שחקנים ראשוניים
    const players = this.generatePlayers(playerIds);

    // 5. אתחול בנק המשאבים והקלפים
    const bankResources = this.initializeBankResources();
    const bankDevCards = this.initializeDevelopmentCards();

    // 6. קביעת אריח השוד הראשוני (על המדבר)
    const desertTile = tiles.find(t => t.resourceType === ResourceType.DESERT);
    const robberTileId = desertTile ? desertTile.id : 0;

    // 7. יצירת מצב המשחק
    const gameState: IGameState = {
      gameId: generateId(),
      createdAt: new Date(),
      phase: GamePhase.SETUP_ROUND_1,
      turnPhase: TurnPhase.BUILD,
      turnNumber: 1,
      players,
      activePlayerId: playerIds[0],
      playerOrder: [...playerIds],
      tiles,
      edges,
      vertices,
      robberTileId,
      lastDiceRoll: null,
      longestRoadOwnerId: null,
      largestArmyOwnerId: null,
      bankResources,
      bankDevCards,
      moveHistory: []
    };

    return gameState;
  }

  /**
   * יצירת אריחי הלוח עם פיזור אקראי של משאבים ומספרים
   */
  private generateTiles(): ITile[] {
    const tiles: ITile[] = [];
    const tileLayout = this.configData.graph_structure.tiles.tile_layout;

    // יצירת רשימת משאבים לפי הכמות הנדרשת
    const resourceTypes: ResourceType[] = [];
    Object.entries(GAME_CONSTANTS.TILE_COUNTS).forEach(([resource, count]) => {
      for (let i = 0; i < count; i++) {
        resourceTypes.push(resource as ResourceType);
      }
    });

    // ערבוב המשאבים
    const shuffledResources = shuffleArray(resourceTypes);

    // יצירת רשימת מספרי הקוביות
    const diceNumbers = [...GAME_CONSTANTS.DICE_NUMBERS];
    const shuffledNumbers = shuffleArray(diceNumbers);

    // מיפוי שכנויות לצורך בדיקת איזון
    const adjacencyMap = new Map<number, number[]>();
    tileLayout.forEach((tile: any) => {
      adjacencyMap.set(tile.tileId, tile.adjacentTileIds);
    });

    // הקצאת מספרים לאריחים עם בדיקת איזון
    const numberAssignment = new Map<number, number>();
    let numberIndex = 0;

    tileLayout.forEach((tileData: any, index: number) => {
      const resourceType = shuffledResources[index];
      const tileId = tileData.tileId;

      let diceNumber: number | null = null;
      let probability = 0;

      // המדבר לא מקבל מספר
      if (resourceType !== ResourceType.DESERT) {
        // נסה למצוא מספר מתאים שמקיים את כללי האיזון
        let attempts = 0;
        const maxAttempts = shuffledNumbers.length;

        while (attempts < maxAttempts) {
          const candidateNumber = shuffledNumbers[numberIndex % shuffledNumbers.length];
          
          if (isValidDiceNumberPlacement(tileId, candidateNumber, numberAssignment, adjacencyMap)) {
            diceNumber = candidateNumber;
            probability = GAME_CONSTANTS.DICE_PROBABILITIES[diceNumber];
            numberAssignment.set(tileId, diceNumber);
            shuffledNumbers.splice(numberIndex % shuffledNumbers.length, 1);
            break;
          }
          
          numberIndex++;
          attempts++;
        }

        // אם לא מצאנו מספר אידיאלי, קח את הראשון הזמין
        if (diceNumber === null && shuffledNumbers.length > 0) {
          diceNumber = shuffledNumbers.shift()!;
          probability = GAME_CONSTANTS.DICE_PROBABILITIES[diceNumber];
          numberAssignment.set(tileId, diceNumber);
        }
      }

      const tile: ITile = {
        id: tileId,
        resourceType,
        diceNumber,
        probability,
        isRobberPresent: resourceType === ResourceType.DESERT,
        adjacentVertexIds: [...tileData.adjacentVertexIds],
        adjacentEdgeIds: [...tileData.adjacentEdgeIds]
      };

      tiles.push(tile);
    });

    return tiles;
  }

  /**
   * יצירת צלעות ריקות (ללא כבישים)
   */
  private generateEdges(): IEdge[] {
    const edges: IEdge[] = [];
    const edgeData = this.configData.graph_structure.edge_adjacency.edges;

    edgeData.forEach((edge: any) => {
      edges.push({
        id: edge.edgeId,
        vertexIds: [edge.vertexIds[0], edge.vertexIds[1]],
        adjacentTileIds: [...edge.adjacentTileIds],
        ownerId: null,
        adjacentEdgeIds: [...edge.adjacentEdgeIds]
      });
    });

    return edges;
  }

  /**
   * יצירת קודקודים עם נמלים
   */
  private generateVertices(): IVertex[] {
    const vertices: IVertex[] = [];
    const vertexData = this.configData.graph_structure.vertex_adjacency.vertices;
    const portData = this.configData.port_locations.ports;

    // יצירת מיפוי נמלים לקודקודים
    const portMap = new Map<number, PortType>();
    portData.forEach((port: any) => {
      port.vertexIds.forEach((vertexId: number) => {
        portMap.set(vertexId, port.type as PortType);
      });
    });

    vertexData.forEach((vertex: any) => {
      vertices.push({
        id: vertex.vertexId,
        adjacentTileIds: [...vertex.adjacentTileIds],
        adjacentEdgeIds: [...vertex.adjacentEdgeIds],
        adjacentVertexIds: [...vertex.adjacentVertexIds],
        ownerId: null,
        buildingType: BuildingType.NONE,
        portType: portMap.get(vertex.vertexId) || PortType.NONE
      });
    });

    return vertices;
  }

  /**
   * יצירת מצבי שחקנים ראשוניים
   */
  private generatePlayers(playerIds: string[]): any[] {
    const colors = ['red', 'blue', 'white', 'orange'];
    
    return playerIds.map((id, index) => ({
      id,
      name: `Player ${index + 1}`,
      color: colors[index],
      resources: {
        [ResourceType.LUMBER]: 0,
        [ResourceType.BRICK]: 0,
        [ResourceType.WOOL]: 0,
        [ResourceType.GRAIN]: 0,
        [ResourceType.ORE]: 0,
        [ResourceType.DESERT]: 0
      },
      developmentCards: {
        [DevelopmentCardType.KNIGHT]: 0,
        [DevelopmentCardType.VICTORY_POINT]: 0,
        [DevelopmentCardType.ROAD_BUILDING]: 0,
        [DevelopmentCardType.MONOPOLY]: 0,
        [DevelopmentCardType.YEAR_OF_PLENTY]: 0
      },
      developmentCardsPlayedThisTurn: [],
      settlementsRemaining: GAME_CONSTANTS.SETTLEMENTS_PER_PLAYER,
      citiesRemaining: GAME_CONSTANTS.CITIES_PER_PLAYER,
      roadsRemaining: GAME_CONSTANTS.ROADS_PER_PLAYER,
      victoryPoints: 0,
      hiddenVictoryPoints: 0,
      knightsPlayed: 0,
      longestRoadLength: 0,
      hasLongestRoad: false,
      hasLargestArmy: false
    }));
  }

  /**
   * אתחול משאבי הבנק
   */
  private initializeBankResources(): Record<ResourceType, number> {
    return {
      [ResourceType.LUMBER]: GAME_CONSTANTS.RESOURCE_CARDS_PER_TYPE,
      [ResourceType.BRICK]: GAME_CONSTANTS.RESOURCE_CARDS_PER_TYPE,
      [ResourceType.WOOL]: GAME_CONSTANTS.RESOURCE_CARDS_PER_TYPE,
      [ResourceType.GRAIN]: GAME_CONSTANTS.RESOURCE_CARDS_PER_TYPE,
      [ResourceType.ORE]: GAME_CONSTANTS.RESOURCE_CARDS_PER_TYPE,
      [ResourceType.DESERT]: 0
    };
  }

  /**
   * אתחול קלפי ההתפתחות (מעורבבים)
   */
  private initializeDevelopmentCards(): DevelopmentCardType[] {
    const cards: DevelopmentCardType[] = [];

    Object.entries(GAME_CONSTANTS.DEV_CARD_COUNTS).forEach(([cardType, count]) => {
      for (let i = 0; i < count; i++) {
        cards.push(cardType as DevelopmentCardType);
      }
    });

    return shuffleArray(cards);
  }

  /**
   * גישה ל-HexGraphManager
   */
  public getGraphManager(): HexGraphManager {
    return this.graphManager;
  }
}
