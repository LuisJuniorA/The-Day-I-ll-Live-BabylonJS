import {
    RandomUtils,
    CellType,
    type Cell,
    type Vector3Like,
} from "../../utils/RandomUtils";
import { ENEMY_REGISTRY } from "../../data/EnemyRegistry";

export interface EnemySpawnData {
    id: string;
    type: string;
    position: Vector3Like;
}

export class MapGenerator {
    private width: number;
    private height: number;
    private grid: Cell[][] = [];
    public enemySpawns: EnemySpawnData[] = [];

    constructor(width = 60, height = 40) {
        this.width = width;
        this.height = height;
    }

    public generate(seed: string, steps = 1500): Cell[][] {
        RandomUtils.setSeed(seed);
        this.enemySpawns = []; // Reset

        // 1. Remplir toute la carte de MURS
        for (let x = 0; x < this.width; x++) {
            this.grid[x] = [];
            for (let y = 0; y < this.height; y++) {
                this.grid[x][y] = {
                    x,
                    y,
                    type: CellType.WALL,
                    hasEnemy: false,
                };
            }
        }

        // 2. Le Drunkard's Walk (L'agent creuse)
        let agentX = Math.floor(this.width / 2);
        let agentY = Math.floor(this.height / 2);

        for (let i = 0; i < steps; i++) {
            this.grid[agentX][agentY].type = CellType.EMPTY;

            // Choix de la direction (on favorise l'horizontal pour un platformer)
            const dir = RandomUtils.random();
            if (dir < 0.35)
                agentX++; // 35% Droite
            else if (dir < 0.7)
                agentX--; // 35% Gauche
            else if (dir < 0.85)
                agentY++; // 15% Haut
            else agentY--; // 15% Bas

            // Garder l'agent dans les limites (avec une marge de 2 pour les murs extérieurs)
            agentX = Math.max(2, Math.min(this.width - 3, agentX));
            agentY = Math.max(2, Math.min(this.height - 3, agentY));
        }

        // 3. Post-Process : Ajout de plateformes pour le Parkour
        this._fixUnjumpableGaps();

        // 4. Post-Process : Placer les ennemis
        this._spawnEnemies();

        return this.grid;
    }

    private _fixUnjumpableGaps(): void {
        // Si on a plus de 4 cases vides verticalement, on met une plateforme au milieu
        for (let x = 1; x < this.width - 1; x++) {
            let emptyCounter = 0;
            for (let y = 1; y < this.height - 1; y++) {
                if (this.grid[x][y].type === CellType.EMPTY) {
                    emptyCounter++;
                    if (emptyCounter >= 5) {
                        this.grid[x][y - 2].type = CellType.PLATFORM;
                        emptyCounter = 0; // On reset le compteur
                    }
                } else {
                    emptyCounter = 0;
                }
            }
        }
    }

    private _spawnEnemies(): void {
        for (let x = 1; x < this.width - 1; x++) {
            for (let y = 1; y < this.height - 2; y++) {
                // Condition de spawn : la case est vide, la case en dessous est solide
                const isFloorSolid =
                    this.grid[x][y - 1].type !== CellType.EMPTY;
                const isCurrentEmpty = this.grid[x][y].type === CellType.EMPTY;

                if (isFloorSolid && isCurrentEmpty) {
                    // 10% de chance de faire spawner un monstre ici
                    if (RandomUtils.random() < 0.1) {
                        this.grid[x][y].hasEnemy = true;
                        const enemyKeys = Object.keys(ENEMY_REGISTRY);
                        const randomType =
                            enemyKeys[
                                Math.floor(
                                    RandomUtils.random() * enemyKeys.length,
                                )
                            ];
                        this.enemySpawns.push({
                            id: `enemy_${x}_${y}`,
                            type: randomType,
                            position: { x, y, z: 0 }, // On stocke la position en coordonnées de grille
                        });
                        x += 2; // On saute quelques cases pour ne pas les entasser
                        break; // Un seul ennemi par colonne max pour éviter la surcharge
                    }
                }
            }
        }
    }
}
