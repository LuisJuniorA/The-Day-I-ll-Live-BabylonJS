import { Observable } from "@babylonjs/core";

export interface RecipeRequirement {
    itemId: string;
    amount: number;
    ownedCount?: number; // Rempli dynamiquement au moment de l'ouverture
}

export interface ForgeRecipe {
    itemId: string; // L'ID de l'arme (ex: "butcher_dagger")
    price: number; // Coût en Fragments d'espoir
    requirements: RecipeRequirement[];
}

export interface ForgeEventData {
    blacksmithId: string;
    recipes: ForgeRecipe[];
}

export const OnOpenForge = new Observable<ForgeEventData>();
export const OnCraftRequest = new Observable<ForgeRecipe>();
