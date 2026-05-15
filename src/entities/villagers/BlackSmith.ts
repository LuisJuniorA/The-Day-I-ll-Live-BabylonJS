import { NPCInteractable } from "../../core/abstracts/NPCInteractable";
import {
    type ForgeRecipe,
    OnOpenForge,
} from "../../core/interfaces/ForgeEvents";
import { OnDialogueRequest } from "../../core/interfaces/Interactable";
import { ALL_ITEMS } from "../../data/ItemDb";
import { RECIPES_DB } from "../../data/RecipesDb";

export class Blacksmith extends NPCInteractable {
    public onInteract(): void {
        OnDialogueRequest.notifyObservers({
            speakerName: this.name,
            text: "Besoin de transformer tes trouvailles ?",
            onComplete: () => {
                const recipeIds = this.data.metadata?.forgeRecipes || [];
                // FUSION DYNAMIQUE ICI
                const enrichedRecipes: ForgeRecipe[] = recipeIds
                    .map((id) => {
                        const raw = RECIPES_DB[id];
                        const baseItem = ALL_ITEMS[id]; // On récupère les infos visuelles

                        if (!raw || !baseItem) return null;
                        return {
                            ...baseItem, // id, name, description, iconPath, type
                            price: raw.price,
                            requirements: raw.requirements,
                        };
                    })
                    .filter((r): r is ForgeRecipe => r !== null);
                OnOpenForge.notifyObservers({
                    blacksmithId: this.id,
                    recipes: enrichedRecipes, // L'UI reçoit des objets parfaits
                });
                return true;
            },
        });
    }
}
