import { Scene } from "@babylonjs/core";
import { AdvancedDynamicTexture } from "@babylonjs/gui";
import { MainMenuView } from "../ui/views/MainMenuView";
import { HUDView } from "../ui/views/HUDView";
import { GameState } from "../core/types/GameState";
import type { GameStateType } from "../core/types/GameState";
import { GameStateManager } from "./GameStateManager";
import { OnInteractionAvailable } from "../core/interfaces/Interactable";
import { AbstractMesh } from "@babylonjs/core";

export class UIManager {
    private _advancedTexture: AdvancedDynamicTexture;

    // On utilise les types précis pour avoir l'autocomplétion sur les méthodes spécifiques
    public mainMenuView: MainMenuView;
    public hudView: HUDView;

    constructor(scene: Scene, gameStateManager: GameStateManager) {
        this._advancedTexture = AdvancedDynamicTexture.CreateFullscreenUI("MainUI", true, scene);

        this.mainMenuView = new MainMenuView(this._advancedTexture);
        this.hudView = new HUDView(this._advancedTexture);

        // --- LA CONNEXION ---
        gameStateManager.onStateChangedObservable.add((state) => {
            this.handleStateChange(state);
        });

        OnInteractionAvailable.add((event) => {
            // 1. On vérifie d'abord si l'interactable existe (on élimine le 'undefined')
            if (event.isNear && event.interactable) {
                const npcMesh = event.interactable.transform as AbstractMesh;

                // FORCE la mise à jour des coordonnées mondiales du NPC
                npcMesh.computeWorldMatrix(true);

                this.hudView.interactionPrompt.showAtMesh(npcMesh); // Utilise des petites valeurs si c'est linkOffsetY
            } else {
                this.hudView.interactionPrompt.hide();
            }
        });

        // On initialise l'UI avec l'état actuel
        this.handleStateChange(gameStateManager.state);
    }

    private handleStateChange(state: GameStateType): void {
        switch (state) {
            case GameState.MENU:
            case GameState.PAUSED:
                this.hudView.interactionPrompt.hide();
                this.showMenu();
                break;

            case GameState.PLAYING:
                this.showHUD();
                break;

            case GameState.GAME_OVER:
                //this.showGameOver();
                break;
        }
    }

    public showHUD(): void {
        this.mainMenuView.hide();
        this.hudView.show();
        this.hudView.interactionPrompt.show();
    }

    public showMenu(): void {
        this.hudView.hide();
        this.mainMenuView.show();
    }
}