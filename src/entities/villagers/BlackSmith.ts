import { NPCInteractable } from "../../core/abstracts/NPCInteractable";
import { OnDialogueRequest } from "../../core/interfaces/Interactable";
import { OnOpenForge } from "../../core/interfaces/ForgeEvents";
import { RECIPES_DB } from "../../data/RecipesDb";

export class Blacksmith extends NPCInteractable {
    public onInteract(): void {
        OnDialogueRequest.notifyObservers({
            speakerName: this.name,
            text: "Besoin de transformer tes trouvailles ou de forger une lame ?",
            onComplete: () => {
                const recipeIds: string[] =
                    this.data.metadata?.forgeRecipes || [];

                // On envoie juste les IDs ou les recettes de base de la DB
                const recipes = recipeIds
                    .map((id) => RECIPES_DB[id])
                    .filter((r) => !!r);

                OnOpenForge.notifyObservers({
                    blacksmithId: this.id,
                    recipes: recipes, // On envoie les données brutes de RECIPES_DB
                });
                return true;
            },
        });
    }
}
