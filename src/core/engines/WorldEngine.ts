import { MapGenerator, type EnemySpawnData } from "./MapGenerator";
import { type Cell, CellType } from "../../utils/RandomUtils";
import { Vector3 } from "@babylonjs/core";

export interface WorldDelegate {
    onWorldGenerated: (grid: Cell[][], blockSize: number) => void;
    onEnemiesReady: (enemies: EnemySpawnData[]) => void;
}

export class WorldEngine {
    private _mapGen: MapGenerator;
    private _delegate: WorldDelegate;
    private _grid: Cell[][] = [];
    private readonly _blockSize: number = 2;

    constructor(delegate: WorldDelegate) {
        this._delegate = delegate;
        // On définit une taille ici
        this._mapGen = new MapGenerator(100, 60);
    }

    public async init(): Promise<void> {
        this._grid = this._mapGen.generate("level_" + Math.random(), 3000);
        this._delegate.onWorldGenerated(this._grid, this._blockSize);
        this._delegate.onEnemiesReady(this._mapGen.enemySpawns);
    }

    public getStartPosition(): Vector3 {
        if (!this._grid || this._grid.length === 0) {
            return new Vector3(0, 10, 0);
        }

        const width = this._grid.length;
        const height = this._grid[0].length;

        // On commence par le centre théorique
        let startX = Math.floor(width / 2);
        let startY = Math.floor(height / 2);

        let spawnX = startX;
        let spawnY = startY;
        let found = false;

        // 1. SCAN EN SPIRALE STRICT
        const maxSearch = Math.max(width, height);
        for (let radius = 0; radius < maxSearch && !found; radius++) {
            for (let x = startX - radius; x <= startX + radius; x++) {
                for (let y = startY - radius; y <= startY + radius; y++) {
                    if (x >= 2 && x < width - 2 && y >= 2 && y < height - 2) {
                        const cell = this._grid[x][y];
                        const cellAbove = this._grid[x][y + 1];

                        if (
                            cell.type === CellType.EMPTY &&
                            cellAbove.type === CellType.EMPTY
                        ) {
                            spawnX = x;
                            spawnY = y;
                            found = true;
                            break;
                        }
                    }
                }
                if (found) break;
            }
        }

        // 2. NETTOYAGE RADICAL DE LA ZONE (Bulle de 3x3)
        // On vide l'air et on supprime les ennemis AVANT le spawn
        for (let x = spawnX - 1; x <= spawnX + 1; x++) {
            for (let y = spawnY; y <= spawnY + 1; y++) {
                // On vide le corps et la tête
                if (this._grid[x] && this._grid[x][y]) {
                    this._grid[x][y].type = CellType.EMPTY;
                    this._grid[x][y].hasEnemy = false;
                }
            }
        }

        // 3. STABILISATION DU SOL
        // On force un sol solide sous les pieds (3 blocs de large pour ne pas glisser)
        const floorY = spawnY - 1;
        if (floorY >= 0) {
            for (let x = spawnX - 1; x <= spawnX + 1; x++) {
                if (this._grid[x] && this._grid[x][floorY]) {
                    this._grid[x][floorY].type = CellType.WALL;
                    this._grid[x][floorY].hasEnemy = false;
                }
            }
        }

        console.log(
            `[WorldEngine] Secure spawn confirmed at [${spawnX}, ${spawnY}]`,
        );

        // 4. CALCUL DE LA POSITION FINALE
        // On ajoute un petit offset de 0.1 sur le Y pour éviter d'être "dans" le sol au frame 0
        return new Vector3(
            (spawnX + 0.5) * this._blockSize,
            (spawnY + 0.1) * this._blockSize,
            0,
        );
    }
}
