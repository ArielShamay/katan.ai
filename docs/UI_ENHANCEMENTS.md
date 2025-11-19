# UI Enhancement Documentation - תיעוד שדרוג הממשק

תיעוד טכני מפורט של שדרוג ממשק המשתמש הגרפי למשחק קטאן.

## סקירה כללית

השדרוג כולל תפריט בנייה אינטראקטיבי, מצב בחירת מיקום חכם, ושיפורים ויזואליים נרחבים.

## רכיבים חדשים

### 1. BuildMenu Component

**מיקום:** `client/components/BuildMenu.tsx`

**אחריות:**
- הצגת תפריט בנייה מודאלי
- בדיקת זמינות משאבים לכל אופציית בנייה
- הצגת עלויות משאבים באייקונים
- טיפול בבחירת אופציית בנייה

**Props:**
```typescript
interface BuildMenuProps {
  isOpen: boolean;                    // האם התפריט פתוח
  onClose: () => void;                // קולבק לסגירה
  playerResources: Record<ResourceType, number>;  // משאבי השחקן
  buildCosts: BuildCosts;             // עלויות בנייה מ-costs.json
  onSelectBuildOption: (buildType) => void;  // קולבק לבחירה
}
```

**תכונות:**
- בדיקת `canAfford()` לכל אופציית בנייה
- הצגת תווית "לא מספיק משאבים" לאופציות לא זמינות
- אנימציות כניסה (fadeIn, slideUp)
- עיצוב רספונסיבי (grid 2x2)

---

### 2. Build Mode State

**מיקום:** `client/App.tsx`

**State Management:**
```typescript
type BuildMode = 'ROAD' | 'SETTLEMENT' | 'CITY' | 'DEVELOPMENT_CARD' | null;
const [buildMode, setBuildMode] = useState<BuildMode>(null);
```

**זרימת עבודה:**
1. המשתמש לוחץ על לחצן "🏗️ בנייה"
2. נפתח תפריט BuildMenu
3. המשתמש בוחר אופציית בנייה
4. `buildMode` מתעדכן ל-`'ROAD'`, `'SETTLEMENT'`, או `'CITY'`
5. הלוח עובר למצב בחירת מיקום
6. לאחר בחירה, `buildMode` חוזר ל-`null`

---

## שיפורי GameBoard

### הדגשת אלמנטים

**מיקום:** `client/components/GameBoard.tsx`

**Prop חדש:**
```typescript
interface GameBoardProps {
  buildMode: 'ROAD' | 'SETTLEMENT' | 'CITY' | null;
}
```

**לוגיקת הדגשה:**

#### עבור Edges (דרכים):
```typescript
const isHighlighted = buildMode === 'ROAD' && !edge.ownerId;
```
- מדגיש רק צלעות פנויות במצב בניית דרך

#### עבור Vertices (כפרים/ערים):
```typescript
const isHighlighted = 
  (buildMode === 'SETTLEMENT' && !vertex.ownerId) ||
  (buildMode === 'CITY' && vertex.ownerId === currentPlayerId && 
   vertex.buildingType === BuildingType.SETTLEMENT);
```
- במצב כפר: מדגיש קודקודים פנויים
- במצב עיר: מדגיש רק כפרים של השחקן הנוכחי

---

## שיפורי EdgeLine ו-VertexPoint

### EdgeLine

**Prop חדש:** `isHighlighted?: boolean`

**עיצוב מודגש:**
```typescript
stroke={isHighlighted ? 'rgba(76, 175, 80, 0.6)' : 'rgba(100, 100, 100, 0.3)'}
strokeWidth={isHighlighted ? 8 : 6}
```

**CSS Class:**
```css
.edge.highlighted {
  stroke: #4CAF50 !important;
  filter: drop-shadow(0 0 8px rgba(76, 175, 80, 0.8));
  animation: pulse 1.5s ease-in-out infinite;
}
```

### VertexPoint

**Prop חדש:** `isHighlighted?: boolean`

**עיצוב מודגש:**
```typescript
let radius = isHighlighted && !isOccupied ? 12 : 8;
let fill = isHighlighted ? 'rgba(76, 175, 80, 0.7)' : 'rgba(255, 255, 255, 0.8)';
let stroke = isHighlighted ? '#4CAF50' : '#333';
```

**CSS Class:**
```css
.vertex.highlighted {
  fill: rgba(76, 175, 80, 0.7) !important;
  stroke: #4CAF50 !important;
  animation: pulse 1.5s ease-in-out infinite;
}
```

---

## אינטגרציה עם costs.json

**מיקום:** `config/costs.json`

**מבנה:**
```json
{
  "costs": {
    "ROAD": {
      "BRICK": 1,
      "LUMBER": 1
    },
    "SETTLEMENT": {
      "BRICK": 1,
      "LUMBER": 1,
      "WOOL": 1,
      "GRAIN": 1
    },
    "CITY": {
      "ORE": 3,
      "GRAIN": 2
    },
    "DEVELOPMENT_CARD": {
      "ORE": 1,
      "WOOL": 1,
      "GRAIN": 1
    }
  }
}
```

**שימוש ב-App.tsx:**
```typescript
import costsData from '../config/costs.json';

<BuildMenu
  buildCosts={costsData.costs}
  playerResources={currentPlayer.resources}
/>
```

---

## ניכוי משאבים

