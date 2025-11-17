/**
 * ResourceManager - ניהול מלאי משאבים וכלכלת מסחר
 * 
 * אחראי על:
 * - בדיקת זמינות משאבים לשחקן
 * - ביצוע עסקאות בנק (4:1, 3:1, 2:1)
 * - עדכון אימוטבילי של משאבי שחקנים ובנק
 */

import { ResourceType, PortType, BuildingType } from '../models/Enums';
import { IPlayerState } from '../models/Player';
import { IGameState } from '../models/GameState';
import { BUILD_COSTS, TRADE_RATIOS } from '../models/Constants';

export class ResourceManager {
  private readonly buildCosts: typeof BUILD_COSTS;
  private readonly tradeRatios: typeof TRADE_RATIOS;

  constructor() {
    this.buildCosts = BUILD_COSTS;
    this.tradeRatios = TRADE_RATIOS;
  }

  /**
   * בודק אם לשחקן יש מספיק משאבים לעלות נתונה
   * @param player - מצב השחקן
   * @param cost - עלות המשאבים הנדרשת
   * @returns true אם לשחקן יש מספיק משאבים
   */
  public isAffordable(
    player: IPlayerState,
    cost: Partial<Record<ResourceType, number>>
  ): boolean {
    // עובר על כל סוג משאב בעלות
    for (const resourceType of Object.keys(cost) as ResourceType[]) {
      const required = cost[resourceType] || 0;
      const available = player.resources[resourceType] || 0;
      
      // אם לא מספיק ממשאב זה, לא ניתן להרשות
      if (available < required) {
        return false;
      }
    }
    
    return true;
  }

  /**
   * מבצע עסקת בנק - החלפת משאבים לפי יחס מסחר
   * @param player - מצב השחקן
   * @param giveResource - סוג המשאב שהשחקן נותן
   * @param takeResource - סוג המשאב שהשחקן מקבל
   * @param portType - סוג הנמל של השחקן (משפיע על יחס המסחר)
   * @returns מצב שחקן מעודכן או null אם העסקה לא חוקית
   */
  public handleBankTrade(
    player: IPlayerState,
    giveResource: ResourceType,
    takeResource: ResourceType,
    portType: PortType
  ): IPlayerState | null {
    // קביעת יחס המסחר לפי סוג הנמל
    const tradeRatio = this.getTradeRatio(giveResource, portType);
    
    // בדיקה אם לשחקן יש מספיק משאבים למסחר
    const availableAmount = player.resources[giveResource] || 0;
    if (availableAmount < tradeRatio) {
      return null; // לא מספיק משאבים
    }

    // יצירת מצב שחקן חדש עם משאבים מעודכנים (אימוטבילי)
    const updatedResources = {
      ...player.resources,
      [giveResource]: player.resources[giveResource] - tradeRatio,
      [takeResource]: player.resources[takeResource] + 1
    };

    return {
      ...player,
      resources: updatedResources
    };
  }

  /**
   * מחזיר את יחס המסחר לפי סוג הנמל
   * @param resourceType - סוג המשאב
   * @param portType - סוג הנמל
   * @returns מספר המשאבים הנדרשים למסחר (4:1, 3:1, או 2:1)
   */
  private getTradeRatio(resourceType: ResourceType, portType: PortType): number {
    // נמל ספציפי למשאב זה - יחס 2:1
    if (this.isSpecificPort(resourceType, portType)) {
      return this.tradeRatios.PORT_SPECIFIC;
    }
    
    // נמל כללי - יחס 3:1
    if (portType === PortType.GENERAL_3_TO_1) {
      return this.tradeRatios.PORT_GENERAL;
    }
    
    // ללא נמל - יחס 4:1
    return this.tradeRatios.BANK_DEFAULT;
  }

  /**
   * בודק אם הנמל הוא נמל ספציפי למשאב נתון
   * @param resourceType - סוג המשאב
   * @param portType - סוג הנמל
   * @returns true אם הנמל תואם למשאב
   */
  private isSpecificPort(resourceType: ResourceType, portType: PortType): boolean {
    const portMapping: Partial<Record<ResourceType, PortType>> = {
      [ResourceType.LUMBER]: PortType.LUMBER_2_TO_1,
      [ResourceType.BRICK]: PortType.BRICK_2_TO_1,
      [ResourceType.WOOL]: PortType.WOOL_2_TO_1,
      [ResourceType.GRAIN]: PortType.GRAIN_2_TO_1,
      [ResourceType.ORE]: PortType.ORE_2_TO_1
    };

    return portMapping[resourceType] === portType;
  }

  /**
   * מעדכן משאבי בנק ושחקנים באופן אימוטבילי
   * @param gameState - מצב המשחק הנוכחי
   * @param transaction - פרטי העסקה (נותן, מקבל, משאבים)
   * @returns מצב משחק מעודכן
   */
  public updateBankAndPlayerResources(
    gameState: IGameState,
    transaction: {
      giverId: string;
      receiverId: string | null; // null = בנק
      resources: Record<ResourceType, number>;
    }
  ): IGameState {
    // יצירת עותק של רשימת השחקנים
    const updatedPlayers = gameState.players.map(player => {
      // עדכון נותן המשאבים (הפחתה)
      if (player.id === transaction.giverId) {
        return this.deductResources(player, transaction.resources);
      }
      
      // עדכון מקבל המשאבים (הוספה) - רק אם לא בנק
      if (transaction.receiverId && player.id === transaction.receiverId) {
        return this.addResources(player, transaction.resources);
      }
      
      return player;
    });

    // עדכון מלאי הבנק
    let updatedBankResources = { ...gameState.bankResources };
    
    // אם המקבל הוא הבנק - הוסף משאבים לבנק
    if (!transaction.receiverId) {
      updatedBankResources = this.addResourcesToDictionary(
        updatedBankResources,
        transaction.resources
      );
    }
    // אם הנותן הוא הבנק (giverId === 'bank') - הפחת משאבים מהבנק
    else if (transaction.giverId === 'bank') {
      updatedBankResources = this.deductResourcesFromDictionary(
        updatedBankResources,
        transaction.resources
      );
    }

    return {
      ...gameState,
      players: updatedPlayers,
      bankResources: updatedBankResources
    };
  }

