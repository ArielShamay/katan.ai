import * as fs from 'fs';
import * as path from 'path';
import { IEdge } from '../models/BoardComponents';

/**
 * מבנה נתוני קודקוד מהקונפיגורציה הסטטית
 */
interface IStaticVertex {
  vertexId: number;
  adjacentVertexIds: number[];
  adjacentEdgeIds: number[];
  adjacentTileIds: number[];
}

/**
 * מבנה נתוני צלע מהקונפיגורציה הסטטית
 */
interface IStaticEdge {
  edgeId: number;
  vertexIds: [number, number];
  adjacentTileIds: number[];
  adjacentEdgeIds: number[];
}

/**
 * מבנה נתוני אריח מהקונפיגורציה הסטטית
 */
interface IStaticTile {
  tileId: number;
  adjacentVertexIds: number[];
  adjacentEdgeIds: number[];
  adjacentTileIds: number[];
}

/**
 * מנהל גרף המשושים (HexGraphManager)
 * אחראי על ניהול קשרי השכנות הסטטיים של הלוח ואלגוריתמים גרפיים
 */
export class HexGraphManager {
  private readonly vertexMap: ReadonlyMap<number, IStaticVertex>;
  private readonly edgeMap: ReadonlyMap<number, IStaticEdge>;
  private readonly tileMap: ReadonlyMap<number, IStaticTile>;

  /**
   * Constructor - טוען את הגרף הסטטי מקובץ הקונפיגורציה
   * @param configPath נתיב לקובץ board_static.json (אופציונלי)
   */
  constructor(configPath?: string) {
    const defaultPath = path.join(__dirname, '../../config/board_static.json');
    const finalPath = configPath || defaultPath;
    
    const configData = JSON.parse(fs.readFileSync(finalPath, 'utf-8'));
    
    // טעינת קודקודים
    const vertices = new Map<number, IStaticVertex>();
    configData.graph_structure.vertex_adjacency.vertices.forEach((v: IStaticVertex) => {
      vertices.set(v.vertexId, v);
    });
    this.vertexMap = vertices;
    
    // טעינת צלעות
    const edges = new Map<number, IStaticEdge>();
    configData.graph_structure.edge_adjacency.edges.forEach((e: IStaticEdge) => {
      edges.set(e.edgeId, e);
    });
    this.edgeMap = edges;
    
    // טעינת אריחים
    const tiles = new Map<number, IStaticTile>();
    configData.graph_structure.tiles.tile_layout.forEach((t: IStaticTile) => {
      tiles.set(t.tileId, t);
    });
    this.tileMap = tiles;
  }

  /**
   * מחזיר את מזהי האריחים הסמוכים לקודקוד נתון
   * @param vertexId מזהה הקודקוד
   * @returns מערך מזהי אריחים (2-3 אריחים)
   */
  public getAdjacentTiles(vertexId: number): number[] {
    const vertex = this.vertexMap.get(vertexId);
    if (!vertex) {
      throw new Error(`Vertex ${vertexId} not found in graph`);
    }
    return [...vertex.adjacentTileIds];
  }

  /**
   * מחזיר את מזהי הקודקודים הסמוכים לקודקוד נתון
   * @param vertexId מזהה הקודקוד
   * @returns מערך מזהי קודקודים שכנים (2-3 קודקודים)
   */
  public getAdjacentVertices(vertexId: number): number[] {
    const vertex = this.vertexMap.get(vertexId);
    if (!vertex) {
      throw new Error(`Vertex ${vertexId} not found in graph`);
    }
    return [...vertex.adjacentVertexIds];
  }

  /**
   * מחזיר את מזהי הצלעות הסמוכות לקודקוד נתון
   * @param vertexId מזהה הקודקוד
   * @returns מערך מזהי צלעות סמוכות
   */
  public getAdjacentEdges(vertexId: number): number[] {
    const vertex = this.vertexMap.get(vertexId);
    if (!vertex) {
      throw new Error(`Vertex ${vertexId} not found in graph`);
    }
    return [...vertex.adjacentEdgeIds];
  }

  /**
   * מחזיר את מזהי הקודקודים של אריח נתון
   * @param tileId מזהה האריח
   * @returns מערך של 6 מזהי קודקודים
   */
  public getTileVertices(tileId: number): number[] {
    const tile = this.tileMap.get(tileId);
    if (!tile) {
      throw new Error(`Tile ${tileId} not found in graph`);
    }
    return [...tile.adjacentVertexIds];
  }

  /**
   * מחזיר את מזהה הקודקוד המסוים באריח לפי אינדקס
   * @param tileId מזהה האריח
   * @param index אינדקס הקודקוד באריח (0-5)
   * @returns מזהה הקודקוד
   */
  public getVertexLocation(tileId: number, index: number): number {
    if (index < 0 || index > 5) {
      throw new Error(`Index must be between 0-5, got ${index}`);
    }
    
    const tile = this.tileMap.get(tileId);
    if (!tile) {
      throw new Error(`Tile ${tileId} not found in graph`);
    }
    
    return tile.adjacentVertexIds[index];
  }

