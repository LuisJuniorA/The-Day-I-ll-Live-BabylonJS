import type { WeaponData } from "../core/types/WeaponStats";
import { WeaponSlot } from "../core/types/WeaponTypes";

export const WEAPONS_DB: Record<string, WeaponData> = {
    // ==========================================
    // DAGGERS (Hitstop très court, KB faible pour rester au corps-à-corps)
    // ==========================================
    butcher_dagger: {
        id: "butcher_dagger",
        name: "Butcher's Dagger",
        type: WeaponSlot.DAGGER,
        meshPath: "assets/models/weapons/daggers/butcher_dagger.glb",
        stats: {
            damage: 7,
            range: 1.1,
            attackDuration: 0.25,
            hitStopDuration: 0.04, // Presque instantané
            knockbackForce: 2.0,
            description: "Perfect for carving meat... and everything else.",
        },
        modifiers: { speedBoost: 1.2 },
    },
    crow_dagger: {
        id: "crow_dagger",
        name: "Crow Dagger",
        type: WeaponSlot.DAGGER,
        meshPath: "assets/models/weapons/daggers/crow_dagger.glb",
        stats: {
            damage: 9,
            range: 1.3,
            attackDuration: 0.2,
            hitStopDuration: 0.03, // Très nerveux
            knockbackForce: 1.5,
            description: "A dark, tapered blade, light as a feather.",
        },
        modifiers: { speedBoost: 2.0, damageMultiplier: 1.1 },
    },
    fish_knife: {
        id: "fish_knife",
        name: "Fish Knife",
        type: WeaponSlot.DAGGER,
        meshPath: "assets/models/weapons/daggers/fish_knife.glb",
        stats: {
            damage: 4,
            range: 1.0,
            attackDuration: 0.2,
            hitStopDuration: 0.02,
            knockbackForce: 1.0,
            description: "A simple sharp knife, designed for scaling.",
        },
        modifiers: { speedBoost: 1.0 },
    },
    hunter_knife: {
        id: "hunter_knife",
        name: "Hunter's Knife",
        type: WeaponSlot.DAGGER,
        meshPath: "assets/models/weapons/daggers/hunter_knife.glb",
        stats: {
            damage: 8,
            range: 1.2,
            attackDuration: 0.3,
            hitStopDuration: 0.05,
            knockbackForce: 3.0,
            description: "Sturdy and reliable in the heart of the wild.",
        },
        modifiers: { speedBoost: 1.5, healthBoost: 10 },
    },
    knife: {
        id: "knife",
        name: "Basic Knife",
        type: WeaponSlot.DAGGER,
        meshPath: "assets/models/weapons/daggers/knife.glb",
        stats: {
            damage: 3,
            range: 1.0,
            attackDuration: 0.25,
            hitStopDuration: 0.03,
            knockbackForce: 1.5,
            description: "A most classic and standard knife.",
        },
        modifiers: { speedBoost: 1.0 },
    },
    noble_dagger: {
        id: "noble_dagger",
        name: "Noble Dagger",
        type: WeaponSlot.DAGGER,
        meshPath: "assets/models/weapons/daggers/noble_dagger.glb",
        stats: {
            damage: 6,
            range: 1.2,
            attackDuration: 0.22,
            hitStopDuration: 0.04,
            knockbackForce: 2.0,
            description: "Adorned with jewels, as beautiful as it is sharp.",
        },
        modifiers: { speedBoost: 1.5, healthBoost: 25 },
    },

    // ==========================================
    // SWORDS (Équilibre entre impact et fluidité)
    // ==========================================
    knight_sword: {
        id: "knight_sword",
        name: "Knight's Sword",
        type: WeaponSlot.SWORD,
        meshPath: "assets/models/weapons/swords/knight_sword.glb",
        stats: {
            damage: 15,
            range: 2.2,
            attackDuration: 0.6,
            hitStopDuration: 0.08,
            knockbackForce: 6.0,
            description: "The standard and noble weapon of the chivalry.",
        },
        modifiers: { speedBoost: -0.5, healthBoost: 20 },
    },
    oath_sword: {
        id: "oath_sword",
        name: "Oathkeeper Sword",
        type: WeaponSlot.SWORD,
        meshPath: "assets/models/weapons/swords/oath_sword.glb",
        stats: {
            damage: 18,
            range: 2.4,
            attackDuration: 0.55,
            hitStopDuration: 0.1,
            knockbackForce: 7.0,
            description:
                "Forged to uphold a sacred promise and protect its wielder.",
        },
        modifiers: { speedBoost: -0.2, damageMultiplier: 1.05 },
    },
    sashimi_sword: {
        id: "sashimi_sword",
        name: "Sashimi Sword",
        type: WeaponSlot.SWORD,
        meshPath: "assets/models/weapons/swords/sashimi_sword.glb",
        stats: {
            damage: 20,
            range: 2.5,
            attackDuration: 0.4,
            hitStopDuration: 0.06, // Plus tranchant/rapide
            knockbackForce: 4.5,
            description: "Razor-sharp, designed for clean and deadly cuts.",
        },
        modifiers: { speedBoost: 0.5 },
    },
    scale_sword: {
        id: "scale_sword",
        name: "Scale Sword",
        type: WeaponSlot.SWORD,
        meshPath: "assets/models/weapons/swords/Scale_Sword.glb",
        stats: {
            damage: 16,
            range: 2.3,
            attackDuration: 0.65,
            hitStopDuration: 0.12, // Un peu plus "lourd" à cause des écailles
            knockbackForce: 8.0,
            description:
                "A textured blade reminiscent of a fierce dragon's scales.",
        },
        modifiers: { speedBoost: -0.5, damageMultiplier: 1.1 },
    },

    // ==========================================
    // GREAT SWORDS (Impact massif, hitstop marqué)
    // ==========================================
    great_imperial_sword: {
        id: "great_imperial_sword",
        name: "Great Imperial Sword",
        type: WeaponSlot.GREATSWORD,
        meshPath: "assets/models/weapons/great_swords/Great_Imperial_Sword.glb",
        stats: {
            damage: 45,
            range: 3.5,
            attackDuration: 1.5,
            hitStopDuration: 0.2, // Stop significatif
            knockbackForce: 15.0, // Expulse les ennemis
            description:
                "A massive, fearsome, and intimidating weapon reserved for the elite.",
        },
        modifiers: { speedBoost: -3.0, healthBoost: 50 },
    },
    great_jade_sword: {
        id: "great_jade_sword",
        name: "Great Jade Sword",
        type: WeaponSlot.GREATSWORD,
        meshPath: "assets/models/weapons/great_swords/Great_Jade_Sword.glb",
        stats: {
            damage: 38,
            range: 3.2,
            attackDuration: 1.3,
            hitStopDuration: 0.15,
            knockbackForce: 12.0,
            description:
                "Heavy yet mystically balanced, carved from pure jade.",
        },
        modifiers: { speedBoost: -2.0, damageMultiplier: 1.15 },
    },
    great_steel_sword: {
        id: "great_steel_sword",
        name: "Great Steel Sword",
        type: WeaponSlot.GREATSWORD,
        meshPath: "assets/models/weapons/great_swords/Great_Steel_Sword.glb",
        stats: {
            damage: 35,
            range: 3.0,
            attackDuration: 1.2,
            hitStopDuration: 0.18,
            knockbackForce: 13.0,
            description: "A classic greatsword, forged from heavy-duty steel.",
        },
        modifiers: { speedBoost: -2.5 },
    },
};
