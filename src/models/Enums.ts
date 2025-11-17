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
  CITY = "CITY",              // עיר (2 VP, 2 משאבים)
  ROAD = "ROAD",              // כביש (לחישוב עלות)
  DEVELOPMENT_CARD = "DEVELOPMENT_CARD"  // קלף פיתוח (לחישוב עלות)
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
  ROLLING_DICE = "ROLLING_DICE",        // הטלת קוביות
  DISCARDING = "DISCARDING",            // זריקת קלפים (7)
  MOVING_ROBBER = "MOVING_ROBBER",      // הזזת שודד
  MAIN_ACTIONS = "MAIN_ACTIONS",        // פעולות ראשיות (בנייה, מסחר, קלפים)
  PLACING_SETTLEMENT = "PLACING_SETTLEMENT"  // הצבת יישוב (שלב SETUP)
}

/**
 * שלבי המשחק
 */
export enum GamePhase {
  SETUP = "SETUP",                      // שלב התחלה (2 סיבובים)
  MAIN_GAME = "MAIN_GAME",              // משחק רגיל
  GAME_OVER = "GAME_OVER"
}

/**
 * סוגי פעולות במשחק
 */
export enum ActionType {
  // פעולות בסיסיות
  ROLL_DICE = "ROLL_DICE",
  END_TURN = "END_TURN",
  
  // בנייה
  BUILD_ROAD = "BUILD_ROAD",
  BUILD_SETTLEMENT = "BUILD_SETTLEMENT",
  BUILD_CITY = "BUILD_CITY",
  BUY_DEVELOPMENT_CARD = "BUY_DEVELOPMENT_CARD",
  
  // מסחר
  TRADE_WITH_BANK = "TRADE_WITH_BANK",
  TRADE_WITH_PORT = "TRADE_WITH_PORT",
  OFFER_TRADE = "OFFER_TRADE",
  ACCEPT_TRADE = "ACCEPT_TRADE",
  
  // קלפי פיתוח
  PLAY_DEVELOPMENT_CARD = "PLAY_DEVELOPMENT_CARD",
  
  // שודד
  MOVE_ROBBER = "MOVE_ROBBER",
  DISCARD_CARDS = "DISCARD_CARDS"
}

