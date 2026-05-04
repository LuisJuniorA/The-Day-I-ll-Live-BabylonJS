import type { EnemyConfig } from "../core/types/EnemyConfig";

export const ENEMY_CONFIGS: Record<string, EnemyConfig> = {
    effroi: {
        id: "effroi_standard",
        displayName: "Effroi",
        assetPath: "assets/models/characters/enemies/effroi.glb",
        stats: { hp: 200, maxHp: 200, speed: 5, damage: 10 },
        // --- RECOMPENSES ---
        xpReward: 150, // Gros mob, grosse XP
        lootTable: [
            {
                itemId: "gold_coin",
                dropChance: 1.0, // Toujours un peu d'or
                minAmount: 20,
                maxAmount: 50,
            },
            {
                itemId: "despairs_tear",
                dropChance: 0.2, // Rare
                minAmount: 1,
                maxAmount: 1,
            },
        ],
        behavior: {
            detectionRange: 15,
            escapeRange: 20,
            interactionRange: 2.5,
            attackRange: 3.5,
            arrivalRadius: 6.0,
            maxSpeed: 5,
            maxForce: 0.3,
            turnSpeed: 0.12,
            weights: { seek: 1, separation: 0.5 },
        },
    },
    slime: {
        id: "slime_dark_entity",
        displayName: "Slime Sombre",
        assetPath: "procedural",
        stats: { hp: 80, maxHp: 80, speed: 2.5, damage: 15 },
        // --- RECOMPENSES ---
        xpReward: 35,
        lootTable: [
            {
                itemId: "gold_coin",
                dropChance: 0.5, // 50% de chance
                minAmount: 5,
                maxAmount: 15,
            },
            {
                itemId: "slime_gel",
                dropChance: 0.8, // Commun
                minAmount: 1,
                maxAmount: 3,
            },
        ],
        behavior: {
            detectionRange: 12,
            escapeRange: 18,
            interactionRange: 2.0,
            attackRange: 2.5,
            arrivalRadius: 4.0,
            maxSpeed: 2.5,
            maxForce: 0.1,
            turnSpeed: 0.1,
            weights: {
                seek: 1.0,
                separation: 0.4,
            },
        },
    },
};
