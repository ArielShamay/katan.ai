/**
 * בדיקת אלגוריתם הדרך הארוכה ביותר (Longest Road)
 */

import { HexGraphManager } from './board/HexGraphManager';
import { IEdge } from './models/BoardComponents';

console.log('=== בדיקת אלגוריתם הדרך הארוכה ביותר ===\n');

const graphManager = new HexGraphManager();

// יצירת סט דרכים לבדיקה - שחקן 1 בנה דרך ישרה
console.log('🧪 מקרה בדיקה 1: דרך ישרה פשוטה');
const straightRoad: IEdge[] = [
  {
    id: 0,
    vertexIds: [0, 1],
    adjacentTileIds: [0],
    ownerId: 'player1',
    adjacentEdgeIds: [1, 2, 6]
  },
  {
    id: 1,
    vertexIds: [1, 2],
    adjacentTileIds: [0],
    ownerId: 'player1',
    adjacentEdgeIds: [0, 2]
  },
  {
    id: 2,
    vertexIds: [2, 3],
    adjacentTileIds: [0, 1],
    ownerId: 'player1',
    adjacentEdgeIds: [0, 1, 3, 7]
  },
  {
    id: 3,
    vertexIds: [3, 4],
    adjacentTileIds: [1],
    ownerId: 'player1',
    adjacentEdgeIds: [2, 4, 7]
  },
  {
    id: 4,
    vertexIds: [4, 5],
    adjacentTileIds: [1, 2],
    ownerId: 'player1',
    adjacentEdgeIds: [3, 5, 9]
  }
];

const length1 = graphManager.getLongestRoad(straightRoad, 'player1');
console.log(`   דרכים: ${straightRoad.length}`);
console.log(`   אורך הדרך הארוכה ביותר: ${length1}`);
console.log(`   ${length1 === 5 ? '✅ נכון!' : '❌ שגוי - צפוי 5'}\n`);

// מקרה בדיקה 2: דרך מסועפת
console.log('🧪 מקרה בדיקה 2: דרך מסועפת (צורת Y)');
const branchedRoad: IEdge[] = [
  {
    id: 0,
    vertexIds: [0, 1],
    adjacentTileIds: [0],
    ownerId: 'player1',
    adjacentEdgeIds: [1, 2, 6]
  },
  {
    id: 1,
    vertexIds: [1, 2],
    adjacentTileIds: [0],
    ownerId: 'player1',
    adjacentEdgeIds: [0, 2]
  },
  {
    id: 2,
    vertexIds: [2, 3],
    adjacentTileIds: [0, 1],
    ownerId: 'player1',
    adjacentEdgeIds: [0, 1, 3, 7]
  },
  // הסתעפות 1
  {
    id: 3,
    vertexIds: [3, 4],
    adjacentTileIds: [1],
    ownerId: 'player1',
    adjacentEdgeIds: [2, 4, 7]
  },
  {
    id: 4,
    vertexIds: [4, 5],
    adjacentTileIds: [1, 2],
    ownerId: 'player1',
    adjacentEdgeIds: [3, 5, 9]
  },
  // הסתעפות 2
  {
    id: 7,
    vertexIds: [3, 9],
    adjacentTileIds: [0, 1, 3],
    ownerId: 'player1',
    adjacentEdgeIds: [2, 3, 10, 18]
  },
  {
    id: 10,
    vertexIds: [8, 9],
    adjacentTileIds: [0, 3],
    ownerId: 'player1',
    adjacentEdgeIds: [6, 7, 15, 18]
  }
];

const length2 = graphManager.getLongestRoad(branchedRoad, 'player1');
console.log(`   דרכים: ${branchedRoad.length}`);
console.log(`   אורך הדרך הארוכה ביותר: ${length2}`);
console.log(`   ${length2 === 6 ? '✅ נכון!' : `❌ שגוי - צפוי 6 (מקצה לקצה דרך הצומת)`}\n`);

