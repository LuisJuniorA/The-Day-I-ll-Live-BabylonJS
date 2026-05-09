import type { ItemData } from "../../data/ItemData";

// ItemTypes.ts
export const ItemType = {
    CURRENCY: "currency",
    MATERIAL: "material",
    CONSUMABLE: "consumable",
    WEAPON: "weapon",
} as const;

export type ItemType = (typeof ItemType)[keyof typeof ItemType];

export interface Item {
    readonly id: string;
    readonly name: string;
    readonly description: string;
    readonly iconPath: string;
    readonly type: ItemType;
    readonly value?: number; // Prix d'achat/revente de base
}

// 2. Un objet généré après la mort d'un monstre (ce qui va tomber par terre)
export type LootDrop = {
    item: Item;
    amount: number;
};

// 3. La configuration probabiliste dans le monstre
export type LootTableEntry = {
    itemId: keyof typeof ItemData; // Fait référence à l'ID d'un Item existant
    dropChance: number; // Entre 0.0 (0%) et 1.0 (100%)
    minAmount: number;
    maxAmount: number;
};
