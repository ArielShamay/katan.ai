/**
 * פונקציות עזר לגנרטור הלוח
 */

/**
 * אלגוריתם Fisher-Yates לערבוב מערך
 * @param array מערך לערבוב
 * @returns מערך מעורבב (מוטציה של המערך המקורי)
 */
export function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

/**
 * בדיקה האם שני אריחים שכנים
 * @param tileId1 אריח ראשון
 * @param tileId2 אריח שני
 * @param adjacencyMap מפת שכנויות אריחים
 * @returns true אם האריחים שכנים
 */
export function areTilesAdjacent(
  tileId1: number,
  tileId2: number,
  adjacencyMap: Map<number, number[]>
): boolean {
  const neighbors = adjacencyMap.get(tileId1);
  return neighbors ? neighbors.includes(tileId2) : false;
}

/**
 * בדיקה האם הצבת מספרים מקיימת את כללי האיזון
 * (מספרים בעלי הסתברות גבוהה - 6 ו-8 - לא צריכים להיות שכנים)
 * @param tileId מזהה האריח
 * @param diceNumber המספר להצבה
 * @param currentAssignment הצבה נוכחית של מספרים לאריחים
 * @param adjacencyMap מפת שכנויות אריחים
 * @returns true אם ההצבה תקינה
 */
export function isValidDiceNumberPlacement(
  tileId: number,
  diceNumber: number,
  currentAssignment: Map<number, number>,
  adjacencyMap: Map<number, number[]>
): boolean {
  // אם המספר הוא 6 או 8 (הסתברות גבוהה)
  if (diceNumber === 6 || diceNumber === 8) {
    const neighbors = adjacencyMap.get(tileId) || [];
    
    // בדוק שאף שכן לא מכיל 6 או 8
    for (const neighborId of neighbors) {
      const neighborNumber = currentAssignment.get(neighborId);
      if (neighborNumber === 6 || neighborNumber === 8) {
        return false;
      }
    }
  }
  
  return true;
}

/**
 * יצירת מספר אקראי בטווח
 * @param min מינימום (כולל)
 * @param max מקסימום (כולל)
 * @returns מספר שלם אקראי
 */
export function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

/**
 * יצירת UUID פשוט
 * @returns מחרוזת UUID
 */
export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}