// מקרה בדיקה 3: מעגל סגור
console.log('🧪 מקרה בדיקה 3: מעגל סגור');
const circularRoad: IEdge[] = [
  {
    id: 0,
    vertexIds: [0, 1],
    adjacentTileIds: [0],
    ownerId: 'player1',
    adjacentEdgeIds: [1, 2, 6]
  },
  {
    id: 1,
    vertexIds: [1, 2],
    adjacentTileIds: [0],
    ownerId: 'player1',
    adjacentEdgeIds: [0, 2]
  },
  {
    id: 2,
    vertexIds: [2, 3],
    adjacentTileIds: [0, 1],
    ownerId: 'player1',
    adjacentEdgeIds: [0, 1, 3, 7]
  },
  {
    id: 7,
    vertexIds: [3, 9],
    adjacentTileIds: [0, 1, 3],
    ownerId: 'player1',
    adjacentEdgeIds: [2, 3, 10, 18]
  },
  {
    id: 10,
    vertexIds: [8, 9],
    adjacentTileIds: [0, 3],
    ownerId: 'player1',
    adjacentEdgeIds: [6, 7, 15, 18]
  },
  {
    id: 6,
    vertexIds: [0, 8],
    adjacentTileIds: [0, 3],
    ownerId: 'player1',
    adjacentEdgeIds: [0, 10, 15]
  }
];

const length3 = graphManager.getLongestRoad(circularRoad, 'player1');
console.log(`   דרכים: ${circularRoad.length}`);
console.log(`   אורך הדרך הארוכה ביותר: ${length3}`);
console.log(`   ${length3 === 6 ? '✅ נכון!' : `❌ שגוי - צפוי 6 (כל המעגל)`}\n`);

// מקרה בדיקה 4: דרך בודדת
console.log('🧪 מקרה בדיקה 4: דרך בודדת');
const singleRoad: IEdge[] = [
  {
    id: 0,
    vertexIds: [0, 1],
    adjacentTileIds: [0],
    ownerId: 'player1',
    adjacentEdgeIds: [1, 2, 6]
  }
];

const length4 = graphManager.getLongestRoad(singleRoad, 'player1');
console.log(`   דרכים: ${singleRoad.length}`);
console.log(`   אורך הדרך הארוכה ביותר: ${length4}`);
console.log(`   ${length4 === 1 ? '✅ נכון!' : '❌ שגוי - צפוי 1'}\n`);

// מקרה בדיקה 5: אין דרכים
console.log('🧪 מקרה בדיקה 5: אין דרכים');
const noRoads: IEdge[] = [];
const length5 = graphManager.getLongestRoad(noRoads, 'player1');
console.log(`   דרכים: ${noRoads.length}`);
console.log(`   אורך הדרך הארוכה ביותר: ${length5}`);
console.log(`   ${length5 === 0 ? '✅ נכון!' : '❌ שגוי - צפוי 0'}\n`);

// מקרה בדיקה 6: שני שחקנים - רק דרכי player1 נספרות
console.log('🧪 מקרה בדיקה 6: מספר שחקנים (רק player1 נספר)');
const multiPlayerRoads: IEdge[] = [
  // Player 1
  {
    id: 0,
    vertexIds: [0, 1],
    adjacentTileIds: [0],
    ownerId: 'player1',
    adjacentEdgeIds: [1, 2, 6]
  },
  {
    id: 1,
    vertexIds: [1, 2],
    adjacentTileIds: [0],
    ownerId: 'player1',
    adjacentEdgeIds: [0, 2]
  },
  {
    id: 2,
    vertexIds: [2, 3],
    adjacentTileIds: [0, 1],
    ownerId: 'player1',
    adjacentEdgeIds: [0, 1, 3, 7]
  },
  // Player 2 (לא צריך להיספר)
  {
    id: 3,
    vertexIds: [3, 4],
    adjacentTileIds: [1],
    ownerId: 'player2',
    adjacentEdgeIds: [2, 4, 7]
  },
  {
    id: 4,
    vertexIds: [4, 5],
    adjacentTileIds: [1, 2],
    ownerId: 'player2',
    adjacentEdgeIds: [3, 5, 9]
  }
];

const length6 = graphManager.getLongestRoad(multiPlayerRoads, 'player1');
console.log(`   סה"כ דרכים: ${multiPlayerRoads.length}`);
console.log(`   דרכים של player1: 3`);
console.log(`   אורך הדרך הארוכה ביותר לplayer1: ${length6}`);
console.log(`   ${length6 === 3 ? '✅ נכון!' : '❌ שגוי - צפוי 3'}\n`);

console.log('=== סיכום ===');
const allPassed = length1 === 5 && length2 === 6 && length3 === 6 && length4 === 1 && length5 === 0 && length6 === 3;
console.log(allPassed ? '✅ כל בדיקות הדרך הארוכה עברו בהצלחה!' : '❌ חלק מהבדיקות נכשלו');
