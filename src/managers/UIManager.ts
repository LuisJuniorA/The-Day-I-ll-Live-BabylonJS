import { Scene, AbstractMesh } from "@babylonjs/core";
import { AdvancedDynamicTexture } from "@babylonjs/gui";

// Vues
import { MainMenuView } from "../ui/views/MainMenuView";
import { PauseMenuView } from "../ui/views/PauseMenuView";
import { HUDView } from "../ui/views/HUDView";
import { DialogueView } from "../ui/views/DialogueView";
import { SettingsView } from "../ui/views/SettingsView";
import { ShopView } from "../ui/views/ShopView";
import { ForgeView } from "../ui/views/ForgeView";
import { InventoryView } from "../ui/views/InventoryView";

// Core & Types
import { GameState, type GameStateType } from "../core/types/GameState";
import { GameStateManager } from "./GameStateManager";
import { ALL_ITEMS } from "../data/ItemDb";
import { WEAPONS_DB } from "../data/WeaponsDb";
import { ItemData } from "../data/ItemData";
import type { Player } from "../entities/Player";

// Events
import {
    OnDialogueRequest,
    OnInteractionAvailable,
    type DialogueRequest,
} from "../core/interfaces/Interactable";
import { OnHealthChanged } from "../core/interfaces/CombatEvent";
import { OnOpenShop, OnPurchaseRequest } from "../core/interfaces/ShopEvents";
import { OnOpenForge, OnCraftRequest } from "../core/interfaces/ForgeEvents";
import {
    OnOpenInventory,
    OnInventoryUpdated,
} from "../core/interfaces/InventoryEvent";
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
        this.inventoryView._setupActionClick(this._player);
    }

    private _setupEventListeners(): void {
        // --- SYSTÈME DE JEU GLOBAL ---
        this._gameStateManager.onStateChangedObservable.add((state) => {
            this.handleStateChange(state);
        });

        // --- GESTION DE L'INVENTAIRE (CENTRALISÉE) ---
        // Se déclenche quand on ouvre l'inventaire
        OnOpenInventory.add(() => {
            this._refreshInventory();
            this._gameStateManager.setInventory();
        });

        // Se déclenche n'importe quand (Consommation, Equipement, Loot)
        OnInventoryUpdated.add(() => {
            this._refreshInventory();
        });

        this.inventoryView.onBackObservable.add(() => {
            this._gameStateManager.setPlaying();
        });

        // --- MENUS PRINCIPAUX ---
        this.mainMenuView.onPlayObservable.add(() =>
            this._gameStateManager.setPlaying(),
        );
        this.mainMenuView.onSettingsObservable.add(() => {
            this.mainMenuView.hide();
            this.settingsView.show();
        });

        this.pauseMenuView.onResumeObservable.add(() =>
            this._gameStateManager.setPlaying(),
        );
        this.pauseMenuView.onMainMenuObservable.add(() =>
            this._gameStateManager.setMenu(),
        );
        this.pauseMenuView.onSettingsObservable?.add(() => {
            this.pauseMenuView.hide();
            this.settingsView.show();
        });

        this.settingsView.onBackObservable.add(() => {
            this.settingsView.hide();
            const currentState = this._gameStateManager.getCurrentState();
            currentState === GameState.MENU
                ? this.mainMenuView.show()
                : this.pauseMenuView.show();
        });

        // --- HUD & COMBAT ---
        OnLootReceived.add((eventData) => {
            this.hudView.displayLoot(eventData.item, eventData.amount);
            // Si l'inventaire est ouvert pendant un loot, on refresh
            if (
                this._gameStateManager.getCurrentState() === GameState.INVENTORY
            ) {
                this._refreshInventory();
            }
        });

        OnHealthChanged.add((event) => {
            this.hudView.updatePlayerHealth(event.currentHp, event.maxHp);
        });

        OnCurrencyChanged.add((event) => {
            this.hudView.updateCurrency(event.currentAmount, event.delta);
        });

        OnInteractionAvailable.add((event) => {
            const isNear = !!(event.isNear && event.interactable);
            const mesh = event.interactable?.transform as AbstractMesh;
            this.hudView.setInteractionAvailable(isNear, mesh);
        });

        // --- DIALOGUES ---
        OnDialogueRequest.add((data) => this.openDialogue(data));
        this.dialogueView.onFinishObservable.add(() => this.closeDialogue());

        // --- SHOP ---
        OnOpenShop.add((data) => {
            if (!this._player) return;
            const enrichedShop = data.inventory.map((item) => ({
                ...item,
                ownedCount: this._player!.inventory.getItemAmount(item.id),
            }));
            this.shopView.updateCurrencyDisplay(this._player.currency);
            this.shopView.populateShop(enrichedShop);
            this._gameStateManager.setShop();
        });

        OnPurchaseRequest.add((shopItem) => {
            if (!this._player) return;
            if (this._player.canAfford(shopItem.price)) {
                const itemBase =
                    ItemData[shopItem.id] || WEAPONS_DB[shopItem.id];
                if (this._player.inventory.addItem(itemBase, 1)) {
                    this._player.currency -= shopItem.price;
                    this.shopView.updateCurrencyDisplay(this._player.currency);
                    this.shopView.updateOwnedDisplay(
                        this._player.inventory.getItemAmount(shopItem.id),
                    );
                    this.shopView.playBuySuccessAnimation();
                    OnInventoryUpdated.notifyObservers(); // Notifie le reste du système
                }
            } else {
                this.shopView.playBuyErrorAnimation();
            }
        });

        this.shopView.onBackObservable.add(() =>
            this._gameStateManager.setPlaying(),
        );

        // --- FORGE ---
        OnOpenForge.add((data) => {
            if (!this._player) return;
            this.forgeView.setCurrentEquipment(this._player.weaponSlots);

            const enrichedRecipes = data.recipes.map((recipe) => {
                const itemInfo = ALL_ITEMS[recipe.id];
                return {
                    ...recipe,
                    name: itemInfo?.name || recipe.id,
                    description: itemInfo?.description || "",
                    iconPath:
                        itemInfo?.iconPath ||
                        "./assets/ui/icons/default_icon.png",
                    type: itemInfo?.type || "material",
                    ownedCount: this._player!.inventory.getItemAmount(
                        recipe.id,
                    ),
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

        OnCraftRequest.add((recipe) => {
            if (!this._player) return;
            if (
                this._player.currency >= recipe.price &&
                this._player.inventory.hasResources(recipe.requirements)
            ) {
                recipe.requirements.forEach((req) =>
                    this._player!.inventory.removeItem(req.itemId, req.amount),
                );
                this._player.currency -= recipe.price;

                if (this._player.inventory.addItem(ALL_ITEMS[recipe.id], 1)) {
                    this.forgeView.updateCurrency(this._player.currency);
                    this.hudView.updateCurrency(
                        this._player.currency,
                        -recipe.price,
                    );
                    this.forgeView.refreshAllRecipesData(this._player);
                    this.forgeView.playBuySuccessAnimation();
                    OnInventoryUpdated.notifyObservers();
                }
            } else {
                this.forgeView.playBuyErrorAnimation();
            }
        });

        this.forgeView.onBackObservable.add(() =>
            this._gameStateManager.setPlaying(),
        );
    }

    private _refreshInventory(): void {
        if (!this._player) return;

        const items = this._player.inventory.getAllItems();

        const enrichedItems = items.map((invItem) => {
            const itemInfo = ALL_ITEMS[invItem.item.id];
            return {
                id: invItem.item.id,
                quantity: invItem.amount,
                name: itemInfo?.name || invItem.item.id,
                description: itemInfo?.description || "Aucune description",
                iconPath: itemInfo?.iconPath || "./assets/ui/icons/default.png",
                type: invItem.item.type,
                // On ajoute ownedCount si ta vue InventoryView l'utilise encore à la place de quantity
                ownedCount: invItem.amount,
            };
        });

        this.inventoryView.populateInventory(enrichedItems as any);
        this.inventoryView.updateCurrency(this._player.currency);
        this.inventoryView.setCurrentEquipment(this._player.weaponSlots);
    }

    private handleStateChange(state: GameStateType): void {
        const views = [
            this.mainMenuView,
            this.pauseMenuView,
            this.hudView,
            this.dialogueView,
            this.settingsView,
            this.shopView,
            this.forgeView,
            this.inventoryView,
        ];
        views.forEach((v) => v.hide());

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
