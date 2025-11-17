import { ResourceType, PortType, BuildingType } from './Enums';

/**
 * אריח משאב משושה (Hex Tile)
 * 19 אריחים סה"כ: 4 יער, 4 חיטה, 4 כבשים, 3 הרים, 3 גבעות, 1 מדבר
 */
export interface ITile {
  readonly id: number;                           // מזהה ייחודי (0-18)
  readonly resourceType: ResourceType;           // סוג המשאב
  readonly diceNumber: number | null;            // מספר הקובייה (2-12, null למדבר)
  readonly probability: number;                  // הסתברות (מספר הנקודות על האסימון)
  readonly isRobberPresent: boolean;             // האם השוד נמצא על האריח
  readonly adjacentVertexIds: number[];          // מזהי 6 הקודקודים הסמוכים
  readonly adjacentEdgeIds: number[];            // מזהי 6 הצלעות הסמוכות
}

/**
 * צלע/דרך בין שני קודקודים (Edge)
 * 72 צלעות סה"כ בלוח
 */
export interface IEdge {
  readonly id: number;                           // מזהה ייחודי (0-71)
  readonly vertexIds: readonly [number, number]; // שני הקודקודים שהצלע מחברת
  readonly adjacentTileIds: number[];            // אריחים סמוכים (1-2)
  readonly ownerId: string | null;               // מזהה השחקן שבנה כביש (null אם ריק)
  readonly adjacentEdgeIds: number[];            // צלעות סמוכות (לחישוב דרך ארוכה)
}

/**
 * קודקוד/צומת בין 3 אריחים (Vertex)
 * 54 קודקודים סה"כ בלוח
 */
export interface IVertex {
  readonly id: number;                           // מזהה ייחודי (0-53)
  readonly adjacentTileIds: number[];            // 2-3 אריחים סמוכים
  readonly adjacentEdgeIds: number[];            // 2-3 צלעות סמוכות
  readonly adjacentVertexIds: number[];          // קודקודים שכנים (לאכיפת חוק מרחק)
  readonly ownerId: string | null;               // מזהה השחקן שבנה (null אם ריק)
  readonly buildingType: BuildingType;           // סוג המבנה (NONE/SETTLEMENT/CITY)
  readonly portType: PortType;                   // סוג הנמל (NONE אם אין)
}
