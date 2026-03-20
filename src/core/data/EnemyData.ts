import type { EnemyConfig } from "../types/EnemyConfig";

export const ENEMY_CONFIGS: Record<string, EnemyConfig> = {
    effroi: {
        id: "effroi_standard",
        displayName: "Effroi",
        stats: { hp: 200, maxHp: 200, speed: 5, damage: 10 },
        behavior: {
            detectionRange: 15,
            escapeRange: 20,
            interactionRange: 3.5, // L'IA commence à attaquer d'un peu plus loin
            attackRange: 3.5,
            arrivalRadius: 3.0,
            maxSpeed: 5,
            maxForce: 0.5,
            turnSpeed: 0.12,
            weights: { seek: 1, separation: 0.5 },
        },
    },
};
