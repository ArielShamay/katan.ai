# AI Agent Instructions - Settlers of Catan TypeScript Implementation

## Project Overview

TypeScript implementation of "The Settlers of Catan" board game with clean modular architecture. This is a **planning-phase project** - no code exists yet beyond documentation.

**Core Philosophy:**
- **Immutable State**: `GameState` is the single source of truth, never modified directly
- **Atomic Commands**: All actions are discrete operations (`RollDice`, `BuildRoad`, `OfferTrade`)
- **Strict Type Safety**: No `any` types; leverage TypeScript's full type system
- **Stateless Engine**: `GameEngine` designed for future multiplayer/API integration

## Architecture Structure

```
config/          # JSON configuration (board layout, costs, resource inventory)
src/
  models/        # Base data structures, Enums, Interfaces (ITile, IVertex, IEdge, IPlayerState)
  rules/         # Modular rule validators (DiceRules, RobberRules, TradingRules, BuildingRules)
  game/          # GameState (immutable) + GameEngine (command coordinator)
  board/         # BoardGenerator + HexGraph (54 vertices, 72 edges, graph algorithms)
  managers/      # ResourceManager (bank inventory, resource distribution)
```

**Critical:** Changes to game state MUST flow through: `Command → Rules Validation → GameEngine → GameState Update`

## Domain Model - Physical Constants

**Board:** 19 hex tiles (4 forest, 4 grain, 4 sheep, 3 ore, 3 brick, 1 desert), 18 number tokens (2-12, skip 7), 54 vertices, 72 edges, 9 ports (4 generic 3:1, 5 specific 2:1)

**Per Player:** 5 settlements, 4 cities, 15 roads

**Bank:** 19 cards per resource type, 25 development cards (14 knights, 5 VP, 2 road building, 2 monopoly, 2 year of plenty)

**Build Costs:**
- Road: 1 brick + 1 lumber
- Settlement: 1 brick + 1 lumber + 1 wool + 1 grain
- City: 3 ore + 2 grain (upgrades settlement)
- Dev Card: 1 ore + 1 wool + 1 grain

**Victory:** 10 points (settlement=1, city=2, longest road=2 @5+ roads, largest army=2 @3+ knights)

## Key Rules & Game Logic

### Dice Phase (DiceRules)
1. Roll determines active tiles (2-12, not 7)
2. Check if robber blocks resource production on tile
3. Calculate resources per player (settlement=1, city=2)
4. Transfer resources via `ResourceManager`
5. **Seven triggers robber**: discard half if 8+ cards, move robber, steal card

### Building Rules (BuildingRules)
- **Distance Rule**: Settlements require 2+ edges from other settlements
- **Road Connectivity**: Roads must connect to existing player structure
- **Longest Road**: BFS/DFS algorithm to find longest continuous path (min 5 for bonus)

### Trading Rules (TradingRules)
Enforce ratios only: 4:1 bank default, 3:1 generic port, 2:1 specific port. Player-to-player trades are unrestricted.

### Robber Rules (RobberRules)
On roll of 7: (1) all players with 8+ cards discard half (rounded down), (2) active player moves robber to new tile, (3) steal 1 random card from adjacent player, (4) tile blocked until robber moves.

## Development Workflow

### Project Setup (First Task)
```bash
npm init -y
npm install typescript @types/node
npm install -D ts-node nodemon
npx tsc --init
```

**tsconfig.json:** `strict: true`, `target: ES2020`, `moduleResolution: node`, `outDir: ./dist`

**File Creation Order:**
1. `src/models/Enums.ts` (ResourceType, BuildingType, DevelopmentCardType, PortType, TurnPhase, GamePhase)
2. `src/models/Constants.ts` (GAME_CONSTANTS, BUILD_COSTS, TRADE_RATIOS)
3. `src/models/BoardComponents.ts` (ITile, IEdge, IVertex)
4. `src/models/Player.ts` (IPlayerState, IPlayerStats)
5. `src/models/GameState.ts` (IGameState, IGameAction)
6. `src/board/HexGraph.ts` (graph connectivity, adjacency lists)
7. `src/game/GameState.ts` & `src/game/GameEngine.ts`

### Type Patterns

**Immutable Records:**
```typescript
export interface IPlayerState {
  readonly id: string;
  readonly resources: Readonly<Record<ResourceType, number>>;
  // ... other readonly fields
}
```

**Enums over String Unions:**
```typescript
// CORRECT
export enum ResourceType {
  LUMBER = "LUMBER",
  BRICK = "BRICK",
  // ...
}

// AVOID: type ResourceType = "LUMBER" | "BRICK" | ...
```

**Validation Returns:**
```typescript
type ValidationResult = { valid: true } | { valid: false; reason: string };
```

## Critical Conventions

### Graph Representation (HexGraph)
- **Adjacency Lists**: Each vertex/edge/tile stores IDs of adjacent elements (not object references)
- **Path Finding**: Implement BFS for longest road calculation (see `src/rules/BuildingRules.ts` spec)
- **Connectivity**: `config/board.json` defines fixed adjacency map loaded at initialization

### State Updates
```typescript
// CORRECT - GameEngine pattern
public buildRoad(playerId: string, edgeId: number): IGameState {
  const validation = BuildingRules.canBuildRoad(this.state, playerId, edgeId);
  if (!validation.valid) throw new Error(validation.reason);
  
  return {
    ...this.state,
    edges: this.state.edges.map(e => 
      e.id === edgeId ? { ...e, ownerId: playerId } : e
    ),
    players: this.updatePlayerResources(playerId, BUILD_COSTS.ROAD)
  };
}

// WRONG - Direct mutation
this.state.edges[edgeId].ownerId = playerId;
```

### Resource Management
`ResourceManager` handles all bank transactions. Never directly modify `player.resources` or `bankResources` - use manager methods like `distributeResources()`, `deductCost()`, `bankTrade()`.

## Testing Requirements

**Unit Tests:** All rule validators must have tests covering edge cases (insufficient resources, invalid placements, robber blocking)

**Integration Tests:** Full turn sequences (roll → distribute → trade → build → end turn)

**Graph Tests:** Verify adjacency correctness, longest road calculation, distance rule enforcement

## Language Note

Documentation and comments are in **Hebrew** (עברית) as seen in `architecture-plan.md` and `README.md`. Maintain this convention for consistency. Code identifiers remain English (PascalCase/camelCase).

## Common Pitfalls

1. **Don't mix validation and execution**: Rules classes only validate, GameEngine executes
2. **No circular references**: Use IDs in adjacency lists, not object references
3. **Robber state is per-tile**: `ITile.isRobberPresent` tracks location, only one true at a time
4. **Development cards can't be played same turn purchased**: Track in `IPlayerState.developmentCardsPlayedThisTurn`
5. **City upgrade consumes settlement**: Increment `settlementsRemaining`, decrement `citiesRemaining`

## Next Immediate Steps

According to the task specification, implement in this exact order:
1. Project structure & TypeScript config
2. Enums.ts with all 6 enum types
3. Constants.ts with physical game data
4. BoardComponents.ts interfaces (ITile, IEdge, IVertex)
5. Player.ts interfaces (IPlayerState, IPlayerStats)
6. GameState.ts (IGameState, IGameAction)

Refer to task specification in latest message for complete interface definitions and JSDoc requirements.
