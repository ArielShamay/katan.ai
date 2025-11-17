import { ResourceType, DevelopmentCardType } from './Enums';

/**
 * מצב שחקן בודד
 * כל שחקן: 5 כפרים, 4 ערים, 15 כבישים
 */
export interface IPlayerState {
  readonly id: string;                           // מזהה ייחודי
  readonly name: string;                         // שם השחקן
  readonly color: string;                        // צבע (לתצוגה)
  
  // משאבים (19 מכל סוג בבנק)
  readonly resources: Readonly<Record<ResourceType, number>>;
  
  // קלפי התפתחות (מוסתרים עד שמשחקים)
  readonly developmentCards: Readonly<Record<DevelopmentCardType, number>>;
  readonly developmentCardsPlayedThisTurn: readonly DevelopmentCardType[];  // למניעת משחק כפול
  
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
