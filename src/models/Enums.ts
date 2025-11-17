/**
 * סוגי משאבים במשחק קטאן
 * 5 משאבים בסיסיים + מדבר (ללא משאב)
 */
export enum ResourceType {
  LUMBER = "LUMBER",      // עץ/יער
  BRICK = "BRICK",        // לבנים/חומר בניה
  WOOL = "WOOL",          // צמר/כבשים
  GRAIN = "GRAIN",        // חיטה
  ORE = "ORE",           // עפרות
  DESERT = "DESERT"       // מדבר (ללא ייצור)
}

/**
 * סוגי מבנים שניתן לבנות
 */
export enum BuildingType {
  NONE = "NONE",
  SETTLEMENT = "SETTLEMENT",  // כפר (1 VP, 1 משאב)
  CITY = "CITY"              // עיר (2 VP, 2 משאבים)
}

/**
 * סוגי קלפי התפתחות (25 קלפים סה"כ)
 * 14 אביר, 5 VP, 2 מכל סוג התקדמות
 */
export enum DevelopmentCardType {
  KNIGHT = "KNIGHT",                    // אביר (14) - מזיז שוד
  VICTORY_POINT = "VICTORY_POINT",      // נקודת ניצחון (5)
  ROAD_BUILDING = "ROAD_BUILDING",      // בניית כבישים (2)
  MONOPOLY = "MONOPOLY",                // מונופול (2)
  YEAR_OF_PLENTY = "YEAR_OF_PLENTY"    // שנת שפע (2)
}

/**
 * סוגי נמלי סחר (9 נמלים סה"כ)
 * 4 כלליים (3:1) + 5 ספציפיים (2:1)
 */
export enum PortType {
  NONE = "NONE",
  GENERAL_3_TO_1 = "GENERAL_3_TO_1",    // 4 נמלים
  LUMBER_2_TO_1 = "LUMBER_2_TO_1",      // 1 נמל
  BRICK_2_TO_1 = "BRICK_2_TO_1",        // 1 נמל
  WOOL_2_TO_1 = "WOOL_2_TO_1",          // 1 נמל
  GRAIN_2_TO_1 = "GRAIN_2_TO_1",        // 1 נמל
  ORE_2_TO_1 = "ORE_2_TO_1"            // 1 נמל
}

/**
 * שלבי התור
 */
export enum TurnPhase {
  ROLL_DICE = "ROLL_DICE",
  HANDLE_ROBBER = "HANDLE_ROBBER",      // כאשר זורקים 7
  DISTRIBUTE_RESOURCES = "DISTRIBUTE_RESOURCES",
  TRADE = "TRADE",
  BUILD = "BUILD",
  END_TURN = "END_TURN"
}

/**
 * שלבי המשחק
 */
export enum GamePhase {
  SETUP_ROUND_1 = "SETUP_ROUND_1",      // סיבוב התחלה ראשון (1→4)
  SETUP_ROUND_2 = "SETUP_ROUND_2",      // סיבוב התחלה שני (4→1)
  MAIN_GAME = "MAIN_GAME",              // משחק רגיל
  GAME_OVER = "GAME_OVER"
}
