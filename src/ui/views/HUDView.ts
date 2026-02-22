import { AdvancedDynamicTexture } from "@babylonjs/gui";
import { BaseView } from "../../core/abstracts/BaseView"; // Ajuste le chemin selon ton projet

export class HUDView extends BaseView {

    constructor(advancedTexture: AdvancedDynamicTexture) {
        super(advancedTexture, "HUDView");
        this.buildUI();
    }

    /**
     * Pour le moment, cette vue est vide.
     * C'est ici que tu ajouteras plus tard ta barre de vie, 
     * ton compteur de munitions ou ta mini-map.
     */
    protected buildUI(): void {
        // Le rootContainer est déjà créé et ajouté à l'AdvancedDynamicTexture par BaseView.
        // On le laisse vide pour l'instant.
    }

    // Exemple de future méthode pour mettre à jour les données du jeu
    // public updateStats(data: any): void { }
}