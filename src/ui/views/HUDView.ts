import { AdvancedDynamicTexture } from "@babylonjs/gui";
import { BaseView } from "../../core/abstracts/BaseView";
import { PromptButtonComponent } from "../components/PromptButtonComponent";
import type { AbstractMesh } from "@babylonjs/core";

export class HUDView extends BaseView {
    private _interactionPrompt!: PromptButtonComponent;
    private _shouldShowPrompt: boolean = false;

    constructor(advancedTexture: AdvancedDynamicTexture) {
        super(advancedTexture, "HUDView");
        this.buildUI();
    }

    protected buildUI(): void {
        this._interactionPrompt = new PromptButtonComponent(
            "PlayerInteraction",
            "E",
        );
        this.advancedTexture.addControl(this._interactionPrompt);
    }

    /**
     * Appelé par l'Observable dans l'UIManager
     */
    public setInteractionAvailable(
        isAvailable: boolean,
        mesh?: AbstractMesh,
    ): void {
        this._shouldShowPrompt = isAvailable;

        if (isAvailable && mesh) {
            this._interactionPrompt.showAtMesh(mesh);
            this._interactionPrompt.show();
        } else {
            this._interactionPrompt.hide();
        }
    }

    /**
     * Cycle de vie : Quand le HUD réapparaît (Resume)
     */
    public show(): void {
        super.show(); // Affiche le HUD (HP, etc.)

        // On check le flag pour savoir s'il faut restaurer le bouton "E"
        if (this._shouldShowPrompt) {
            this._interactionPrompt.show();
        }
    }

    /**
     * Getter pour accéder au composant depuis un Controller ou Manager
     */
    public get interactionPrompt(): PromptButtonComponent {
        return this._interactionPrompt;
    }
}
