/**
 * @fileoverview נקודת כניסה ראשית לאפליקציה
 * @description מאתחל את כל המנהלים ומפעיל את המשחק
 * @module index
 */

import * as path from 'path';
import { BoardGenerator } from './board/BoardGenerator';
import { HexGraphManager } from './board/HexGraphManager';
import { ResourceManager } from './managers/ResourceManager';
import { RuleValidator } from './rules/RuleValidator';
import { GameEngine } from './game/GameEngine';
import { CLIManager } from './cli/CLIManager';

/**
 * פונקציה ראשית - מאתחלת את המערכת ומפעילה את המשחק
 */
async function main(): Promise<void> {
  try {
    console.log('🔧 מאתחל מנהלים...\n');

    // נתיבים לקובצי תצורה
    const configDir = path.join(__dirname, '..', 'config');
    const boardConfigPath = path.join(configDir, 'board_static.json');

    // 1. מנהל גרף ההקסגון (HexGraphManager)
    const hexGraphManager = new HexGraphManager();
    console.log('✓ HexGraphManager אותחל');

    // 2. מייצר הלוח (BoardGenerator)
    const boardGenerator = new BoardGenerator(boardConfigPath);
    console.log('✓ BoardGenerator אותחל');

    // 3. מנהל משאבים (ResourceManager)
    const resourceManager = new ResourceManager();
    console.log('✓ ResourceManager אותחל');

    // 4. מאמת חוקים (RuleValidator)
    const ruleValidator = new RuleValidator();
    console.log('✓ RuleValidator אותחל');

    // 5. מנוע המשחק (GameEngine) - הזרקת כל התלויות
    const gameEngine = new GameEngine(
      boardGenerator,
      hexGraphManager,
      resourceManager,
      ruleValidator
    );
    console.log('✓ GameEngine אותחל');

    // 6. מנהל CLI (CLIManager) - מקבל את GameEngine
    const cliManager = new CLIManager(gameEngine);
    console.log('✓ CLIManager אותחל\n');

    // 7. הפעלת לולאת המשחק
    await cliManager.startGameLoop();

    console.log('\n👋 תודה ששיחקת!\n');
    process.exit(0);

  } catch (error) {
    console.error('\n❌ שגיאה קריטית:', error instanceof Error ? error.message : error);
    console.error('Stack trace:', error instanceof Error ? error.stack : 'N/A');
    process.exit(1);
  }
}

// הפעלת התוכנית
main();
