/**
 * @fileoverview מנוע המשחק המרכזי (Core Game Engine)
 * @description מנהל את כל לוגיקת המשחק, מתאם בין המנהלים השונים ומבצע את כל הפעולות
 * @module game/GameEngine
 */

import { IGameState, IGameAction } from '../models/GameState';
import { IPlayerState } from '../models/Player';
import { 
  ActionType, 
  BuildingType, 
  ResourceType, 
  GamePhase, 
  TurnPhase,
  DevelopmentCardType,
  PortType
} from '../models/Enums';
import { GAME_CONSTANTS } from '../models/Constants';
import { BoardGenerator } from '../board/BoardGenerator';
import { HexGraphManager } from '../board/HexGraphManager';
import { ResourceManager } from '../managers/ResourceManager';
import { RuleValidator } from '../rules/RuleValidator';

/**
 * מנוע המשחק - ליבת המשחק, מתאם בין כל המנהלים
 * מחלקה זו משמשת כ-Controller מרכזי, מקבלת פעולות מהשחקנים ומבצעת אותן
 * תוך שימוש במנהלים השונים (ResourceManager, RuleValidator וכו')
 */
export class GameEngine {
  /**
   * מחזיק את מצב המשחק הנוכחי
   * מצב זה הוא immutable - כל פעולה מחזירה מצב חדש
   */
  private currentState: IGameState | null = null;

  /**
   * @param boardGenerator - מחולל הלוח (יוצר לוח אקראי)
   * @param hexGraphManager - מנהל הגרף המשושה (מחשב מסלולים, סמיכויות)
   * @param resourceManager - מנהל המשאבים (חלוקה, מסחר, תשלומים)
   * @param ruleValidator - בודק התקינות (מאמת שפעולות חוקיות)
   */
  constructor(
    private readonly boardGenerator: BoardGenerator,
    private readonly hexGraphManager: HexGraphManager,
    private readonly resourceManager: ResourceManager,
    private readonly ruleValidator: RuleValidator
  ) {}

  /**
   * מתחיל משחק חדש
   * @param playerIds - מערך של מזהי שחקנים (2-4 שחקנים)
   * @returns מצב משחק ראשוני עם לוח אקראי, בנק מלא ושחקנים מאותחלים
   * @throws {Error} אם מספר השחקנים לא תקין
   */
  public startGame(playerIds: string[]): IGameState {
    // בדיקת תקינות מספר שחקנים
    if (playerIds.length < GAME_CONSTANTS.MIN_PLAYERS || 
        playerIds.length > GAME_CONSTANTS.MAX_PLAYERS) {
      throw new Error(
        `מספר שחקנים לא תקין: ${playerIds.length}. נדרשים ${GAME_CONSTANTS.MIN_PLAYERS}-${GAME_CONSTANTS.MAX_PLAYERS} שחקנים`
      );
    }

    // יצירת לוח אקראי
    const { tiles, edges, vertices } = this.boardGenerator.generateRandomBoard(playerIds);

    // אתחול בנק המשאבים (19 קלפים מכל סוג, מדבר = 0)
    const bankResources: Record<ResourceType, number> = {
      [ResourceType.LUMBER]: GAME_CONSTANTS.RESOURCE_CARDS_PER_TYPE,
      [ResourceType.BRICK]: GAME_CONSTANTS.RESOURCE_CARDS_PER_TYPE,
      [ResourceType.WOOL]: GAME_CONSTANTS.RESOURCE_CARDS_PER_TYPE,
      [ResourceType.GRAIN]: GAME_CONSTANTS.RESOURCE_CARDS_PER_TYPE,
      [ResourceType.ORE]: GAME_CONSTANTS.RESOURCE_CARDS_PER_TYPE,
      [ResourceType.DESERT]: 0  // מדבר אין לו משאב
    };

    // אתחול ערימת קלפי הפיתוח
    const developmentCardDeck = this.initializeDevelopmentCardDeck();

    // ערבוב סדר השחקנים (אקראי)
    const shuffledPlayerIds = this.shuffleArray([...playerIds]);

    // יצירת שחקנים ריקים
    const players = shuffledPlayerIds.map((id, index) => 
      this.createInitialPlayer(id, index)
    );

    // יצירת מצב משחק ראשוני
    this.currentState = {
      tiles,
      edges,
      vertices,
      players,
      bankResources,
      developmentCardDeck,
      currentPlayerIndex: 0,
      gamePhase: GamePhase.SETUP,
      turnPhase: TurnPhase.PLACING_SETTLEMENT,
      diceResult: null,
      robberTileId: tiles.find(t => t.resourceType === ResourceType.DESERT)?.id ?? 0, // המדבר
      longestRoadPlayerId: null,
      largestArmyPlayerId: null,
      winner: null,
      setupRound: 1, // סיבוב ראשון בהקמה
      setupDirection: 1 // 1 = קדימה, -1 = אחורה
    };

    return this.currentState;
  }

