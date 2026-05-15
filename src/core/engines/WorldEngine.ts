import { MapGenerator, type EnemySpawnData } from "./MapGenerator";
import { type Cell, CellType } from "../../utils/RandomUtils";
import { Vector3 } from "@babylonjs/core";

export interface WorldDelegate {
    onWorldGenerated: (grid: Cell[][], blockSize: number) => void;
    onEnemiesReady: (enemies: EnemySpawnData[]) => void;
    onLevelLoaded: (url: string) => void;
}

export class WorldEngine {
    private _mapGen: MapGenerator;
    private _delegate: WorldDelegate;
    private _grid: Cell[][] = [];
    private readonly _blockSize: number = 2;
    private _isProcedural: boolean = true;

    constructor(delegate: WorldDelegate) {
        this._delegate = delegate;
        this._mapGen = new MapGenerator(100, 60);
    }

    /**
     * Initialise le monde. Si mapUrl est fourni, on passe en mode artisanal.
     */
    public async init(mapUrl?: string): Promise<void> {
        if (mapUrl) {
            this._isProcedural = false;
            this._grid = []; // Pas de grille en mode GLB
            this._delegate.onLevelLoaded(mapUrl);
        } else {
            this._isProcedural = true;
            this._grid = this._mapGen.generate("level_" + Math.random(), 3000);
            this._delegate.onWorldGenerated(this._grid, this._blockSize);
            this._delegate.onEnemiesReady(this._mapGen.enemySpawns);
        }
    }

    public getStartPosition(): Vector3 {
        // Mode Artisanal : Position fixe par défaut (à adapter selon ta scène Blender)
        if (!this._isProcedural) {
            return new Vector3(-1, 2, 0);
        }

        // Mode Procédural : Recherche de spawn sécurisé
        if (!this._grid || this._grid.length === 0)
            return new Vector3(0, 10, 0);

        const width = this._grid.length;
        const height = this._grid[0].length;
        let startX = Math.floor(width / 2);
        let startY = Math.floor(height / 2);
        let found = false;

        const maxSearch = Math.max(width, height);
        for (let radius = 0; radius < maxSearch && !found; radius++) {
            for (let x = startX - radius; x <= startX + radius; x++) {
                for (let y = startY - radius; y <= startY + radius; y++) {
                    if (x >= 2 && x < width - 2 && y >= 2 && y < height - 2) {
                        if (
                            this._grid[x][y].type === CellType.EMPTY &&
                            this._grid[x][y + 1].type === CellType.EMPTY
                        ) {
                            startX = x;
                            startY = y;
                            found = true;
                            break;
                        }
                    }
                }
                if (found) break;
            }
        }

        // Stabilisation du sol procédural
        const floorY = startY - 1;
        if (floorY >= 0) {
            for (let x = startX - 1; x <= startX + 1; x++) {
                if (this._grid[x] && this._grid[x][floorY])
                    this._grid[x][floorY].type = CellType.WALL;
            }
        }

        return new Vector3(
            (startX + 0.5) * this._blockSize,
            (startY + 0.1) * this._blockSize,
            0,
        );
    }
}
