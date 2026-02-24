import { AdvancedDynamicTexture } from "@babylonjs/gui";
import { BaseView } from "../../core/abstracts/BaseView";
import { PromptButtonComponent } from "../components/PromptButtonComponent";

export class HUDView extends BaseView {
    private _interactionPrompt!: PromptButtonComponent;

    constructor(advancedTexture: AdvancedDynamicTexture) {
        super(advancedTexture, "HUDView");
        this.buildUI();
    }

    protected buildUI(): void {
        // 1. Instanciation du composant
        this._interactionPrompt = new PromptButtonComponent("PlayerInteraction", "E");

        // 2. Ajout au container racine de la vue
        // Comme PromptButtonComponent EST un Rectangle, on l'ajoute directement
        this.advancedTexture.addControl(this._interactionPrompt);
    }

    /**
     * Getter pour accéder au composant depuis un Controller ou Manager
     */
    public get interactionPrompt(): PromptButtonComponent {
        return this._interactionPrompt;
    }
}