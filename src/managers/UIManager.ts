import { Scene, AbstractMesh } from "@babylonjs/core";
import { AdvancedDynamicTexture } from "@babylonjs/gui";
import { MainMenuView } from "../ui/views/MainMenuView";
import { HUDView } from "../ui/views/HUDView";
import { DialogueView } from "../ui/views/DialogueView";
import { GameState, type GameStateType } from "../core/types/GameState";
import { GameStateManager } from "./GameStateManager";
import {
    OnDialogueRequest,
    OnInteractionAvailable,
    type DialogueRequest,
} from "../core/interfaces/Interactable";
import { OnHealthChanged } from "../core/interfaces/CombatEvent";

export class UIManager {
    private _advancedTexture: AdvancedDynamicTexture;
    public mainMenuView: MainMenuView;
    public hudView: HUDView;
    public dialogueView: DialogueView;
    private _gameStateManager: GameStateManager;

    constructor(scene: Scene, gameStateManager: GameStateManager) {
        this._advancedTexture = AdvancedDynamicTexture.CreateFullscreenUI(
            "MainUI",
            true,
            scene,
        );
        this._gameStateManager = gameStateManager;

        this.mainMenuView = new MainMenuView(this._advancedTexture);
        this.hudView = new HUDView(this._advancedTexture);
        this.dialogueView = new DialogueView(this._advancedTexture);

        // --- ECOUTEURS ---

        // Changement d'état global
        this._gameStateManager.onStateChangedObservable.add((state) => {
            this.handleStateChange(state);
        });

        // Interaction HUD
        OnInteractionAvailable.add((event) => {
            const isNear = !!(event.isNear && event.interactable);
            const mesh = event.interactable?.transform as AbstractMesh;
            this.hudView.setInteractionAvailable(isNear, mesh);
        });

        OnHealthChanged.add((event) => {
            this.hudView.updatePlayerHealth(event.currentHp, event.maxHp);
        });

        // Requête de dialogue (vient du monde 3D)
        OnDialogueRequest.add((data) => {
            this.openDialogue(data);
        });

        // FIN DE DIALOGUE (vient de la DialogueView)
        this.dialogueView.onFinishObservable.add(() => {
            this.closeDialogue();
        });

        this.handleStateChange(this._gameStateManager.getCurrentState());
    }

    private handleStateChange(state: GameStateType): void {
        switch (state) {
            case GameState.MENU:
            case GameState.PAUSED:
                this.hudView.hide();
                this.mainMenuView.show();
                this.dialogueView.hide();
                break;
            case GameState.PLAYING:
                this.mainMenuView.hide();
                this.dialogueView.hide();
                this.hudView.show();
                break;
            case GameState.DIALOGUE:
                this.hudView.hide();
                this.hudView.interactionPrompt.hide();
                this.mainMenuView.hide();
                this.dialogueView.show();
                break;
        }
    }

    public openDialogue(data: DialogueRequest): void {
        this._gameStateManager.setDialogue();
        this.dialogueView.requestDialogue(data);
    }

    public closeDialogue(): void {
        this.dialogueView.reset();
        this._gameStateManager.setPlaying();
    }

    public update(dt: number): void {
        this.dialogueView.update(dt);
    }
}
