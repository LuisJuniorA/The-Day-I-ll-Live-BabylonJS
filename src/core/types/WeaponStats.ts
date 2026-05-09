import type { Item, ItemType } from "./Items";
import { WeaponSlot } from "./WeaponTypes";

export type WeaponOwnerModifiers = {
    readonly speedBoost?: number;
    readonly healthBoost?: number;
    readonly damageMultiplier?: number;
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
