import { WeaponSlot } from "./WeaponTypes";

export type WeaponOwnerModifiers = {
    readonly speedBoost?: number; // Valeur ajoutée à la vitesse (ex: -2)
    readonly healthBoost?: number; // PV max supplémentaires (ex: 20)
    readonly damageMultiplier?: number; // Multiplicateur de dégâts globaux (ex: 1.1)
};

export type WeaponData = {
    readonly id: string;
    readonly name: string;
    readonly type: WeaponSlot;
    readonly meshPath: string;

    // Stats de combat
    readonly stats: {
        readonly damage: number;
        readonly range: number;
        readonly attackDuration: number; // Temps total de l'anim/état
        readonly description?: string;
    };

    // Stats appliquées au joueur
    readonly modifiers: WeaponOwnerModifiers;
};
