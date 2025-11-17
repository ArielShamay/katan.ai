import { ResourceType, DevelopmentCardType } from './Enums';

/**
 * קבועים פיזיים של המשחק
 */
export const GAME_CONSTANTS = {
  // מבנה הלוח
  TOTAL_TILES: 19,
  TOTAL_EDGES: 72,
  TOTAL_VERTICES: 54,
  TOTAL_PORTS: 9,
  
  // אריחי משאבים לפי סוג
  TILE_COUNTS: {
    [ResourceType.LUMBER]: 4,
    [ResourceType.GRAIN]: 4,
    [ResourceType.WOOL]: 4,
    [ResourceType.BRICK]: 3,
    [ResourceType.ORE]: 3,
    [ResourceType.DESERT]: 1
  } as Record<ResourceType, number>,
  
  // אסימוני מספרים (18 סה"כ, ללא 7)
  DICE_NUMBERS: [2, 3, 3, 4, 4, 5, 5, 6, 6, 8, 8, 9, 9, 10, 10, 11, 11, 12],
  
  // הסתברויות (נקודות על האסימונים)
  DICE_PROBABILITIES: {
    2: 1, 3: 2, 4: 3, 5: 4, 6: 5,
    8: 5, 9: 4, 10: 3, 11: 2, 12: 1
  } as Record<number, number>,
  
  // שחקנים
  MIN_PLAYERS: 3,
  MAX_PLAYERS: 4,
  VICTORY_POINTS_TO_WIN: 10,
  
  // רכיבים לכל שחקן
  SETTLEMENTS_PER_PLAYER: 5,
  CITIES_PER_PLAYER: 4,
  ROADS_PER_PLAYER: 15,
  
  // בנק משאבים
  RESOURCE_CARDS_PER_TYPE: 19,
  ROBBER_HAND_LIMIT: 7,              // השלכה ב-8+
  
  // קלפי התפתחות (25 סה"כ)
  DEV_CARD_COUNTS: {
    [DevelopmentCardType.KNIGHT]: 14,
    [DevelopmentCardType.VICTORY_POINT]: 5,
    [DevelopmentCardType.ROAD_BUILDING]: 2,
    [DevelopmentCardType.MONOPOLY]: 2,
    [DevelopmentCardType.YEAR_OF_PLENTY]: 2
  } as Record<DevelopmentCardType, number>,
  
  // קלפים מיוחדים
  MIN_ROADS_FOR_LONGEST_ROAD: 5,
  MIN_KNIGHTS_FOR_LARGEST_ARMY: 3,
  LONGEST_ROAD_VP: 2,
  LARGEST_ARMY_VP: 2
} as const;

/**
 * עלויות בניה (מחירון)
 */
export const BUILD_COSTS = {
  ROAD: {
    [ResourceType.BRICK]: 1,
    [ResourceType.LUMBER]: 1
  },
  SETTLEMENT: {
    [ResourceType.BRICK]: 1,
    [ResourceType.LUMBER]: 1,
    [ResourceType.WOOL]: 1,
    [ResourceType.GRAIN]: 1
  },
  CITY: {
    [ResourceType.ORE]: 3,
    [ResourceType.GRAIN]: 2
  },
  DEVELOPMENT_CARD: {
    [ResourceType.ORE]: 1,
    [ResourceType.WOOL]: 1,
    [ResourceType.GRAIN]: 1
  }
} as const;

/**
 * יחסי סחר
 */
export const TRADE_RATIOS = {
  BANK_DEFAULT: 4,        // 4:1 ללא נמל
  PORT_GENERAL: 3,        // 3:1 נמל כללי
  PORT_SPECIFIC: 2        // 2:1 נמל ספציפי
} as const;
