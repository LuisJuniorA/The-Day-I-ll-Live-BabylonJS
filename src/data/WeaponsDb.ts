import type { WeaponData } from "../core/types/WeaponStats";

export const WEAPONS_DB: Record<string, WeaponData> = {
    rusty_iron_sword: {
        id: "rusty_iron_sword",
        name: "Épée en fer rouillée",
        type: "Sword",
        meshPath: "models/weapons/sword_iron.glb",
        stats: {
            damage: 12,
            range: 2.2,
            attackDuration: 0.6,
            description: "Une vieille épée qui a connu des jours meilleurs.",
        },
        modifiers: {
            speedBoost: -0.5, // Les épées ralentissent un peu
        },
    },
    assassin_dagger: {
        id: "assassin_dagger",
        name: "Dague d'assassin",
        type: "Dagger",
        meshPath: "models/weapons/dagger_v2.glb",
        stats: {
            damage: 5,
            range: 1.2,
            attackDuration: 0.25,
            description: "Légère et mortelle.",
        },
        modifiers: {
            speedBoost: 1.5, // La dague rend plus agile
        },
    },
};