  /**
   * מציב יישוב וכביש ראשוניים בשלב ההתחלה
   * @param gameState - מצב המשחק הנוכחי
   * @param playerId - מזהה השחקן
   * @param vertexId - מזהה הקודקוד להצבת יישוב
   * @param roadEdgeId - מזהה הקצה להצבת כביש
   * @returns מצב משחק מעודכן עם היישוב והכביש
   * @throws {Error} אם ההצבה לא חוקית
   */
  public placeInitialSettlementAndRoad(
    gameState: IGameState,
    playerId: string,
    vertexId: number,
    roadEdgeId: number
  ): IGameState {
    // בדיקה שאנחנו בשלב ההתחלה
    if (gameState.gamePhase !== GamePhase.SETUP) {
      throw new Error('לא ניתן להציב יישוב וכביש ראשוניים מחוץ לשלב ההתחלה');
    }

    // בדיקה שזה תור השחקן
    const currentPlayer = gameState.players[gameState.currentPlayerIndex];
    if (currentPlayer.id !== playerId) {
      throw new Error(`לא תור השחקן ${playerId}`);
    }

    // בדיקת תקינות הצבת יישוב (בשלב setup מותר ללא רכוש משאבים)
    const settlementValidation = this.ruleValidator.canPlaceSettlement(
      playerId,
      vertexId,
      gameState.edges,
      gameState.vertices,
      true // isSetupPhase = true
    );
    if (!settlementValidation.valid) {
      const reason = 'reason' in settlementValidation ? settlementValidation.reason : 'שגיאה לא ידועה';
      throw new Error(`לא ניתן להציב יישוב: ${reason}`);
    }

    // בדיקת תקינות הצבת כביש (הכביש חייב להיות צמוד ליישוב שהוצב)
    const roadValidation = this.ruleValidator.canPlaceRoad(
      playerId,
      roadEdgeId,
      gameState.edges,
      [...gameState.          vertices.map(v => v.id === vertexId ? { ...v, ownerId: playerId, buildingType: BuildingType.SETTLEMENT } : v)] // סימולציה של היישוב
    );
    if (!roadValidation.valid) {
      throw new Error(`לא ניתן להציב כביש: ${roadValidation.reason}`);
    }

    // בדיקה שהכביש באמת צמוד ליישוב המוצב
    const edge = gameState.edges.find(e => e.id === roadEdgeId);
    if (!edge || (edge.vertexIds[0] !== vertexId && edge.vertexIds[1] !== vertexId)) {
      throw new Error('הכביש חייב להיות צמוד ליישוב');
    }

    // עדכון מצב - הצבת יישוב
    const updatedVertices = gameState.vertices.map(v =>
      v.id === vertexId
        ? { ...v, ownerId: playerId, buildingType: BuildingType.SETTLEMENT }
        : v
    );

    // עדכון מצב - הצבת כביש
    const updatedEdges = gameState.edges.map(e =>
      e.id === roadEdgeId
        ? { ...e, ownerId: playerId }
        : e
    );

    // עדכון שחקן - הפחתת יישובים וכבישים זמינים
    const updatedPlayers = gameState.players.map(p =>
      p.id === playerId
        ? {
            ...p,
            settlementsRemaining: p.settlementsRemaining - 1,
            roadsRemaining: p.roadsRemaining - 1,
            victoryPoints: p.victoryPoints + 1 // יישוב = נקודת ניצחון
          }
        : p
    );

    // קביעת המעבר לשחקן הבא
    let nextPlayerIndex = gameState.currentPlayerIndex;
    let setupRound = gameState.setupRound;
    let setupDirection = gameState.setupDirection;

    // מעבר לשחקן הבא
    if (setupDirection === 1) {
      // סיבוב ראשון - קדימה
      if (nextPlayerIndex < gameState.players.length - 1) {
        nextPlayerIndex++;
      } else {
        // הגענו לשחקן האחרון - מתחילים סיבוב שני אחורה
        setupDirection = -1;
        setupRound = 2;
      }
    } else {
      // סיבוב שני - אחורה
      if (nextPlayerIndex > 0) {
        nextPlayerIndex--;
      } else {
        // סיימנו את שלב ההתחלה - מעבר למשחק רגיל
        return {
          ...gameState,
          vertices: updatedVertices,
          edges: updatedEdges,
          players: updatedPlayers,
          gamePhase: GamePhase.MAIN_GAME,
          turnPhase: TurnPhase.ROLLING_DICE,
          currentPlayerIndex: 0,
          setupRound: 2,
          setupDirection: -1
        };
      }
    }

    return {
      ...gameState,
      vertices: updatedVertices,
      edges: updatedEdges,
      players: updatedPlayers,
      currentPlayerIndex: nextPlayerIndex,
      setupRound,
      setupDirection
    };
  }

