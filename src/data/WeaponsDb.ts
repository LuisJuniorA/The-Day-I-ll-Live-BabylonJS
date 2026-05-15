import { ItemType } from "../core/types/Items";
import { type WeaponData, ModifierMode } from "../core/types/WeaponStats";
import { WeaponSlot } from "../core/types/WeaponTypes";

export const WEAPONS_DB: Record<string, WeaponData> = {
    // --- DAGUES (Vitesse extrême, Dégâts par coup faibles mais DPS élevé) ---
    fish_knife: {
        id: "fish_knife",
        name: "Fish Knife",
        type: ItemType.WEAPON,
        weaponSlot: WeaponSlot.DAGGER,
        description: "Une petite lame dentelée, idéale pour l'écaillage.",
        iconPath: "./assets/ui/icons/weapons/fish_knife.png",
        meshPath: "./assets/models/weapons/daggers/fish_knife.glb",
        stats: {
            damage: 156, // 866 * 0.18
            range: 1.2,
            attackDuration: 0.18,
            hitStopDuration: 0.02,
            knockbackForce: 1.5,
        },
        modifiers: { speedBoost: { value: 0.1, mode: ModifierMode.ACTIVE } },
    },
    butcher_dagger: {
        id: "butcher_dagger",
        name: "Butcher's Dagger",
        type: ItemType.WEAPON,
        weaponSlot: WeaponSlot.DAGGER,
        description: "Lame épaisse pour découper la viande... et les os.",
        iconPath: "./assets/ui/icons/weapons/butcher_dagger.png",
        meshPath: "./assets/models/weapons/daggers/butcher_dagger.glb",
        stats: {
            damage: 213, // (1314 * 0.18) / 1.1 multiplier
            range: 1.4,
            attackDuration: 0.18,
            hitStopDuration: 0.04,
            knockbackForce: 3.0,
        },
        modifiers: {
            damageMultiplier: { value: 0.1, mode: ModifierMode.ACTIVE },
            healthBoost: { value: -15, mode: ModifierMode.PASSIVE },
        },
    },
    noble_dagger: {
        id: "noble_dagger",
        name: "Noble Dagger",
        type: ItemType.WEAPON,
        weaponSlot: WeaponSlot.DAGGER,
        description: "Une arme de parade ornée de joyaux.",
        iconPath: "./assets/ui/icons/weapons/noble_dagger.png",
        meshPath: "./assets/models/weapons/daggers/noble_dagger.glb",
        stats: {
            damage: 251, // (1607 * 0.18) / 1.15 multiplier
            range: 1.6,
            attackDuration: 0.18,
            hitStopDuration: 0.05,
            knockbackForce: 4.5,
        },
        modifiers: {
            damageMultiplier: { value: 0.15, mode: ModifierMode.ACTIVE },
            healthBoost: { value: -30, mode: ModifierMode.PASSIVE },
        },
    },
    hunter_knife: {
        id: "hunter_knife",
        name: "Hunter's Knife",
        type: ItemType.WEAPON,
        weaponSlot: WeaponSlot.DAGGER,
        description: "Robuste et fiable, survit à toutes les traques.",
        iconPath: "./assets/ui/icons/weapons/hunter_knife.png",
        meshPath: "./assets/models/weapons/daggers/hunter_knife.glb",
        stats: {
            damage: 271, // (1811 * 0.18) / 1.2 multiplier
            range: 1.8,
            attackDuration: 0.18,
            hitStopDuration: 0.06,
            knockbackForce: 6.0,
        },
        modifiers: {
            damageMultiplier: { value: 0.2, mode: ModifierMode.ACTIVE },
            healthBoost: { value: -45, mode: ModifierMode.PASSIVE },
        },
    },
    crow_dagger: {
        id: "crow_dagger",
        name: "Crow Dagger",
        type: ItemType.WEAPON,
        weaponSlot: WeaponSlot.DAGGER,
        description: "Aussi légère qu'une plume, aussi noire que la nuit.",
        iconPath: "./assets/ui/icons/weapons/crow_dagger.png",
        meshPath: "./assets/models/weapons/daggers/crow_dagger.glb",
        stats: {
            damage: 282, // (1960 * 0.18) / 1.25 multiplier
            range: 2.0,
            attackDuration: 0.18,
            hitStopDuration: 0.08,
            knockbackForce: 7.5,
        },
        modifiers: {
            damageMultiplier: { value: 0.25, mode: ModifierMode.ACTIVE },
            healthBoost: { value: -60, mode: ModifierMode.PASSIVE },
            speedBoost: { value: 0.15, mode: ModifierMode.ACTIVE },
        },
    },

    // --- ÉPÉES (Équilibrées, dégâts modérés) ---
    knight_sword: {
        id: "knight_sword",
        name: "Knight's Sword",
        type: ItemType.WEAPON,
        weaponSlot: WeaponSlot.SWORD,
        description: "L'équilibre parfait entre l'acier et la volonté.",
        iconPath: "./assets/ui/icons/weapons/knight_sword.png",
        meshPath: "./assets/models/weapons/swords/knight_sword.glb",
        stats: {
            damage: 113, // 226.7 * 0.5
            range: 2.2,
            attackDuration: 0.5,
            hitStopDuration: 0.08,
            knockbackForce: 5.0,
        },
        modifiers: { speedBoost: { value: 0.05, mode: ModifierMode.ACTIVE } },
    },
    oath_sword: {
        id: "oath_sword",
        name: "Oathkeeper Sword",
        type: ItemType.WEAPON,
        weaponSlot: WeaponSlot.SWORD,
        description: "Forgée pour respecter une promesse éternelle.",
        iconPath: "./assets/ui/icons/weapons/oath_sword.png",
        meshPath: "./assets/models/weapons/swords/oath_sword.glb",
        stats: {
            damage: 167, // (368 * 0.5) / 1.1 multiplier
            range: 2.4,
            attackDuration: 0.5,
            hitStopDuration: 0.1,
            knockbackForce: 6.5,
        },
        modifiers: {
            damageMultiplier: { value: 0.1, mode: ModifierMode.ACTIVE },
        },
    },
    sashimi_sword: {
        id: "sashimi_sword",
        name: "Sashimi Sword",
        type: ItemType.WEAPON,
        weaponSlot: WeaponSlot.SWORD,
        description: "Une lame si fine qu'elle tranche l'air sans bruit.",
        iconPath: "./assets/ui/icons/weapons/sashimi_sword.png",
        meshPath: "./assets/models/weapons/swords/sashimi_sword.glb",
        stats: {
            damage: 206, // (474 * 0.5) / 1.15 multiplier
            range: 2.6,
            attackDuration: 0.5,
            hitStopDuration: 0.12,
            knockbackForce: 8.0,
        },
        modifiers: {
            damageMultiplier: { value: 0.15, mode: ModifierMode.ACTIVE },
            speedBoost: { value: 0.1, mode: ModifierMode.ACTIVE },
        },
    },
    scale_sword: {
        id: "scale_sword",
        name: "Scale Sword",
        type: ItemType.WEAPON,
        weaponSlot: WeaponSlot.SWORD,
        description: "Une lame renforcée par des écailles de Calamité.",
        iconPath: "./assets/ui/icons/weapons/scale_sword.png",
        meshPath: "./assets/models/weapons/swords/scale_sword.glb",
        stats: {
            damage: 233, // (559 * 0.5) / 1.2 multiplier
            range: 2.8,
            attackDuration: 0.5,
            hitStopDuration: 0.14,
            knockbackForce: 9.5,
        },
        modifiers: {
            damageMultiplier: { value: 0.2, mode: ModifierMode.ACTIVE },
        },
    },

    // --- ESPADONS (Lents, mais dégâts par coup massifs) ---
    great_jade_sword: {
        id: "great_jade_sword",
        name: "Great Jade Sword",
        type: ItemType.WEAPON,
        weaponSlot: WeaponSlot.GREATSWORD,
        description: "Lourde, mais mystiquement équilibrée par le jade.",
        iconPath: "./assets/ui/icons/weapons/great_jade_sword.png",
        meshPath: "./assets/models/weapons/great_swords/great_jade_sword.glb",
        stats: {
            damage: 231, // 178.2 * 1.3
            range: 3.5,
            attackDuration: 1.3,
            hitStopDuration: 0.16,
            knockbackForce: 15.0,
        },
        modifiers: { speedBoost: { value: -0.1, mode: ModifierMode.PASSIVE } },
    },
    great_imperial_sword: {
        id: "great_imperial_sword",
        name: "Great Imperial Sword",
        type: ItemType.WEAPON,
        weaponSlot: WeaponSlot.GREATSWORD,
        description: "L'emblème de la garde impériale déchue.",
        iconPath: "./assets/ui/icons/weapons/great_imperial_sword.png",
        meshPath:
            "./assets/models/weapons/great_swords/great_imperial_sword.glb",
        stats: {
            damage: 352, // (298 * 1.3) / 1.1 multiplier
            range: 3.7,
            attackDuration: 1.3,
            hitStopDuration: 0.2,
            knockbackForce: 16.5,
        },
        modifiers: {
            damageMultiplier: { value: 0.1, mode: ModifierMode.ACTIVE },
            healthBoost: { value: 25, mode: ModifierMode.PASSIVE },
        },
    },
    great_steel_sword: {
        id: "great_steel_sword",
        name: "Great Steel Sword",
        type: ItemType.WEAPON,
        weaponSlot: WeaponSlot.GREATSWORD,
        description: "Une masse d'acier brut. Lent, mais définitif.",
        iconPath: "./assets/ui/icons/weapons/great_steel_sword.png",
        meshPath: "./assets/models/weapons/great_swords/great_steel_sword.glb",
        stats: {
            damage: 428, // (395 * 1.3) / 1.2 multiplier
            range: 3.9,
            attackDuration: 1.3,
            hitStopDuration: 0.25,
            knockbackForce: 18.0,
        },
        modifiers: {
            damageMultiplier: { value: 0.2, mode: ModifierMode.ACTIVE },
            healthBoost: { value: 50, mode: ModifierMode.PASSIVE },
            speedBoost: { value: -0.2, mode: ModifierMode.PASSIVE },
        },
    },
};