  /**
   * בדיקה האם שני קודקודים מחוברים ישירות
   * @param vertexId1 קודקוד ראשון
   * @param vertexId2 קודקוד שני
   * @returns true אם הקודקודים מחוברים
   */
  public areVerticesConnected(vertexId1: number, vertexId2: number): boolean {
    const vertex = this.vertexMap.get(vertexId1);
    if (!vertex) {
      return false;
    }
    return vertex.adjacentVertexIds.includes(vertexId2);
  }

  /**
   * מחזיר את שני הקודקודים שהצלע מחברת
   * @param edgeId מזהה הצלע
   * @returns tuple של שני מזהי קודקודים
   */
  public getEdgeVertices(edgeId: number): [number, number] {
    const edge = this.edgeMap.get(edgeId);
    if (!edge) {
      throw new Error(`Edge ${edgeId} not found in graph`);
    }
    return [...edge.vertexIds] as [number, number];
  }

  /**
   * מחשב את אורך הדרך הארוכה ביותר עבור שחקן מסוים
   * משתמש באלגוריתם DFS לחיפוש כל הדרכים האפשריות
   * 
   * @param edges רשימת כל הצלעות במשחק
   * @param playerId מזהה השחקן (לסינון הדרכים שלו בלבד)
   * @returns אורך הדרך הארוכה ביותר
   */
  public getLongestRoad(edges: readonly IEdge[], playerId: string): number {
    // סינון הצלעות של השחקן הספציפי בלבד
    const playerEdges = edges.filter(edge => edge.ownerId === playerId);
    
    if (playerEdges.length === 0) {
      return 0;
    }

    // בניית גרף צמתים (vertices) עם הדרכים (edges) שלהם
    const vertexToEdges = new Map<number, Set<number>>();
    
    playerEdges.forEach(edge => {
      const [v1, v2] = edge.vertexIds;
      
      if (!vertexToEdges.has(v1)) {
        vertexToEdges.set(v1, new Set());
      }
      if (!vertexToEdges.has(v2)) {
        vertexToEdges.set(v2, new Set());
      }
      
      vertexToEdges.get(v1)!.add(edge.id);
      vertexToEdges.get(v2)!.add(edge.id);
    });

    let maxLength = 0;

    // נסה לעבור מכל צלע כנקודת התחלה
    playerEdges.forEach(startEdge => {
      const length = this.dfsLongestPath(
        startEdge.id,
        playerEdges,
        vertexToEdges,
        new Set<number>()
      );
      maxLength = Math.max(maxLength, length);
    });

    return maxLength;
  }

  /**
   * DFS רקורסיבי למציאת הדרך הארוכה ביותר
   * @param currentEdgeId הצלע הנוכחית
   * @param playerEdges כל הצלעות של השחקן
   * @param vertexToEdges מיפוי מקודקוד לצלעות
   * @param visitedEdges סט של צלעות שכבר ביקרנו בהן
   * @returns אורך הדרך מהצלע הנוכחית
   */
  private dfsLongestPath(
    currentEdgeId: number,
    playerEdges: readonly IEdge[],
    vertexToEdges: Map<number, Set<number>>,
    visitedEdges: Set<number>
  ): number {
    const currentEdge = playerEdges.find(e => e.id === currentEdgeId);
    if (!currentEdge) {
      return 0;
    }

    // סמן את הצלע הנוכחית כמבוקרת
    visitedEdges.add(currentEdgeId);

    let maxLength = 1; // הצלע הנוכחית נספרת

    // נסה להמשיך משני הקצוות של הצלע
    const [v1, v2] = currentEdge.vertexIds;

    for (const vertexId of [v1, v2]) {
      const adjacentEdgeIds = vertexToEdges.get(vertexId);
      if (!adjacentEdgeIds) {
        continue;
      }

      // עבור על כל הצלעות הסמוכות שעוד לא ביקרנו בהן
      for (const adjacentEdgeId of adjacentEdgeIds) {
        if (!visitedEdges.has(adjacentEdgeId) && adjacentEdgeId !== currentEdgeId) {
          const length = 1 + this.dfsLongestPath(
            adjacentEdgeId,
            playerEdges,
            vertexToEdges,
            new Set(visitedEdges) // העתק חדש של visited
          );
          maxLength = Math.max(maxLength, length);
        }
      }
    }

    return maxLength;
  }

  /**
   * בדיקה האם קודקוד מקיים את חוק המרחק (2 צלעות לפחות מכפרים אחרים)
   * @param vertexId מזהה הקודקוד לבדיקה
   * @param occupiedVertices מערך של קודקודים תפוסים
   * @returns true אם הקודקוד מקיים את חוק המרחק
   */
  public checkDistanceRule(vertexId: number, occupiedVertices: number[]): boolean {
    const vertex = this.vertexMap.get(vertexId);
    if (!vertex) {
      return false;
    }

    // בדוק שאף אחד מהקודקודים הסמוכים אינו תפוס
    for (const adjacentVertexId of vertex.adjacentVertexIds) {
      if (occupiedVertices.includes(adjacentVertexId)) {
        return false;
      }
    }

    return true;
  }

  /**
   * מחזיר את מספר הקודקודים בגרף
   */
  public getVertexCount(): number {
    return this.vertexMap.size;
  }

  /**
   * מחזיר את מספר הצלעות בגרף
   */
  public getEdgeCount(): number {
    return this.edgeMap.size;
  }

  /**
   * מחזיר את מספר האריחים בגרף
   */
  public getTileCount(): number {
    return this.tileMap.size;
  }
}