  /**
   * מפחית משאבים משחקן (אימוטבילי)
   * @param player - מצב השחקן
   * @param resources - משאבים להפחתה
   * @returns מצב שחקן מעודכן
   */
  private deductResources(
    player: IPlayerState,
    resources: Record<ResourceType, number>
  ): IPlayerState {
    const updatedResources = { ...player.resources };
    
    for (const resourceType of Object.keys(resources) as ResourceType[]) {
      const amount = resources[resourceType];
      updatedResources[resourceType] = Math.max(
        0,
        updatedResources[resourceType] - amount
      );
    }

    return {
      ...player,
      resources: updatedResources
    };
  }

  /**
   * מוסיף משאבים לשחקן (אימוטבילי)
   * @param player - מצב השחקן
   * @param resources - משאבים להוספה
   * @returns מצב שחקן מעודכן
   */
  private addResources(
    player: IPlayerState,
    resources: Record<ResourceType, number>
  ): IPlayerState {
    const updatedResources = { ...player.resources };
    
    for (const resourceType of Object.keys(resources) as ResourceType[]) {
      const amount = resources[resourceType];
      updatedResources[resourceType] += amount;
    }

    return {
      ...player,
      resources: updatedResources
    };
  }

  /**
   * מוסיף משאבים למילון (אימוטבילי)
   * @param dictionary - מילון משאבים
   * @param resources - משאבים להוספה
   * @returns מילון משאבים מעודכן
   */
  private addResourcesToDictionary(
    dictionary: Record<ResourceType, number>,
    resources: Record<ResourceType, number>
  ): Record<ResourceType, number> {
    const updated = { ...dictionary };
    
    for (const resourceType of Object.keys(resources) as ResourceType[]) {
      const amount = resources[resourceType];
      updated[resourceType] = (updated[resourceType] || 0) + amount;
    }

    return updated;
  }

  /**
   * מפחית משאבים ממילון (אימוטבילי)
   * @param dictionary - מילון משאבים
   * @param resources - משאבים להפחתה
   * @returns מילון משאבים מעודכן
   */
  private deductResourcesFromDictionary(
    dictionary: Record<ResourceType, number>,
    resources: Record<ResourceType, number>
  ): Record<ResourceType, number> {
    const updated = { ...dictionary };
    
    for (const resourceType of Object.keys(resources) as ResourceType[]) {
      const amount = resources[resourceType];
      updated[resourceType] = Math.max(0, (updated[resourceType] || 0) - amount);
    }

    return updated;
  }

  /**
   * מפיץ משאבים לשחקנים לפי התוצאה של הקוביה
   * @param gameState - מצב המשחק הנוכחי
   * @param diceResult - תוצאת זריקת הקוביות
   * @returns מצב משחק מעודכן עם משאבים חדשים
   */
  public distributeResources(
    gameState: IGameState,
    diceResult: number
  ): IGameState {
    // מציאת כל האריחים עם מספר הקוביה שזרקו
    const activeTiles = gameState.tiles.filter(
      tile => tile.diceNumber === diceResult && !tile.isRobberPresent
    );

    // אם אין אריחים פעילים, החזר את המצב כמו שהוא
    if (activeTiles.length === 0) {
      return gameState;
    }

    // מעבר על כל קודקוד ובדיקה אם יש עליו מבנה
    const updatedPlayers = gameState.players.map(player => {
      const additionalResources: Partial<Record<ResourceType, number>> = {
        [ResourceType.LUMBER]: 0,
        [ResourceType.BRICK]: 0,
        [ResourceType.WOOL]: 0,
        [ResourceType.GRAIN]: 0,
        [ResourceType.ORE]: 0
      };

      // מעבר על כל אריח פעיל
      for (const tile of activeTiles) {
        // מעבר על כל קודקוד של האריח
        for (const vertexId of tile.adjacentVertexIds) {
          const vertex = gameState.vertices[vertexId];
          
          // אם לשחקן יש מבנה על הקודקוד הזה
          if (vertex.ownerId === player.id) {
            const multiplier = vertex.buildingType === BuildingType.CITY ? 2 : 1;
            if (tile.resourceType !== ResourceType.DESERT) {
              additionalResources[tile.resourceType] = 
                (additionalResources[tile.resourceType] || 0) + multiplier;
            }
          }
        }
      }

      // הוספת המשאבים לשחקן
      return this.addResources(player, additionalResources as Record<ResourceType, number>);
    });

    return {
      ...gameState,
      players: updatedPlayers
    };
  }

  /**
   * מקבל את עלות הבנייה לסוג מבנה/קלף
   * @param buildingType - סוג המבנה או 'DEVELOPMENT_CARD'
   * @returns עלות המשאבים
   */
  public getBuildCost(buildingType: keyof typeof BUILD_COSTS): Partial<Record<ResourceType, number>> {
    return { ...this.buildCosts[buildingType] } as Partial<Record<ResourceType, number>>;
  }
}
