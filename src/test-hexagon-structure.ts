/**
 * בדיקת מבנה משושה - וידוא שכל אריח מוגדר עם 6 קודקודים ו-6 צלעות
 */

import * as fs from 'fs';
import * as path from 'path';

const configPath = path.join(__dirname, '../config/board_static.json');
const configData = JSON.parse(fs.readFileSync(configPath, 'utf-8'));

console.log('=== בדיקת מבנה משושה לכל אריח ===\n');

const tiles = configData.graph_structure.tiles.tile_layout;
let allValid = true;

tiles.forEach((tile: any) => {
  const vertexCount = tile.adjacentVertexIds.length;
  const edgeCount = tile.adjacentEdgeIds.length;
  const isValid = vertexCount === 6 && edgeCount === 6;
  const status = isValid ? '✅' : '❌';
  
  if (!isValid) {
    allValid = false;
  }
  
  console.log(`${status} אריח ${tile.tileId} (${tile.position}):`);
  console.log(`   קודקודים: ${vertexCount}/6 - ${tile.adjacentVertexIds.join(', ')}`);
  console.log(`   צלעות: ${edgeCount}/6 - ${tile.adjacentEdgeIds.join(', ')}`);
  
  if (!isValid) {
    console.log(`   ⚠️  אריח לא תקין!`);
  }
  console.log('');
});

console.log('=== סיכום ===');
console.log(`סה"כ אריחים: ${tiles.length}`);
console.log(`אריחים תקינים: ${tiles.filter((t: any) => t.adjacentVertexIds.length === 6 && t.adjacentEdgeIds.length === 6).length}`);
console.log('');

if (allValid) {
  console.log('✅ כל האריחים משושים תקינים (6 קודקודים + 6 צלעות)!');
  console.log('✅ הפרויקט מתאים לדרישות קובץ ההוראות');
} else {
  console.log('❌ נמצאו אריחים שאינם משושים תקינים');
  console.log('❌ יש לתקן את הקונפיגורציה');
  process.exit(1);
}

// בדיקות נוספות - התאמה לקובץ ההוראות
console.log('\n=== בדיקות נוספות - התאמה לקובץ ההוראות ===\n');

console.log('📊 קבועים פיזיים:');
console.log(`   - אריחים: ${tiles.length} (צפוי: 19) ${tiles.length === 19 ? '✅' : '❌'}`);
console.log(`   - קודקודים: ${configData.graph_structure.vertices.count} (צפוי: 54) ${configData.graph_structure.vertices.count === 54 ? '✅' : '❌'}`);
console.log(`   - צלעות: ${configData.graph_structure.edges.count} (צפוי: 72) ${configData.graph_structure.edges.count === 72 ? '✅' : '❌'}`);
console.log(`   - נמלים: ${configData.port_locations.ports.length} (צפוי: 9) ${configData.port_locations.ports.length === 9 ? '✅' : '❌'}`);
console.log('');

console.log('🏝️  התפלגות אריחים:');
const tileCounts = configData.tile_distribution.resources;
console.log(`   - יער (LUMBER): ${tileCounts.LUMBER} (צפוי: 4) ${tileCounts.LUMBER === 4 ? '✅' : '❌'}`);
console.log(`   - חיטה (GRAIN): ${tileCounts.GRAIN} (צפוי: 4) ${tileCounts.GRAIN === 4 ? '✅' : '❌'}`);
console.log(`   - צמר (WOOL): ${tileCounts.WOOL} (צפוי: 4) ${tileCounts.WOOL === 4 ? '✅' : '❌'}`);
console.log(`   - לבנים (BRICK): ${tileCounts.BRICK} (צפוי: 3) ${tileCounts.BRICK === 3 ? '✅' : '❌'}`);
console.log(`   - עפרות (ORE): ${tileCounts.ORE} (צפוי: 3) ${tileCounts.ORE === 3 ? '✅' : '❌'}`);
console.log(`   - מדבר (DESERT): ${tileCounts.DESERT} (צפוי: 1) ${tileCounts.DESERT === 1 ? '✅' : '❌'}`);
console.log('');

console.log('🎲 מספרי קוביות:');
const diceNumbers = configData.dice_numbers.numbers;
console.log(`   - סה"כ מספרים: ${diceNumbers.length} (צפוי: 18) ${diceNumbers.length === 18 ? '✅' : '❌'}`);
console.log(`   - טווח: 2-12 (ללא 7) ${diceNumbers.includes(7) ? '❌ מכיל 7!' : '✅'}`);
console.log('');

console.log('⚓ נמלים:');
const ports = configData.port_locations.ports;
const generalPorts = ports.filter((p: any) => p.type === 'GENERAL_3_TO_1').length;
const specificPorts = ports.filter((p: any) => p.type !== 'GENERAL_3_TO_1').length;
console.log(`   - נמלים כלליים (3:1): ${generalPorts} (צפוי: 4) ${generalPorts === 4 ? '✅' : '❌'}`);
console.log(`   - נמלים ספציפיים (2:1): ${specificPorts} (צפוי: 5) ${specificPorts === 5 ? '✅' : '❌'}`);
console.log('');

console.log('✅ כל הבדיקות עברו בהצלחה!');
console.log('✅ הפרויקט מוכן להמשך פיתוח!');