  /**
   * מעבד את חלוקת המשאבים הראשונית מהיישוב השני בשלב ההתחלה
   * @param gameState - מצב המשחק הנוכחי
   * @param lastPlacedVertexId - מזהה הקודקוד שבו הוצב היישוב האחרון
   * @returns מצב משחק מעודכן עם משאבים שחולקו
   */
  public processInitialResourceHandout(
    gameState: IGameState,
    lastPlacedVertexId: number
  ): IGameState {
    // בדיקה שאנחנו בסיבוב השני של ההתחלה
    if (gameState.setupRound !== 2) {
      return gameState; // רק בסיבוב השני מחלקים משאבים
    }

    const currentPlayer = gameState.players[gameState.currentPlayerIndex];

    // מציאת המשבצות הסמוכות ליישוב
    const adjacentTileIds = this.hexGraphManager.getAdjacentTiles(lastPlacedVertexId);
    const adjacentTiles = gameState.tiles.filter(t => adjacentTileIds.includes(t.id));

    // חישוב המשאבים לחלוקה
    const resourcesToAdd: Partial<Record<ResourceType, number>> = {};
    
    for (const tile of adjacentTiles) {
      // דלג על מדבר ומשבצות עם השודד
      if (tile.resourceType === ResourceType.DESERT || tile.id === gameState.robberTileId) {
        continue;
      }

      // הוספת משאב אחד מהמשבצת
      const resourceType = tile.resourceType;
      if (!resourcesToAdd[resourceType]) {
        resourcesToAdd[resourceType] = 0;
      }
      resourcesToAdd[resourceType]!++;
    }

    // אם אין משאבים - החזר את המצב ללא שינוי
    if (Object.keys(resourcesToAdd).length === 0) {
      return gameState;
    }

    // עדכון משאבי השחקן
    const updatedResources = { ...currentPlayer.resources };
    for (const [resource, amount] of Object.entries(resourcesToAdd)) {
      const resourceType = resource as ResourceType;
      updatedResources[resourceType] += amount;
    }

    // עדכון הבנק (הפחתה)
    const updatedBankResources = { ...gameState.bankResources };
    for (const [resource, amount] of Object.entries(resourcesToAdd)) {
      const resourceType = resource as ResourceType;
      updatedBankResources[resourceType] -= amount;
      
      // וידוא שהבנק לא שלילי
      if (updatedBankResources[resourceType] < 0) {
        updatedBankResources[resourceType] = 0;
      }
    }

    // עדכון השחקן במצב
    const updatedPlayers = gameState.players.map(p =>
      p.id === currentPlayer.id
        ? { ...p, resources: updatedResources }
        : p
    );

    return {
      ...gameState,
      players: updatedPlayers,
      bankResources: updatedBankResources
    };
  }

  /**
   * מקדם לתור הבא
   * @param gameState - מצב המשחק הנוכחי
   * @returns מצב משחק מעודכן עם שחקן הבא
   */
  public nextTurn(gameState: IGameState): IGameState {
    // איפוס מצב התור הנוכחי
    const currentPlayer = gameState.players[gameState.currentPlayerIndex];
    const resetPlayer: IPlayerState = {
      ...currentPlayer,
      developmentCardsPlayedThisTurn: []
    };

    const updatedPlayers = gameState.players.map((p, idx) =>
      idx === gameState.currentPlayerIndex ? resetPlayer : p
    );

    // מעבר לשחקן הבא (מחזורי)
    const nextPlayerIndex = (gameState.currentPlayerIndex + 1) % gameState.players.length;

    return {
      ...gameState,
      players: updatedPlayers,
      currentPlayerIndex: nextPlayerIndex,
      turnPhase: TurnPhase.ROLLING_DICE,
      diceResult: null
    };
  }

