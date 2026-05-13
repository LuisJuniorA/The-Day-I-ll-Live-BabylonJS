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
import { InventoryView } from "../ui/views/InventoryView";
import { OnOpenInventory } from "../core/interfaces/InventoryEvent";
import { OnCurrencyChanged } from "../core/interfaces/CurrencyEvent";
import { OnLootReceived } from "../core/interfaces/LootEvents";

export class UIManager {
    private _advancedTexture: AdvancedDynamicTexture;
    public mainMenuView: MainMenuView;
    public pauseMenuView: PauseMenuView;
    public hudView: HUDView;
    public dialogueView: DialogueView;
    public settingsView: SettingsView;
    public shopView: ShopView;
    public forgeView: ForgeView;
    public inventoryView: InventoryView;

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
        this.inventoryView = new InventoryView(this._advancedTexture);

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

        OnLootReceived.add((eventData) => {
            this.hudView.displayLoot(eventData.item, eventData.amount);
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

        OnCurrencyChanged.add((event) => {
            this.hudView.updateCurrency(event.currentAmount, event.delta);
        });

        OnOpenInventory.add((data) => {
            if (!this._player) return;

            // --- ENRICHISSEMENT DES DONNÉES ---
            // On transforme les items bruts de l'inventaire en items avec images et noms
            const enrichedItems = data.items.map((invItem) => {
                const itemInfo = ALL_ITEMS[invItem.id];

                return {
                    ...invItem,
                    name: itemInfo?.name || invItem.id,
                    description: itemInfo?.description || "Aucune description",
                    iconPath:
                        itemInfo?.iconPath || "./assets/ui/icons/default.png",
                };
            });

            // On passe les infos enrichies à la vue
            this.inventoryView.populateInventory(enrichedItems as any);
            this.inventoryView.updateCurrency(this._player.currency);

            // On synchronise l'équipement actuel pour les stats de comparaison
            this.inventoryView.setCurrentEquipment(this._player.weaponSlots);

            // On change l'état global
            this._gameStateManager.setInventory();
        });

        this.inventoryView.onBackObservable.add(() => {
            this._gameStateManager.setPlaying();
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
                const itemInfo = ALL_ITEMS[recipe.id];

                return {
                    ...recipe,
                    name:
                        itemInfo?.name ||
                        recipe.id.replace(/_/g, " ").toUpperCase(),
                    description: itemInfo?.description || "Aucune description",
                    // On déplace la logique de nettoyage de path ici
                    iconPath:
                        itemInfo?.iconPath ||
                        "./assets/ui/icons/default_icon.png",
                    type: itemInfo?.type || "material",
                    weaponSlot: (itemInfo as any)?.weaponSlot,
                    ownedCount: this._player!.inventory.getItemAmount(
                        recipe.id,
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

            // 1. Checks (Monnaie + Ressources)
            if (
                this._player.currency < recipe.price ||
                !this._player.inventory.hasResources(recipe.requirements)
            ) {
                this.forgeView.playBuyErrorAnimation();
                return;
            }

            // 2. Consommation
            recipe.requirements.forEach((req) => {
                this._player!.inventory.removeItem(req.itemId, req.amount);
            });
            this._player.currency -= recipe.price;

            // 3. Ajout de l'item
            const weaponToGive = ALL_ITEMS[recipe.id];
            const success = this._player.inventory.addItem(weaponToGive, 1);

            if (success) {
                // 1. Mettre à jour la monnaie et le HUD
                const pricePaid = recipe.price;
                this.forgeView.updateCurrency(this._player.currency);
                this.hudView.updateCurrency(this._player.currency, -pricePaid);

                // 2. IMPORTANT : Mettre à jour TOUTES les recettes enrichies dans la grille
                // On demande à la forge de rafraîchir les données de ses items à partir de l'inventaire réel
                this.forgeView.refreshAllRecipesData(this._player);

                // 3. Animation de succès
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
        this.inventoryView.hide();

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
            case GameState.INVENTORY:
                this.inventoryView.show();
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
        this.hudView._currencyHUD.update(dt);
    }
}
