/**
 * RuleValidator - אכיפת כללי המשחק הקשוחים
 * 
 * אחראי על בדיקת תקינות פעולות לפני ביצוען:
 * - חוק המרחק להתיישבויות (Distance Rule)
 * - קישוריות דרכים
 * - תקינות שימוש בקלפי פיתוח
 */

import { DevelopmentCardType, BuildingType } from '../models/Enums';
import { IPlayerState } from '../models/Player';
import { IEdge, IVertex } from '../models/BoardComponents';

export class RuleValidator {
  constructor() {
    // אין צורך ב-HexGraphManager כיוון שנעשה בדיקות ישירות על ה-vertices/edges
  }

  /**
   * בודק אם ניתן להציב התיישבות בקודקוד
   * @param playerId - מזהה השחקן
   * @param vertexId - מזהה הקודקוד
   * @param currentEdges - רשימת הצלעות הנוכחית
   * @param currentVertices - רשימת הקודקודים הנוכחית
   * @param isSetupPhase - האם זה שלב ההקמה הראשוני (ללא דרישת קישוריות)
   * @returns תוצאת ולידציה
   */
  public canPlaceSettlement(
    playerId: string,
    vertexId: number,
    currentEdges: Readonly<IEdge[]>,
    currentVertices: Readonly<IVertex[]>,
    isSetupPhase: boolean = false
  ): { valid: true } | { valid: false; reason: string } {
    const vertex = currentVertices[vertexId];

    // בדיקה 1: הקודקוד חייב להיות ריק
    if (vertex.ownerId !== null) {
      return { valid: false, reason: 'הקודקוד תפוס' };
    }

    // בדיקה 2: חוק המרחק - לא יכול להיות מבנה בקודקודים הסמוכים
    if (!this.checkDistanceRule(vertexId, currentVertices)) {
      return { valid: false, reason: 'קודקוד קרוב מדי ליישוב אחר' };
    }

    // בדיקה 3: בשלב המשחק הרגיל (לא setup) - חייבת להיות קישוריות לדרך של השחקן
    if (!isSetupPhase) {
      if (!this.hasConnectedRoad(playerId, vertexId, currentEdges, currentVertices)) {
        return { valid: false, reason: 'אין כביש מחובר' };
      }
    }

    return { valid: true };
  }

  /**
   * בודק את חוק המרחק - שום מבנה לא יכול להיות במרחק של צלע אחת מהתיישבות
   * @param vertexId - מזהה הקודקוד לבדיקה
   * @param currentVertices - רשימת הקודקודים הנוכחית
   * @returns true אם הקודקוד עומד בחוק המרחק
   */
  private checkDistanceRule(
    vertexId: number,
    currentVertices: Readonly<IVertex[]>
  ): boolean {
    const vertex = currentVertices[vertexId];
    
    // בדיקה שכל הקודקודים הסמוכים ריקים
    for (const adjacentVertexId of vertex.adjacentVertexIds) {
      const adjacentVertex = currentVertices[adjacentVertexId];
      if (adjacentVertex.ownerId !== null) {
        return false;
      }
    }
    
    return true;
  }

  /**
   * בודק אם לשחקן יש דרך המחוברת לקודקוד
   * @param playerId - מזהה השחקן
   * @param vertexId - מזהה הקודקוד
   * @param currentEdges - רשימת הצלעות הנוכחית
   * @param currentVertices - רשימת הקודקודים הנוכחית
   * @returns true אם יש דרך מחוברת
   */
  private hasConnectedRoad(
    playerId: string,
    vertexId: number,
    currentEdges: Readonly<IEdge[]>,
    currentVertices: Readonly<IVertex[]>
  ): boolean {
    const vertex = currentVertices[vertexId];

    // בדיקה אם לשחקן יש כבר מבנה בקודקוד זה
    if (vertex.ownerId === playerId) {
      return true;
    }

    // בדיקה אם יש דרך של השחקן באחת הצלעות הסמוכות
    for (const edgeId of vertex.adjacentEdgeIds) {
      const edge = currentEdges[edgeId];
      if (edge.ownerId === playerId) {
        return true;
      }
    }

    return false;
  }

  /**
   * בודק אם ניתן להציב כביש על צלע
   * @param playerId - מזהה השחקן
   * @param edgeId - מזהה הצלע
   * @param currentEdges - רשימת הצלעות הנוכחית
   * @param currentVertices - רשימת הקודקודים הנוכחית
   * @returns תוצאת ולידציה
   */
  public canPlaceRoad(
    playerId: string,
    edgeId: number,
    currentEdges: Readonly<IEdge[]>,
    currentVertices: Readonly<IVertex[]>
  ): { valid: true } | { valid: false; reason: string } {
    const edge = currentEdges[edgeId];

    // בדיקה 1: הצלע חייבת להיות ריקה
    if (edge.ownerId !== null) {
      return { valid: false, reason: 'הצלע תפוסה' };
    }

    // בדיקה 2: הדרך חייבת להיות מחוברת לדרך/כפר/עיר של השחקן
    if (!this.isRoadConnected(playerId, edgeId, currentEdges, currentVertices)) {
      return { valid: false, reason: 'הכביש לא מחובר למבנה או כביש קיים' };
    }

    return { valid: true };
  }