  /**
   * מטפל בפעולה של שחקן
   * @param gameState - מצב המשחק הנוכחי
   * @param action - הפעולה לביצוע
   * @returns מצב משחק מעודכן לאחר ביצוע הפעולה
   * @throws {Error} אם הפעולה לא חוקית
   */
  public handleAction(gameState: IGameState, action: IGameAction): IGameState {
    // ניתוב לפונקציה המתאימה לפי סוג הפעולה
    switch (action.type) {
      case ActionType.ROLL_DICE:
        return this.executeRollDice(gameState);
      
      case ActionType.BUILD_ROAD:
      case ActionType.BUILD_SETTLEMENT:
      case ActionType.BUILD_CITY:
      case ActionType.BUY_DEVELOPMENT_CARD:
        return this.executeBuild(gameState, action);
      
      case ActionType.TRADE_WITH_BANK:
      case ActionType.TRADE_WITH_PORT:
      case ActionType.OFFER_TRADE:
      case ActionType.ACCEPT_TRADE:
        return this.executeTrade(gameState, action);
      
      case ActionType.PLAY_DEVELOPMENT_CARD:
        return this.executePlayDevCard(gameState, action);
      
      case ActionType.MOVE_ROBBER:
        return this.executeMoveRobber(gameState, action);
      
      case ActionType.DISCARD_CARDS:
        return this.executeDiscardCards(gameState, action);
      
      case ActionType.END_TURN:
        return this.executeEndTurn(gameState);
      
      default:
        throw new Error(`סוג פעולה לא מוכר: ${action.type}`);
    }
  }

  /**
   * מבצע הטלת קוביות
   * @param gameState - מצב המשחק הנוכחי
   * @returns מצב משחק מעודכן עם תוצאת קוביות וחלוקת משאבים
   * @throws {Error} אם לא בפאזת הטלת קוביות
   */
  public executeRollDice(gameState: IGameState): IGameState {
    // בדיקת פאזה
    if (gameState.turnPhase !== TurnPhase.ROLLING_DICE) {
      throw new Error('לא ניתן להטיל קוביות בפאזה זו');
    }

    // הטלת קוביות (2-12)
    const diceResult = this.rollDice();

    // טיפול במקרה של 7 - השודד
    if (diceResult === 7) {
      // בדיקה אילו שחקנים צריכים לזרוק קלפים
      const playersToDiscard = gameState.players.filter(p =>
        this.ruleValidator.mustDiscardOnSeven(p)
      );

      if (playersToDiscard.length > 0) {
        // מעבר לפאזת זריקת קלפים
        return {
          ...gameState,
          diceResult,
          turnPhase: TurnPhase.DISCARDING
        };
      } else {
        // אין מי שצריך לזרוק - מעבר ישירות להזזת השודד
        return {
          ...gameState,
          diceResult,
          turnPhase: TurnPhase.MOVING_ROBBER
        };
      }
    }

    // חלוקת משאבים (לא 7)
    const stateAfterDistribution = this.resourceManager.distributeResources(
      gameState,
      diceResult
    );

    return {
      ...stateAfterDistribution,
      diceResult,
      turnPhase: TurnPhase.MAIN_ACTIONS
    };
  }

  /**
   * מבצע בניה (כביש, יישוב, עיר, קלף פיתוח)
   * @param gameState - מצב המשחק הנוכחי
   * @param action - פעולת הבניה
   * @returns מצב משחק מעודכן לאחר הבניה
   * @throws {Error} אם הבניה לא חוקית
   */
  public executeBuild(gameState: IGameState, action: IGameAction): IGameState {
    // בדיקה שזה תור השחקן
    if (action.playerId !== gameState.players[gameState.currentPlayerIndex].id) {
      throw new Error('לא תור השחקן');
    }

    switch (action.type) {
      case ActionType.BUILD_ROAD:
        return this.buildRoad(gameState, action.playerId, action.edgeId!);
      
      case ActionType.BUILD_SETTLEMENT:
        return this.buildSettlement(gameState, action.playerId, action.vertexId!);
      
      case ActionType.BUILD_CITY:
        return this.buildCity(gameState, action.playerId, action.vertexId!);
      
      case ActionType.BUY_DEVELOPMENT_CARD:
        return this.buyDevelopmentCard(gameState, action.playerId);
      
      default:
        throw new Error(`סוג בניה לא מוכר: ${action.type}`);
    }
  }

