import { Observable } from "@babylonjs/core";
import type { Item } from "../types/Items";

export interface RecipeRequirement {
    itemId: string;
    amount: number;
    ownedCount?: number; // Rempli dynamiquement au moment de l'ouverture
}

export interface ForgeRecipe extends Item {
    price: number; // Coût en fragments
    requirements: RecipeRequirement[];
}

export interface ForgeEventData {
    blacksmithId: string;
    recipes: ForgeRecipe[];
}

export const OnOpenForge = new Observable<ForgeEventData>();
export const OnCraftRequest = new Observable<ForgeRecipe>();
