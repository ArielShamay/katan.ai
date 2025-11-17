import { IPlayerState } from './Player';
import { ITile, IEdge, IVertex } from './BoardComponents';
import { ResourceType, DevelopmentCardType, GamePhase, TurnPhase } from './Enums';

/**
 * מצב המשחק המלא - Source of Truth
 * זהו ה-Immutable State היחיד במערכת
 */
export interface IGameState {
  // מטא-דאטה
  readonly gameId: string;
  readonly createdAt: Date;
  readonly phase: GamePhase;
  readonly turnPhase: TurnPhase;
  readonly turnNumber: number;
  
  // שחקנים (3-4 שחקנים)
  readonly players: readonly IPlayerState[];
  readonly activePlayerId: string;
  readonly playerOrder: readonly string[];                // סדר השחקנים
  
  // רכיבי לוח (קבועים לאורך המשחק)
  readonly tiles: readonly ITile[];                       // 19 אריחים
  readonly edges: readonly IEdge[];                       // 72 צלעות
  readonly vertices: readonly IVertex[];                  // 54 קודקודים
  
  // מצב דינמי
  readonly robberTileId: number;                 // איפה השוד נמצא
  readonly lastDiceRoll: readonly [number, number] | null; // תוצאת זריקה אחרונה
  
  // כרטיסים מיוחדים
  readonly longestRoadOwnerId: string | null;    // 2 VP (מינימום 5 כבישים)
  readonly largestArmyOwnerId: string | null;    // 2 VP (מינימום 3 אבירים)
  
  // בנק (מלאי משאבים וקלפים)
  readonly bankResources: Readonly<Record<ResourceType, number>>;  // 19 מכל סוג
  readonly bankDevCards: readonly DevelopmentCardType[];          // 25 קלפים (מעורבבים)
  
  // היסטוריה (אופציונלי - לתמיכה ב-undo/redo)
  readonly moveHistory?: readonly IGameAction[];
}

/**
 * פעולה במשחק - לצורך תיעוד והיסטוריה
 */
export interface IGameAction {
  readonly type: string;
  readonly playerId: string;
  readonly timestamp: Date;
  readonly data: any;
}