  /**
   * מבצע מסחר (בנק, נמל, שחקן)
   * @param gameState - מצב המשחק הנוכחי
   * @param action - פעולת המסחר
   * @returns מצב משחק מעודכן לאחר המסחר
   * @throws {Error} אם המסחר לא חוקי
   */
  public executeTrade(gameState: IGameState, action: IGameAction): IGameState {
    switch (action.type) {
      case ActionType.TRADE_WITH_BANK:
        return this.tradeWithBank(gameState, action.playerId, action.giveResources!, action.takeResources!);
      
      case ActionType.TRADE_WITH_PORT:
        return this.tradeWithPort(gameState, action.playerId, action.portType!, action.giveResources!, action.takeResources!);
      
      // TODO: מסחר בין שחקנים (נדרש מנגנון הצעות וקבלות)
      case ActionType.OFFER_TRADE:
      case ActionType.ACCEPT_TRADE:
        throw new Error('מסחר בין שחקנים טרם מיושם');
      
      default:
        throw new Error(`סוג מסחר לא מוכר: ${action.type}`);
    }
  }

  /**
   * מבצע שימוש בקלף פיתוח
   * @param gameState - מצב המשחק הנוכחי
   * @param action - פעולת השימוש בקלף
   * @returns מצב משחק מעודכן לאחר השימוש בקלף
   * @throws {Error} אם השימוש בקלף לא חוקי
   */
  public executePlayDevCard(gameState: IGameState, action: IGameAction): IGameState {
    const currentPlayer = gameState.players[gameState.currentPlayerIndex];

    // בדיקת תקינות
    const validation = this.ruleValidator.canPlayDevCard(currentPlayer, action.developmentCard!);
    if (!validation.valid) {
      throw new Error(`לא ניתן לשחק קלף פיתוח: ${validation.reason}`);
    }

    // הסרת הקלף מיד השחקן
    const cardIndex = currentPlayer.developmentCards.indexOf(action.developmentCard!);
    const updatedDevCards = [...currentPlayer.developmentCards];
    updatedDevCards.splice(cardIndex, 1);

    // רישום שהקלף שוחק בתור זה
    const playedCards = [...currentPlayer.developmentCardsPlayedThisTurn, action.developmentCard!];

    let updatedPlayer: IPlayerState = {
      ...currentPlayer,
      developmentCards: updatedDevCards,
      developmentCardsPlayedThisTurn: playedCards
    };

    // טיפול לפי סוג הקלף
    switch (action.developmentCard!) {
      case DevelopmentCardType.KNIGHT:
        // אבירים מוזז את השודד ונותן נקודה לצבא הגדול
        updatedPlayer = {
          ...updatedPlayer,
          knightsPlayed: updatedPlayer.knightsPlayed + 1
        };
        
        // עדכון שחקן במצב
        const playersAfterKnight = gameState.players.map(p =>
          p.id === currentPlayer.id ? updatedPlayer : p
        );

        // מעבר להזזת השודד
        return {
          ...gameState,
          players: playersAfterKnight,
          turnPhase: TurnPhase.MOVING_ROBBER
        };

      // TODO: קלפי פיתוח נוספים
      default:
        throw new Error(`קלף פיתוח ${action.developmentCard} טרם מיושם`);
    }
  }

  /**
   * מבצע הזזת השודד
   * @param gameState - מצב המשחק הנוכחי
   * @param action - פעולת הזזת השודד
   * @returns מצב משחק מעודכן לאחר הזזת השודד
   * @throws {Error} אם ההזזה לא חוקית
   */
  private executeMoveRobber(gameState: IGameState, action: IGameAction): IGameState {
    // בדיקת תקינות
    const validation = this.ruleValidator.isValidRobberPlacement(
      action.tileId!,
      gameState.robberTileId
    );
    if (!validation.valid) {
      throw new Error(`לא ניתן להזיז את השודד: ${validation.reason}`);
    }

    // TODO: גניבת קלף מהשחקן הנבחר (צריך לקבל targetPlayerId בפעולה)

    return {
      ...gameState,
      robberTileId: action.tileId!,
      turnPhase: TurnPhase.MAIN_ACTIONS
    };
  }

