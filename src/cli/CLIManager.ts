/**
 * @fileoverview מנהל ממשק שורת הפקודה (CLI) למשחק קטאן
 * @description מטפל בכל האינטראקציה עם המשתמש ומתקשר עם GameEngine
 * @module cli/CLIManager
 */

import * as readline from 'readline';
import { GameEngine } from '../game/GameEngine';
import { IGameState, IGameAction } from '../models/GameState';
import { ActionType, GamePhase, TurnPhase, ResourceType, BuildingType, DevelopmentCardType } from '../models/Enums';

/**
 * מנהל CLI - שכבת הממשק בין המשתמש ל-GameEngine
 * משמש כ-HumanPlayerAgent ומדמה את ה-API הסטייטלס העתידי
 */
export class CLIManager {
  private rl: readline.Interface;
  private currentState: IGameState | null = null;

  /**
   * @param gameEngine - מנוע המשחק (הוזרק באמצעות DI)
   */
  constructor(private readonly gameEngine: GameEngine) {
    // יצירת ממשק readline לקריאת קלט מהמשתמש
    this.rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });
  }

  /**
   * נקודת כניסה ראשית - מתחילה את לולאת המשחק
   */
  public async startGameLoop(): Promise<void> {
    console.log('\n=== ברוכים הבאים למשחק קטאן! ===\n');

    try {
      // שלב 1: איסוף מידע על שחקנים
      const playerIds = await this.setupPlayers();

      // שלב 2: התחלת משחק חדש
      this.currentState = this.gameEngine.startGame(playerIds);
      console.log('\n✓ משחק חדש התחיל בהצלחה!\n');

      // שלב 3: שלב הבנייה הראשוני (Setup Phase)
      await this.handleSetupPhase();

      // שלב 4: לולאת המשחק הראשית
      await this.handleMainGameLoop();

    } catch (error) {
      console.error('\n❌ שגיאה:', error instanceof Error ? error.message : error);
    } finally {
      this.rl.close();
    }
  }

  /**
   * איסוף מספר ושמות שחקנים
   */
  private async setupPlayers(): Promise<string[]> {
    const numPlayers = await this.question('כמה שחקנים? (3-4): ');
    const num = parseInt(numPlayers);

    if (isNaN(num) || num < 3 || num > 4) {
      console.log('מספר לא תקין, משתמש ב-3 שחקנים כברירת מחדל');
      return ['player1', 'player2', 'player3'];
    }

    const playerIds: string[] = [];
    for (let i = 1; i <= num; i++) {
      const name = await this.question(`שם שחקן ${i}: `);
      playerIds.push(name.trim() || `player${i}`);
    }

    return playerIds;
  }

  /**
   * טיפול בשלב ההתחלה - 2 סיבובי בנייה (קדימה ואחורה)
   */
  private async handleSetupPhase(): Promise<void> {
    if (!this.currentState) return;

    console.log('\n=== שלב התחלה: כל שחקן מציב 2 יישובים ו-2 כבישים ===\n');
    console.log('בסיבוב הראשון: שחקנים מציבים בסדר 1→2→3→4');
    console.log('בסיבוב השני: שחקנים מציבים בסדר 4→3→2→1 ומקבלים משאבים\n');

    while (this.currentState.gamePhase === GamePhase.SETUP) {
      const currentPlayer = this.currentState.players[this.currentState.currentPlayerIndex];
      const roundInfo = this.currentState.setupRound === 1 ? 'סיבוב ראשון' : 'סיבוב שני';

      console.log(`\n--- ${roundInfo} - ${currentPlayer.name} (${currentPlayer.color}) ---`);
      console.log(`יישובים נותרים: ${currentPlayer.settlementsRemaining}, כבישים נותרים: ${currentPlayer.roadsRemaining}`);

      // קבלת מיקום יישוב
      const vertexId = await this.getNumberInput('הכנס מספר קודקוד ליישוב (0-53): ', 0, 53);

      // קבלת מיקום כביש
      const edgeId = await this.getNumberInput('הכנס מספר צלע לכביש (0-71): ', 0, 71);

      try {
        // ביצוע הצבה
        this.currentState = this.gameEngine.placeInitialSettlementAndRoad(
          this.currentState,
          currentPlayer.id,
          vertexId,
          edgeId
        );

        console.log('✓ יישוב וכביש הוצבו בהצלחה!');

        // בסיבוב השני - חלוקת משאבים
        if (this.currentState.setupRound === 2) {
          this.currentState = this.gameEngine.processInitialResourceHandout(
            this.currentState,
            vertexId
          );
          console.log('✓ משאבים ראשוניים חולקו');
        }

      } catch (error) {
        console.error('❌ שגיאה:', error instanceof Error ? error.message : error);
        console.log('נסה שוב...\n');
      }
    }

    console.log('\n=== שלב ההתחלה הסתיים! המשחק מתחיל ===\n');
  }

  /**
   * לולאת המשחק הראשית
   */
  private async handleMainGameLoop(): Promise<void> {
    if (!this.currentState) return;

    while (!this.currentState.winner) {
      // הצגת מצב המשחק
      this.displayGameStatus(this.currentState);

      // קבלת פעולה מהשחקן
      const action = await this.promptForAction(this.currentState);

      if (!action) {
        console.log('פעולה לא תקינה, נסה שוב');
        continue;
      }

      try {
        // ביצוע הפעולה דרך GameEngine
        this.currentState = this.gameEngine.handleAction(this.currentState, action);
        console.log('✓ פעולה בוצעה בהצלחה!\n');

        // אם זה סיום תור - עבור לשחקן הבא
        if (action.type === ActionType.END_TURN) {
          this.currentState = this.gameEngine.nextTurn(this.currentState);
        }

      } catch (error) {
        console.error('❌ שגיאה:', error instanceof Error ? error.message : error);
      }
    }

    // הכרזה על המנצח!
    const winner = this.currentState.players.find(p => p.id === this.currentState!.winner);
    console.log('\n🎉🎉🎉 המשחק הסתיים! 🎉🎉🎉');
    console.log(`🏆 המנצח: ${winner?.name} עם ${winner?.victoryPoints} נקודות! 🏆\n`);
  }

  /**
   * הצגת מצב המשחק הנוכחי
   */
  private displayGameStatus(gameState: IGameState): void {
    console.log('\n' + '='.repeat(80));
    console.log('מצב המשחק'.padStart(45));
    console.log('='.repeat(80));

    // שחקן פעיל
    const currentPlayer = gameState.players[gameState.currentPlayerIndex];
    console.log(`\n🎮 תור: ${currentPlayer.name} (${currentPlayer.color})`);
    console.log(`📊 שלב: ${this.getPhaseDescription(gameState.turnPhase)}`);
    
    if (gameState.diceResult) {
      console.log(`🎲 תוצאת קוביות אחרונה: ${gameState.diceResult}`);
    }

    // משאבי השחקן הפעיל
    console.log(`\n💰 משאבים:`);
    const resources = currentPlayer.resources;
    console.log(`   עץ: ${resources[ResourceType.LUMBER]} | לבנים: ${resources[ResourceType.BRICK]} | צמר: ${resources[ResourceType.WOOL]}`);
    console.log(`   חיטה: ${resources[ResourceType.GRAIN]} | עפרות: ${resources[ResourceType.ORE]}`);

    // סטטיסטיקות
    console.log(`\n📈 סטטיסטיקות:`);
    console.log(`   נקודות ניצחון: ${currentPlayer.victoryPoints}`);
    console.log(`   יישובים נותרים: ${currentPlayer.settlementsRemaining}, ערים: ${currentPlayer.citiesRemaining}, כבישים: ${currentPlayer.roadsRemaining}`);
    console.log(`   קלפי פיתוח: ${currentPlayer.developmentCards.length}, אבירים ששוחקו: ${currentPlayer.knightsPlayed}`);

    // כל השחקנים (סיכום)
    console.log(`\n👥 כל השחקנים:`);
    gameState.players.forEach((p, idx) => {
      const marker = idx === gameState.currentPlayerIndex ? '►' : ' ';
      const resources = Object.values(p.resources).reduce((sum, val) => sum + val, 0);
      console.log(`${marker} ${p.name} - ${p.victoryPoints} VP | ${resources} קלפים | ${p.roadsRemaining} כבישים`);
    });

    // מיקום השודד
    console.log(`\n🏴‍☠️ השודד נמצא על אריח: ${gameState.robberTileId}`);

    // כבישים וערים מיוחדות
    if (gameState.longestRoadPlayerId) {
      const lrPlayer = gameState.players.find(p => p.id === gameState.longestRoadPlayerId);
      console.log(`🛣️  הכביש הארוך ביותר: ${lrPlayer?.name}`);
    }
    if (gameState.largestArmyPlayerId) {
      const laPlayer = gameState.players.find(p => p.id === gameState.largestArmyPlayerId);
      console.log(`⚔️  הצבא הגדול ביותר: ${laPlayer?.name}`);
    }

    console.log('\n' + '='.repeat(80) + '\n');
  }

  /**
   * קבלת פעולה מהמשתמש
   */
  private async promptForAction(gameState: IGameState): Promise<IGameAction | null> {
    const currentPlayer = gameState.players[gameState.currentPlayerIndex];

    console.log('פעולות זמינות:');
    console.log('  roll - הטל קוביות');
    console.log('  build road <edgeId> - בנה כביש');
    console.log('  build settlement <vertexId> - בנה יישוב');
    console.log('  build city <vertexId> - שדרג לעיר');
    console.log('  buy devcard - קנה קלף פיתוח');
    console.log('  play knight - שחק קלף אביר');
    console.log('  trade - מסחר (TODO)');
    console.log('  end - סיים תור');
    console.log('  status - הצג מצב מפורט');
    console.log('  help - עזרה');

    const input = await this.question('\nמה תרצה לעשות? ');
    return this.processInput(input.trim().toLowerCase(), currentPlayer.id);
  }

  /**
   * עיבוד קלט מהמשתמש והמרה ל-IGameAction
   */
  private processInput(input: string, playerId: string): IGameAction | null {
    const parts = input.split(' ');
    const command = parts[0];

    switch (command) {
      case 'roll':
        return {
          type: ActionType.ROLL_DICE,
          playerId
        };

      case 'build':
        const buildType = parts[1];
        const locationId = parseInt(parts[2]);

        if (buildType === 'road' && !isNaN(locationId)) {
          return {
            type: ActionType.BUILD_ROAD,
            playerId,
            edgeId: locationId
          };
        } else if (buildType === 'settlement' && !isNaN(locationId)) {
          return {
            type: ActionType.BUILD_SETTLEMENT,
            playerId,
            vertexId: locationId
          };
        } else if (buildType === 'city' && !isNaN(locationId)) {
          return {
            type: ActionType.BUILD_CITY,
            playerId,
            vertexId: locationId
          };
        }
        break;

      case 'buy':
        if (parts[1] === 'devcard') {
          return {
            type: ActionType.BUY_DEVELOPMENT_CARD,
            playerId
          };
        }
        break;

      case 'play':
        if (parts[1] === 'knight') {
          return {
            type: ActionType.PLAY_DEVELOPMENT_CARD,
            playerId,
            developmentCard: DevelopmentCardType.KNIGHT
          };
        }
        break;

      case 'end':
        return {
          type: ActionType.END_TURN,
          playerId
        };

      case 'status':
        // הצג מצב מפורט
        if (this.currentState) {
          this.displayDetailedStatus(this.currentState);
        }
        return null;

      case 'help':
        this.showHelp();
        return null;

      default:
        console.log('פקודה לא מוכרת. הקלד "help" לעזרה');
        return null;
    }

    return null;
  }

  /**
   * הצגת מצב מפורט (מבנים על הלוח)
   */
  private displayDetailedStatus(gameState: IGameState): void {
    console.log('\n=== מצב מפורט ===\n');

    // יישובים וערים
    console.log('🏘️  יישובים וערים על הלוח:');
    const settlements = gameState.vertices.filter(v => v.ownerId !== null);
    settlements.forEach(v => {
      const player = gameState.players.find(p => p.id === v.ownerId);
      const buildingName = v.buildingType === BuildingType.SETTLEMENT ? 'יישוב' : 'עיר';
      console.log(`   קודקוד ${v.id}: ${buildingName} של ${player?.name}`);
    });

    // כבישים
    console.log('\n🛣️  כבישים על הלוח:');
    const roads = gameState.edges.filter(e => e.ownerId !== null);
    roads.forEach(e => {
      const player = gameState.players.find(p => p.id === e.ownerId);
      console.log(`   צלע ${e.id}: כביש של ${player?.name}`);
    });

    console.log('');
  }

  /**
   * הצגת הוראות עזרה
   */
  private showHelp(): void {
    console.log('\n=== עזרה ===');
    console.log('\nפקודות זמינות:');
    console.log('  roll                    - הטל קוביות (פעם אחת בתור)');
    console.log('  build road <edgeId>     - בנה כביש על צלע מסוימת');
    console.log('  build settlement <vid>  - בנה יישוב על קודקוד');
    console.log('  build city <vertexId>   - שדרג יישוב לעיר');
    console.log('  buy devcard             - קנה קלף פיתוח');
    console.log('  play knight             - שחק קלף אביר (מזיז שודד)');
    console.log('  end                     - סיים את התור');
    console.log('  status                  - הצג מצב מפורט של הלוח');
    console.log('  help                    - הצג הוראות אלה');
    console.log('\nעלויות בניה:');
    console.log('  כביש: 1 לבנה + 1 עץ');
    console.log('  יישוב: 1 לבנה + 1 עץ + 1 צמר + 1 חיטה');
    console.log('  עיר: 3 עפרות + 2 חיטה');
    console.log('  קלף פיתוח: 1 עפרות + 1 צמר + 1 חיטה\n');
  }

  /**
   * תיאור פאזת המשחק
   */
  private getPhaseDescription(phase: TurnPhase): string {
    switch (phase) {
      case TurnPhase.ROLLING_DICE: return 'הטלת קוביות';
      case TurnPhase.DISCARDING: return 'זריקת קלפים (7)';
      case TurnPhase.MOVING_ROBBER: return 'הזזת שודד';
      case TurnPhase.MAIN_ACTIONS: return 'פעולות ראשיות';
      case TurnPhase.PLACING_SETTLEMENT: return 'הצבת יישוב';
      default: return 'לא ידוע';
    }
  }

  /**
   * שאלה עם המתנה לתשובה
   */
  private question(prompt: string): Promise<string> {
    return new Promise((resolve) => {
      this.rl.question(prompt, resolve);
    });
  }

  /**
   * קבלת מספר מהמשתמש עם ולידציה
   */
  private async getNumberInput(prompt: string, min: number, max: number): Promise<number> {
    while (true) {
      const input = await this.question(prompt);
      const num = parseInt(input);

      if (!isNaN(num) && num >= min && num <= max) {
        return num;
      }

      console.log(`❌ מספר לא תקין. הכנס מספר בין ${min} ל-${max}`);
    }
  }
}