### בניית דרך
```typescript
resources: {
  ...p.resources,
  [ResourceType.LUMBER]: p.resources[ResourceType.LUMBER] - 1,
  [ResourceType.BRICK]: p.resources[ResourceType.BRICK] - 1,
}
```

### בניית כפר
```typescript
resources: {
  ...p.resources,
  [ResourceType.LUMBER]: p.resources[ResourceType.LUMBER] - 1,
  [ResourceType.BRICK]: p.resources[ResourceType.BRICK] - 1,
  [ResourceType.WOOL]: p.resources[ResourceType.WOOL] - 1,
  [ResourceType.GRAIN]: p.resources[ResourceType.GRAIN] - 1,
}
```

### שדרוג לעיר
```typescript
citiesRemaining: p.citiesRemaining - 1,
settlementsRemaining: p.settlementsRemaining + 1,  // החזרת כפר למלאי
resources: {
  ...p.resources,
  [ResourceType.ORE]: p.resources[ResourceType.ORE] - 3,
  [ResourceType.GRAIN]: p.resources[ResourceType.GRAIN] - 2,
}
```

---

## שיפורים ויזואליים

### גדלי מסך

#### לפני:
- כותרת: `2rem`
- לוח: `900x800px`
- משושה: `70px`

#### אחרי:
- כותרת: `1.4rem`
- לוח: `1200x900px`
- משושה: `80px`

### צבעים

**לחצנים:**
- הטל קוביות: `#4CAF50` (ירוק)
- בנייה: `#FF9800` (כתום)
- סיים תור: `#2196F3` (כחול)

**הדגשה:**
- צלעות/קודקודים: `rgba(76, 175, 80, 0.6)` (ירוק שקוף)
- צל: `drop-shadow(0 0 8px rgba(76, 175, 80, 0.8))`

---

## אנימציות

### fadeIn (תפריט בנייה)
```css
@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}
```
משך: 0.2s

### slideUp (תוכן תפריט)
```css
@keyframes slideUp {
  from { 
    opacity: 0;
    transform: translateY(30px);
  }
  to { 
    opacity: 1;
    transform: translateY(0);
  }
}
```
משך: 0.3s

### slideDown (באנר מצב בנייה)
```css
@keyframes slideDown {
  from {
    opacity: 0;
    transform: translateX(-50%) translateY(-20px);
  }
  to {
    opacity: 1;
    transform: translateX(-50%) translateY(0);
  }
}
```
משך: 0.3s

### pulse (הדגשת אלמנטים)
```css
@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.7; }
}
```
משך: 1.5s, חוזר

---

## PlayerPanel Improvements

### ספירת רכיבים

**לפני:**
```
🏘️ 3
```

**אחרי:**
```
🏘️ 3/5
```

**קוד:**
```typescript
<span className="value">🏘️ {5 - player.settlementsRemaining}/5</span>
<span className="value">🏰 {4 - player.citiesRemaining}/4</span>
<span className="value">🛣️ {15 - player.roadsRemaining}/15</span>
```

---

## Build Mode Banner

**מיקום:** מעל הלוח, מתחת לכותרת

**תוכן דינמי:**
```typescript
{buildMode === 'ROAD' && '🛣️ בחר צלע לבניית דרך'}
{buildMode === 'SETTLEMENT' && '🏘️ בחר קודקוד לבניית כפר'}
{buildMode === 'CITY' && '🏰 בחר כפר שלך לשדרוג לעיר'}
```

**כפתור ביטול:**
```typescript
<button className="cancel-build-btn" onClick={() => setBuildMode(null)}>
  ביטול
</button>
```

---

## תרשים זרימה

```
[לחיצה על "בנייה"]
        ↓
[פתיחת BuildMenu]
        ↓
[בדיקת זמינות משאבים]
        ↓
[בחירת אופציית בנייה]
        ↓
[עדכון buildMode] → [הצגת באנר]
        ↓                    ↓
[הדגשת אלמנטים]    [אפשרות ביטול]
        ↓
[לחיצה על מיקום]
        ↓
[ניכוי משאבים]
        ↓
[עדכון GameState]
        ↓
[איפוס buildMode]
```

---

## טיפים לפיתוח עתידי

### הוספת אופציית בנייה חדשה:
1. עדכן את `BuildCosts` interface
2. הוסף ל-`buildOptions` array ב-BuildMenu
3. הוסף case ב-`handleSelectBuildOption`
4. הוסף לוגיקה ב-handler המתאים (vertex/edge)

### הוספת ולידציות נוספות:
1. בדוק חוקי מרחק לכפרים (2 צלעות)
2. בדוק חיבור לכביש קיים
3. הוסף הודעות שגיאה ידידותיות

### אינטגרציה עם API:
```typescript
// במקום עדכון ישיר של state:
const response = await fetch('/api/game/action', {
  method: 'POST',
  body: JSON.stringify({
    type: 'BUILD_SETTLEMENT',
    playerId: currentPlayer.id,
    vertexId: vertexId,
  }),
});
const newGameState = await response.json();
setGameState(newGameState);
```

---

## בעיות ידועות ופתרונות עתידיים

### נדרש בעתיד:
- [ ] ולידציית חוק מרחק (2 צלעות בין כפרים)
- [ ] בדיקת חיבור לכביש קיים
- [ ] הגבלת בנייה לשחקן הפעיל בלבד
- [ ] אינטגרציה מלאה עם backend API
- [ ] שמירת מצב משחק ב-localStorage
- [ ] תמיכה במולטיפלייר אונליין
- [ ] הוספת אפקטי סאונד

