import { Scene } from "@babylonjs/core";
import { AdvancedDynamicTexture } from "@babylonjs/gui";
import { MainMenuView } from "../ui/views/MainMenuView";
import { HUDView } from "../ui/views/HUDView";
import { GameState } from "../core/types/GameState";
import type { GameStateType } from "../core/types/GameState";
import { GameStateManager } from "./GameStateManager";

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

        // On initialise l'UI avec l'état actuel
        this.handleStateChange(gameStateManager.state);
    }

    private handleStateChange(state: GameStateType): void {
        switch (state) {
            case GameState.MENU:
            case GameState.PAUSED:
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
    }

    public showMenu(): void {
        this.hudView.hide();
        this.mainMenuView.show();
    }
}