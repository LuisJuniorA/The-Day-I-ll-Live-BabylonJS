import type { Item, ItemType } from "./Items";

import { WeaponSlot } from "./WeaponTypes";

export const ModifierMode = {
    PASSIVE: "passive",

    ACTIVE: "active",
} as const;

export type ModifierMode = (typeof ModifierMode)[keyof typeof ModifierMode];

export type ModifierValue = {
    readonly value: number;

    readonly mode: ModifierMode;
};

export type WeaponOwnerModifiers = {
    readonly speedBoost?: ModifierValue;

    readonly healthBoost?: ModifierValue;

    readonly damageMultiplier?: ModifierValue;
};

// WeaponData hérite de Item !

export interface WeaponData extends Item {
    readonly type: typeof ItemType.WEAPON; // Force le type à "weapon"

    readonly weaponSlot: WeaponSlot; // Anciennement 'type' dans ton code

    readonly meshPath: string;

    readonly stats: {
        readonly damage: number;

        readonly range: number;

        readonly attackDuration: number;

        readonly hitStopDuration?: number;

        readonly knockbackForce?: number;

        // Note: La description est déjà dans Item,

        // on peut la retirer de stats ou la garder pour le "lore"
    };

    readonly modifiers: WeaponOwnerModifiers;
}
