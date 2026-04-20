// --- TYPES ---
export const CellType = {
    WALL: 1,
    EMPTY: 0,
    PLATFORM: 2,
} as const;

export type CellType = (typeof CellType)[keyof typeof CellType];

export interface Cell {
    x: number;
    y: number;
    type: CellType;
    hasEnemy: boolean;
}

export interface Vector3Like {
    x: number;
    y: number;
    z: number;
}

// --- UTILS ---
export class RandomUtils {
    private static _seed = 12345;

    // Convertit une string (ex: "level_1") en nombre pour la seed
    public static setSeed(seedString: string): void {
        let hash = 0;
        for (let i = 0; i < seedString.length; i++) {
            const char = seedString.charCodeAt(i);
            hash = (hash << 5) - hash + char;
            hash = hash & hash; // Convert to 32bit integer
        }
        this._seed = Math.abs(hash);
    }

    // Génère un nombre entre 0 et 1 basé sur la seed
    public static random(): number {
        this._seed = (this._seed * 9301 + 49297) % 233280;
        return this._seed / 233280;
    }

    // Retourne un entier entre min et max inclus
    public static range(min: number, max: number): number {
        return Math.floor(this.random() * (max - min + 1)) + min;
    }
}