  /**
   * מבצע זריקת קלפים (במקרה של 7)
   * @param gameState - מצב המשחק הנוכחי
   * @param action - פעולת זריקת הקלפים
   * @returns מצב משחק מעודכן לאחר זריקת הקלפים
   * @throws {Error} אם הזריקה לא חוקית
   */
  private executeDiscardCards(gameState: IGameState, action: IGameAction): IGameState {
    const player = gameState.players.find(p => p.id === action.playerId);
    if (!player) {
      throw new Error('שחקן לא נמצא');
    }

    // בדיקת תקינות
    const discardCount = Object.values(action.discardResources!).reduce((sum, val) => sum + val, 0);
    const validation = this.ruleValidator.isValidDiscardCount(player, discardCount);
    if (!validation.valid) {
      throw new Error(`זריקת קלפים לא תקינה: ${validation.reason}`);
    }

    // ביצוע הזריקה
    const updatedResources = { ...player.resources };
    for (const [resource, amount] of Object.entries(action.discardResources!)) {
      const resourceType = resource as ResourceType;
      updatedResources[resourceType] -= amount;
      
      if (updatedResources[resourceType] < 0) {
        throw new Error(`אין מספיק ${resourceType} לזריקה`);
      }
    }

    // עדכון השחקן
    const updatedPlayers = gameState.players.map(p =>
      p.id === action.playerId
        ? { ...p, resources: updatedResources }
        : p
    );

    // בדיקה אם כל השחקנים שצריכים לזרוק כבר עשו זאת
    const stillNeedToDiscard = updatedPlayers.some(p =>
      p.id !== action.playerId && this.ruleValidator.mustDiscardOnSeven(p)
    );

    if (!stillNeedToDiscard) {
      // כולם זרקו - מעבר להזזת השודד
      return {
        ...gameState,
        players: updatedPlayers,
        turnPhase: TurnPhase.MOVING_ROBBER
      };
    }

    return {
      ...gameState,
      players: updatedPlayers
    };
  }

  /**
   * מסיים תור
   * @param gameState - מצב המשחק הנוכחי
   * @returns מצב משחק מעודכן עם תור הבא
   */
  private executeEndTurn(gameState: IGameState): IGameState {
    // בדיקת ניצחון לפני סיום התור
    const currentPlayer = gameState.players[gameState.currentPlayerIndex];
    
    if (currentPlayer.victoryPoints >= GAME_CONSTANTS.VICTORY_POINTS_TO_WIN) {
      return {
        ...gameState,
        winner: currentPlayer.id,
        gamePhase: GamePhase.GAME_OVER
      };
    }

    return this.nextTurn(gameState);
  }

  // ============================================================
  // פונקציות עזר פרטיות לבניה
  // ============================================================

  /**
   * בונה כביש
   */
  private buildRoad(gameState: IGameState, playerId: string, edgeId: number): IGameState {
    const player = gameState.players.find(p => p.id === playerId)!;

    // בדיקת משאבים
    const cost = this.resourceManager.getBuildCost(BuildingType.ROAD);
    if (!this.resourceManager.isAffordable(player, cost)) {
      throw new Error('אין מספיק משאבים לבניית כביש');
    }

    // בדיקת חוקיות
    const validation = this.ruleValidator.canPlaceRoad(
      playerId,
      edgeId,
      gameState.edges,
      gameState.vertices
    );
    if (!validation.valid) {
      throw new Error(`לא ניתן לבנות כביש: ${validation.reason}`);
    }

    // ביצוע הבניה
    const stateAfterPayment = this.resourceManager.updateBankAndPlayerResources(
      gameState,
      { giverId: playerId, receiverId: null, resources: cost as Record<ResourceType, number> }
    );

    const updatedEdges = stateAfterPayment.edges.map(e =>
      e.id === edgeId ? { ...e, ownerId: playerId } : e
    );

    const updatedPlayers = stateAfterPayment.players.map(p =>
      p.id === playerId
        ? { ...p, roadsRemaining: p.roadsRemaining - 1 }
        : p
    );

    // עדכון הכביש הארוך ביותר
    const stateWithRoad = {
      ...stateAfterPayment,
      edges: updatedEdges,
      players: updatedPlayers
    };

    return this.updateLongestRoad(stateWithRoad);
  }

  /**
   * בונה יישוב
   */
  private buildSettlement(gameState: IGameState, playerId: string, vertexId: number): IGameState {
    const player = gameState.players.find(p => p.id === playerId)!;

    // בדיקת משאבים
    const cost = this.resourceManager.getBuildCost(BuildingType.SETTLEMENT);
    if (!this.resourceManager.isAffordable(player, cost)) {
      throw new Error('אין מספיק משאבים לבניית יישוב');
    }

    // בדיקת חוקיות
    const validation = this.ruleValidator.canPlaceSettlement(
      playerId,
      vertexId,
      gameState.edges,
      gameState.vertices,
      false // not setup phase
    );
    if (!validation.valid) {
      throw new Error(`לא ניתן לבנות יישוב: ${validation.reason}`);
    }

    // ביצוע הבניה
    const stateAfterPayment = this.resourceManager.updateBankAndPlayerResources(
      gameState,
      { giverId: playerId, receiverId: null, resources: cost as Record<ResourceType, number> }
    );

    const updatedVertices = stateAfterPayment.vertices.map(v =>
      v.id === vertexId
        ? { ...v, ownerId: playerId, building: BuildingType.SETTLEMENT }
        : v
    );

    const updatedPlayers = stateAfterPayment.players.map(p =>
      p.id === playerId
        ? {
            ...p,
            settlementsRemaining: p.settlementsRemaining - 1,
            victoryPoints: p.victoryPoints + 1
          }
        : p
    );

    return {
      ...stateAfterPayment,
      vertices: updatedVertices,
      players: updatedPlayers
    };
  }

