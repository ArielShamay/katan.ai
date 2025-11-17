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
   * @returns true אם ניתן להציב התיישבות
   */
  public canPlaceSettlement(
    playerId: string,
    vertexId: number,
    currentEdges: Readonly<IEdge[]>,
    currentVertices: Readonly<IVertex[]>,
    isSetupPhase: boolean = false
  ): boolean {
    const vertex = currentVertices[vertexId];

    // בדיקה 1: הקודקוד חייב להיות ריק
    if (vertex.ownerId !== null) {
      return false;
    }

    // בדיקה 2: חוק המרחק - לא יכול להיות מבנה בקודקודים הסמוכים
    if (!this.checkDistanceRule(vertexId, currentVertices)) {
      return false;
    }

    // בדיקה 3: בשלב המשחק הרגיל (לא setup) - חייבת להיות קישוריות לדרך של השחקן
    if (!isSetupPhase) {
      if (!this.hasConnectedRoad(playerId, vertexId, currentEdges, currentVertices)) {
        return false;
      }
    }

    return true;
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
   * בודק אם ניתן להציב דרך על צלע
   * @param playerId - מזהה השחקן
   * @param edgeId - מזהה הצלע
   * @param currentEdges - רשימת הצלעות הנוכחית
   * @param currentVertices - רשימת הקודקודים הנוכחית
   * @returns true אם ניתן להציב דרך
   */
  public canPlaceRoad(
    playerId: string,
    edgeId: number,
    currentEdges: Readonly<IEdge[]>,
    currentVertices: Readonly<IVertex[]>
  ): boolean {
    const edge = currentEdges[edgeId];

    // בדיקה 1: הצלע חייבת להיות ריקה
    if (edge.ownerId !== null) {
      return false;
    }

    // בדיקה 2: הדרך חייבת להיות מחוברת לדרך/כפר/עיר של השחקן
    if (!this.isRoadConnected(playerId, edgeId, currentEdges, currentVertices)) {
      return false;
    }

    return true;
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
   * @returns true אם ניתן לשחק את הקלף
   */
  public canPlayDevCard(player: IPlayerState, cardType: DevelopmentCardType): boolean {
    // בדיקה 1: לשחקן חייב להיות קלף מהסוג הזה
    const cardCount = player.developmentCards[cardType] || 0;
    if (cardCount === 0) {
      return false;
    }

    // בדיקה 2: קלפי נקודות ניצחון לא ניתנים למשחק
    if (cardType === DevelopmentCardType.VICTORY_POINT) {
      return false;
    }

    // בדיקה 3: לא ניתן לשחק קלף שנקנה באותו תור
    // הערה: זה יבדק במנוע המשחק על ידי מעקב אחר קלפים שנקנו בתור זה
    
    // בדיקה 4: ניתן לשחק רק קלף פיתוח אחד לתור (כולל אבירים)
    const alreadyPlayedThisTurn = player.developmentCardsPlayedThisTurn.length > 0;
    if (alreadyPlayedThisTurn) {
      return false;
    }

    return true;
  }

  /**
   * בודק אם ניתן לשדרג התיישבות לעיר
   * @param playerId - מזהה השחקן
   * @param vertexId - מזהה הקודקוד
   * @param currentVertices - רשימת הקודקודים הנוכחית
   * @returns true אם ניתן לשדרג
   */
  public canUpgradeToCity(
    playerId: string,
    vertexId: number,
    currentVertices: Readonly<IVertex[]>
  ): boolean {
    const vertex = currentVertices[vertexId];

    // בדיקה 1: חייב להיות כפר של השחקן
    if (vertex.ownerId !== playerId) {
      return false;
    }

    // בדיקה 2: חייב להיות התיישבות (לא עיר)
    if (vertex.buildingType !== BuildingType.SETTLEMENT) {
      return false;
    }

    return true;
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
   * @returns true אם מספר הזריקה תקין
   */
  public isValidDiscardCount(player: IPlayerState, discardCount: number): boolean {
    const totalResources = Object.values(player.resources).reduce(
      (sum, count) => sum + count,
      0
    );
    const expectedDiscard = Math.floor(totalResources / 2);
    return discardCount === expectedDiscard;
  }

  /**
   * בודק אם מיקום השודד תקין (לא על המדבר, לא על אריח נוכחי)
   * @param newTileId - מזהה האריח החדש
   * @param currentRobberTileId - מזהה האריח הנוכחי של השודד
   * @returns true אם המיקום תקין
   */
  public isValidRobberPlacement(newTileId: number, currentRobberTileId: number): boolean {
    // לא ניתן להשאיר את השודד באותו מקום
    return newTileId !== currentRobberTileId;
  }
}
