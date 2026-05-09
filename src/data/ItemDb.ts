// src/data/ItemsDb.ts
import { ItemData } from "./ItemData"; // Tes matériaux (Larmes, Âmes)
import { WEAPONS_DB } from "./WeaponsDb"; // Tes armes
import type { Item } from "../core/types/Items";

export const ALL_ITEMS: Record<string, Item> = {
    ...ItemData,
    ...WEAPONS_DB,
};
