import type { EnemyConfig } from "../core/types/EnemyConfig";

export const ENEMY_CONFIGS: Record<string, EnemyConfig> = {
    // --- L'EFFROI (Mob de milieu/fin de zone) ---
    // C'est lui qui doit financer les armes Tier 2 et 3.
    effroi: {
        id: "effroi_standard",
        displayName: "Effroi",
        assetPath: "./assets/models/characters/enemies/effroi.glb",
        stats: { hp: 200, maxHp: 200, speed: 5, damage: 10 },
        xpReward: 150,
        lootTable: [
            {
                itemId: "gold_coin",
                dropChance: 1.0,
                minAmount: 80, // Augmenté : 4-5 kills = 1 Despair Tear
                maxAmount: 150,
            },
            {
                itemId: "despairs_tear",
                dropChance: 0.4, // Augmenté : Moins de grind frustrant
                minAmount: 1,
                maxAmount: 2,
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

    // --- SLIME SOMBRE (Mob de début de zone) ---
    // Source principale de Slime Souls et petit revenu constant.
    slime: {
        id: "slime_dark_entity",
        displayName: "Slime Sombre",
        assetPath: "procedural",
        stats: { hp: 80, maxHp: 80, speed: 2.5, damage: 15 },
        xpReward: 35,
        lootTable: [
            {
                itemId: "gold_coin",
                dropChance: 1.0, // Toujours de l'or, même un peu
                minAmount: 15, // 20 kills = 300g (Prix de base d'une arme T1)
                maxAmount: 35,
            },
            {
                itemId: "slime_soul",
                dropChance: 0.9, // Presque systématique
                minAmount: 2, // On en donne plus car les recettes en demandent pas mal
                maxAmount: 4,
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
