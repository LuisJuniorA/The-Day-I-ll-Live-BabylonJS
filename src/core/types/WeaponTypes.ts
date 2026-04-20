export const WeaponSlot = {
    DAGGER: "Dagger",
    SWORD: "Sword",
    GREATSWORD: "GreatSword",
} as const;

export type WeaponSlot = (typeof WeaponSlot)[keyof typeof WeaponSlot];

export type WeaponSlotMap = Record<WeaponSlot, string>;
