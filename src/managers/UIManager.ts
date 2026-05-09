import { Scene, AbstractMesh } from "@babylonjs/core";
import { AdvancedDynamicTexture } from "@babylonjs/gui";
import { MainMenuView } from "../ui/views/MainMenuView";
import { PauseMenuView } from "../ui/views/PauseMenuView";
import { HUDView } from "../ui/views/HUDView";
import { DialogueView } from "../ui/views/DialogueView";
import { SettingsView } from "../ui/views/SettingsView";
import { ShopView } from "../ui/views/ShopView";
import { ForgeView } from "../ui/views/ForgeView";

import { GameState, type GameStateType } from "../core/types/GameState";
import { GameStateManager } from "./GameStateManager";
import {
    OnDialogueRequest,
    OnInteractionAvailable,
    type DialogueRequest,
} from "../core/interfaces/Interactable";
import { OnHealthChanged } from "../core/interfaces/CombatEvent";
import { OnOpenShop, OnPurchaseRequest } from "../core/interfaces/ShopEvents";
import { OnOpenForge, OnCraftRequest } from "../core/interfaces/ForgeEvents";

import type { Player } from "../entities/Player";
import { WEAPONS_DB } from "../data/WeaponsDb";
import { ItemData } from "../data/ItemData";
import { ALL_ITEMS } from "../data/ItemDb";

export class UIManager {
    private _advancedTexture: AdvancedDynamicTexture;
    public mainMenuView: MainMenuView;
    public pauseMenuView: PauseMenuView;
    public hudView: HUDView;
    public dialogueView: DialogueView;
    public settingsView: SettingsView;
    public shopView: ShopView;
    public forgeView: ForgeView;

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
        this.forgeView = new ForgeView(this._advancedTexture);

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
        OnOpenShop.add((data) => {
            if (!this._player) return;

            const enrichedInventory = data.inventory.map((shopItem) => {
                return {
                    ...shopItem,
                    ownedCount: this._player!.inventory.getItemAmount(
                        shopItem.id,
                    ),
                };
            });

            this.shopView.updateCurrencyDisplay(this._player.currency);
            this.shopView.populateShop(enrichedInventory);
            this._gameStateManager.setShop();
        });

        this.shopView.onBackObservable.add(() => {
            this._gameStateManager.setPlaying();
        });

        OnPurchaseRequest.add((shopItem) => {
            if (!this._player) return;

            if (this._player.canAfford(shopItem.price)) {
                // On récupère les données propres de l'item depuis ItemData ou WeaponsDB
                const itemBase =
                    ItemData[shopItem.id] || WEAPONS_DB[shopItem.id];
                const success = this._player.inventory.addItem(itemBase, 1);

                if (success) {
                    this._player.currency -= shopItem.price;
                    this.shopView.updateCurrencyDisplay(this._player.currency);

                    const newCount = this._player.inventory.getItemAmount(
                        shopItem.id,
                    );
                    this.shopView.updateOwnedDisplay(newCount);
                    this.shopView.playBuySuccessAnimation();
                }
            } else {
                this.shopView.playBuyErrorAnimation();
            }
        });

        // --- EVENTS FORGE ---
        OnOpenForge.add((data) => {
            if (!this._player) return;

            this.forgeView.setCurrentEquipment(this._player.weaponSlots);

            const enrichedRecipes = data.recipes.map((recipe) => {
                const itemInfo = ALL_ITEMS[recipe.itemId];

                return {
                    ...recipe,
                    name:
                        itemInfo?.name ||
                        recipe.itemId.replace(/_/g, " ").toUpperCase(),
                    description: itemInfo?.description || "Aucune description",
                    // On déplace la logique de nettoyage de path ici
                    iconPath:
                        itemInfo?.iconPath ||
                        "/assets/ui/icons/default_icon.png",
                    type: itemInfo?.type || "material",
                    weaponSlot: (itemInfo as any)?.weaponSlot,
                    ownedCount: this._player!.inventory.getItemAmount(
                        recipe.itemId,
                    ),
                    // On enrichit aussi les composants requis (pour les noms/quantités possédées)
                    requirements: recipe.requirements.map((req) => ({
                        ...req,
                        ownedCount: this._player!.inventory.getItemAmount(
                            req.itemId,
                        ),
                    })),
                };
            });

            this.forgeView.updateCurrency(this._player.currency);
            this.forgeView.populateForge(enrichedRecipes as any);
            this._gameStateManager.setForge();
        });

        this.forgeView.onBackObservable.add(() => {
            this._gameStateManager.setPlaying();
        });

        OnCraftRequest.add((recipe) => {
            if (!this._player) return;

            // 1. Check monnaie
            if (this._player.currency < recipe.price) {
                this.forgeView.playBuyErrorAnimation();
                return;
            }

            // 2. Check ressources
            if (!this._player.inventory.hasResources(recipe.requirements)) {
                this.forgeView.playBuyErrorAnimation();
                return;
            }

            // 3. Consommation des ressources
            recipe.requirements.forEach((req) => {
                this._player!.inventory.removeItem(req.itemId, req.amount);
            });
            this._player.currency -= recipe.price;

            // 4. Ajout de l'arme (On donne l'objet complet de WEAPONS_DB)
            const weaponToGive = WEAPONS_DB[recipe.itemId];
            const success = this._player.inventory.addItem(weaponToGive, 1);

            if (success) {
                // Mise à jour de l'UI
                this.forgeView.updateCurrency(this._player.currency);

                // On rafraîchit le compteur de l'arme fabriquée
                const newWeaponCount = this._player.inventory.getItemAmount(
                    recipe.itemId,
                );
                this.forgeView.updateOwnedDisplay(newWeaponCount);

                // On rafraîchit l'affichage des composants (car les stocks ont baissé)
                const updatedRequirements = recipe.requirements.map((req) => ({
                    ...req,
                    ownedCount: this._player!.inventory.getItemAmount(
                        req.itemId,
                    ),
                }));
                this.forgeView.updateRequirementsDisplay(updatedRequirements);

                this.forgeView.playBuySuccessAnimation();
            }
        });
    }

    private handleStateChange(state: GameStateType): void {
        this.mainMenuView.hide();
        this.pauseMenuView.hide();
        this.hudView.hide();
        this.dialogueView.hide();
        this.settingsView.hide();
        this.shopView.hide();
        this.forgeView.hide();

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
            case GameState.SHOP:
                this.shopView.show();
                break;
            case GameState.FORGE:
                this.forgeView.show();
                break;
        }
    }

    public openDialogue(data: DialogueRequest): void {
        this._gameStateManager.setDialogue();
        this.dialogueView.requestDialogue(data);
    }

    public closeDialogue(): void {
        this.dialogueView.reset();

        const currentState = this._gameStateManager.getCurrentState();
        if (
            currentState !== GameState.SHOP &&
            currentState !== GameState.FORGE
        ) {
            this._gameStateManager.setPlaying();
        }
    }

    public update(dt: number): void {
        this.dialogueView.update(dt);
    }
}
