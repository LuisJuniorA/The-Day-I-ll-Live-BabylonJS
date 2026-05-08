import { Scene, AbstractMesh } from "@babylonjs/core";
import { AdvancedDynamicTexture } from "@babylonjs/gui";
import { MainMenuView } from "../ui/views/MainMenuView";
import { PauseMenuView } from "../ui/views/PauseMenuView";
import { HUDView } from "../ui/views/HUDView";
import { DialogueView } from "../ui/views/DialogueView";
import { SettingsView } from "../ui/views/SettingsView";
import { ShopView } from "../ui/views/ShopView";
import { GameState, type GameStateType } from "../core/types/GameState";
import { GameStateManager } from "./GameStateManager";
import {
    OnDialogueRequest,
    OnInteractionAvailable,
    type DialogueRequest,
} from "../core/interfaces/Interactable";
import { OnHealthChanged } from "../core/interfaces/CombatEvent";
import { OnOpenShop, OnPurchaseRequest } from "../core/interfaces/ShopEvents";
import type { Player } from "../entities/Player";

export class UIManager {
    private _advancedTexture: AdvancedDynamicTexture;
    public mainMenuView: MainMenuView;
    public pauseMenuView: PauseMenuView;
    public hudView: HUDView;
    public dialogueView: DialogueView;
    public settingsView: SettingsView;
    public shopView: ShopView;
    private _gameStateManager: GameStateManager;
    private _player: Player | null = null;

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
        this.settingsView = new SettingsView(this._advancedTexture);
        this.shopView = new ShopView(this._advancedTexture);

        this._setupEventListeners();

        // Initialisation de l'état de départ
        this.handleStateChange(this._gameStateManager.getCurrentState());
    }

    public setPlayer(player: Player) {
        this._player = player;
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
            this.pauseMenuView.hide();
            this.settingsView.show();
        });

        this.pauseMenuView.onMainMenuObservable.add(() => {
            this._gameStateManager.setMenu();
        });

        // --- EVENTS SETTINGS (RETOUR) ---
        this.settingsView.onBackObservable.add(() => {
            this.settingsView.hide();
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
            // On s'assure de récupérer le mesh pour le link visuel du prompt
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

        // --- EVENTS SHOP ---

        // ... (haut du fichier UIManager.ts identique)

        // --- EVENTS SHOP ---
        OnOpenShop.add((data) => {
            if (!this._player) return;

            // 1. On prépare l'inventaire enrichi avec les quantités du joueur
            const enrichedInventory = data.inventory.map((shopItem) => {
                return {
                    ...shopItem,
                    // On interroge l'inventaire du player pour chaque item du shop
                    ownedCount: this._player!.inventory.getItemAmount(
                        shopItem.id,
                    ),
                };
            });

            // 2. On met à jour la monnaie et on peuple la grille avec les données enrichies
            this.shopView.updateCurrencyDisplay(this._player.currency);
            this.shopView.populateShop(enrichedInventory);

            // 3. On passe en mode SHOP
            this._gameStateManager.setShop();
        });

        this.shopView.onBackObservable.add(() => {
            this._gameStateManager.setPlaying();
        });

        OnPurchaseRequest.add((shopItem) => {
            if (!this._player) return;

            if (this._player.canAfford(shopItem.price)) {
                const success = this._player.inventory.addItem(
                    {
                        id: shopItem.id,
                        name: shopItem.name,
                        description: shopItem.description,
                        iconPath: shopItem.iconPath,
                        type: shopItem.type,
                    },
                    1,
                );

                if (success) {
                    this._player.currency -= shopItem.price;
                    this.shopView.updateCurrencyDisplay(this._player.currency);

                    // Une fois l'achat réussi, on rafraîchit l'item sélectionné
                    // pour mettre à jour le compteur "EN POSSESSION" immédiatement
                    const newCount = this._player.inventory.getItemAmount(
                        shopItem.id,
                    );
                    // On force une petite mise à jour locale de l'item dans la vue
                    (shopItem as any).ownedCount = newCount;

                    this.shopView.playBuySuccessAnimation();

                    // On repopulate pour que tous les slots (même non sélectionnés) soient à jour
                    // ou on appelle juste une mise à jour sur le slot concerné.
                } else {
                    console.log("Inventaire plein !");
                }
            } else {
                this.shopView.playBuyErrorAnimation();
            }
        });
    }

    private handleStateChange(state: GameStateType): void {
        // Reset de la visibilité de toutes les vues
        this.mainMenuView.hide();
        this.pauseMenuView.hide();
        this.hudView.hide();
        this.dialogueView.hide();
        this.settingsView.hide();
        this.shopView.hide();

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
                // Cache le "E" pour ne pas polluer l'écran de dialogue
                this.hudView.interactionPrompt.hide();
                this.dialogueView.show();
                break;
            case GameState.SHOP:
                this.shopView.show();
                break;
        }
    }

    public openDialogue(data: DialogueRequest): void {
        this._gameStateManager.setDialogue();
        this.dialogueView.requestDialogue(data);
    }

    public closeDialogue(): void {
        // On nettoie la vue dans tous les cas
        this.dialogueView.reset();

        // LOGIQUE CRITIQUE : Si le marchand a fait passer l'état en SHOP,
        // on ne doit SURTOUT PAS appeler setPlaying() ici, sinon on ferme le shop instantanément.
        if (this._gameStateManager.getCurrentState() !== GameState.SHOP) {
            this._gameStateManager.setPlaying();
        }
    }

    public update(dt: number): void {
        this.dialogueView.update(dt);
    }
}
