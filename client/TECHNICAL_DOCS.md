# תיעוד טכני - ממשק המשחק

## ארכיטקטורה

### שכבות האפליקציה

```
┌─────────────────────────────────┐
│   React UI Layer (client/)       │
│   - Components                   │
│   - State Management             │
└──────────────┬──────────────────┘
               │
┌──────────────▼──────────────────┐
│   Game Engine (src/game/)        │
│   - State Management             │
│   - Action Handling              │
└──────────────┬──────────────────┘
               │
┌──────────────▼──────────────────┐
│   Core Logic (src/)              │
│   - Models                       │
│   - Board Management             │
│   - Rules Validation             │
│   - Resource Management          │
└──────────────────────────────────┘
```

## קומפוננטות React

### App.tsx
**תפקיד**: קומפוננטה ראשית, מנהלת את מצב המשחק

**State**:
- `gameState: IGameState | null` - מצב המשחק המלא
- `gameEngine: GameEngine | null` - מופע של מנוע המשחק

**Handlers**:
- `handleVertexClick(vertexId)` - בניית כפר/עיר
- `handleEdgeClick(edgeId)` - בניית כביש
- `handleRollDice()` - הטלת קוביות
- `handleEndTurn()` - סיום תור

### GameBoard.tsx
**תפקיד**: הצגת לוח המשחק עם כל האלמנטים

**Props**:
- `gameState: IGameState` - מצב המשחק הנוכחי
- `onVertexClick: (vertexId: number) => void` - callback לקליק על קודקוד
- `onEdgeClick: (edgeId: number) => void` - callback לקליק על צלע

**מבנה פנימי**:
1. חישוב מיקומי אריחים על פי HEX_LAYOUT
2. מיפוי vertex IDs למיקומים במסך
3. רינדור של כל השכבות לפי סדר:
   - Edges (קווים - שכבה תחתונה)
   - Tiles (אריחים)
   - Vertices (קודקודים)
   - Ports (נמלים)

### HexTile.tsx
**תפקיד**: הצגת אריח משושה בודד

**Props**:
- `tile: ITile` - נתוני האריח
- `x, y: number` - מיקום מרכז האריח
- `size: number` - גודל צלע המשושה

**מבנה**:
- Polygon עם 6 נקודות
- טקסט סוג משאב
- מספר קובייה ונקודות הסתברות
- אייקון שודד אם קיים

### VertexPoint.tsx
**תפקיד**: הצגת קודקוד (ריק/כפר/עיר)

**Props**:
- `vertex: IVertex` - נתוני הקודקוד
- `x, y: number` - מיקום הקודקוד
- `color?: string` - צבע השחקן אם תפוס
- `onClick: () => void` - callback לקליק

**מצבים**:
- ריק: עיגול לבן שקוף
- כפר: עיגול בצבע השחקן עם אייקון 🏠
- עיר: עיגול גדול יותר עם מסגרת זהב ואייקון 🏰

### EdgeLine.tsx
**תפקיד**: הצגת צלע (ריק/כביש)

**Props**:
- `edge: IEdge` - נתוני הצלע
- `x1, y1, x2, y2: number` - נקודות קצה
- `color?: string` - צבע השחקן אם תפוס
- `onClick: () => void` - callback לקליק

**מצבים**:
- ריק: קו דק אפור שקוף
- כביש: קו עבה בצבע השחקן

### PortIndicator.tsx
**תפקיד**: הצגת נמל סחר

**Props**:
- `portType: PortType` - סוג הנמל
- `x, y: number` - מיקום הנמל

**סוגים**:
- 3:1 כללי: ⚓ כחול
- 2:1 עץ: 🌲 ירוק
- 2:1 חומר: 🧱 אדום
- 2:1 צמר: 🐑 ירוק בהיר
- 2:1 חיטה: 🌾 זהב
- 2:1 עפרות: ⛰️ אפור

### PlayerPanel.tsx
**תפקיד**: הצגת מידע על שחקן

**Props**:
- `player: IPlayerState` - מצב השחקן
- `isActive: boolean` - האם זה תור השחקן

**State**:
- `showResources: boolean` - האם להציג את חלון המשאבים

**תצוגה**:
- כרטיס שחקן עם צבע ייחודי
- סטטיסטיקות בסיסיות
- Modal של משאבים מפורט

## מבני נתונים

