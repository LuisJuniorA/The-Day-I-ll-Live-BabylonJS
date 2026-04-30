import { Scene, AbstractMesh } from "@babylonjs/core";
import { AdvancedDynamicTexture } from "@babylonjs/gui";
import { MainMenuView } from "../ui/views/MainMenuView";
import { PauseMenuView } from "../ui/views/PauseMenuView";
import { HUDView } from "../ui/views/HUDView";
import { DialogueView } from "../ui/views/DialogueView";
import { SettingsView } from "../ui/views/SettingsView"; // <-- Import
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
    public pauseMenuView: PauseMenuView;
    public hudView: HUDView;
    public dialogueView: DialogueView;
    public settingsView: SettingsView; // <-- Déclaration
    private _gameStateManager: GameStateManager;

    constructor(scene: Scene, gameStateManager: GameStateManager) {
        this._advancedTexture = AdvancedDynamicTexture.CreateFullscreenUI(
            "MainUI",
            true,
            scene,
        );
        this._gameStateManager = gameStateManager;

        // Instanciation des vues
        this.mainMenuView = new MainMenuView(this._advancedTexture);
        this.pauseMenuView = new PauseMenuView(this._advancedTexture);
        this.hudView = new HUDView(this._advancedTexture);
        this.dialogueView = new DialogueView(this._advancedTexture);
        this.settingsView = new SettingsView(this._advancedTexture); // <-- Instanciation

        this._setupEventListeners();

        // Initialisation de l'état de départ
        this.handleStateChange(this._gameStateManager.getCurrentState());
    }

    private _setupEventListeners(): void {
        // --- CHANGEMENT D'ÉTAT GLOBAL ---
        this._gameStateManager.onStateChangedObservable.add((state) => {
            this.handleStateChange(state);
        });

        // --- EVENTS MENU PRINCIPAL ---
        this.mainMenuView.onPlayObservable.add(() => {
            this._gameStateManager.setPlaying();
        });

        this.mainMenuView.onSettingsObservable.add(() => {
            // On cache le menu principal et on affiche les settings
            this.mainMenuView.hide();
            this.settingsView.show();
        });

        this.mainMenuView.onQuitObservable.add(() => {
            console.log("Quitter le jeu");
        });

        // --- EVENTS MENU PAUSE ---
        this.pauseMenuView.onResumeObservable.add(() => {
            this._gameStateManager.setPlaying();
        });

        this.pauseMenuView.onSettingsObservable?.add(() => {
            // Optionnel : si ton PauseMenu a aussi un bouton settings
            this.pauseMenuView.hide();
            this.settingsView.show();
        });

        this.pauseMenuView.onMainMenuObservable.add(() => {
            this._gameStateManager.setMenu();
        });

        // --- EVENTS SETTINGS (RETOUR) ---
        this.settingsView.onBackObservable.add(() => {
            this.settingsView.hide();

            // On revient au bon menu selon l'état du jeu
            const currentState = this._gameStateManager.getCurrentState();
            if (currentState === GameState.MENU) {
                this.mainMenuView.show();
            } else {
                this.pauseMenuView.show();
            }
        });

        // --- EVENTS IN-GAME (HUD) ---
        OnInteractionAvailable.add((event) => {
            const isNear = !!(event.isNear && event.interactable);
            const mesh = event.interactable?.transform as AbstractMesh;
            this.hudView.setInteractionAvailable(isNear, mesh);
        });

        OnHealthChanged.add((event) => {
            this.hudView.updatePlayerHealth(event.currentHp, event.maxHp);
        });

        // --- EVENTS DIALOGUES ---
        OnDialogueRequest.add((data) => {
            this.openDialogue(data);
        });

        this.dialogueView.onFinishObservable.add(() => {
            this.closeDialogue();
        });
    }

    private handleStateChange(state: GameStateType): void {
        // On cache tout sauf les settings si on est en train de rebind
        this.mainMenuView.hide();
        this.pauseMenuView.hide();
        this.hudView.hide();
        this.dialogueView.hide();
        this.settingsView.hide();

        switch (state) {
            case GameState.MENU:
                this.mainMenuView.show();
                break;
            case GameState.PAUSED:
                this.pauseMenuView.show();
                break;
            case GameState.PLAYING:
                this.hudView.show();
                break;
            case GameState.DIALOGUE:
                this.hudView.interactionPrompt.hide();
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
