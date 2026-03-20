import type { EnemyConfig } from "../types/EnemyConfig";

export const ENEMY_CONFIGS: Record<string, EnemyConfig> = {
    effroi: {
        id: "effroi_standard",
        displayName: "Effroi",
        stats: { hp: 200, maxHp: 200, speed: 5 },
        behavior: {
            detectionRange: 15,
            escapeRange: 20,
            interactionRange: 2,
            arrivalRadius: 3.0,
            maxSpeed: 5,
            turnSpeed: 0.12,
            weights: { seek: 3, separation: 1 },
        },
    },
};
