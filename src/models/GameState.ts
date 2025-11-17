import { IPlayerState } from './Player';
import { ITile, IEdge, IVertex } from './BoardComponents';
import { ResourceType, DevelopmentCardType, GamePhase, TurnPhase, PortType, ActionType } from './Enums';

/**
 * מצב המשחק המלא - Source of Truth
 * זהו ה-Immutable State היחיד במערכת
 */
export interface IGameState {
  // רכיבי לוח (קבועים לאורך המשחק)
  readonly tiles: readonly ITile[];                       // 19 אריחים
  readonly edges: readonly IEdge[];                       // 72 צלעות
  readonly vertices: readonly IVertex[];                  // 54 קודקודים
  
  // שחקנים (2-4 שחקנים)
  readonly players: readonly IPlayerState[];
  readonly currentPlayerIndex: number;                    // אינדקס השחקן הפעיל
  
  // בנק (מלאי משאבים וקלפים)
  readonly bankResources: Readonly<Record<ResourceType, number>>;  // 19 מכל סוג
  readonly developmentCardDeck: readonly DevelopmentCardType[];    // 25 קלפים (מעורבבים)
  
  // שלבי משחק
  readonly gamePhase: GamePhase;
  readonly turnPhase: TurnPhase;
  
  // מצב דינמי
  readonly diceResult: number | null;                     // תוצאת זריקת קוביות אחרונה
  readonly robberTileId: number;                          // איפה השודד נמצא
  
  // כרטיסים מיוחדים
  readonly longestRoadPlayerId: string | null;            // 2 VP (מינימום 5 כבישים)
  readonly largestArmyPlayerId: string | null;            // 2 VP (מינימום 3 אבירים)
  
  // ניצחון
  readonly winner: string | null;                         // מזהה השחקן המנצח
  
  // שלב התחלה (SETUP)
  readonly setupRound?: number;                           // 1 או 2
  readonly setupDirection?: number;                       // 1 = קדימה, -1 = אחורה
}

/**
 * פעולה במשחק - לצורך ביצוע פעולות על ידי שחקנים
 */
export interface IGameAction {
  readonly type: ActionType;
  readonly playerId: string;
  
  // נתוני פעולה ספציפיים (אופציונליים)
  readonly vertexId?: number;          // להצבת יישוב/עיר
  readonly edgeId?: number;            // להצבת כביש
  readonly tileId?: number;            // להזזת שודד
  readonly developmentCard?: DevelopmentCardType;  // לשימוש בקלף פיתוח
  
  // משאבים למסחר
  readonly giveResources?: Partial<Record<ResourceType, number>>;
  readonly takeResources?: Partial<Record<ResourceType, number>>;
  readonly portType?: PortType;
  
  // זריקת קלפים (7)
  readonly discardResources?: Partial<Record<ResourceType, number>>;
  
  // מסחר בין שחקנים
  readonly targetPlayerId?: string;    // שחקן יעד למסחר/גניבה
  readonly offeredResources?: Partial<Record<ResourceType, number>>;
  readonly requestedResources?: Partial<Record<ResourceType, number>>;
}
