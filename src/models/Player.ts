import { ResourceType, DevelopmentCardType } from './Enums';

/**
 * מצב שחקן בודד
 * כל שחקן: 5 כפרים, 4 ערים, 15 כבישים
 */
export interface IPlayerState {
  readonly id: string;                           // מזהה ייחודי
  readonly name: string;                         // שם השחקן
  readonly color: string;                        // צבע (לתצוגה)
  
  // משאבים (19 מכל סוג בבנק, DESERT תמיד 0)
  readonly resources: Readonly<Record<ResourceType, number>>;
  
  // קלפי התפתחות (מוסתרים עד שמשחקים)
  readonly developmentCards: readonly DevelopmentCardType[];  // רשימת קלפים שיש לשחקן
  readonly developmentCardsPlayedThisTurn: readonly DevelopmentCardType[];  // למניעת משחק כפול
  
  // מצב תור
  readonly hasRolledDice: boolean;               // האם הטיל קוביות בתור הנוכחי
  
  // רכיבים על הלוח
  readonly settlementsRemaining: number;         // 5 בהתחלה
  readonly citiesRemaining: number;              // 4 בהתחלה
  readonly roadsRemaining: number;               // 15 בהתחלה
  
  // סטטיסטיקות
  readonly victoryPoints: number;                // נקודות גלויות (ללא VP cards)
  readonly hiddenVictoryPoints: number;          // מקלפי VP
  readonly knightsPlayed: number;                // לחישוב צבא גדול
  readonly longestRoadLength: number;            // אורך דרך נוכחי
  
  // דגלים
  readonly hasLongestRoad: boolean;              // מחזיק ב"דרך הארוכה ביותר"
  readonly hasLargestArmy: boolean;              // מחזיק ב"צבא הגדול ביותר"
}

/**
 * סטטיסטיקות שחקן לצורך חישובים
 */
export interface IPlayerStats {
  readonly totalVictoryPoints: number;           // כולל קלפי VP מוסתרים
  readonly totalResources: number;
  readonly totalDevelopmentCards: number;
}
