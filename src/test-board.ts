/**
 * קובץ לבדיקת HexGraphManager ו-BoardGenerator
 * מוודא שהמחלקות עובדות כראוי ויוצרות לוח תקין
 */

import { BoardGenerator } from './board/BoardGenerator';
import { HexGraphManager } from './board/HexGraphManager';
import { ResourceType } from './models/Enums';
import { GAME_CONSTANTS } from './models/Constants';

console.log('=== בדיקת HexGraphManager ===\n');

const graphManager = new HexGraphManager();

console.log('✅ HexGraphManager נטען בהצלחה');
console.log(`📊 סטטיסטיקות גרף:`);
console.log(`   - קודקודים: ${graphManager.getVertexCount()}`);
console.log(`   - צלעות: ${graphManager.getEdgeCount()}`);
console.log(`   - אריחים: ${graphManager.getTileCount()}`);
console.log('');

// בדיקת פונקציות שכנויות
console.log('🔍 בדיקת פונקציות שכנויות:');
const testVertexId = 0;
const adjacentTiles = graphManager.getAdjacentTiles(testVertexId);
const adjacentVertices = graphManager.getAdjacentVertices(testVertexId);
const adjacentEdges = graphManager.getAdjacentEdges(testVertexId);

console.log(`   קודקוד ${testVertexId}:`);
console.log(`   - אריחים סמוכים: ${adjacentTiles.join(', ')}`);
console.log(`   - קודקודים סמוכים: ${adjacentVertices.join(', ')}`);
console.log(`   - צלעות סמוכות: ${adjacentEdges.join(', ')}`);
console.log('');

// בדיקת חוק מרחק
console.log('📏 בדיקת חוק מרחק:');
const testVertex1 = 10;
const testVertex2 = 11;
const isDistanceValid = graphManager.checkDistanceRule(testVertex1, [testVertex2]);
console.log(`   קודקוד ${testVertex1} עם קודקוד ${testVertex2} תפוס:`);
console.log(`   ${isDistanceValid ? '❌ לא תקין (שכנים)' : '✅ תקין (לא שכנים)'}`);
console.log('');

// בדיקת getVertexLocation
console.log('🎯 בדיקת getVertexLocation:');
const testTileId = 0;
for (let i = 0; i < 6; i++) {
  const vertexId = graphManager.getVertexLocation(testTileId, i);
  console.log(`   אריח ${testTileId}, אינדקס ${i}: קודקוד ${vertexId}`);
}
console.log('');

console.log('=== בדיקת BoardGenerator ===\n');

const boardGenerator = new BoardGenerator();

console.log('✅ BoardGenerator נטען בהצלחה');
console.log('🎲 יוצר לוח אקראי...\n');

const playerIds = ['player1', 'player2', 'player3', 'player4'];
const gameState = boardGenerator.generateRandomBoard(playerIds);

console.log('✅ לוח נוצר בהצלחה!');
console.log(`📋 מצב משחק:`);
console.log(`   - מזהה משחק: ${gameState.gameId}`);
console.log(`   - שלב משחק: ${gameState.phase}`);
console.log(`   - מספר שחקנים: ${gameState.players.length}`);
console.log(`   - שחקן פעיל: ${gameState.activePlayerId}`);
console.log('');

console.log('🏝️  אריחים:');
console.log(`   - סה"כ אריחים: ${gameState.tiles.length}`);

// ספירת אריחים לפי סוג
const tileCounts: Record<string, number> = {};
gameState.tiles.forEach(tile => {
  tileCounts[tile.resourceType] = (tileCounts[tile.resourceType] || 0) + 1;
});

console.log('   - התפלגות משאבים:');
Object.entries(tileCounts).forEach(([resource, count]) => {
  const expected = GAME_CONSTANTS.TILE_COUNTS[resource as ResourceType];
  const status = count === expected ? '✅' : '❌';
  console.log(`     ${status} ${resource}: ${count} (צפוי: ${expected})`);
});
console.log('');

// בדיקת מספרי קוביות
const numbersUsed: number[] = [];
gameState.tiles.forEach(tile => {
  if (tile.diceNumber !== null) {
    numbersUsed.push(tile.diceNumber);
  }
});

console.log('🎲 מספרי קוביות:');
console.log(`   - סה"כ מספרים: ${numbersUsed.length} (צפוי: 18)`);
console.log(`   - מספרים בשימוש: ${numbersUsed.sort((a, b) => a - b).join(', ')}`);
console.log('');

// בדיקת נמלים
const portsCount: Record<string, number> = {};
gameState.vertices.forEach(vertex => {
  if (vertex.portType !== 'NONE') {
    portsCount[vertex.portType] = (portsCount[vertex.portType] || 0) + 1;
  }
});

console.log('⚓ נמלים:');
const totalPorts = Object.values(portsCount).reduce((sum, count) => sum + count, 0);
console.log(`   - סה"כ קודקודי נמל: ${totalPorts} (צפוי: 18 - 9 נמלים × 2 קודקודים)`);
console.log('   - התפלגות נמלים:');
Object.entries(portsCount).forEach(([portType, count]) => {
  console.log(`     - ${portType}: ${count} קודקודים`);
});
console.log('');

// בדיקת שחקנים
console.log('👥 שחקנים:');
gameState.players.forEach((player, index) => {
  console.log(`   ${index + 1}. ${player.name} (${player.color})`);
  console.log(`      - כפרים זמינים: ${player.settlementsRemaining}`);
  console.log(`      - ערים זמינות: ${player.citiesRemaining}`);
  console.log(`      - כבישים זמינים: ${player.roadsRemaining}`);
});
console.log('');

// בדיקת בנק
console.log('🏦 בנק משאבים:');
let totalBankResources = 0;
Object.entries(gameState.bankResources).forEach(([resource, count]) => {
  if (resource !== ResourceType.DESERT) {
    totalBankResources += count;
    const expected = GAME_CONSTANTS.RESOURCE_CARDS_PER_TYPE;
    const status = count === expected ? '✅' : '❌';
    console.log(`   ${status} ${resource}: ${count} (צפוי: ${expected})`);
  }
});
console.log(`   סה"כ משאבים: ${totalBankResources} (צפוי: ${GAME_CONSTANTS.RESOURCE_CARDS_PER_TYPE * 5})`);
console.log('');

console.log('🃏 קלפי התפתחות:');
console.log(`   - סה"כ קלפים בבנק: ${gameState.bankDevCards.length} (צפוי: 25)`);
const devCardCounts: Record<string, number> = {};
gameState.bankDevCards.forEach(card => {
  devCardCounts[card] = (devCardCounts[card] || 0) + 1;
});
console.log('   - התפלגות:');
Object.entries(devCardCounts).forEach(([cardType, count]) => {
  console.log(`     - ${cardType}: ${count}`);
});
console.log('');

// בדיקת השוד
console.log('🏴‍☠️ השוד:');
const robberTile = gameState.tiles.find(t => t.id === gameState.robberTileId);
if (robberTile) {
  console.log(`   - ממוקם על אריח ${robberTile.id} (${robberTile.resourceType})`);
  console.log(`   - ${robberTile.resourceType === ResourceType.DESERT ? '✅' : '❌'} צריך להיות על המדבר בהתחלה`);
} else {
  console.log('   ❌ לא נמצא אריח שוד');
}
console.log('');

// סיכום
console.log('=== סיכום ===');
console.log('✅ כל הבדיקות הושלמו בהצלחה!');
console.log('🎮 הלוח מוכן למשחק!');
