import { ItemType } from "../core/types/Items";
import { ModifierMode, type WeaponData } from "../core/types/WeaponStats";
import { WeaponSlot } from "../core/types/WeaponTypes";

export const WEAPONS_DB: Record<string, WeaponData> = {
    // ==========================================
    // DAGGERS (Vitesse Active / Santé Passive)
    // ==========================================
    butcher_dagger: {
        id: "butcher_dagger",
        name: "Butcher's Dagger",
        type: ItemType.WEAPON,
        weaponSlot: WeaponSlot.DAGGER,
        description: "Perfect for carving meat... and everything else.",
        iconPath: "./assets/ui/icons/weapons/butcher_dagger.png",
        meshPath: "./assets/models/weapons/daggers/butcher_dagger.glb",
        stats: {
            damage: 7,
            range: 1.1,
            attackDuration: 0.25,
            hitStopDuration: 0.04,
            knockbackForce: 2.0,
        },
        modifiers: {
            speedBoost: { value: 1.2, mode: ModifierMode.ACTIVE },
        },
    },
    crow_dagger: {
        id: "crow_dagger",
        name: "Crow Dagger",
        type: ItemType.WEAPON,
        weaponSlot: WeaponSlot.DAGGER,
        description: "A dark, tapered blade, light as a feather.",
        iconPath: "./assets/ui/icons/weapons/crow_dagger.png",
        meshPath: "./assets/models/weapons/daggers/crow_dagger.glb",
        stats: {
            damage: 9,
            range: 1.3,
            attackDuration: 0.2,
            hitStopDuration: 0.03,
            knockbackForce: 1.5,
        },
        modifiers: {
            speedBoost: { value: 2.0, mode: ModifierMode.ACTIVE },
            damageMultiplier: { value: 1.1, mode: ModifierMode.ACTIVE },
        },
    },
    hunter_knife: {
        id: "hunter_knife",
        name: "Hunter's Knife",
        type: ItemType.WEAPON,
        weaponSlot: WeaponSlot.DAGGER,
        description: "Sturdy and reliable in the heart of the wild.",
        iconPath: "./assets/ui/icons/weapons/hunter_knife.png",
        meshPath: "./assets/models/weapons/daggers/hunter_knife.glb",
        stats: {
            damage: 8,
            range: 1.2,
            attackDuration: 0.3,
            hitStopDuration: 0.05,
            knockbackForce: 3.0,
        },
        modifiers: {
            speedBoost: { value: 1.5, mode: ModifierMode.ACTIVE },
            healthBoost: { value: 10, mode: ModifierMode.PASSIVE },
        },
    },
    noble_dagger: {
        id: "noble_dagger",
        name: "Noble Dagger",
        type: ItemType.WEAPON,
        weaponSlot: WeaponSlot.DAGGER,
        description: "Adorned with jewels, as beautiful as it is sharp.",
        iconPath: "./assets/ui/icons/weapons/noble_dagger.png",
        meshPath: "./assets/models/weapons/daggers/noble_dagger.glb",
        stats: {
            damage: 6,
            range: 1.2,
            attackDuration: 0.22,
            hitStopDuration: 0.04,
            knockbackForce: 2.0,
        },
        modifiers: {
            speedBoost: { value: 1.5, mode: ModifierMode.ACTIVE },
            healthBoost: { value: 25, mode: ModifierMode.PASSIVE },
        },
    },

    // ==========================================
    // SWORDS
    // ==========================================
    knight_sword: {
        id: "knight_sword",
        name: "Knight's Sword",
        type: ItemType.WEAPON,
        weaponSlot: WeaponSlot.SWORD,
        description: "The standard and noble weapon of the chivalry.",
        iconPath: "./assets/ui/icons/weapons/knight_sword.png",
        meshPath: "./assets/models/weapons/swords/knight_sword.glb",
        stats: {
            damage: 15,
            range: 2.2,
            attackDuration: 0.6,
            hitStopDuration: 0.08,
            knockbackForce: 6.0,
        },
        modifiers: {
            speedBoost: { value: -0.5, mode: ModifierMode.ACTIVE },
            healthBoost: { value: 20, mode: ModifierMode.PASSIVE },
        },
    },
    oath_sword: {
        id: "oath_sword",
        name: "Oathkeeper Sword",
        type: ItemType.WEAPON,
        weaponSlot: WeaponSlot.SWORD,
        description:
            "Forged to uphold a sacred promise and protect its wielder.",
        iconPath: "./assets/ui/icons/weapons/oath_sword.png",
        meshPath: "./assets/models/weapons/swords/oath_sword.glb",
        stats: {
            damage: 18,
            range: 2.4,
            attackDuration: 0.55,
            hitStopDuration: 0.1,
            knockbackForce: 7.0,
        },
        modifiers: {
            speedBoost: { value: -0.2, mode: ModifierMode.ACTIVE },
            damageMultiplier: { value: 1.05, mode: ModifierMode.ACTIVE },
        },
    },

    // ==========================================
    // GREAT SWORDS (Gros malus de vitesse Active, Gros bonus PV Passif)
    // ==========================================
    great_imperial_sword: {
        id: "great_imperial_sword",
        name: "Great Imperial Sword",
        type: ItemType.WEAPON,
        weaponSlot: WeaponSlot.GREATSWORD,
        description:
            "A massive, fearsome, and intimidating weapon reserved for the elite.",
        iconPath: "./assets/ui/icons/weapons/great_imperial_sword.png",
        meshPath:
            "./assets/models/weapons/great_swords/Great_Imperial_Sword.glb",
        stats: {
            damage: 45,
            range: 3.5,
            attackDuration: 1.5,
            hitStopDuration: 0.2,
            knockbackForce: 15.0,
        },
        modifiers: {
            speedBoost: { value: -3.0, mode: ModifierMode.ACTIVE },
            healthBoost: { value: 50, mode: ModifierMode.PASSIVE },
        },
    },
    great_jade_sword: {
        id: "great_jade_sword",
        name: "Great Jade Sword",
        type: ItemType.WEAPON,
        weaponSlot: WeaponSlot.GREATSWORD,
        description: "Heavy yet mystically balanced, carved from pure jade.",
        iconPath: "./assets/ui/icons/weapons/great_jade_sword.png",
        meshPath: "./assets/models/weapons/great_swords/Great_Jade_Sword.glb",
        stats: {
            damage: 38,
            range: 3.2,
            attackDuration: 1.3,
            hitStopDuration: 0.15,
            knockbackForce: 12.0,
        },
        modifiers: {
            speedBoost: { value: -2.0, mode: ModifierMode.ACTIVE },
            damageMultiplier: { value: 1.15, mode: ModifierMode.ACTIVE },
        },
    },
};