  /**
   * בודק אם דרך חדשה מחוברת למבנה או דרך קיימת של השחקן
   * @param playerId - מזהה השחקן
   * @param edgeId - מזהה הצלע
   * @param currentEdges - רשימת הצלעות הנוכחית
   * @param currentVertices - רשימת הקודקודים הנוכחית
   * @returns true אם הדרך מחוברת
   */
  private isRoadConnected(
    playerId: string,
    edgeId: number,
    currentEdges: Readonly<IEdge[]>,
    currentVertices: Readonly<IVertex[]>
  ): boolean {
    const edge = currentEdges[edgeId];
    const [vertex1Id, vertex2Id] = edge.vertexIds;

    // בדיקה של שני קצוות הצלע
    return (
      this.hasPlayerStructureOrRoad(playerId, vertex1Id, currentEdges, currentVertices) ||
      this.hasPlayerStructureOrRoad(playerId, vertex2Id, currentEdges, currentVertices)
    );
  }

  /**
   * בודק אם לשחקן יש מבנה או דרך בקודקוד
   * @param playerId - מזהה השחקן
   * @param vertexId - מזהה הקודקוד
   * @param currentEdges - רשימת הצלעות הנוכחית
   * @param currentVertices - רשימת הקודקודים הנוכחית
   * @returns true אם יש מבנה או דרך
   */
  private hasPlayerStructureOrRoad(
    playerId: string,
    vertexId: number,
    currentEdges: Readonly<IEdge[]>,
    currentVertices: Readonly<IVertex[]>
  ): boolean {
    const vertex = currentVertices[vertexId];

    // בדיקה אם יש מבנה של השחקן
    if (vertex.ownerId === playerId) {
      return true;
    }

    // בדיקה אם יש דרך של השחקן באחת הצלעות הסמוכות
    for (const adjacentEdgeId of vertex.adjacentEdgeIds) {
      const adjacentEdge = currentEdges[adjacentEdgeId];
      if (adjacentEdge.ownerId === playerId) {
        return true;
      }
    }

    return false;
  }

  /**
   * בודק אם שחקן יכול לשחק קלף פיתוח
   * @param player - מצב השחקן
   * @param cardType - סוג קלף הפיתוח
   * @returns תוצאת ולידציה
   */
  public canPlayDevCard(
    player: IPlayerState,
    cardType: DevelopmentCardType
  ): { valid: true } | { valid: false; reason: string } {
    // בדיקה 1: לשחקן חייב להיות קלף מהסוג הזה
    const hasCard = player.developmentCards.includes(cardType);
    if (!hasCard) {
      return { valid: false, reason: 'אין לשחקן את הקלף הזה' };
    }

    // בדיקה 2: קלפי נקודות ניצחון לא ניתנים למשחק
    if (cardType === DevelopmentCardType.VICTORY_POINT) {
      return { valid: false, reason: 'קלפי ניצחון לא ניתן לשחק' };
    }
    
    // בדיקה 3: ניתן לשחק רק קלף פיתוח אחד לתור
    const alreadyPlayedThisTurn = player.developmentCardsPlayedThisTurn.length > 0;
    if (alreadyPlayedThisTurn) {
      return { valid: false, reason: 'כבר שיחק קלף פיתוח בתור זה' };
    }

    return { valid: true };
  }

  /**
   * בודק אם ניתן לשדרג התיישבות לעיר
   * @param playerId - מזהה השחקן
   * @param vertexId - מזהה הקודקוד
   * @param currentVertices - רשימת הקודקודים הנוכחית
   * @returns תוצאת ולידציה
   */
  public canUpgradeToCity(
    playerId: string,
    vertexId: number,
    currentVertices: Readonly<IVertex[]>
  ): { valid: true } | { valid: false; reason: string } {
    const vertex = currentVertices[vertexId];

    // בדיקה 1: חייב להיות כפר של השחקן
    if (vertex.ownerId !== playerId) {
      return { valid: false, reason: 'היישוב לא שייך לשחקן' };
    }

    // בדיקה 2: חייב להיות התיישבות (לא עיר)
    if (vertex.buildingType !== BuildingType.SETTLEMENT) {
      return { valid: false, reason: 'רק יישוב ניתן לשדרג לעיר' };
    }

    return { valid: true };
  }

  /**
   * בודק אם השחקן צריך לזרוק קלפים כאשר נזרק 7
   * @param player - מצב השחקן
   * @returns true אם השחקן צריך לזרוק מחצית מהקלפים
   */
  public mustDiscardOnSeven(player: IPlayerState): boolean {
    const totalResources = Object.values(player.resources).reduce(
      (sum, count) => sum + count,
      0
    );
    return totalResources > 7;
  }

  /**
   * בודק אם מספר הקלפים לזריקה תקין (מחצית, מעוגל למטה)
   * @param player - מצב השחקן
   * @param discardCount - מספר הקלפים לזריקה
   * @returns תוצאת ולידציה
   */
  public isValidDiscardCount(
    player: IPlayerState,
    discardCount: number
  ): { valid: true } | { valid: false; reason: string } {
    const totalResources = Object.values(player.resources).reduce(
      (sum, count) => sum + count,
      0
    );
    const expectedDiscard = Math.floor(totalResources / 2);
    
    if (discardCount !== expectedDiscard) {
      return { valid: false, reason: `צריך לזרוק ${expectedDiscard} קלפים` };
    }
    return { valid: true };
  }

  /**
   * בודק אם מיקום השודד תקין (לא על המדבר, לא על אריח נוכחי)
   * @param newTileId - מזהה האריח החדש
   * @param currentRobberTileId - מזהה האריח הנוכחי של השודד
   * @returns תוצאת ולידציה
   */
  public isValidRobberPlacement(
    newTileId: number,
    currentRobberTileId: number
  ): { valid: true } | { valid: false; reason: string } {
    // לא ניתן להשאיר את השודד באותו מקום
    if (newTileId === currentRobberTileId) {
      return { valid: false, reason: 'השודד חייב לעבור למשבצת אחרת' };
    }
    return { valid: true };
  }
}