### IGameState
```typescript
{
  tiles: ITile[],           // 19 אריחים
  edges: IEdge[],          // 72 צלעות
  vertices: IVertex[],     // 54 קודקודים
  players: IPlayerState[], // 2-4 שחקנים
  currentPlayerIndex: number,
  gamePhase: GamePhase,
  turnPhase: TurnPhase,
  diceResult: number | null,
  robberTileId: number,
  // ... ועוד
}
```

### IPlayerState
```typescript
{
  id: string,
  name: string,
  color: string,
  resources: Record<ResourceType, number>,
  developmentCards: DevelopmentCardType[],
  victoryPoints: number,
  settlementsRemaining: number,
  citiesRemaining: number,
  roadsRemaining: number,
  // ... ועוד
}
```

## תהליכי עבודה

### אתחול משחק
1. יצירת מנהלים (BoardGenerator, HexGraphManager, etc.)
2. קריאה ל-`gameEngine.startGame(playerIds)`
3. קבלת IGameState ראשוני
4. הצגה ב-UI

### ביצוע פעולה
1. משתמש לוחץ על אלמנט (vertex/edge/button)
2. יצירת IGameAction עם הפרטים
3. קריאה ל-`gameEngine.handleAction(currentState, action)`
4. קבלת IGameState חדש
5. עדכון State ב-React
6. re-render אוטומטי

### הטלת קוביות
1. `handleRollDice()` נקרא
2. יוצר action מסוג ROLL_DICE
3. GameEngine:
   - זורק 2 קוביות (1-6 כל אחת)
   - אם 7: מעביר ל-phase של DISCARDING/MOVING_ROBBER
   - אחרת: מחלק משאבים לכל השחקנים
4. State מתעדכן עם diceResult
5. UI מציג תוצאה עם אנימציה

## חישובים גאומטריים

### מיקומי אריחים
```typescript
const getHexCenter = (row: number, col: number) => {
  const x = col * hexWidth + (row % 2 === 1 ? hexWidth / 2 : 0);
  const y = row * (hexHeight * 0.75);
  return { x, y };
};
```

### קודקודי משושה
```typescript
const getHexCorners = (cx: number, cy: number) => {
  const corners = [];
  for (let i = 0; i < 6; i++) {
    const angle = (Math.PI / 3) * i - Math.PI / 2;
    corners.push({
      x: cx + hexSize * Math.cos(angle),
      y: cy + hexSize * Math.sin(angle),
    });
  }
  return corners;
};
```

## אופטימיזציות

### Memoization
- ה-`vertexPositions` Map נבנה פעם אחת ב-render
- מונע חישובים מיותרים של מיקומים

### Conditional Rendering
- קומפוננטות מוצגות רק אם יש להן data
- `if (!pos) return null`

### Event Handlers
- Handlers מוגדרים בשכבה עליונה (App)
- מועברים כ-props ולא נוצרים בכל render

## סטיילינג

### CSS Variables
ניתן להוסיף משתנים גלובליים:
```css
:root {
  --hex-size: 60px;
  --player-panel-width: 280px;
  --primary-color: #667eea;
}
```

### Responsive Breakpoints
- Large: 1400px+
- Medium: 1200px-1400px
- Small: <1200px

## Debug Mode

להוספת מצב debug, הוסף ל-App.tsx:
```typescript
const [debugMode, setDebugMode] = useState(false);

// הצג IDs על הלוח
{debugMode && (
  <text x={pos.x} y={pos.y} fontSize="8">
    {vertex.id}
  </text>
)}
```

## Performance Monitoring

להוספת מדידת performance:
```typescript
import { useEffect } from 'react';

useEffect(() => {
  const start = performance.now();
  // render logic
  const end = performance.now();
  console.log(`Render time: ${end - start}ms`);
});
```

## טיפים לפיתוח

1. **State Immutability**: תמיד החזר state חדש, לא לשנות את הקיים
2. **Type Safety**: השתמש ב-TypeScript strict mode
3. **Component Separation**: כל קומפוננטה אחראית רק על החלק שלה
4. **Props Drilling**: אם יש יותר מ-3 רמות, שקול Context API
5. **Performance**: השתמש ב-React.memo לקומפוננטות כבדות

## בדיקות (Future)

תוכנית לבדיקות:
- Unit tests לכל קומפוננטה
- Integration tests למהלך משחק מלא
- E2E tests עם Playwright/Cypress
- Performance tests עם Lighthouse