  /**
   * בונה עיר (משדרג יישוב)
   */
  private buildCity(gameState: IGameState, playerId: string, vertexId: number): IGameState {
    const player = gameState.players.find(p => p.id === playerId)!;

    // בדיקת משאבים
    const cost = this.resourceManager.getBuildCost(BuildingType.CITY);
    if (!this.resourceManager.isAffordable(player, cost)) {
      throw new Error('אין מספיק משאבים לבניית עיר');
    }

    // בדיקת חוקיות
    const validation = this.ruleValidator.canUpgradeToCity(
      playerId,
      vertexId,
      gameState.vertices
    );
    if (!validation.valid) {
      throw new Error(`לא ניתן לשדרג לעיר: ${validation.reason}`);
    }

    // ביצוע השדרוג - הורדת משאבים
    const stateAfterPayment = this.resourceManager.updateBankAndPlayerResources(
      gameState,
      {
        giverId: playerId,
        receiverId: null,
        resources: cost as Record<ResourceType, number>
      }
    );

    const updatedVertices = stateAfterPayment.vertices.map(v =>
      v.id === vertexId
        ? { ...v, buildingType: BuildingType.CITY }
        : v
    );

    const updatedPlayers = stateAfterPayment.players.map(p =>
      p.id === playerId
        ? {
            ...p,
            settlementsRemaining: p.settlementsRemaining + 1, // משחרר יישוב
            citiesRemaining: p.citiesRemaining - 1,
            victoryPoints: p.victoryPoints + 1 // עיר נותנת עוד נקודה
          }
        : p
    );

    return {
      ...stateAfterPayment,
      vertices: updatedVertices,
      players: updatedPlayers
    };
  }

  /**
   * קונה קלף פיתוח
   */
  private buyDevelopmentCard(gameState: IGameState, playerId: string): IGameState {
    const player = gameState.players.find(p => p.id === playerId)!;

    // בדיקה שיש קלפים בערימה
    if (gameState.developmentCardDeck.length === 0) {
      throw new Error('אין קלפי פיתוח זמינים');
    }

    // בדיקת משאבים
    const cost = this.resourceManager.getBuildCost(BuildingType.DEVELOPMENT_CARD);
    if (!this.resourceManager.isAffordable(player, cost)) {
      throw new Error('אין מספיק משאבים לקניית קלף פיתוח');
    }

    // ביצוע הקנייה - הורדת משאבים
    const stateAfterPayment = this.resourceManager.updateBankAndPlayerResources(
      gameState,
      {
        giverId: playerId,
        receiverId: null,
        resources: cost as Record<ResourceType, number>
      }
    );

    // שליפת קלף מהערימה
    const drawnCard = stateAfterPayment.developmentCardDeck[0];
    const updatedDeck = stateAfterPayment.developmentCardDeck.slice(1);

    const updatedPlayers = stateAfterPayment.players.map(p =>
      p.id === playerId
        ? { ...p, developmentCards: [...p.developmentCards, drawnCard] }
        : p
    );

    return {
      ...stateAfterPayment,
      developmentCardDeck: updatedDeck,
      players: updatedPlayers
    };
  }

  // ============================================================
  // פונקציות עזר פרטיות למסחר
  // ============================================================

  /**
   * מסחר עם הבנק (4:1)
   */
  private tradeWithBank(
    gameState: IGameState,
    playerId: string,
    _giveResources: Partial<Record<ResourceType, number>>,
    _takeResources: Partial<Record<ResourceType, number>>
  ): IGameState {
    // מציאת השחקן
    const player = gameState.players.find(p => p.id === playerId);
    if (!player) {
      throw new Error('\u05e9\u05d7\u05e7\u05df \u05dc\u05d0 \u05e0\u05de\u05e6\u05d0');
    }

    // TODO: ביצוע המסחר - צריך לממש updateBankAndPlayerResources מחדש
    // כרגע נחזיר את המצב כמו שהוא
    return gameState;
  }

