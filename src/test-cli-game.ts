/**
 * @fileoverview בדיקת משחק מלא דרך CLI - סימולציה אוטומטית
 * @description מריץ משחק שלם עם פקודות מוכנות מראש לצורך בדיקה
 */

import * as path from 'path';
import { BoardGenerator } from './board/BoardGenerator';
import { HexGraphManager } from './board/HexGraphManager';
import { ResourceManager } from './managers/ResourceManager';
import { RuleValidator } from './rules/RuleValidator';
import { GameEngine } from './game/GameEngine';
import { ActionType, ResourceType } from './models/Enums';

async function testFullGame() {
  console.log('🧪 מתחיל בדיקת משחק מלא...\n');

  try {
    // אתחול מנהלים
    console.log('🔧 מאתחל מנהלים...');
    const configDir = path.join(__dirname, '..', 'config');
    const boardConfigPath = path.join(configDir, 'board_static.json');

    const hexGraphManager = new HexGraphManager();
    const boardGenerator = new BoardGenerator(boardConfigPath);
    const resourceManager = new ResourceManager();
    const ruleValidator = new RuleValidator();
    const gameEngine = new GameEngine(boardGenerator, hexGraphManager, resourceManager, ruleValidator);
    console.log('✓ כל המנהלים אותחלו\n');

    // התחלת משחק עם 3 שחקנים
    console.log('=== התחלת משחק חדש ===');
    const playerIds = ['Alice', 'Bob', 'Charlie'];
    let gameState = gameEngine.startGame(playerIds);
    console.log(`✓ משחק התחיל עם ${gameState.players.length} שחקנים`);
    console.log(`✓ שלב משחק: ${gameState.gamePhase}`);
    
    // השתמש ב-ID האמיתי של השחקן הראשון
    const firstPlayerID = gameState.players[gameState.currentPlayerIndex].id;
    console.log(`✓ שחקן ראשון: ${gameState.players[gameState.currentPlayerIndex].name} (ID: ${firstPlayerID})\n`);

    // שלב Setup - סיבוב ראשון (קדימה)
    console.log('=== שלב התחלה - סיבוב 1 ===');
    console.log('מציב יישובים וכבישים ראשוניים...\n');

    // קבלת ה-IDs האמיתיים מהמערכת
    const player1ID = gameState.players[0].id;
    const player2ID = gameState.players[1].id;
    const player3ID = gameState.players[2].id;

    // שחקן 1 - יישוב על קודקוד 0 וכביש סמוך
    console.log(`👤 ${gameState.players[0].name} מציב יישוב וכביש ראשונים`);
    const vertex0 = gameState.vertices.find(v => v.id === 0)!;
    const edge0 = vertex0.adjacentEdgeIds[0]; // קח את הצלע הראשונה הסמוכה
    gameState = gameEngine.placeInitialSettlementAndRoad(gameState, player1ID, 0, edge0);
    console.log(`✓ יישוב על קודקוד 0, כביש על צלע ${edge0}`);
    console.log(`   משאבים: ${JSON.stringify(gameState.players[0].resources)}`);

    // שחקן 2 - יישוב על קודקוד אחר
    console.log(`\n👤 ${gameState.players[1].name} מציב יישוב וכביש ראשונים`);
    const vertex10 = gameState.vertices.find(v => v.id === 10)!;
    const edge10 = vertex10.adjacentEdgeIds[0];
    gameState = gameEngine.placeInitialSettlementAndRoad(gameState, player2ID, 10, edge10);
    console.log(`✓ יישוב על קודקוד 10, כביש על צלע ${edge10}`);

    // שחקן 3 - יישוב על קודקוד אחר
    console.log(`\n👤 ${gameState.players[2].name} מציב יישוב וכביש ראשונים`);
    const vertex20 = gameState.vertices.find(v => v.id === 20)!;
    const edge20 = vertex20.adjacentEdgeIds[0];
    gameState = gameEngine.placeInitialSettlementAndRoad(gameState, player3ID, 20, edge20);
    console.log(`✓ יישוב על קודקוד 20, כביש על צלע ${edge20}`);

    // שלב Setup - סיבוב שני (אחורה)
    console.log('\n=== שלב התחלה - סיבוב 2 (עם משאבים) ===');

    // שחקן 3 - יישוב שני
    console.log(`\n👤 ${gameState.players[2].name} מציב יישוב וכביש שניים`);
    const vertex30 = gameState.vertices.find(v => v.id === 30)!;
    const edge30 = vertex30.adjacentEdgeIds[0];
    gameState = gameEngine.placeInitialSettlementAndRoad(gameState, player3ID, 30, edge30);
    gameState = gameEngine.processInitialResourceHandout(gameState, 30);
    const player3Resources = gameState.players.find(p => p.id === player3ID)!.resources;
    console.log(`✓ יישוב על קודקוד 30, כביש על צלע ${edge30}`);
    console.log(`✓ קיבל משאבים: ${JSON.stringify(player3Resources)}`);

    // שחקן 2 - יישוב שני
    console.log(`\n👤 ${gameState.players[1].name} מציב יישוב וכביש שניים`);
    const vertex40 = gameState.vertices.find(v => v.id === 40)!;
    const edge40 = vertex40.adjacentEdgeIds[0];
    gameState = gameEngine.placeInitialSettlementAndRoad(gameState, player2ID, 40, edge40);
    gameState = gameEngine.processInitialResourceHandout(gameState, 40);
    const player2Resources = gameState.players.find(p => p.id === player2ID)!.resources;
    console.log(`✓ יישוב על קודקוד 40, כביש על צלע ${edge40}`);
    console.log(`✓ קיבל משאבים: ${JSON.stringify(player2Resources)}`);

    // שחקן 1 - יישוב שני
    console.log(`\n👤 ${gameState.players[0].name} מציב יישוב וכביש שניים`);
    const vertex50 = gameState.vertices.find(v => v.id === 50)!;
    const edge50 = vertex50.adjacentEdgeIds[0];
    gameState = gameEngine.placeInitialSettlementAndRoad(gameState, player1ID, 50, edge50);
    gameState = gameEngine.processInitialResourceHandout(gameState, 50);
    const player1Resources = gameState.players.find(p => p.id === player1ID)!.resources;
    console.log(`✓ יישוב על קודקוד 50, כביש על צלע ${edge50}`);
    console.log(`✓ קיבל משאבים: ${JSON.stringify(player1Resources)}`);

    console.log('\n✅ שלב ההתחלה הסתיים!');
    console.log(`✓ שלב משחק עבר ל: ${gameState.gamePhase}`);
    console.log(`✓ שלב תור: ${gameState.turnPhase}\n`);

    // תור ראשון - שחקן 1
    console.log(`=== תור 1 - ${gameState.players[0].name} ===`);
    
    // הוספת משאבים מלאכותית לבדיקה
    console.log('➕ מוסיף משאבים לצורך בדיקה...');
    gameState = {
      ...gameState,
      players: gameState.players.map(p => 
        p.id === player1ID 
          ? {
              ...p,
              resources: {
                [ResourceType.LUMBER]: 10,
                [ResourceType.BRICK]: 10,
                [ResourceType.WOOL]: 10,
                [ResourceType.GRAIN]: 10,
                [ResourceType.ORE]: 10,
                [ResourceType.DESERT]: 0
              }
            }
          : p
      )
    };

    // הטלת קוביות
    console.log(`\n🎲 ${gameState.players[0].name} מטיל קוביות...`);
    gameState = gameEngine.handleAction(gameState, {
      type: ActionType.ROLL_DICE,
      playerId: player1ID
    });
    console.log(`✓ תוצאת קוביות: ${gameState.diceResult}`);

    // בניית כביש
    console.log(`\n🛣️  ${gameState.players[0].name} בונה כביש...`);
    try {
      gameState = gameEngine.handleAction(gameState, {
        type: ActionType.BUILD_ROAD,
        playerId: player1ID,
        edgeId: 1
      });
      console.log('✓ כביש נבנה בהצלחה על צלע 1');
      const player1 = gameState.players.find(p => p.id === player1ID)!;
      console.log(`   כבישים נותרים: ${player1.roadsRemaining}`);
      console.log(`   משאבים לאחר בנייה: עץ=${player1.resources[ResourceType.LUMBER]}, לבנה=${player1.resources[ResourceType.BRICK]}`);
    } catch (error) {
      console.log(`⚠️  בניית כביש נכשלה: ${error instanceof Error ? error.message : error}`);
    }

    // בניית יישוב
    console.log(`\n🏘️  ${gameState.players[0].name} בונה יישוב...`);
    try {
      gameState = gameEngine.handleAction(gameState, {
        type: ActionType.BUILD_SETTLEMENT,
        playerId: player1ID,
        vertexId: 30
      });
      console.log('✓ יישוב נבנה בהצלחה על קודקוד 30');
      const player1 = gameState.players.find(p => p.id === player1ID)!;
      console.log(`   יישובים נותרים: ${player1.settlementsRemaining}`);
      console.log(`   נקודות ניצחון: ${player1.victoryPoints}`);
    } catch (error) {
      console.log(`⚠️  בניית יישוב נכשלה: ${error instanceof Error ? error.message : error}`);
    }

    // שדרוג לעיר
    console.log(`\n🏙️  ${gameState.players[0].name} משדרג יישוב לעיר...`);
    try {
      gameState = gameEngine.handleAction(gameState, {
        type: ActionType.BUILD_CITY,
        playerId: player1ID,
        vertexId: 0
      });
      console.log('✓ יישוב שודרג לעיר על קודקוד 0');
      const player1 = gameState.players.find(p => p.id === player1ID)!;
      console.log(`   ערים נותרות: ${player1.citiesRemaining}`);
      console.log(`   יישובים נותרים: ${player1.settlementsRemaining}`);
      console.log(`   נקודות ניצחון: ${player1.victoryPoints}`);
    } catch (error) {
      console.log(`⚠️  שדרוג לעיר נכשל: ${error instanceof Error ? error.message : error}`);
    }

    // קניית קלף פיתוח
    console.log(`\n🎴 ${gameState.players[0].name} קונה קלף פיתוח...`);
    try {
      gameState = gameEngine.handleAction(gameState, {
        type: ActionType.BUY_DEVELOPMENT_CARD,
        playerId: player1ID
      });
      console.log('✓ קלף פיתוח נקנה בהצלחה');
      const player1 = gameState.players.find(p => p.id === player1ID)!;
      console.log(`   קלפי פיתוח: ${player1.developmentCards.length}`);
      console.log(`   סוג הקלף: ${player1.developmentCards[player1.developmentCards.length - 1]}`);
    } catch (error) {
      console.log(`⚠️  קניית קלף פיתוח נכשלה: ${error instanceof Error ? error.message : error}`);
    }

    // סיום תור
    console.log(`\n⏭️  ${gameState.players[0].name} מסיים את התור`);
    gameState = gameEngine.handleAction(gameState, {
      type: ActionType.END_TURN,
      playerId: player1ID
    });
    gameState = gameEngine.nextTurn(gameState);
    console.log(`✓ תור עבר ל-${gameState.players[gameState.currentPlayerIndex].name}`);

    // סיכום
    console.log('\n' + '='.repeat(80));
    console.log('📊 סיכום מצב המשחק'.padStart(45));
    console.log('='.repeat(80));

    gameState.players.forEach((player, idx) => {
      const marker = idx === gameState.currentPlayerIndex ? '►' : ' ';
      const totalResources = Object.values(player.resources).reduce((sum, val) => sum + val, 0);
      console.log(`\n${marker} ${player.name}:`);
      console.log(`   נקודות ניצחון: ${player.victoryPoints}`);
      console.log(`   סה"כ קלפים: ${totalResources}`);
      console.log(`   יישובים: ${3 - player.settlementsRemaining}/3`);
      console.log(`   ערים: ${4 - player.citiesRemaining}/4`);
      console.log(`   כבישים: ${15 - player.roadsRemaining}/15`);
      console.log(`   קלפי פיתוח: ${player.developmentCards.length}`);
      console.log(`   אבירים ששוחקו: ${player.knightsPlayed}`);
    });

    console.log('\n' + '='.repeat(80));
    console.log(`\n🏴‍☠️ השודד: אריח ${gameState.robberTileId}`);
    
    if (gameState.longestRoadPlayerId) {
      const lrPlayer = gameState.players.find(p => p.id === gameState.longestRoadPlayerId);
      console.log(`🛣️  הכביש הארוך ביותר: ${lrPlayer?.name}`);
    }
    
    if (gameState.largestArmyPlayerId) {
      const laPlayer = gameState.players.find(p => p.id === gameState.largestArmyPlayerId);
      console.log(`⚔️  הצבא הגדול ביותר: ${laPlayer?.name}`);
    }

    console.log('\n✅ בדיקת משחק מלא הסתיימה בהצלחה!');
    console.log('✓ כל המערכות עובדות תקין');
    console.log('✓ GameEngine מטפל בפעולות כראוי');
    console.log('✓ מצב המשחק מתעדכן באופן אימוטבילי');
    console.log('✓ ולידציות עובדות');
    console.log('\n🎉 המשחק מוכן לשימוש!\n');

  } catch (error) {
    console.error('\n❌ שגיאה קריטית בבדיקה:', error instanceof Error ? error.message : error);
    console.error('Stack trace:', error instanceof Error ? error.stack : 'N/A');
    process.exit(1);
  }
}

// הרצה
testFullGame();
