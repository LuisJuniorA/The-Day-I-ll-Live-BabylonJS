import type { EnemyConfig } from "../core/types/EnemyConfig";

export const ENEMY_CONFIGS: Record<string, EnemyConfig> = {
    effroi: {
        id: "effroi_standard",
        displayName: "Effroi",
        assetPath: "assets/models/characters/enemies/effroi.glb",
        stats: { hp: 200, maxHp: 200, speed: 5, damage: 10 },
        behavior: {
            detectionRange: 15,
            escapeRange: 20,

            interactionRange: 2.5, // S'arrête un peu avant de taper
            attackRange: 3.5, // Ses griffes sont longues, il touche de loin
            arrivalRadius: 6.0, // Il commence à ralentir bien avant pour être fluide

            maxSpeed: 5,
            maxForce: 0.3, // Un peu plus nerveux que le slime
            turnSpeed: 0.12,
            weights: { seek: 1, separation: 0.5 },
        },
    },
    slime: {
        id: "slime_dark_entity",
        displayName: "Slime Sombre",
        assetPath: "procedural",
        stats: { hp: 80, maxHp: 80, speed: 2.5, damage: 15 },
        behavior: {
            detectionRange: 12,
            escapeRange: 18,

            // --- TA CONFIG SLIME EST GOOD ---
            interactionRange: 2.0,
            attackRange: 2.5,
            arrivalRadius: 4.0,

            maxSpeed: 2.5,
            maxForce: 0.1,
            turnSpeed: 0.1,

            weights: {
                seek: 1.0,
                separation: 0.4, // Baissé légèrement pour éviter les secousses
            },
        },
    },
};
