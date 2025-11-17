/**
 * קובץ לבדיקת טעינת קבצי הקונפיגורציה
 * מוודא שהקבצים תקינים ותואמים למבני הנתונים
 */

import * as fs from 'fs';
import * as path from 'path';

// טעינת קובץ המחירון
const costsPath = path.join(__dirname, '../config/costs.json');
const costsData = JSON.parse(fs.readFileSync(costsPath, 'utf-8'));

console.log('✅ קובץ costs.json נטען בהצלחה');
console.log('מחירון בניה:');
console.log('- כביש:', costsData.costs.ROAD);
console.log('- כפר:', costsData.costs.SETTLEMENT);
console.log('- עיר:', costsData.costs.CITY);
console.log('- קלף התפתחות:', costsData.costs.DEVELOPMENT_CARD);
console.log('');

// טעינת קובץ הלוח הסטטי
const boardPath = path.join(__dirname, '../config/board_static.json');
const boardData = JSON.parse(fs.readFileSync(boardPath, 'utf-8'));

console.log('✅ קובץ board_static.json נטען בהצלחה');
console.log('מבנה הלוח:');
console.log('- סה"כ אריחים:', boardData.tile_distribution.total);
console.log('- סה"כ קודקודים:', boardData.graph_structure.vertices.count);
console.log('- סה"כ צלעות:', boardData.graph_structure.edges.count);
console.log('- סה"כ נמלים:', boardData.port_locations.ports.length);
console.log('');

// אימות התאמה לקבועים
const expectedResources = {
  LUMBER: 4,
  GRAIN: 4,
  WOOL: 4,
  BRICK: 3,
  ORE: 3,
  DESERT: 1
};

let isValid = true;

for (const [resource, count] of Object.entries(expectedResources)) {
  if (boardData.tile_distribution.resources[resource] !== count) {
    console.error(`❌ שגיאה: מספר אריחי ${resource} לא תקין`);
    isValid = false;
  }
}

// אימות מספר נמלים
const portsByType = {
  GENERAL_3_TO_1: 0,
  LUMBER_2_TO_1: 0,
  BRICK_2_TO_1: 0,
  WOOL_2_TO_1: 0,
  GRAIN_2_TO_1: 0,
  ORE_2_TO_1: 0
};

boardData.port_locations.ports.forEach((port: any) => {
  portsByType[port.type as keyof typeof portsByType]++;
});

console.log('התפלגות נמלים:');
console.log('- נמלים כלליים (3:1):', portsByType.GENERAL_3_TO_1);
console.log('- נמלים ספציפיים (2:1):', 
  portsByType.LUMBER_2_TO_1 + 
  portsByType.BRICK_2_TO_1 + 
  portsByType.WOOL_2_TO_1 + 
  portsByType.GRAIN_2_TO_1 + 
  portsByType.ORE_2_TO_1
);
console.log('');

if (portsByType.GENERAL_3_TO_1 !== 4) {
  console.error('❌ שגיאה: צריך להיות בדיוק 4 נמלים כלליים');
  isValid = false;
}

const specificPorts = portsByType.LUMBER_2_TO_1 + 
  portsByType.BRICK_2_TO_1 + 
  portsByType.WOOL_2_TO_1 + 
  portsByType.GRAIN_2_TO_1 + 
  portsByType.ORE_2_TO_1;

if (specificPorts !== 5) {
  console.error('❌ שגיאה: צריך להיות בדיוק 5 נמלים ספציפיים');
  isValid = false;
}

// אימות מבנה הגרף
const vertexCount = boardData.graph_structure.vertex_adjacency.vertices.length;
const edgeCount = boardData.graph_structure.edge_adjacency.edges.length;
const tileCount = boardData.graph_structure.tiles.tile_layout.length;

if (vertexCount !== 54) {
  console.error('❌ שגיאה: צריך להיות בדיוק 54 קודקודים');
  isValid = false;
}

if (edgeCount !== 72) {
  console.error('❌ שגיאה: צריך להיות בדיוק 72 צלעות');
  isValid = false;
}

if (tileCount !== 19) {
  console.error('❌ שגיאה: צריך להיות בדיוק 19 אריחים');
  isValid = false;
}

if (isValid) {
  console.log('✅ כל קבצי הקונפיגורציה תקינים ועומדים בדרישות!');
} else {
  console.error('❌ נמצאו שגיאות בקבצי הקונפיגורציה');
  process.exit(1);
}