  /**
   * מסחר עם נמל (3:1 או 2:1)
   */
  private tradeWithPort(
    gameState: IGameState,
    playerId: string,
    _portType: PortType,
    _giveResources: Partial<Record<ResourceType, number>>,
    _takeResources: Partial<Record<ResourceType, number>>
  ): IGameState {
    // בדיקה שהשחקן יש לו גישה לנמל
    const playerVertices = gameState.vertices.filter(v => v.ownerId === playerId);
    const hasPort = playerVertices.some(v => v.portType === _portType);
    
    if (!hasPort) {
      throw new Error(`לשחקן אין גישה לנמל ${_portType}`);
    }

    // TODO: ביצוע המסחר
    return gameState;
  }

  // ============================================================
  // פונקציות עזר כלליות
  // ============================================================

  /**
   * יוצר שחקן ראשוני ריק
   */
  private createInitialPlayer(id: string, playerIndex: number): IPlayerState {
    return {
      id,
      name: `שחקן ${playerIndex + 1}`,
      color: this.getPlayerColor(playerIndex),
      resources: {
        [ResourceType.LUMBER]: 0,
        [ResourceType.BRICK]: 0,
        [ResourceType.WOOL]: 0,
        [ResourceType.GRAIN]: 0,
        [ResourceType.ORE]: 0,
        [ResourceType.DESERT]: 0
      },
      developmentCards: [],
      knightsPlayed: 0,
      settlementsRemaining: GAME_CONSTANTS.SETTLEMENTS_PER_PLAYER,
      citiesRemaining: GAME_CONSTANTS.CITIES_PER_PLAYER,
      roadsRemaining: GAME_CONSTANTS.ROADS_PER_PLAYER,
      victoryPoints: 0,
      hiddenVictoryPoints: 0,
      longestRoadLength: 0,
      hasLongestRoad: false,
      hasLargestArmy: false,
      hasRolledDice: false,
      developmentCardsPlayedThisTurn: []
    };
  }

  /**
   * מחזיר צבע לפי אינדקס שחקן
   */
  private getPlayerColor(index: number): string {
    const colors = ['אדום', 'כחול', 'לבן', 'כתום'];
    return colors[index] || 'אפור';
  }

  /**
   * מאתחל ערימת קלפי פיתוח
   */
  private initializeDevelopmentCardDeck(): DevelopmentCardType[] {
    const deck: DevelopmentCardType[] = [
      ...Array(14).fill(DevelopmentCardType.KNIGHT),
      ...Array(5).fill(DevelopmentCardType.VICTORY_POINT),
      ...Array(2).fill(DevelopmentCardType.ROAD_BUILDING),
      ...Array(2).fill(DevelopmentCardType.YEAR_OF_PLENTY),
      ...Array(2).fill(DevelopmentCardType.MONOPOLY)
    ];

    return this.shuffleArray(deck);
  }

  /**
   * מערבב מערך (Fisher-Yates shuffle)
   */
  private shuffleArray<T>(array: T[]): T[] {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }

  /**
   * מטיל שתי קוביות (2-12)
   */
  private rollDice(): number {
    const die1 = Math.floor(Math.random() * 6) + 1;
    const die2 = Math.floor(Math.random() * 6) + 1;
    return die1 + die2;
  }

  /**
   * מעדכן את בעל הכביש הארוך ביותר
   */
  private updateLongestRoad(gameState: IGameState): IGameState {
    let longestLength = GAME_CONSTANTS.MIN_ROADS_FOR_LONGEST_ROAD - 1; // צריך לפחות 5
    let longestPlayerId: string | null = null;

    // חישוב אורך כביש לכל שחקן
    for (const player of gameState.players) {
      const roadLength = this.hexGraphManager.getLongestRoad(
        gameState.edges,
        player.id
      );

      if (roadLength > longestLength) {
        longestLength = roadLength;
        longestPlayerId = player.id;
      }
    }

    // אם לא השתנה - החזר את המצב
    if (longestPlayerId === gameState.longestRoadPlayerId) {
      return gameState;
    }

    // עדכון נקודות
    const updatedPlayers = gameState.players.map(p => {
      let points = p.victoryPoints;
      
      // הורדת נקודות מהבעלים הקודם
      if (p.id === gameState.longestRoadPlayerId) {
        points -= 2;
      }
      
      // הוספת נקודות לבעלים החדש
      if (p.id === longestPlayerId) {
        points += 2;
      }

      return { ...p, victoryPoints: points };
    });

    return {
      ...gameState,
      longestRoadPlayerId: longestPlayerId,
      players: updatedPlayers
    };
  }

  /**
   * מחזיר את מצב המשחק הנוכחי
   */
  public getCurrentState(): IGameState | null {
    return this.currentState;
  }
}
